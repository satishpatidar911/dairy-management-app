import React from 'react';
import { X, AlertTriangle, Syringe, Calendar, HeartPulse, Wheat, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const NotificationDrawer = ({ isOpen, onClose, onNavigate }) => {
  const { t } = useLanguage();
  const { alerts, isDark } = useApp();

  if (!isOpen) return null;

  const getIcon = (module) => {
    switch (module) {
      case 'feed':
        return <Wheat className="w-5 h-5 text-amber-500" />;
      case 'health':
        return <Syringe className="w-5 h-5 text-rose-500" />;
      case 'breeding':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getBorderColor = (type) => {
    if (isDark) {
      switch (type) {
        case 'danger':
          return 'border-rose-800/80 bg-rose-950/40 text-rose-200';
        case 'warning':
          return 'border-amber-800/80 bg-amber-950/40 text-amber-200';
        case 'info':
          return 'border-blue-800/80 bg-blue-950/40 text-blue-200';
        default:
          return 'border-slate-800 bg-slate-900/60 text-slate-200';
      }
    }
    switch (type) {
      case 'danger':
        return 'border-rose-200 bg-rose-50/70 text-slate-800';
      case 'warning':
        return 'border-amber-200 bg-amber-50/70 text-slate-800';
      case 'info':
        return 'border-blue-200 bg-blue-50/70 text-slate-800';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print print:hidden">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-md shadow-2xl flex flex-col transition-colors ${
          isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        }`}>
          {/* Header */}
          <div className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-sm font-bold tracking-wide">
                {t.dashboard.alertsTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                  isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  ✓
                </div>
                <p className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>All clear! (सब कुछ सही है!)</p>
                <p className="text-xs text-slate-400 mt-1">No urgent alerts or reminders (कोई आपातकालीन अलर्ट नहीं है).</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border ${getBorderColor(alert.type)} transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-lg shadow-sm border ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                    }`}>
                      {getIcon(alert.module)}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {alert.message}
                      </p>
                      
                      <button
                        onClick={() => {
                          onNavigate(alert.module);
                          onClose();
                        }}
                        className={`mt-2 text-[11px] font-bold flex items-center gap-1 group ${
                          isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-dairy-700 hover:text-dairy-800'
                        }`}
                      >
                        <span>View Module (मॉड्यूल देखें)</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
          }`}>
            <span>Total Alerts (कुल अलर्ट): <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{alerts.length}</strong></span>
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg border font-semibold shadow-sm transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {t.actions.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
