import React, { useState } from 'react';
import { X, Save, User, Phone, MapPin, Milk, IndianRupee } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const CustomerFormModal = ({ isOpen, onClose, customer = null }) => {
  const { t } = useLanguage();
  const { addCustomer, updateCustomer, customers } = useApp();

  const isEdit = !!customer;

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    mobile: customer?.mobile || '',
    address: customer?.address || '',
    milkType: customer?.milkType || 'cow',
    morningQty: customer?.morningQty || 1.5,
    eveningQty: customer?.eveningQty || 1.5,
    rate: customer?.rate || 65,
    balance: customer?.balance || 0,
    advance: customer?.advance || 0
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) return;

    if (isEdit) {
      updateCustomer(customer.id, {
        ...formData,
        morningQty: Number(formData.morningQty),
        eveningQty: Number(formData.eveningQty),
        rate: Number(formData.rate),
        balance: Number(formData.balance),
        advance: Number(formData.advance)
      });
    } else {
      addCustomer({
        ...formData,
        morningQty: Number(formData.morningQty),
        eveningQty: Number(formData.eveningQty),
        rate: Number(formData.rate),
        balance: Number(formData.balance),
        advance: Number(formData.advance)
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <span>👥</span>
            <span>{isEdit ? 'Edit Customer Details (ग्राहक विवरण संपादित करें)' : '+ Add Customer (+ नया ग्राहक जोड़ें)'}</span>
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
                Customer Name / ग्राहक का नाम *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number / मोबाइल नंबर *
              </label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address / Route (पता / डिलीवरी रूट)
            </label>
            <input
              type="text"
              placeholder="e.g. House No 14, Main Market Road"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Morning Qty (सुबह L)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.morningQty}
                onChange={(e) => setFormData({ ...formData, morningQty: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Evening Qty (शाम L)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.eveningQty}
                onChange={(e) => setFormData({ ...formData, eveningQty: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Milk Rate (दूध दर ₹/L)
              </label>
              <input
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center text-dairy-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Balance (प्रारंभिक बकाया ₹)
              </label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Advance Deposit (अग्रिम जमा ₹)
              </label>
              <input
                type="number"
                value={formData.advance}
                onChange={(e) => setFormData({ ...formData, advance: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
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
