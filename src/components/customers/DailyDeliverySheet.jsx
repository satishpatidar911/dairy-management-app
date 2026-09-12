import React, { useState } from 'react';
import { Check, X, Clock, Sun, Moon, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const DailyDeliverySheet = () => {
  const { t } = useLanguage();
  const { customers, recordCustomerDelivery } = useApp();

  const [shift, setShift] = useState('morning'); // 'morning' | 'evening'
  const [deliveryStatus, setDeliveryStatus] = useState({}); // { [custId]: 'done' | 'skipped' }
  const [customQuantities, setCustomQuantities] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  const handleDeliver = (customer) => {
    const defaultQty = shift === 'morning' ? customer.morningQty : customer.eveningQty;
    const qty = customQuantities[customer.id] !== undefined ? Number(customQuantities[customer.id]) : defaultQty;

    recordCustomerDelivery(customer.id, shift, qty);
    setDeliveryStatus(prev => ({ ...prev, [customer.id]: 'done' }));

    setToastMessage(`✓ Delivered ${qty}L to ${customer.name} (${customer.name} को सप्लाई दर्ज की गई)`);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleSkip = (customer) => {
    setDeliveryStatus(prev => ({ ...prev, [customer.id]: 'skipped' }));
    setToastMessage(`Marked skipped for ${customer.name} (${customer.name} की आज डिलीवरी बंद दर्ज की गई)`);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const totalDemandThisShift = customers.reduce((sum, c) => {
    const qty = shift === 'morning' ? c.morningQty : c.eveningQty;
    return sum + Number(qty || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Shift Switcher & Summary Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShift('morning')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              shift === 'morning'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>🌅 Morning Delivery (सुबह की डिलीवरी)</span>
          </button>

          <button
            onClick={() => setShift('evening')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              shift === 'evening'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>🌇 Evening Delivery (शाम की डिलीवरी)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
          <span>Shift Demand (कुल मांग): <strong className="text-dairy-700 text-sm">{totalDemandThisShift.toFixed(1)} L</strong></span>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Customer Delivery Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {customers.map(cust => {
          const defaultQty = shift === 'morning' ? cust.morningQty : cust.eveningQty;
          const status = deliveryStatus[cust.id];

          if (defaultQty <= 0) return null; // Skip if no demand this shift

          return (
            <div
              key={cust.id}
              className={`p-4 rounded-2xl border transition-all ${
                status === 'done'
                  ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                  : status === 'skipped'
                  ? 'bg-slate-100/70 border-slate-300 opacity-60'
                  : 'bg-white border-slate-200 shadow-card hover:shadow-card-hover'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {cust.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{cust.mobile}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{cust.address}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">Milk Rate (दूध दर)</span>
                  <span className="text-xs font-extrabold text-slate-700">₹{cust.rate}/L</span>
                </div>
              </div>

              {/* Quantity Input & Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-500">Qty (मात्रा):</span>
                  <input
                    type="number"
                    step="0.5"
                    disabled={status === 'done'}
                    defaultValue={defaultQty}
                    onChange={(e) => setCustomQuantities({ ...customQuantities, [cust.id]: e.target.value })}
                    className="w-16 px-2 py-1 text-xs text-center font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="text-xs text-slate-500 font-bold">L</span>
                </div>

                {status === 'done' ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Delivered (दिया गया)
                  </span>
                ) : status === 'skipped' ? (
                  <span className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold">
                    Skipped (बंद था)
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeliver(cust)}
                      className="px-3 py-1.5 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Deliver (दिया)</span>
                    </button>
                    <button
                      onClick={() => handleSkip(cust)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                      title="Skip / Absent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
