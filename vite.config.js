import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'dairy_database.json');

let memoryDb = null;
let memoryDbString = null;
let saveDebounceTimer = null;

const loadDatabaseIntoMemory = () => {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      memoryDb = JSON.parse(raw);
      memoryDbString = JSON.stringify(memoryDb);
      console.log(`[DB Cache] Loaded database into memory (${(memoryDbString.length / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      memoryDb = {};
      memoryDbString = '{}';
    }
  } catch (err) {
    console.error('[DB Cache] Error loading database into memory:', err);
    memoryDb = {};
    memoryDbString = '{}';
  }
};

// Initial load into memory on server start
loadDatabaseIntoMemory();

const smsConfigPath = path.resolve(__dirname, 'sms_config.json');
const getSmsConfig = () => {
  try {
    if (fs.existsSync(smsConfigPath)) {
      return JSON.parse(fs.readFileSync(smsConfigPath, 'utf-8'));
    }
  } catch (e) {
    console.error('[SMS] Error reading sms_config.json:', e);
  }
  return {
    provider: process.env.SMS_PROVIDER || 'fast2sms',
    apiKey: process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY || '',
    twoFactorApiKey: process.env.TWOFACTOR_API_KEY || '',
    twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioFrom: process.env.TWILIO_FROM || '',
    customUrl: process.env.CUSTOM_SMS_URL || ''
  };
};

const saveSmsConfig = (config) => {
  try {
    fs.writeFileSync(smsConfigPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[SMS] Error saving sms_config.json:', e);
    return false;
  }
};

const scheduleBackgroundDiskSave = () => {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    try {
      if (memoryDb) {
        const compactJson = JSON.stringify(memoryDb);
        memoryDbString = compactJson;
        await fs.promises.writeFile(dbPath, compactJson, 'utf-8');
      }
    } catch (e) {
      console.error('[DB] Asynchronous disk write error:', e);
    }
  }, 100);
};

const mergeSafely = (incomingArr, existingArr) => {
  if (!Array.isArray(incomingArr)) return existingArr || [];
  if (incomingArr.length > 0) return incomingArr;
  if (Array.isArray(existingArr) && existingArr.length > 0) return existingArr;
  return incomingArr;
};

const databaseStoragePlugin = () => ({
  name: 'dairy-database-storage-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // 1. GET /api/db - Read current database from RAM cache (instant < 2ms)
      if (req.url === '/api/db' && req.method === 'GET') {
        try {
          if (!memoryDbString) {
            loadDatabaseIntoMemory();
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(memoryDbString || '{}');
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // 2. POST /api/db - Save database (instant RAM update + non-blocking background disk write)
      if (req.url === '/api/db' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            if (!memoryDb) loadDatabaseIntoMemory();

            const merged = {
              ...memoryDb,
              ...incoming,
              customerSales: mergeSafely(incoming.customerSales, memoryDb.customerSales, 100),
              dairySales: mergeSafely(incoming.dairySales, memoryDb.dairySales, 20),
              customers: mergeSafely(incoming.customers, memoryDb.customers, 10),
              customerTransactions: mergeSafely(incoming.customerTransactions, memoryDb.customerTransactions, 100)
            };

            memoryDb = merged;
            memoryDbString = JSON.stringify(merged);

            // Respond instantly to client without waiting for disk I/O!
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));

            // Save to disk asynchronously in background
            scheduleBackgroundDiskSave();
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // 2.1 POST /api/db/patch - High-speed Partial Update (Delta Save without sending 5MB payload)
      if (req.url === '/api/db/patch' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const patch = JSON.parse(body || '{}');
            if (!memoryDb) loadDatabaseIntoMemory();

            if (patch.key && patch.items && Array.isArray(patch.items)) {
              const currentArr = Array.isArray(memoryDb[patch.key]) ? memoryDb[patch.key] : [];
              if (patch.action === 'prepend') {
                memoryDb[patch.key] = [...patch.items, ...currentArr];
              } else if (patch.action === 'append') {
                memoryDb[patch.key] = [...currentArr, ...patch.items];
              } else {
                memoryDb[patch.key] = patch.items;
              }
            } else if (typeof patch === 'object') {
              for (const k in patch) {
                memoryDb[k] = patch[k];
              }
            }

            memoryDbString = JSON.stringify(memoryDb);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
            scheduleBackgroundDiskSave();
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // 3. POST /api/sync-sheet - Robust Multi-Strategy Google Sheets CSV Fetcher
      if (req.url === '/api/sync-sheet' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            let sheetUrl = (parsed.sheetUrl || '').trim();

            if (!sheetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Please enter a Google Sheet URL' }));
              return;
            }

            // Build candidate URLs to try in sequence
            const urlsToTry = [];

            if (sheetUrl.includes('/d/e/')) {
              const pubMatch = sheetUrl.match(/\/d\/e\/([^\/\?#&]+)/);
              if (pubMatch) {
                urlsToTry.push(`https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv`);
              }
            } else if (sheetUrl.includes('/d/')) {
              const idMatch = sheetUrl.match(/\/d\/([^\/\?#&]+)/);
              const gidMatch = sheetUrl.match(/[?#&]gid=([0-9]+)/);
              const gid = gidMatch ? gidMatch[1] : '0';

              if (idMatch) {
                const sheetId = decodeURIComponent(idMatch[1]);
                // Strategy 1: Google Visualization Query API with CUSTOMER INTRY tab name
                urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('CUSTOMER INTRY')}`);
                urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('CUSTOMER ENTRY')}`);
                // Strategy 2: Google Visualization Query API with gid
                urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
                // Strategy 3: Google Visualization Query API without gid
                urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
                // Strategy 4: Standard Export CSV
                urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
                urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
              }
            }

            urlsToTry.push(sheetUrl);

            let fetchedCsv = '';
            let successfulUrl = '';
            let lastStatus = 0;

            for (const targetUrl of urlsToTry) {
              try {
                const googleRes = await fetch(targetUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/csv,text/plain,application/csv,*/*'
                  },
                  redirect: 'follow'
                });

                lastStatus = googleRes.status;

                if (googleRes.ok) {
                  const text = await googleRes.text();
                  // Check if response is valid CSV and not HTML login page
                  if (text && !text.trim().startsWith('<!DOCTYPE') && !text.includes('<html') && !text.includes('accounts.google.com')) {
                    fetchedCsv = text;
                    successfulUrl = targetUrl;
                    break;
                  }
                }
              } catch (e) {
                // continue to next URL strategy
              }
            }

            if (fetchedCsv) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                csvText: fetchedCsv,
                exportUrl: successfulUrl
              }));
              return;
            }

            // If all fetch strategies failed, sheet is likely Private in Google Drive
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              isPrivateSheet: true,
              error: `Google Sheet एक्सेस नहीं हो सकी (Status ${lastStatus || 403})। कृपया Google Sheet में 'File > Share > Publish to web (CSV)' करें या टैब 3 में दी गई 'Apps Script' का उपयोग करें।`
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // 4. POST /api/webhook/google-sheets - Direct Webhook Receiver from Google Apps Script
      if (req.url === '/api/webhook/google-sheets' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            if (!memoryDb) loadDatabaseIntoMemory();

            const customerName = data.name || data.customerName || 'Google Form Customer';
            const quantity = parseFloat(data.quantity || data.liters || data.qty) || 0;
            const rate = parseFloat(data.rate || data.price) || 60;
            const shift = (data.shift || 'morning').toLowerCase().includes('ev') || (data.shift || '').includes('शाम') ? 'evening' : 'morning';
            const date = data.date || new Date().toISOString().split('T')[0];
            const amount = Math.round(quantity * rate);

            if (quantity > 0) {
              if (!Array.isArray(memoryDb.customerSales)) memoryDb.customerSales = [];
              if (!Array.isArray(memoryDb.customers)) memoryDb.customers = [];
              if (!Array.isArray(memoryDb.customerTransactions)) memoryDb.customerTransactions = [];

              let customer = memoryDb.customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
              if (!customer) {
                customer = {
                  id: `CUST-${Date.now().toString().slice(-4)}`,
                  name: customerName,
                  mobile: data.mobile || data.phone || '',
                  address: data.address || '',
                  milkType: data.milkType || 'cow',
                  morningQty: shift === 'morning' ? quantity : 0,
                  eveningQty: shift === 'evening' ? quantity : 0,
                  rate: rate,
                  balance: amount,
                  advance: 0,
                  status: 'active',
                  joinedDate: date
                };
                memoryDb.customers.unshift(customer);
              } else {
                customer.balance = (Number(customer.balance) || 0) + amount;
              }

              const saleEntry = {
                id: `CSALE-${Date.now().toString().slice(-4)}`,
                customerId: customer.id,
                customerName: customer.name,
                date,
                shift,
                quantity,
                rate,
                amount,
                source: 'Google Form (Webhook)'
              };
              memoryDb.customerSales.unshift(saleEntry);

              memoryDb.customerTransactions.unshift({
                id: `TXN-${Date.now().toString().slice(-4)}`,
                customerId: customer.id,
                customerName: customer.name,
                date,
                type: 'milk_supply',
                shift,
                liters: quantity,
                rate,
                amount,
                balanceAfter: customer.balance,
                note: `Google Form Auto-Sync: ${shift === 'morning' ? 'Morning' : 'Evening'} (${quantity}L @ ₹${rate})`
              });

              memoryDbString = JSON.stringify(memoryDb);
              scheduleBackgroundDiskSave();
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Google Form data synced successfully!' }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // 5. GET /api/sms/config - Get current SMS gateway configuration
      if (req.url === '/api/sms/config' && req.method === 'GET') {
        const cfg = getSmsConfig();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          provider: cfg.provider || 'fast2sms',
          apiKey: cfg.apiKey || '',
          twoFactorApiKey: cfg.twoFactorApiKey || '',
          twilioSid: cfg.twilioSid || '',
          twilioAuthToken: cfg.twilioAuthToken || '',
          twilioFrom: cfg.twilioFrom || '',
          customUrl: cfg.customUrl || '',
          isConfigured: !!(cfg.apiKey || cfg.twoFactorApiKey || (cfg.twilioSid && cfg.twilioAuthToken) || cfg.customUrl)
        }));
        return;
      }

      // 6. POST /api/sms/config - Save SMS gateway configuration
      if (req.url === '/api/sms/config' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            const current = getSmsConfig();
            const updated = { ...current, ...incoming };
            saveSmsConfig(updated);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'SMS Gateway configuration saved!', config: updated }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // 7. POST /api/sms/send - Send real SMS via configured SMS Gateway
      if (req.url === '/api/sms/send' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { mobile, otp, message } = JSON.parse(body || '{}');
            const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
            if (!cleanMobile || cleanMobile.length !== 10) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: '10 अंकों का मान्य भारतीय मोबाइल नंबर आवश्यक है।' }));
              return;
            }

            const config = getSmsConfig();
            const provider = config.provider || 'fast2sms';

            // Provider 1: Fast2SMS (India's most popular instant OTP gateway)
            if (provider === 'fast2sms') {
              const apiKey = (config.apiKey || process.env.FAST2SMS_API_KEY || '').trim();
              if (!apiKey) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  notConfigured: true,
                  provider: 'Fast2SMS',
                  error: 'Fast2SMS API Key सेट नहीं है। कृपया SMS गेटवे सेटिंग्स में अपनी API Key दर्ज करें।'
                }));
                return;
              }

              console.log(`[SMS] Dispatching Fast2SMS OTP to +91 ${cleanMobile}...`);
              const fast2smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                  'authorization': apiKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  route: 'otp',
                  variables_values: String(otp),
                  numbers: cleanMobile
                })
              });

              const fast2smsData = await fast2smsRes.json();
              console.log('[SMS] Fast2SMS Gateway Response:', fast2smsData);

              if (fast2smsData.return === true || fast2smsData.status_code === 200) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  provider: 'Fast2SMS',
                  message: `OTP सफलतापूर्वक +91 ${cleanMobile} पर भेजा गया!`,
                  details: fast2smsData
                }));
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  provider: 'Fast2SMS',
                  error: fast2smsData.message || 'Fast2SMS से SMS भेजने में त्रुटि आई। कृपया API Key या बैलेंस चेक करें।',
                  details: fast2smsData
                }));
              }
              return;
            }

            // Provider 2: 2Factor.in
            if (provider === '2factor') {
              const apiKey = (config.twoFactorApiKey || config.apiKey || '').trim();
              if (!apiKey) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  notConfigured: true,
                  provider: '2Factor.in',
                  error: '2Factor.in API Key सेट नहीं है।'
                }));
                return;
              }

              console.log(`[SMS] Dispatching 2Factor OTP to +91 ${cleanMobile}...`);
              const tfRes = await fetch(`https://2factor.in/v1/API/V1/${apiKey}/SMS/${cleanMobile}/${otp}/OTP1`);
              const tfData = await tfRes.json();
              if (tfData.Status === 'Success') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  provider: '2Factor.in',
                  message: `OTP सफलतापूर्वक +91 ${cleanMobile} पर भेजा गया!`,
                  details: tfData
                }));
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  provider: '2Factor.in',
                  error: tfData.Details || '2Factor SMS भेजने में त्रुटि आई।',
                  details: tfData
                }));
              }
              return;
            }

            // Provider 3: Twilio
            if (provider === 'twilio') {
              const { twilioSid, twilioAuthToken, twilioFrom } = config;
              if (!twilioSid || !twilioAuthToken || !twilioFrom) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  notConfigured: true,
                  provider: 'Twilio',
                  error: 'Twilio SID, Auth Token या Twilio Phone Number सेट नहीं है।'
                }));
                return;
              }

              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
              const twilioBody = new URLSearchParams({
                To: `+91${cleanMobile}`,
                From: twilioFrom,
                Body: message || `Dairy Farm Pro: Your login OTP is ${otp}. Valid for 5 minutes.`
              });

              const twilioRes = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                  'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64'),
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: twilioBody.toString()
              });

              const twilioData = await twilioRes.json();
              if (twilioRes.ok) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  provider: 'Twilio',
                  message: `OTP Twilio द्वारा +91 ${cleanMobile} पर भेजा गया!`,
                  details: twilioData
                }));
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  provider: 'Twilio',
                  error: twilioData.message || 'Twilio SMS त्रुटि।',
                  details: twilioData
                }));
              }
              return;
            }

            // Provider 4: Custom SMS Webhook URL
            if (provider === 'custom' && config.customUrl) {
              const targetUrl = config.customUrl
                .replace(/\{mobile\}/g, cleanMobile)
                .replace(/\{otp\}/g, encodeURIComponent(String(otp)))
                .replace(/\{message\}/g, encodeURIComponent(message || `Your OTP is ${otp}`));

              const custRes = await fetch(targetUrl);
              const custText = await custRes.text();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: custRes.ok,
                provider: 'Custom SMS Gateway',
                message: custRes.ok ? `OTP भेजा गया!` : `कस्टम SMS गेटवे त्रुटि`,
                response: custText
              }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              notConfigured: true,
              error: 'कोई SMS गेटवे सक्रिय नहीं है।'
            }));
          } catch (err) {
            console.error('[SMS] Send OTP error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), databaseStoragePlugin()],
  server: {
    port: 3000,
    strictPort: true,
    open: false,
    host: true
  }
});
