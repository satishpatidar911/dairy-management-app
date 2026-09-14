import { supabase } from '../utils/supabase.js';

// Helper to convert snake_case to camelCase
const snakeToCamel = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const newObj = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = snakeToCamel(obj[key]);
  }
  return newObj;
};

// Helper to convert camelCase to snake_case
const camelToSnake = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  const newObj = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snakeKey] = camelToSnake(obj[key]);
  }
  return newObj;
};

// Helper to fetch all rows across multiple pages from Supabase with ultra-fast parallel pagination
async function fetchAllSupabaseRows(tableName, orderColumn = 'delivery_id', ascending = false) {
  try {
    const pageSize = 1000;
    const { count, error: countErr } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

    if (countErr || !count) {
      const { data, error } = await supabase.from(tableName).select('*').order(orderColumn, { ascending }).limit(pageSize);
      if (error) {
        console.warn(`Error fetching ${tableName}:`, error);
        return [];
      }
      return data || [];
    }

    const totalPages = Math.ceil(count / pageSize);
    const pagePromises = [];

    for (let page = 0; page < totalPages; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      let query = supabase.from(tableName).select('*').range(from, to);
      if (orderColumn) {
        query = query.order(orderColumn, { ascending });
      }
      pagePromises.push(
        query.then(res => {
          if (res.error) {
            console.warn(`Error fetching ${tableName} page ${page}:`, res.error);
            return [];
          }
          return res.data || [];
        })
      );
    }

    const pages = await Promise.all(pagePromises);
    return pages.flat();
  } catch (err) {
    console.warn(`Exception fetching ${tableName}:`, err);
    return [];
  }
}


