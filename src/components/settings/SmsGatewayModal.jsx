import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Send, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { smsService } from '../../services/smsService';

export const SmsGatewayModal = ({ isOpen, onClose }) => {
  const [smsConfig, setSmsConfig] = useState({
    provider: 'fast2sms',
    apiKey: '',
    twoFactorApiKey: '',
    twilioSid: '',
    twilioAuthToken: '',
    twilioFrom: '',
    customUrl: '',
    isConfigured: false
  });
  const [testMobile, setTestMobile] = useState('8770234735');
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testSmsStatus, setTestSmsStatus] = useState(null);
  const [isSavingSms, setIsSavingSms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      smsService.getSmsConfig().then(cfg => {
        if (cfg) {
          setSmsConfig(cfg);
        }
      });
      setTestSmsStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSmsConfig = async () => {
    setIsSavingSms(true);
    setTestSmsStatus(null);
    try {
      const res = await smsService.saveSmsConfig(smsConfig);
      if (res.success) {
        setSmsConfig(prev => ({
          ...prev,
          isConfigured: !!(prev.apiKey || prev.twoFactorApiKey || (prev.twilioSid && prev.twilioAuthToken) || prev.customUrl)
        }));
        setTestSmsStatus({ type: 'success', message: '✓ SMS गेटवे सेटिंग्स सुरक्षित हो गईं!' });
        setTimeout(() => onClose(), 1500);
      } else {
        setTestSmsStatus({ type: 'error', message: res.error || 'सेव करने में त्रुटि' });
      }
    } catch (e) {
      setTestSmsStatus({ type: 'error', message: e.message });
    } finally {
      setIsSavingSms(false);
    }
  };

  const handleSendTestSms = async () => {
    const cleanNum = String(testMobile || '').replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length !== 10) {
      setTestSmsStatus({ type: 'error', message: 'कृपया 10-अंकों का वैध मोबाइल नंबर दर्ज करें' });
      return;
    }
    setIsTestingSms(true);
    setTestSmsStatus(null);
    try {
      await smsService.saveSmsConfig(smsConfig);
      const res = await smsService.sendTestSms(cleanNum, smsConfig.provider);
      if (res.success) {
        setTestSmsStatus({ 
          type: 'success', 
          message: `✓ टेस्ट SMS +91 ${cleanNum} पर भेज दिया गया! अपना इनबॉक्स देखें।` 
        });
      } else {
        setTestSmsStatus({ 
          type: 'error', 
          message: res.error || 'SMS नहीं भेजा जा सका। कृपया API Key या बैलेंस चेक करें।' 
        });
      }
    } catch (e) {
      setTestSmsStatus({ type: 'error', message: 'नेटवर्क त्रुटि: ' + e.message });
    } finally {
      setIsTestingSms(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                लाइव SMS गेटवे सेटअप (SMS Gateway)
              </h3>
              <p className="text-xs text-slate-400">
                लॉगिन OTP सीधे मोबाइल फोन पर भेजने के लिए सुरक्षित सेटिंग्स
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Selection Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">
            SMS सेवा प्रदाता चुनें (Select Provider):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'fast2sms', name: 'Fast2SMS', tag: 'अनुशंसित (Free ₹50)' },
              { id: '2factor', name: '2Factor.in', tag: 'OTP Gateway' },
              { id: 'twilio', name: 'Twilio', tag: 'Global' },
              { id: 'custom', name: 'Custom URL', tag: 'Webhook' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSmsConfig(prev => ({ ...prev, provider: p.id }))}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  smsConfig.provider === p.id
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-extrabold">{p.name}</div>
                <div className="text-[10px] text-emerald-400/80 font-semibold">{p.tag}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Fast2SMS Config */}
        {smsConfig.provider === 'fast2sms' && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Fast2SMS Authorization API Key:</span>
              <a
                href="https://www.fast2sms.com/dashboard/dev-api"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Free Key लें</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder="Fast2SMS API Key यहाँ पेस्ट करें"
              value={smsConfig.apiKey}
              onChange={(e) => setSmsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* 2Factor Config */}
        {smsConfig.provider === '2factor' && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">2Factor.in API Key:</span>
              <a
                href="https://2factor.in/v3/login"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>2Factor Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder="2Factor API Key"
              value={smsConfig.twoFactorApiKey}
              onChange={(e) => setSmsConfig(prev => ({ ...prev, twoFactorApiKey: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Test SMS dispatch */}
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>📲 अपने मोबाइल पर टेस्ट SMS भेजें:</span>
          </label>

          <div className="flex gap-2">
            <input
              type="tel"
              maxLength={10}
              placeholder="10-अंकों का मोबाइल नंबर"
              value={testMobile}
              onChange={(e) => setTestMobile(e.target.value.replace(/\D/g, ''))}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSendTestSms}
              disabled={isTestingSms}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {isTestingSms ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>भेज रहे हैं...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>टेस्ट SMS भेजें</span>
                </>
              )}
            </button>
          </div>

          {testSmsStatus && (
            <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              testSmsStatus.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}>
              {testSmsStatus.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{testSmsStatus.message}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            बंद करें
          </button>

          <button
            type="button"
            onClick={handleSaveSmsConfig}
            disabled={isSavingSms}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            {isSavingSms ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>सेव हो रहा है...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>सेटिंग्स सुरक्षित करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
