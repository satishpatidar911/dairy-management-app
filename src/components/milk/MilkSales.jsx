import React, { useState } from 'react';
import { Truck, Store, Home, ShoppingBag, CheckCircle, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const MilkSales = () => {
  const { t } = useLanguage();
  const { stats, customers, milkEntries } = useApp();

  const [salesType, setSalesType] = useState('retail'); // retail, bulk_dairy, home
  const [bulkEntry, setBulkEntry] = useState({
    dairyName: 'Amul / Mother Dairy Center (अमूल / संकलन केंद्र)',
    quantity: '40',
    fat: '6.8',
    snf: '9.0',
    rate: '72',
    notes: 'Evening bulk tanker milk'
  });

  const totalRetailDemand = customers.reduce((sum, c) => sum + Number(c.morningQty || 0) + Number(c.eveningQty || 0), 0);
  const totalProduction = stats.todayMilkTotal;
  const balanceAvailable = Math.max(0, totalProduction - totalRetailDemand);

  return (
    <div className="space-y-6">
      {/* Distribution Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Retail Demand (खुदरा मांग)</span>
              <p className="text-xl font-bold text-slate-800">{totalRetailDemand.toFixed(1)} L</p>
              <span className="text-[11px] text-slate-500">{customers.length} Registered Customers (ग्राहक)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dairy Plant / Surplus (थोक बिक्री)</span>
              <p className="text-xl font-bold text-emerald-700">{balanceAvailable.toFixed(1)} L</p>
              <span className="text-[11px] text-emerald-600">Available for Bulk Sale</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Calf / Home Use (घरेलू उपयोग)</span>
              <p className="text-xl font-bold text-slate-800">4.5 L</p>
              <span className="text-[11px] text-slate-500">Daily Reserved (आरक्षित)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Dairy Sale Record Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <Truck className="w-4 h-4 text-dairy-600" />
            <span>Record Dairy Plant Sale (डेयरी संकलन केंद्र को बिक्री)</span>
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-dairy-100 text-dairy-800 font-bold">
            FAT/SNF Based
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dairy / Center Name (डेयरी का नाम)
            </label>
            <input
              type="text"
              value={bulkEntry.dairyName}
              onChange={(e) => setBulkEntry({ ...bulkEntry, dairyName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Milk Quantity / मात्रा (Liters)
            </label>
            <input
              type="number"
              step="0.5"
              value={bulkEntry.quantity}
              onChange={(e) => setBulkEntry({ ...bulkEntry, quantity: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold text-dairy-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              FAT % & SNF % (फेट व एसएनएफ)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="FAT"
                value={bulkEntry.fat}
                onChange={(e) => setBulkEntry({ ...bulkEntry, fat: e.target.value })}
                className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 text-center"
              />
              <input
                type="number"
                step="0.1"
                placeholder="SNF"
                value={bulkEntry.snf}
                onChange={(e) => setBulkEntry({ ...bulkEntry, snf: e.target.value })}
                className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 text-center"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rate / तय दर (₹/Liter)
            </label>
            <input
              type="number"
              value={bulkEntry.rate}
              onChange={(e) => setBulkEntry({ ...bulkEntry, rate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Amount (कुल राशि ₹)
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-extrabold text-slate-900">
              ₹{(Number(bulkEntry.quantity || 0) * Number(bulkEntry.rate || 0)).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => alert('Sale receipt recorded successfully (बिक्री रसीद दर्ज हुई)!')}
            className="px-5 py-2.5 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save Sale Receipt (बिक्री सुरक्षित करें)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
