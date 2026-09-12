import React, { useState } from 'react';
import { X, Save, Building2, User, Phone, MapPin, Sparkles, QrCode, CheckCircle2, Trash2, RotateCcw, Zap, ExternalLink, Users, Settings, Lock, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { GoogleFormSyncModal } from '../customers/GoogleFormSyncModal';
import { UserManagementModal } from '../auth/UserManagementModal';
import { SmsGatewayModal } from './SmsGatewayModal';

export const FarmSettingsModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { farmProfile, updateFarmProfile, currentUser } = useAuth();
  const { clearAllData, loadDemoData, googleSheetsConfig } = useApp();

  const [formData, setFormData] = useState({
    farmName: farmProfile?.farmName || 'Shree Krishna Dairy Farm',
    ownerName: farmProfile?.ownerName || 'Satish Kumar',
    phone: farmProfile?.phone || '9876543210',
    address: farmProfile?.address || 'Village - Rampur, Jaipur',
    tagline: farmProfile?.tagline || 'Pure & Fresh Milk, Healthy Family',
    upiId: farmProfile?.upiId || 'dairyfarm@upi'
  });

  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);

  // Sync state whenever modal opens or farmProfile changes
  React.useEffect(() => {
    if (farmProfile) {
      setFormData({
        farmName: farmProfile.farmName || '',
        ownerName: farmProfile.ownerName || '',
        phone: farmProfile.phone || '',
        address: farmProfile.address || '',
        tagline: farmProfile.tagline || '',
        upiId: farmProfile.upiId || ''
      });
    }
  }, [farmProfile, isOpen]);

  const [isSaved, setIsSaved] = useState(false);
  const [dataNotice, setDataNotice] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.farmName.trim()) return;

    updateFarmProfile(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data (Cattle, Milk, Khata, Expenses)?')) {
      clearAllData();
      setDataNotice('✓ All farm data has been cleared! You can now start entering fresh data.');
      setTimeout(() => setDataNotice(''), 3000);
    }
  };

  const handleSyncDatabase = async () => {
    setDataNotice('⏳ Syncing with Live Database...');
    await loadDemoData();
    setDataNotice('✓ Live Database successfully synced!');
    setTimeout(() => setDataNotice(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-dairy-500 flex items-center justify-center text-white text-lg shadow">
              🏡
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Farm Profile & Name Settings (फार्म प्रोफाइल व नाम)
              </h3>
              <p className="text-[11px] text-slate-400">
                Dairy name, owner contact & farm data management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSaved ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce mb-3" />
            <h4 className="font-bold text-slate-800 text-base">Farm Profile Updated Successfully!</h4>
            <p className="text-xs text-slate-500 mt-1">Updated across Dashboard, Navbar, Invoices & Reports.</p>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Notice if data cleared */}
            {dataNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold animate-pulse">
                {dataNotice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Farm Name (Primary Field) */}
              <div className="bg-dairy-50 p-4 rounded-xl border border-dairy-200">
                <label className="block text-xs font-bold text-dairy-900 mb-1">
                  Dairy Farm Name (फार्म / डेयरी का नाम) *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dairy-600" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shree Krishna Dairy Farm"
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-black text-slate-900 rounded-xl border border-dairy-300 bg-white focus:outline-none focus:ring-2 focus:ring-dairy-500 shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-dairy-700 mt-1.5">
                  This name will appear across Dashboard, Invoices, WhatsApp bills and Reports.
                </p>
              </div>

              {/* Owner Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Name (मालिक का नाम)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Satish Kumar"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone (संपर्क मोबाइल नंबर)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Farm Address / Location (फार्म का पता)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Village Rampur, Sanganer, Jaipur"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500"
                  />
                </div>
              </div>

              {/* Tagline & UPI ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Slogan (टैगलाइन)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pure & Fresh Milk"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI ID (PhonePe / GPay)
                  </label>
                  <div className="relative">
                    <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 9876543210@ybl"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Farm Profile (फार्म प्रोफाइल सुरक्षित करें)</span>
                </button>
              </div>
            </form>

            {/* ADMIN PRIVACY & SECURITY SECTION (Accessible ONLY to Owner / Admin) */}
            {currentUser?.role === 'admin' && (
              <div className="pt-2">
                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                      🔒
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        गोपनीयता एवं सुरक्षा नियंत्रण (Admin Privacy & Access)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        यूजर आईडी, पासवर्ड और SMS गेटवे केवल मालिक के लिए सुरक्षित
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(true)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>👥 यूजर व पासवर्ड प्रबंधन</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSmsModalOpen(true)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span>⚙️ SMS गेटवे सेटिंग्स</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GOOGLE FORMS & GOOGLE SHEETS LIVE INTEGRATION LINK */}
            <div className="pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-base">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-emerald-950">
                      Google Forms & Sheets Auto-Sync
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      {googleSheetsConfig.sheetUrl
                        ? `Live connected • Synced: ${googleSheetsConfig.lastSyncTime || 'Active'}`
                        : 'Connect Google Form responses to auto-import customer orders.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGoogleSyncOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm whitespace-nowrap"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* DANGER ZONE: CLEAR ALL DATA / RESET */}
            <div className="pt-4 border-t border-slate-200">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Data Management & Reset (डेटा नियंत्रण)</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Reset demo data to start afresh for your real farm operations.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearData}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Data (डेटा साफ़ करें)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncDatabase}
                    className="py-2 px-3 rounded-lg bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-900 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                    title="Fetch latest entries directly from Database"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sync Database (डेटाबेस सिंक)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Form Sync Modal */}
        {isGoogleSyncOpen && (
          <GoogleFormSyncModal
            isOpen={isGoogleSyncOpen}
            onClose={() => setIsGoogleSyncOpen(false)}
          />
        )}

        {/* Admin Only: Database Users & Passwords Management Modal */}
        {isUserModalOpen && (
          <UserManagementModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
          />
        )}

        {/* Admin Only: SMS Gateway Setup Modal */}
        {isSmsModalOpen && (
          <SmsGatewayModal
            isOpen={isSmsModalOpen}
            onClose={() => setIsSmsModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
