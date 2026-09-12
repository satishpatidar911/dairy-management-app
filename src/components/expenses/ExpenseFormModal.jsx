import React, { useState } from 'react';
import { X, Save, Receipt, IndianRupee } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const ExpenseFormModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { addExpense } = useApp();

  const [formData, setFormData] = useState({
    category: 'fodder',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payee: '',
    paymentMethod: 'cash',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.title) return;

    addExpense({
      ...formData,
      amount: Number(formData.amount)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>{t.expenses.addExpense}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category / खर्च श्रेणी *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 bg-white font-medium"
              >
                <option value="fodder">🌾 Green & Dry Fodder (चारा एवं भूसा)</option>
                <option value="feed">🥣 Feed & Cakes (दाना, खल व चोकर)</option>
                <option value="medicine">🩺 Vet & Medicine (दवाई व डॉक्टर फीस)</option>
                <option value="labor">👷 Labor & Wages (मजदूरी व वेतन)</option>
                <option value="utility">⚡ Electricity & Water (बिजली व पानी बिल)</option>
                <option value="animalPurchase">🐄 Animal Purchase (पशु खरीद)</option>
                <option value="equipment">🔧 Equipment & Maintenance (उपकरण व मरम्मत)</option>
                <option value="other">📦 Other Expenses (अन्य फुटकर खर्च)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date / तारीख
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title / विवरण *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2 Trolley Green Fodder, 10 Bags Mustard Cake"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount / राशि (₹) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 3500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-black text-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method / माध्यम
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="cash">Cash (नकद)</option>
                <option value="upi">UPI / PhonePe / GPay</option>
                <option value="bank">Bank Transfer (बैंक)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paid To / Vendor (दुकानदार / प्राप्तकर्ता)
            </label>
            <input
              type="text"
              placeholder="e.g. Kisan Rampal, Patel Feed Center"
              value={formData.payee}
              onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / टिप्पणी / बिल नं.
            </label>
            <textarea
              rows="2"
              placeholder="Bill number, notes (बिल नंबर, रसीद नोट आदि)..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel (रद्द करें)
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save (सुरक्षित करें)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
