import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Link,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Copy,
  ExternalLink,
  Code,
  Sparkles,
  Zap,
  HelpCircle,
  UploadCloud,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GoogleFormSyncModal = ({ isOpen, onClose }) => {
  const {
    googleSheetsConfig,
    updateGoogleSheetsConfig,
    fetchAndSyncGoogleSheet,
    customerSales,
    customers
  } = useApp();

  const [sheetUrlInput, setSheetUrlInput] = useState(googleSheetsConfig.sheetUrl || '');
  const [syncInterval, setSyncInterval] = useState(googleSheetsConfig.syncInterval || 2);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(googleSheetsConfig.autoSyncEnabled ?? true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('live_sync'); // 'live_sync' | 'form_guide' | 'apps_script'
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndSync = async (e) => {
    e.preventDefault();
    if (!sheetUrlInput.trim()) {
      alert('Please enter your Google Sheet link (कृपया Google Sheet लिंक दर्ज करें)');
      return;
    }

    updateGoogleSheetsConfig({
      sheetUrl: sheetUrlInput.trim(),
      syncInterval: Number(syncInterval),
      autoSyncEnabled
    });

    setIsSyncing(true);
    setSyncResult(null);

    const res = await fetchAndSyncGoogleSheet(sheetUrlInput.trim());
    setIsSyncing(false);
    setSyncResult(res);
  };

  const handleManualSyncNow = async () => {
    if (!sheetUrlInput.trim() && !googleSheetsConfig.sheetUrl) {
      alert('Please enter your Google Sheet link first');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    const res = await fetchAndSyncGoogleSheet(sheetUrlInput.trim() || googleSheetsConfig.sheetUrl);
    setIsSyncing(false);
    setSyncResult(res);
  };

  const googleAppsScriptCode = `/**
 * Google Apps Script for Instant Real-Time Google Form to Dairy Software Sync
 * Instructions:
 * 1. Open your linked Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Delete existing code, paste this code, and click Save (💾)
 * 4. Click Triggers (⏰ clock icon) > Add Trigger
 *    - Function: onFormSubmit
 *    - Event Source: From spreadsheet
 *    - Event type: On form submit
 * 5. Save & Authorize. Done!
 */

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  var payload = {};
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i].toString().toLowerCase().trim();
    if (key.indexOf('name') > -1 || key.indexOf('नाम') > -1 || key.indexOf('ग्राहक') > -1) {
      payload.name = rowData[i];
    } else if (key.indexOf('phone') > -1 || key.indexOf('mobile') > -1 || key.indexOf('मोबाइल') > -1) {
      payload.mobile = rowData[i];
    } else if (key.indexOf('qty') > -1 || key.indexOf('quantity') > -1 || key.indexOf('मात्रा') > -1 || key.indexOf('लीटर') > -1) {
      payload.quantity = parseFloat(rowData[i]) || 0;
    } else if (key.indexOf('rate') > -1 || key.indexOf('price') > -1 || key.indexOf('दर') > -1) {
      payload.rate = parseFloat(rowData[i]) || 60;
    } else if (key.indexOf('shift') > -1 || key.indexOf('शिफ्ट') > -1) {
      payload.shift = rowData[i];
    } else if (key.indexOf('address') > -1 || key.indexOf('पता') > -1) {
      payload.address = rowData[i];
    } else if (key.indexOf('type') > -1 || key.indexOf('प्रकार') > -1) {
      payload.milkType = rowData[i];
    }
  }

  // Fallback if specific headers not found
  if (!payload.name && rowData.length >= 2) payload.name = rowData[1];
  if (!payload.quantity && rowData.length >= 3) payload.quantity = parseFloat(rowData[2]) || 0;

  var webhookUrl = "http://localhost:3000/api/webhook/google-sheets";
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (err) {
    Logger.log("Sync error: " + err);
  }
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl shadow">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Google Forms & Google Sheets Auto-Sync (ऑटोमैटिक सिंक)</span>
              </h3>
              <p className="text-xs text-emerald-200">
                Automatic customer data and milk delivery intake from Google Forms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5 flex-shrink-0">
          <button
            onClick={() => setActiveSubTab('live_sync')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'live_sync'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>1. Live Sheet Auto-Sync (लाइव लिंक जोड़ें)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('form_guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'form_guide'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>2. Setup Guide (गूगल फॉर्म कैसे जोड़ें)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('apps_script')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'apps_script'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4 text-purple-600" />
            <span>3. Real-Time Apps Script (0-Second Push)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* ============================================================== */}
          {/* SUB-TAB 1: LIVE SHEET AUTO-SYNC                                */}
          {/* ============================================================== */}
          {activeSubTab === 'live_sync' && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    googleSheetsConfig.sheetUrl ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}></div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                      {googleSheetsConfig.sheetUrl
                        ? '🟢 Google Sheets Live Auto-Sync Active (सक्रिय)'
                        : '⚪ No Google Sheet Connected (कोई शीट लिंक नहीं है)'}
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {googleSheetsConfig.sheetUrl
                        ? `Auto-syncing every ${googleSheetsConfig.syncInterval || 2} min • Last check: ${googleSheetsConfig.lastSyncTime || 'Never'}`
                        : 'Paste your Google Sheet share link below to start automatic syncing.'}
                    </p>
                  </div>
                </div>

                {googleSheetsConfig.sheetUrl && (
                  <button
                    type="button"
                    onClick={handleManualSyncNow}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : '⚡ Sync Now (तुरंत सिंक करें)'}</span>
                  </button>
                )}
              </div>

              {/* Sync Result Alert */}
              {syncResult && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in ${
                  syncResult.success
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-rose-50 border-2 border-rose-300 text-rose-900'
                }`}>
                  {syncResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p>{syncResult.message || syncResult.error}</p>
                    {!syncResult.success && (
                      <div className="text-[11px] font-normal text-rose-800 pt-1 border-t border-rose-200 mt-1">
                        <strong>समाधान:</strong> Google Sheet में ऊपर <strong>'Share'</strong> बटन पर क्लिक करके <strong>"Anyone with the link"</strong> को 'Viewer' सेट करें, अथवा 'File &gt; Share &gt; Publish to web (CSV)' करें।
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Google Sheet URL Config Form */}
              <form onSubmit={handleSaveAndSync} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Google Sheet Share Link (गूगल शीट का लिंक यहाँ पेस्ट करें): *</span>
                    <a
                      href="https://docs.google.com/spreadsheets"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-normal"
                    >
                      <span>Open Google Sheets</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="relative">
                    <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      required
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                {/* Illustrated Permission Helper Box */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-1.5">
                  <h5 className="font-bold flex items-center gap-1.5 text-amber-900">
                    <span>🔑</span>
                    <span>Google Sheet शेयरिंग परमिशन कैसे सेट करें (Important):</span>
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800">
                    <li>Google Sheet खोलें &gt; ऊपर दाईं ओर <strong>"Share" (शेयर)</strong> बटन दबाएं।</li>
                    <li>General access में <strong>"Restricted"</strong> को बदलकर <strong>"Anyone with the link" (कोई भी जिसके पास लिंक है)</strong> चुनें।</li>
                    <li>दाईं ओर <strong>"Viewer" (दर्शक)</strong> रहने दें और <strong>Copy Link</strong> करके ऊपर पेस्ट करें।</li>
                  </ol>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Auto-Sync Frequency (सिंक अंतराल)
                    </label>
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold"
                    >
                      <option value={1}>Every 1 Minute (हर 1 मिनट में)</option>
                      <option value={2}>Every 2 Minutes (हर 2 मिनट में)</option>
                      <option value={5}>Every 5 Minutes (हर 5 मिनट में)</option>
                      <option value={10}>Every 10 Minutes (हर 10 मिनट में)</option>
                      <option value={15}>Every 15 Minutes (हर 15 मिनट में)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Auto Background Sync
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={autoSyncEnabled}
                          onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Enable Auto-Sync in Background (चालू रखें)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-slate-500">
                    👥 <strong>Auto Registration:</strong> नए ग्राहकों का नाम, मोबाइल व पता अपने आप कस्टमर लिस्ट में दर्ज हो जाएगा।
                  </span>

                  <button
                    type="submit"
                    disabled={isSyncing || !sheetUrlInput.trim()}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 ${
                      sheetUrlInput.trim()
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'Connecting...' : 'Save & Start Auto-Sync (सुरक्षित करें व सिंक करें)'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-TAB 2: STEP-BY-STEP SETUP GUIDE                            */}
          {/* ============================================================== */}
          {activeSubTab === 'form_guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
                <h4 className="font-bold text-sm text-emerald-300">
                  🚀 3 आसान चरणों में Google Form को सॉफ्टवेयर से कनेक्ट करें
                </h4>
                <p className="text-xs text-slate-300">
                  ग्राहकों द्वारा भरा गया फॉर्म सीधे आपकी Google Sheet में और वहाँ से तुरंत इस सॉफ्टवेयर के खाताबही में दर्ज हो जाएगा।
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    Google Form बनाएं (Create Google Form)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  <a href="https://forms.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">
                    forms.google.com
                  </a> पर जाएं और एक नया फॉर्म बनाएं जिसमें निम्न प्रश्न जोड़ें:
                </p>
                <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <strong>1. ग्राहक का नाम (Customer Name)</strong> — Short Answer
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <strong>2. दूध मात्रा / Liters (Quantity)</strong> — Number (उदा. 2.5)
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <strong>3. शिफ्ट (Shift)</strong> — Multiple Choice (Morning / Evening)
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <strong>4. मोबाइल नंबर (Mobile No)</strong> — Number (वैकल्पिक)
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    फॉर्म को Google Sheets से लिंक करें (Link to Sheets)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  Google Form के ऊपर <strong>'Responses'</strong> टैब में जाएं और हरे रंग के <strong>'Link to Sheets'</strong> (स्प्रेडशीट में देखें) बटन पर क्लिक करें। इससे एक Google Sheet बन जाएगी।
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    Google Sheet का लिंक कॉपी करके सॉफ्टवेयर में पेस्ट करें
                  </h4>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  Google Sheet के ऊपर दाईं ओर <strong>'Share'</strong> बटन दबाएं। 'General access' में <strong>"Anyone with the link"</strong> को 'Viewer' सेट करें, लिंक कॉपी करें और टैब 1 में पेस्ट करके <strong>'Save & Start Auto-Sync'</strong> दबा दें!
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-TAB 3: REAL-TIME GOOGLE APPS SCRIPT (0-SECOND PUSH)        */}
          {/* ============================================================== */}
          {activeSubTab === 'apps_script' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>0-सेकंड रियल-टाइम Google Apps Script (Instant Webhook)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={copyScriptToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? '✓ Copied!' : '📋 Copy Script'}</span>
                  </button>
                </div>
                <p className="text-xs text-purple-800">
                  यदि आप चाहते हैं कि ग्राहक द्वारा Google Form भरते ही <strong>बिना 1 सेकंड की देरी</strong> के तुरंत सॉफ्टवेयर में डेटा दर्ज हो जाए, तो इस स्क्रिप्ट को अपनी Google Sheet के <strong>Extensions &gt; Apps Script</strong> में पेस्ट कर दें।
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {googleAppsScriptCode}
                </pre>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <strong className="block text-slate-900">सेटअप करने के 3 स्टेप्स:</strong>
                <p>1. Google Sheet खोलें &gt; मेन्यू में <strong>Extensions &gt; Apps Script</strong> पर क्लिक करें।</p>
                <p>2. ऊपर का पूरा कोड कॉपी करके वहाँ पेस्ट करें और सेव (Ctrl+S) करें।</p>
                <p>3. बाईं ओर <strong>Triggers (घड़ी का निशान)</strong> पर जाएं &gt; <strong>Add Trigger</strong> &gt; Event type में <strong>'On form submit'</strong> चुनें व सेव करें।</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Status: <strong className="text-slate-800">{googleSheetsConfig.lastSyncMessage || 'Ready to sync'}</strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Close (बंद करें)
          </button>
        </div>
      </div>
    </div>
  );
};
