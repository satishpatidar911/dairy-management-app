import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  CreditCard,
  Send,
  Phone,
  MapPin,
  Eye,
  Trash2,
  Edit,
  ClipboardList,
  IndianRupee,
  Calendar,
  Zap,
  FileSpreadsheet,
  BarChart3,
  Milk
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { CustomerLedgerModal } from './CustomerLedgerModal';
import { CustomerFormModal } from './CustomerFormModal';
import { DailyDeliverySheet } from './DailyDeliverySheet';
import { GoogleFormSyncModal } from './GoogleFormSyncModal';
import { CustomerMilkReport } from './CustomerMilkReport';

export const CustomerList = ({ onOpenAnalysis }) => {
  const { t } = useLanguage();
  const { customers, deleteCustomer, stats, googleSheetsConfig } = useApp();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('milk_report'); // 'milk_report' | 'directory' | 'delivery_sheet'
  const [selectedReportCustomerId, setSelectedReportCustomerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.mobile && c.mobile.includes(searchQuery)) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (activeTab === 'milk_report') {
    return (
      <CustomerMilkReport
        preselectedCustomerId={selectedReportCustomerId}
        onBack={() => setActiveTab('directory')}
        onOpenDirectory={() => setActiveTab('directory')}
        onOpenDeliverySheet={() => setActiveTab('delivery_sheet')}
      />
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.customers.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              Total Dues (कुल बकाया): ₹{stats.totalReceivable.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer Directory, Daily Milk Delivery Sheet, Ledger & WhatsApp Invoices
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAnalysis && (
            <button
              onClick={() => onOpenAnalysis()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Open Detailed Customer Milk Analysis"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📊 दूध विश्लेषण (Analysis)</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('milk_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'milk_report' ? 'option-active-light' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📊 Milk Report (दूध व खाता)
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'directory' ? 'option-active-light' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👥 Customer Directory (ग्राहक सूची)
            </button>
            <button
              onClick={() => setActiveTab('delivery_sheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'delivery_sheet' ? 'option-active-light' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📋 Daily Delivery Sheet (दैनिक डिलीवरी)
            </button>
          </div>

          <button
            onClick={() => setIsGoogleSyncOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 border ${
              googleSheetsConfig.sheetUrl
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title="Google Form / Sheets Auto-Sync"
          >
            <Zap className={`w-3.5 h-3.5 ${googleSheetsConfig.sheetUrl ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>Google Form Auto-Sync</span>
          </button>

          {currentUser.role !== ROLES.WORKER && (
            <button
              onClick={() => {
                setEditingCustomer(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.customers.addCustomer}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-card">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer name, mobile or route (ग्राहक का नाम, मोबाइल नंबर या पता खोजें)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {customer.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{customer.mobile || 'No Mobile'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending (बकाया राशि)</span>
                      <span className={`text-base font-extrabold ${(customer.balance || 0) > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        ₹{(customer.balance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{customer.address || 'Local Delivery Area'}</span>
                  </p>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Morning (सुबह)</span>
                      <strong className="text-slate-800">{customer.morningQty || 0} L</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Evening (शाम)</span>
                      <strong className="text-slate-800">{customer.eveningQty || 0} L</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Rate (दर)</span>
                      <strong className="text-dairy-700 font-bold">₹{customer.rate || 70}/L</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedReportCustomerId(customer.id);
                      setActiveTab('milk_report');
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="ग्राहक दूध व खाता रिपोर्ट देखें"
                  >
                    <Milk className="w-3.5 h-3.5 text-blue-600" />
                    <span>दूध रिपोर्ट</span>
                  </button>

                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-dairy-50 hover:bg-dairy-100 text-dairy-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="खाताबही देखें"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>खाताबही</span>
                  </button>

                  {onOpenAnalysis && (
                    <button
                      onClick={() => onOpenAnalysis(customer.id)}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="विस्तृत विश्लेषण (Analysis)"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {currentUser.role === ROLES.ADMIN && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="Edit Customer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Do you want to delete ${customer.name}?`)) {
                            deleteCustomer(customer.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY DELIVERY CHECKLIST */}
      {activeTab === 'delivery_sheet' && <DailyDeliverySheet />}

      {/* Google Forms Auto-Sync Modal */}
      {isGoogleSyncOpen && (
        <GoogleFormSyncModal
          isOpen={isGoogleSyncOpen}
          onClose={() => setIsGoogleSyncOpen(false)}
        />
      )}

      {/* Customer Ledger Modal */}
      {selectedCustomer && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Customer Form Modal */}
      {isFormOpen && (
        <CustomerFormModal
          customer={editingCustomer}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};
