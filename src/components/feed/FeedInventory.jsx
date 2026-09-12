import React, { useState } from 'react';
import {
  Wheat,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ShoppingBag,
  Clock,
  ArrowDownCircle,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const FeedInventory = () => {
  const { t } = useLanguage();
  const { feedStock, addFeedStock, recordDailyFeedUsage } = useApp();

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState(feedStock[0]?.id || '');
  const [amountToAdd, setAmountToAdd] = useState('');
  const [costToAdd, setCostToAdd] = useState('');
  const [usageAmount, setUsageAmount] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const handleAddStockSubmit = (e) => {
    e.preventDefault();
    if (!amountToAdd) return;

    addFeedStock(selectedFeedId, Number(amountToAdd), Number(costToAdd) || 0);
    setIsAddStockOpen(false);
    setAmountToAdd('');
    setCostToAdd('');

    setToastMsg('✓ Stock updated successfully (स्टॉक सुरक्षित हुआ)!');
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleUsageSubmit = (e) => {
    e.preventDefault();
    if (!usageAmount) return;

    recordDailyFeedUsage(selectedFeedId, Number(usageAmount));
    setIsUsageOpen(false);
    setUsageAmount('');

    setToastMsg('✓ Daily ration consumption recorded (दैनिक दाना खपत दर्ज हुई)!');
    setTimeout(() => setToastMsg(''), 2500);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.feed.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              {feedStock.length} Feed Items (आहार सामग्री)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Green & Dry Fodder, Cattle Pellets, Cakes & Mineral Mixture Inventory Tracker
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUsageOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <span>Record Daily Usage (दैनिक उपयोग दर्ज करें)</span>
          </button>

          <button
            onClick={() => setIsAddStockOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Stock Purchase (+ नया स्टॉक खरीदें)</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feedStock.map(item => {
          const isLowStock = item.stockQuantity <= (item.minThreshold || 100);
          const daysRemaining = item.dailyUsage > 0 ? Math.floor(item.stockQuantity / item.dailyUsage) : 99;
          const maxCapacity = (item.minThreshold || 100) * 5;
          const progressPercent = Math.min(100, Math.round((item.stockQuantity / maxCapacity) * 100));

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                isLowStock
                  ? 'bg-amber-50/50 border-amber-300 shadow-md ring-1 ring-amber-300'
                  : 'bg-white border-slate-200 shadow-card hover:shadow-card-hover'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {item.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
                    Rate (दर): ₹{item.costPerUnit} / {item.unit}
                  </span>
                </div>

                {isLowStock ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> Low Stock (कम स्टॉक!)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Sufficient (पर्याप्त)
                  </span>
                )}
              </div>

              {/* Quantity Big Display */}
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {item.stockQuantity}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">{item.unit} Available (उपलब्ध)</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">Est. Left (अनुमानित शेष)</span>
                  <span className={`text-sm font-extrabold ${daysRemaining <= 5 ? 'text-rose-600' : 'text-slate-700'}`}>
                    ~{daysRemaining} Days (दिन)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLowStock ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Daily Burn Rate & Quick Refill */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Daily Usage (दैनिक खपत): <strong>{item.dailyUsage} {item.unit}/day</strong>
                </span>

                <button
                  onClick={() => {
                    setSelectedFeedId(item.id);
                    setIsAddStockOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition-colors"
                >
                  + Refill (+ रिफिल)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD STOCK PURCHASE */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Add Feed Stock Purchase (नया स्टॉक खरीद)</span>
              </h3>
              <button
                onClick={() => setIsAddStockOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Feed Item (आहार सामग्री चुनें)
                </label>
                <select
                  value={selectedFeedId}
                  onChange={(e) => setSelectedFeedId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                >
                  {feedStock.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Current: {f.stockQuantity} {f.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity to Add (मात्रा) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={amountToAdd}
                    onChange={(e) => setAmountToAdd(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold text-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Cost (लागत ₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 12500"
                    value={costToAdd}
                    onChange={(e) => setCostToAdd(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                * Entering cost will automatically log an entry in Expense Tracker (खर्च में भी दर्ज होगा).
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStockOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
                >
                  Update Stock (स्टॉक अपडेट करें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD DAILY USAGE */}
      {isUsageOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-400" />
                <span>Record Daily Consumption (दैनिक दाना खपत दर्ज करें)</span>
              </h3>
              <button
                onClick={() => setIsUsageOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUsageSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Feed Item (आहार सामग्री)
                </label>
                <select
                  value={selectedFeedId}
                  onChange={(e) => setSelectedFeedId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                >
                  {feedStock.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Stock: {f.stockQuantity} {f.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consumed Quantity (मात्रा - Kg/Unit) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 40"
                  value={usageAmount}
                  onChange={(e) => setUsageAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUsageOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-md"
                >
                  Save Usage (खपत सुरक्षित करें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