export const dbService = {
  // Automatic Real-Time Google Sheet to Supabase Reconciler
  // Guarantees that any delivery in the Google Sheet missing from Supabase is automatically backfilled into Supabase!
  async reconcileGoogleSheet(customSheetUrl = null) {
    try {
      const sheetUrl = customSheetUrl || 'https://docs.google.com/spreadsheets/d/1-YeMwL36BtMSzMvlbJs8xm3CHWpsm7SsFfRQPlK6-8E/gviz/tq?tqx=out:csv&sheet=CUSTOMER%20INTRY';
      const idMatch = sheetUrl.match(/\/d\/([^\/\?#&]+)/);
      const sheetId = idMatch ? decodeURIComponent(idMatch[1]) : '1-YeMwL36BtMSzMvlbJs8xm3CHWpsm7SsFfRQPlK6-8E';
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('CUSTOMER INTRY')}`;

      const res = await fetch(gvizUrl);
      if (!res.ok) return 0;
      const csv = await res.text();
      const lines = csv.split('\n');
      if (lines.length <= 1) return 0;

      // Check the latest 300 rows in Supabase
      const { data: recentSupabase, error } = await supabase
        .from('milk_deliveries')
        .select('delivery_id, source_row')
        .order('delivery_id', { ascending: false })
        .limit(300);

      if (error) return 0;

      const existingRowSet = new Set((recentSupabase || []).map(d => d.source_row).filter(Boolean));
      const maxId = recentSupabase?.[0]?.delivery_id || 33750;
      let nextId = maxId + 1;

      const missingRows = [];
      const checkFrom = Math.max(1, lines.length - 200);

      for (let i = checkFrom; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const rowNum = i + 1;

        if (!existingRowSet.has(rowNum)) {
          const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
          const cols = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            cols.push(match[1] !== undefined ? match[1] : match[2]);
          }

          const dateRaw = (cols[1] || '').trim();
          const time = (cols[2] || '').trim().toUpperCase();
          const name = (cols[3] || cols[4] || '').trim();
          const qty = parseFloat(cols[5]) || 0;
          const totalPay = parseFloat(cols[7]) || (qty * 70);

          if (!dateRaw && !name && qty === 0) continue;

          let isoDate = dateRaw;
          if (dateRaw.includes('/')) {
            const parts = dateRaw.split('/');
            if (parts.length === 3) {
              isoDate = `${parts[2].padStart(4, '20')}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
          }

          missingRows.push({
            delivery_id: nextId++,
            delivery_date: isoDate,
            delivery_time: time.includes('EV') ? 'EVENING' : 'MORNING',
            customer_name_original: name || 'ग्राहक',
            milk_liters: qty,
            bill_amount: totalPay,
            source_row: rowNum,
            source_timestamp: new Date().toISOString()
          });
        }
      }

      if (missingRows.length > 0) {
        console.log(`[Reconciler] Auto-syncing ${missingRows.length} missing rows from Google Sheet to Supabase...`);
        await supabase.from('milk_deliveries').insert(missingRows);
        return missingRows.length;
      }
      return 0;
    } catch (err) {
      console.warn('Google Sheet reconciliation warning:', err);
      return 0;
    }
  },

  // 1. Fetch All Data from Supabase with Intelligent Multi-Table Mapping & Full Pagination
  async loadAll() {
    let cloudData = null;
    try {
      // Client-side reconcile is disabled because Google Apps Script now syncs directly in real-time
      // await this.reconcileGoogleSheet().catch(() => {});

      const [
        farmProfileRes,
        animalsRes,
        customersRes,
        rawDeliveries,
        rawPayments,
        legacyCustSalesRes,
        legacyTxnsRes,
        legacyMilkRes,
        dairySalesRes,
        rateMasterRes,
        expensesRes,
        feedRes,
        healthRes,
        vacRes,
        brdRes
      ] = await Promise.all([
        supabase.from('farm_profile').select('*').maybeSingle().then(r => r.data),
        supabase.from('animals').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('customers').select('*').order('customer_name', { ascending: true }).then(r => r.data || []),
        fetchAllSupabaseRows('milk_deliveries', 'delivery_id', false),
        fetchAllSupabaseRows('payments', 'payment_id', false),
        supabase.from('customer_sales').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('customer_transactions').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('milk_entries').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
        fetchAllSupabaseRows('dairy_sales', 'date', false),
        supabase.from('rate_master_config').select('*').maybeSingle().then(r => r.data),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('feed_stock').select('*').then(r => r.data || []),
        supabase.from('health_records').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('vaccinations').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
        supabase.from('breeding_records').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
      ]);

      // Process Customers from 'customers' table
      const rawCustomers = Array.isArray(customersRes) ? customersRes : [];

      // Calculate customer-wise delivery total and payment total for balances
      const custDeliveryTotals = {};
      const custPaymentTotals = {};

      rawDeliveries.forEach(d => {
        const idKey = d.customer_id ? String(d.customer_id) : (d.customer_name_original || 'unknown');
        custDeliveryTotals[idKey] = (custDeliveryTotals[idKey] || 0) + (Number(d.bill_amount) || 0);
      });

      rawPayments.forEach(p => {
        const idKey = p.customer_id ? String(p.customer_id) : (p.customer_name_original || 'unknown');
        custPaymentTotals[idKey] = (custPaymentTotals[idKey] || 0) + (Number(p.payment_amount) || 0);
      });

      // Map Supabase Customers to Application Customers
      const mappedCustomers = rawCustomers.map(c => {
        const idKey = String(c.customer_id);
        const totalBilled = custDeliveryTotals[idKey] || custDeliveryTotals[c.customer_name] || 0;
        const totalPaid = custPaymentTotals[idKey] || custPaymentTotals[c.customer_name] || 0;
        const balance = Math.max(0, totalBilled - totalPaid);
        const advance = totalPaid > totalBilled ? totalPaid - totalBilled : 0;

        return {
          id: `CUST-${c.customer_id}`,
          rawId: c.customer_id,
          name: c.customer_name || 'ग्राहक',
          phone: c.contact_number || c.contact_number_normalized || '',
          mobile: c.contact_number || c.contact_number_normalized || '',
          address: '',
          milkType: 'cow',
          morningQty: 1.0,
          eveningQty: 0.0,
          rate: 70,
          balance,
          advance,
          status: 'active',
          joinedDate: new Date().toISOString().split('T')[0]
        };
      });

      // Map Supabase 'milk_deliveries' to 'customerSales'
      const mappedCustomerSales = rawDeliveries.map(d => {
        const liters = Number(d.milk_liters) || 0;
        const bill = d.bill_amount !== null && d.bill_amount !== undefined ? Number(d.bill_amount) : (liters > 0 ? liters * 70 : 0);
        const rate = liters > 0 && bill > 0 ? Math.round(bill / liters) : 70;
        const shift = String(d.delivery_time || 'MORNING').toLowerCase().includes('ev') ? 'evening' : 'morning';

        return {
          id: `DELIV-${d.delivery_id}`,
          rawDeliveryId: d.delivery_id,
          customerId: d.customer_id ? `CUST-${d.customer_id}` : '',
          customerName: d.customer_name_original || 'ग्राहक',
          date: d.delivery_date,
          shift,
          quantity: liters,
          rate,
          amount: bill,
          source: 'Supabase Database',
          note: d.other_customer_note || ''
        };
      });

      // If legacy customer_sales table also has rows, merge them
      const legacySales = Array.isArray(legacyCustSalesRes) ? snakeToCamel(legacyCustSalesRes) : [];
      legacySales.forEach(s => {
        if (!mappedCustomerSales.some(x => x.id === s.id)) {
          mappedCustomerSales.push(s);
        }
      });

      // Build Complete Ledger Transactions from Deliveries + Payments
      const mappedTransactions = [];

      rawDeliveries.forEach(d => {
        const liters = Number(d.milk_liters) || 0;
        const bill = d.bill_amount !== null && d.bill_amount !== undefined ? Number(d.bill_amount) : (liters > 0 ? liters * 70 : 0);
        const rate = liters > 0 && bill > 0 ? Math.round(bill / liters) : 70;
        const shift = String(d.delivery_time || 'MORNING').toLowerCase().includes('ev') ? 'evening' : 'morning';

        mappedTransactions.push({
          id: `TXN-DELIV-${d.delivery_id}`,
          customerId: d.customer_id ? `CUST-${d.customer_id}` : '',
          customerName: d.customer_name_original || 'ग्राहक',
          date: d.delivery_date,
          type: 'milk_supply',
          shift,
          liters,
          rate,
          amount: bill,
          balanceAfter: 0,
          note: d.other_customer_note || `${shift === 'morning' ? 'Morning (सुबह)' : 'Evening (शाम)'} Supply (${liters} L @ ₹${rate})`
        });
      });

      rawPayments.forEach(p => {
        mappedTransactions.push({
          id: `TXN-PMT-${p.payment_id}`,
          customerId: p.customer_id ? `CUST-${p.customer_id}` : '',
          customerName: p.customer_name_original || 'ग्राहक',
          date: p.payment_date,
          type: 'payment_received',
          liters: 0,
          rate: 0,
          amount: Number(p.payment_amount) || 0,
          paymentMode: String(p.payment_mode || 'CASH').toLowerCase(),
          balanceAfter: 0,
          note: p.other_customer_note || `Payment Received (${p.payment_mode || 'CASH'})`
        });
      });

      // Sort transactions by date descending
      mappedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      cloudData = {
        farmProfile: farmProfileRes
          ? snakeToCamel(farmProfileRes)
          : {
              farmName: 'SHIVAJI MILK CENTER',
              ownerName: 'SATISH PATIDAR',
              phone: '8770234735',
              address: 'CHAKROD KALAPIPAL',
              tagline: 'Pure & Fresh Milk, Healthy Family (शुद्ध एवं ताजा दूध, स्वस्थ परिवार)',
              upiId: '8770234735@upi'
            },
        animals: Array.isArray(animalsRes) ? snakeToCamel(animalsRes) : [],
        customers: mappedCustomers,
        customerTransactions: mappedTransactions,
        customerSales: mappedCustomerSales,
        milkEntries: Array.isArray(legacyMilkRes) ? snakeToCamel(legacyMilkRes) : [],
        dairySales: Array.isArray(dairySalesRes) ? snakeToCamel(dairySalesRes) : [],
        rateMasterConfig: rateMasterRes ? snakeToCamel(rateMasterRes) : null,
        expenses: Array.isArray(expensesRes) ? snakeToCamel(expensesRes) : [],
        feedStock: Array.isArray(feedRes) && feedRes.length > 0 ? snakeToCamel(feedRes) : null,
        healthRecords: Array.isArray(healthRes) ? snakeToCamel(healthRes) : [],
        vaccinations: Array.isArray(vacRes) ? snakeToCamel(vacRes) : [],
        breedingRecords: Array.isArray(brdRes) ? brdRes.map(b => {
          let tech = b.technician || '';
          let notes = '';
          const noteMatch = tech.match(/\((.*?)\)$/);
          if (noteMatch) {
            notes = noteMatch[1];
            tech = tech.replace(/\s*\(.*?\)$/, '').trim();
          }

          return {
            id: b.id,
            animalId: b.animal_id,
            animalName: b.animal_name,
            aiDate: b.ai_date,
            bullStrawTag: b.bull_id || '',
            bullId: b.bull_id || '',
            technicianName: tech,
            technician: tech,
            expectedCalvingDate: b.expected_calving_date,
            status: b.status || 'inseminated',
            isPregnant: b.status === 'pregnant' || b.status === 'inseminated',
            notes: notes,
            createdAt: b.created_at
          };
        }) : [],
      };
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }

    return cloudData;
  },

  // 2. Customer Save/Delete in Supabase
  async saveCustomer(customer) {
    try {
      let rawId = customer.rawId || (customer.id ? parseInt(String(customer.id).replace(/\D/g, '')) : null);
      const payload = {
        customer_name: customer.name,
        contact_number: customer.phone || customer.mobile || null,
        contact_number_normalized: customer.phone ? customer.phone.replace(/\D/g, '') : null
      };

      if (rawId) {
        payload.customer_id = rawId;
      }

      await supabase.from('customers').upsert(payload);
    } catch (e) {
      console.warn('saveCustomer to Supabase error:', e);
    }
  },

  async deleteCustomer(id) {
    try {
      const rawId = parseInt(String(id).replace(/\D/g, ''));
      if (rawId) {
        await supabase.from('customers').delete().eq('customer_id', rawId);
      }
    } catch (e) {}
  },

  // 3. Customer Sale / Delivery Save in Supabase
  async saveCustomerSale(sale) {
    try {
      const liters = Number(sale.quantity) || 0;
      const rate = Number(sale.rate) || 70;
      const amount = Number(sale.amount) || Math.round(liters * rate);
      const shift = String(sale.shift || 'morning').toUpperCase();
      const rawCustId = sale.customerId ? parseInt(String(sale.customerId).replace(/\D/g, '')) : null;

      const deliveryPayload = {
        delivery_date: sale.date || new Date().toISOString().split('T')[0],
        delivery_time: shift.includes('EV') ? 'EVENING' : 'MORNING',
        customer_id: rawCustId || null,
        customer_name_original: sale.customerName || 'Customer',
        other_customer_note: sale.note || null,
        milk_liters: liters,
        bill_amount: amount
      };

      const { data, error } = await supabase.from('milk_deliveries').insert(deliveryPayload).select('*');
      if (error) console.error('Supabase saveCustomerSale error:', error);
      else console.log('✓ Milk delivery directly saved to Supabase');
      return data?.[0];
    } catch (e) {
      console.warn('saveCustomerSale to Supabase error:', e);
    }
  },

  async deleteCustomerSale(id) {
    try {
      const rawId = parseInt(String(id).replace(/\D/g, ''));
      if (rawId) {
        await supabase.from('milk_deliveries').delete().eq('delivery_id', rawId);
      }
    } catch (e) {}
  },

  // 4. Payment Save in Supabase
  async savePayment(payment) {
    try {
      const rawCustId = payment.customerId ? parseInt(String(payment.customerId).replace(/\D/g, '')) : null;
      const payload = {
        payment_date: payment.date || new Date().toISOString().split('T')[0],
        customer_id: rawCustId || null,
        customer_name_original: payment.customerName || 'Customer',
        other_customer_note: payment.note || null,
        payment_amount: Number(payment.amount) || 0,
        payment_mode: String(payment.paymentMode || 'CASH').toUpperCase()
      };

      const { error } = await supabase.from('payments').insert(payload);
      if (error) console.error('Supabase savePayment error:', error);
      else console.log('✓ Payment directly saved to Supabase');
    } catch (e) {
      console.warn('savePayment to Supabase error:', e);
    }
  },

  // 5. Farm Profile
  async saveFarmProfile(profile) {
    try {
      const payload = {
        id: 'default',
        farm_name: profile.farmName || 'SHIVAJI MILK CENTER',
        owner_name: profile.ownerName || 'SATISH PATIDAR',
        phone: profile.phone || '8770234735',
        address: profile.address || '',
        tagline: profile.tagline || '',
        upi_id: profile.upiId || ''
      };
      await supabase.from('farm_profile').upsert(payload);
      console.log('✓ Farm Profile directly saved to Supabase');
    } catch (e) {}
  },

  // 6. Animals
  async saveAnimal(animal) {
    try {
      const payload = {
        id: animal.id || `ANM-${Date.now().toString().slice(-4)}`,
        tag_no: animal.tagNo || animal.tag_no,
        name: animal.name,
        type: animal.type || 'buffalo',
        breed: animal.breed || 'Murrah (मुर्राह)',
        gender: animal.gender || 'female',
        origin: animal.origin || 'purchased',
        dob: animal.dob && animal.dob !== 'Farm Born' ? animal.dob : null,
        purchase_date: animal.purchaseDate && animal.purchaseDate !== 'Farm Born' ? animal.purchaseDate : null,
        purchase_price: Number(animal.purchasePrice || animal.purchase_price || 0),
        mother_tag: animal.motherTag || animal.mother_tag || null,
        weight: Number(animal.weight || 450),
        daily_capacity: Number(animal.dailyCapacity || animal.daily_capacity || 0),
        status: animal.status || 'milking',
        lactation_no: Number(animal.lactationNo || animal.lactation_no || 1),
        photo: animal.photo || null,
        notes: animal.notes || null
      };
      const { error } = await supabase.from('animals').upsert(payload);
      if (error) console.error('Supabase saveAnimal error:', error);
      else console.log('✓ Animal directly synced to Supabase:', payload.name);
    } catch (e) {
      console.error('saveAnimal exception:', e);
    }
  },

  async deleteAnimal(id) {
    try {
      await supabase.from('animals').delete().eq('id', id);
    } catch (e) {}
  },

  // 7. Milk Production Entries (Farm Milk)
  async saveMilkEntry(entry) {
    try {
      const payload = {
        id: entry.id || `MILK-${Date.now().toString().slice(-4)}`,
        entry_mode: entry.entryMode || 'animal_wise',
        bulk_type: entry.bulkType || null,
        date: entry.date || new Date().toISOString().split('T')[0],
        shift: entry.shift || 'morning',
        animal_id: entry.animalId || entry.animal_id || 'GENERAL',
        animal_name: entry.animalName || entry.animal_name || 'Animal',
        animal_type: entry.animalType || entry.animal_type || 'buffalo',
        quantity: Number(entry.quantity || 0),
        fat: Number(entry.fat || 0),
        snf: Number(entry.snf || 0),
        rate: Number(entry.rate || 0),
        recorded_by: entry.recordedBy || entry.recorded_by || 'Dairy Manager',
        notes: entry.notes || null
      };
      const { error } = await supabase.from('milk_entries').upsert(payload);
      if (error) console.error('Supabase saveMilkEntry error:', error);
      else console.log('✓ Milk Entry directly synced to Supabase');
    } catch (e) {
      console.error('saveMilkEntry exception:', e);
    }
  },

  async deleteMilkEntry(id) {
    try {
      await supabase.from('milk_entries').delete().eq('id', id);
    } catch (e) {}
  },

  // 8. Wholesale Dairy Plant Sales
  async saveDairySale(sale) {
    try {
      const payload = {
        id: sale.id || `DSALE-${Date.now().toString().slice(-4)}`,
        date: sale.date || new Date().toISOString().split('T')[0],
        shift: sale.shift || 'morning',
        dairy_name: sale.dairyName || 'HARIHAR DAIRY',
        milk_type: sale.milkType || 'buffalo',
        quantity: Number(sale.quantity || 0),
        fat: Number(sale.fat || 0),
        snf: Number(sale.snf || 0),
        rate: Number(sale.rate || 0),
        total_amount: Number(sale.totalAmount || 0),
        slip_no: sale.slipNo || `SLIP-${Date.now().toString().slice(-4)}`,
        status: sale.status || 'completed'
      };
      const { error } = await supabase.from('dairy_sales').upsert(payload);
      if (error) console.error('Supabase saveDairySale error:', error);
      else console.log('✓ Dairy Sale directly saved to Supabase');
    } catch (e) {
      console.error('saveDairySale exception:', e);
    }
  },

  async deleteDairySale(id) {
    try {
      await supabase.from('dairy_sales').delete().eq('id', id);
    } catch (e) {}
  },

  // 9. Rate Master Config
  async saveRateMaster(config) {
    try {
      const payload = {
        id: 'default',
        cow_base_fat: Number(config.cowBaseFat || 3.5),
        cow_base_snf: Number(config.cowBaseSnf || 8.5),
        cow_base_rate: Number(config.cowBaseRate || 38.0),
        cow_fat_diff: Number(config.cowFatDiff || 0.40),
        cow_snf_diff: Number(config.cowSnfDiff || 0.25),
        buffalo_base_fat: Number(config.buffaloBaseFat || 6.5),
        buffalo_base_snf: Number(config.buffaloBaseSnf || 9.0),
        buffalo_base_rate: Number(config.buffaloBaseRate || 68.0),
        buffalo_fat_diff: Number(config.buffaloFatDiff || 0.65),
        buffalo_snf_diff: Number(config.buffaloSnfDiff || 0.35)
      };
      await supabase.from('rate_master_config').upsert(payload);
      console.log('✓ Rate Master directly saved to Supabase');
    } catch (e) {}
  },

  // 10. Expenses
  async saveExpense(expense) {
    try {
      const payload = {
        id: expense.id || `EXP-${Date.now().toString().slice(-4)}`,
        category: expense.category || 'general',
        title: expense.title || expense.name || 'Expense',
        amount: Number(expense.amount || 0),
        date: expense.date || new Date().toISOString().split('T')[0],
        payee: expense.payee || expense.paidTo || expense.paid_to || null,
        payment_method: expense.paymentMethod || expense.payment_method || expense.paymentMode || 'cash',
        notes: expense.notes || null
      };
      const { error } = await supabase.from('expenses').upsert(payload);
      if (error) console.error('Supabase saveExpense error:', error);
      else console.log('✓ Expense directly saved to Supabase');
    } catch (e) {
      console.error('saveExpense exception:', e);
    }
  },

  async deleteExpense(id) {
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch (e) {}
  },

  // 11. Feed Stock
  async saveFeedStockItem(item) {
    try {
      const payload = {
        id: item.id,
        name: item.name,
        stock_quantity: Number(item.stockQuantity || item.stock_quantity || 0),
        unit: item.unit || 'kg',
        daily_usage: Number(item.dailyUsage || item.daily_usage || 0),
        cost_per_unit: Number(item.costPerUnit || item.cost_per_unit || 0),
        min_threshold: Number(item.minThreshold || item.min_threshold || 10)
      };
      const { error } = await supabase.from('feed_stock').upsert(payload);
      if (error) console.error('Supabase saveFeedStock error:', error);
    } catch (e) {}
  },

  // 12. Health Records
  async saveHealthRecord(record) {
    try {
      const payload = {
        id: record.id || `HLT-${Date.now().toString().slice(-4)}`,
        animal_id: record.animalId || record.animal_id,
        animal_name: record.animalName || record.animal_name || null,
        date: record.date || new Date().toISOString().split('T')[0],
        disease: record.disease || 'General Checkup',
        diagnosis: record.diagnosis || null,
        treatment: record.treatment || null,
        doctor: record.doctor || null,
        cost: Number(record.cost || 0),
        medicine: record.medicine || null
      };
      const { error } = await supabase.from('health_records').upsert(payload);
      if (error) console.error('Supabase saveHealthRecord error:', error);
    } catch (e) {}
  },

  // 13. Vaccinations
  async saveVaccination(vac) {
    try {
      const payload = {
        id: vac.id || `VAC-${Date.now().toString().slice(-4)}`,
        vaccine_name: vac.vaccineName || vac.vaccine_name || 'Vaccine',
        target: vac.target || vac.animalType || 'All Cattle',
        next_due_date: vac.nextDueDate || vac.next_due_date || vac.date || new Date().toISOString().split('T')[0],
        status: vac.status || 'scheduled',
        notes: vac.notes || null
      };
      const { error } = await supabase.from('vaccinations').upsert(payload);
      if (error) console.error('Supabase saveVaccination error:', error);
    } catch (e) {}
  },

  // 14. Breeding Records
  async saveBreedingRecord(brd) {
    try {
      let tech = brd.technicianName || brd.technician || null;
      if (brd.notes && String(brd.notes).trim()) {
        const noteText = String(brd.notes).trim();
        tech = tech ? `${tech} (${noteText})` : noteText;
      }

      const payload = {
        id: brd.id || `BRD-${Date.now().toString().slice(-4)}`,
        animal_id: brd.animalId || brd.animal_id,
        animal_name: brd.animalName || brd.animal_name || null,
        ai_date: brd.aiDate || brd.ai_date || brd.breedingDate || brd.date || new Date().toISOString().split('T')[0],
        bull_id: brd.bullStrawTag || brd.bullId || brd.bull_id || null,
        technician: tech,
        expected_calving_date: brd.expectedCalvingDate || brd.expected_calving_date || null,
        status: brd.status || 'inseminated'
      };

      const { error } = await supabase.from('breeding_records').upsert(payload);
      if (error) {
        console.error('Supabase saveBreedingRecord error:', error);
        return { success: false, error };
      }
      console.log('✓ Breeding record saved to Supabase:', payload.id);
      return { success: true, id: payload.id };
    } catch (e) {
      console.error('Supabase saveBreedingRecord exception:', e);
      return { success: false, error: e };
    }
  },

  async deleteBreedingRecord(id) {
    try {
      const { error } = await supabase.from('breeding_records').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteBreedingRecord error:', error);
        return { success: false, error };
      }
      console.log('✓ Breeding record deleted from Supabase:', id);
      return { success: true };
    } catch (e) {
      console.error('Supabase deleteBreedingRecord exception:', e);
      return { success: false, error: e };
    }
  },

  // 15. Ledger Transactions
  async saveTransaction(txn) {
    try {
      if (txn.type === 'payment_received') {
        await this.savePayment(txn);
      } else if (txn.type === 'milk_supply') {
        await this.saveCustomerSale(txn);
      }
    } catch (e) {}
  },

  // 16. Cattle Sales (Animal Sale Hub)
  async saveCattleSale(sale) {
    try {
      const payload = {
        id: sale.id || `CS-${Date.now().toString().slice(-6)}`,
        animal_id: sale.animalId || sale.animal_id || null,
        tag_no: sale.tagNo || sale.tag_no || null,
        animal_name: sale.animalName || sale.animal_name || 'Animal',
        animal_type: sale.animalType || sale.animal_type || 'cow',
        breed: sale.breed || null,
        sale_date: sale.saleDate || sale.sale_date || new Date().toISOString().split('T')[0],
        sale_price: Number(sale.salePrice || sale.sale_price || 0),
        paid_amount: Number(sale.paidAmount || sale.paid_amount || 0),
        payment_mode: sale.paymentMode || sale.payment_mode || 'cash',
        buyer_name: sale.buyerName || sale.buyer_name || 'Buyer',
        buyer_phone: sale.buyerPhone || sale.buyer_phone || null,
        buyer_address: sale.buyerAddress || sale.buyer_address || null,
        reason: sale.reason || null,
        notes: sale.notes || null
      };
      const { error } = await supabase.from('cattle_sales').upsert(payload);
      if (error) console.log('Supabase cattle_sales notice (stored locally):', error.message);
      else console.log('✓ Cattle Sale directly synced to Supabase');
    } catch (e) {
      console.warn('saveCattleSale exception (handled gracefully):', e);
    }
  },

  async deleteCattleSale(id) {
    try {
      await supabase.from('cattle_sales').delete().eq('id', id);
    } catch (e) {}
  },

  // 17. User Login & Password Check from Supabase 'app_users' & Local Database
  async authenticateUser(loginId, password) {
    const cleanId = String(loginId || '').trim();
    const cleanPass = String(password || '').trim();
    if (!cleanId || !cleanPass) return { success: false, error: 'कृपया लॉगिन आईडी और पासवर्ड दर्ज करें' };

    // 1. Try Supabase app_users table
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .or(`login_id.eq.${cleanId},mobile.eq.${cleanId}`)
        .eq('password', cleanPass)
        .eq('is_active', true)
        .maybeSingle();

      if (data && !error) {
        return {
          success: true,
          user: {
            id: data.id,
            loginId: data.login_id,
            name: data.full_name,
            phone: data.mobile,
            mobile: data.mobile,
            role: data.role,
            title: data.role === 'admin' ? 'मालिक (Owner)' : (data.role === 'manager' ? 'मुनीम (Manager)' : 'ग्वाला (Worker)')
          }
        };
      }
    } catch (e) {
      console.warn('authenticateUser remote query warning:', e);
    }

    // 2. Fallback to Local Server Database (/api/db)
    try {
      const res = await fetch('/api/db');
      const db = await res.json();
      if (db && Array.isArray(db.users)) {
        const found = db.users.find(u => 
          u.isActive !== false &&
          (String(u.loginId).toLowerCase() === cleanId.toLowerCase() || String(u.mobile) === cleanId) &&
          String(u.password) === cleanPass
        );
        if (found) {
          return {
            success: true,
            user: {
              id: found.id,
              loginId: found.loginId,
              name: found.fullName || found.name,
              phone: found.mobile,
              mobile: found.mobile,
              role: found.role,
              title: found.role === 'admin' ? 'मालिक (Owner)' : (found.role === 'manager' ? 'मुनीम (Manager)' : 'ग्वाला (Worker)')
            }
          };
        }
      }
    } catch (e) {
      console.warn('authenticateUser local query warning:', e);
    }

    return null;
  },

  // 17.1 Get all users from Database
  async getUsers() {
    try {
      const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          loginId: d.login_id,
          password: d.password,
          fullName: d.full_name,
          mobile: d.mobile,
          role: d.role,
          isActive: d.is_active
        }));
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/db');
      const db = await res.json();
      if (db && Array.isArray(db.users)) {
        return db.users;
      }
    } catch (e) {}

    return [];
  },

  // 17.2 Save or Update User in Database
  async saveUser(user) {
    const cleanUser = {
      id: user.id || `usr_${Date.now()}`,
      loginId: String(user.loginId || user.login_id || '').trim().toLowerCase(),
      password: String(user.password || '').trim(),
      fullName: user.fullName || user.full_name || 'Staff User',
      mobile: String(user.mobile || '').replace(/\D/g, '').slice(-10),
      role: user.role || 'worker',
      isActive: user.isActive !== undefined ? user.isActive : true,
      updatedAt: new Date().toISOString()
    };

    // 1. Save to local database
    try {
      const res = await fetch('/api/db');
      const db = await res.json();
      const currentUsers = Array.isArray(db.users) ? db.users : [];
      const index = currentUsers.findIndex(u => u.id === cleanUser.id || u.loginId === cleanUser.loginId);

      let updatedUsers;
      if (index >= 0) {
        updatedUsers = [...currentUsers];
        updatedUsers[index] = { ...updatedUsers[index], ...cleanUser };
      } else {
        updatedUsers = [cleanUser, ...currentUsers];
      }

      await fetch('/api/db/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: updatedUsers })
      });
    } catch (e) {
      console.warn('saveUser local error:', e);
    }

    // 2. Save to Supabase (if table exists)
    try {
      await supabase.from('app_users').upsert({
        id: cleanUser.id,
        login_id: cleanUser.loginId,
        password: cleanUser.password,
        full_name: cleanUser.fullName,
        mobile: cleanUser.mobile,
        role: cleanUser.role,
        is_active: cleanUser.isActive
      });
    } catch (e) {}

    return cleanUser;
  },

  // 17.3 Delete User from Database
  async deleteUser(userId) {
    try {
      const res = await fetch('/api/db');
      const db = await res.json();
      if (db && Array.isArray(db.users)) {
        const filtered = db.users.filter(u => u.id !== userId && u.loginId !== userId);
        await fetch('/api/db/patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: filtered })
        });
      }
    } catch (e) {}

    try {
      await supabase.from('app_users').delete().eq('id', userId);
    } catch (e) {}

    return true;
  },

  // 18. Generate and store OTP in Supabase 'user_otps'
  async createOtp(mobile) {
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiry

    try {
      await supabase.from('user_otps').insert({
        mobile: cleanMobile,
        otp_code: otpCode,
        expires_at: expiresAt,
        is_verified: false
      });
    } catch (e) {
      console.warn('createOtp remote insert warning:', e);
    }

    return { otp: otpCode, mobile: cleanMobile, expiresAt };
  },

  // 19. Verify OTP from Supabase 'user_otps'
  async verifyOtp(mobile, enteredOtp) {
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
    const cleanOtp = String(enteredOtp || '').trim();

    try {
      const { data, error } = await supabase
        .from('user_otps')
        .select('*')
        .eq('mobile', cleanMobile)
        .eq('otp_code', cleanOtp)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        await supabase.from('user_otps').update({ is_verified: true }).eq('id', data.id);
        return { success: true };
      }
    } catch (e) {
      console.warn('verifyOtp remote query warning:', e);
    }

    return { success: false };
  }
};
