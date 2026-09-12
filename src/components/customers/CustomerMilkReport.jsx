import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Printer,
  Download,
  ArrowLeft,
  Search,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  X,
  Milk,
  HandCoins,
  ReceiptText,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const CustomerMilkReport = ({
  preselectedCustomerId = null,
  onBack = null,
  onOpenDirectory = null,
  onOpenDeliverySheet = null
}) => {
  const { t } = useLanguage();
  const {
    customers,
    customerSales,
    customerTransactions,
    recordCustomerPayment,
    recordCustomerDelivery,
    isDark
  } = useApp();
  const { farmProfile } = useAuth();

  // 1. Customer Selection & Searchable Dropdown State
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    if (preselectedCustomerId) return preselectedCustomerId;
    // Prefer "HUKAM SINGH JI MEDICAL" if available in DB to match screenshot, else first customer
    const hukam = customers.find(c => c.name.toLowerCase().includes('hukam'));
    if (hukam) return hukam.id;
    return customers.length > 0 ? customers[0].id : '';
  });

  // Sync when preselectedCustomerId prop changes
  useEffect(() => {
    if (preselectedCustomerId) {
      setSelectedCustomerId(preselectedCustomerId);
    }
  }, [preselectedCustomerId]);

  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0);
  const dropdownRef = useRef(null);
  const customerSearchInputRef = useRef(null);
  const customerListRef = useRef(null);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when query or open state changes
  useEffect(() => {
    setHighlightedCustomerIndex(0);
  }, [customerSearchQuery, isCustomerDropdownOpen]);

  // Keep highlighted customer in view on arrow key navigation
  useEffect(() => {
    if (isCustomerDropdownOpen && customerListRef.current) {
      const activeEl = customerListRef.current.querySelector(`[data-index="${highlightedCustomerIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedCustomerIndex, isCustomerDropdownOpen]);

  const handleCustomerSearchKeyDown = (e) => {
    if (!searchedCustomers || searchedCustomers.length === 0) {
      if (e.key === 'Escape') {
        setIsCustomerDropdownOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedCustomerIndex(prev => (prev < searchedCustomers.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedCustomerIndex(prev => (prev > 0 ? prev - 1 : searchedCustomers.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetCustomer = searchedCustomers[highlightedCustomerIndex];
      if (targetCustomer) {
        setSelectedCustomerId(targetCustomer.id);
        setIsCustomerDropdownOpen(false);
        setCustomerSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsCustomerDropdownOpen(false);
    }
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => String(c.id) === String(selectedCustomerId)) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // 2. Month and Date Range Filter States
  const currentYearMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  
  const getMonthDateRange = (ymStr) => {
    const [y, m] = ymStr.split('-').map(Number);
    const firstDay = `${ymStr}-01`;
    const lastDate = new Date(y, m, 0).getDate();
    const lastDay = `${ymStr}-${String(lastDate).padStart(2, '0')}`;
    return { firstDay, lastDay };
  };

  const [fromDate, setFromDate] = useState(() => getMonthDateRange(currentYearMonth()).firstDay);
  const [toDate, setToDate] = useState(() => getMonthDateRange(currentYearMonth()).lastDay);

  // Handle Month dropdown change
  const handleMonthChange = (ymStr) => {
    setSelectedMonth(ymStr);
    const range = getMonthDateRange(ymStr);
    setFromDate(range.firstDay);
    setToDate(range.lastDay);
  };

  // Month options for filter dropdown
  const monthOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ ym, label });
    }
    return list;
  }, []);

  // 3. Tab State
  const [activeTab, setActiveTab] = useState('milk_detail'); // 'milk_detail' | 'payment_history' | 'monthly_summary' | 'chart_view'

  // 4. Modals State: New Entry & Add Payment
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRemark, setPaymentRemark] = useState('');

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryMorningQty, setEntryMorningQty] = useState('');
  const [entryEveningQty, setEntryEveningQty] = useState('');
  const [entryRate, setEntryRate] = useState(() => selectedCustomer?.rate || selectedCustomer?.defaultPrice || 70);

  useEffect(() => {
    if (selectedCustomer) {
      setEntryRate(selectedCustomer.rate || selectedCustomer.defaultPrice || 70);
    }
  }, [selectedCustomer]);

  const [paymentViewMode, setPaymentViewMode] = useState('month'); // 'month' | 'all'

  // Customer matching helper (strict exact match by id, rawId or customerName)
  const isMatchingCustomer = (item) => {
    if (!selectedCustomer || !item) return false;
    const custIdStr = String(selectedCustomer.id || '').trim();
    const rawIdStr = selectedCustomer.rawId !== undefined && selectedCustomer.rawId !== null ? String(selectedCustomer.rawId).trim() : '';
    const custNameNorm = (selectedCustomer.name || '').trim().toLowerCase();

    if (item.customerId !== undefined && item.customerId !== null) {
      const itemCustId = String(item.customerId).trim();
      if (itemCustId === custIdStr) return true;
      if (rawIdStr && (itemCustId === rawIdStr || itemCustId === `CUST-${rawIdStr}`)) return true;
    }

    if (item.customerName) {
      const itemName = item.customerName.trim().toLowerCase();
      if (itemName === custNameNorm) return true;
    }

    return false;
  };

  // 5. Filter Customer Deliveries and Transactions
  const filteredCustomerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return (customerSales || []).filter(s => {
      if (!isMatchingCustomer(s)) return false;
      if (!s.date) return false;
      return s.date >= fromDate && s.date <= toDate;
    });
  }, [customerSales, selectedCustomer, fromDate, toDate]);

  // All historical payments of this customer (ONLY payment_received or payment, NOT milk_supply!)
  const allCustomerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return (customerTransactions || []).filter(t => {
      if (!isMatchingCustomer(t)) return false;
      return t.type === 'payment_received' || t.type === 'payment';
    });
  }, [customerTransactions, selectedCustomer]);

  // Payments in selected Date Range / Month
  const periodPayments = useMemo(() => {
    return allCustomerPayments.filter(t => {
      if (!t.date) return false;
      return t.date >= fromDate && t.date <= toDate;
    });
  }, [allCustomerPayments, fromDate, toDate]);

  // 6. Build Daily Grid for Left Column (Date Wise Milk Record)
  const dailyMilkRows = useMemo(() => {
    if (!selectedCustomer) return [];
    
    // Generate dates between fromDate and toDate
    const rows = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);

    // Group actual sales by date
    const salesByDate = {};
    filteredCustomerSales.forEach(s => {
      if (!s.date) return;
      if (!salesByDate[s.date]) {
        salesByDate[s.date] = { morning: 0, evening: 0, fat: s.fat || 6.2, rate: s.rate || selectedCustomer.rate || 58, amount: 0 };
      }
      const qty = Number(s.quantity || s.liters || 0);
      const isEve = s.shift === 'evening' || s.shift === 'शाम';
      if (isEve) {
        salesByDate[s.date].evening += qty;
      } else {
        salesByDate[s.date].morning += qty;
      }
      if (s.fat) salesByDate[s.date].fat = Number(s.fat);
      if (s.rate) salesByDate[s.date].rate = Number(s.rate);
      salesByDate[s.date].amount += Number(s.amount || s.totalAmount || Math.round(qty * salesByDate[s.date].rate));
    });

    // Loop through each date in the range
    const cur = new Date(start);
    while (cur <= end) {
      const dStr = cur.toISOString().split('T')[0];
      const [y, m, d] = dStr.split('-');
      const formattedDate = `${d}-${m}-${y}`;

      const entry = salesByDate[dStr];
      const defaultRate = Number(selectedCustomer?.rate || selectedCustomer?.defaultPrice || 70);

      if (entry) {
        const total = entry.morning + entry.evening;
        const amt = entry.amount || Math.round(total * entry.rate);
        rows.push({
          rawDate: dStr,
          date: formattedDate,
          morning: Number(entry.morning.toFixed(1)),
          evening: Number(entry.evening.toFixed(1)),
          total: Number(total.toFixed(1)),
          fat: entry.fat || '-',
          rate: entry.rate || defaultRate,
          amount: amt
        });
      } else {
        // No delivery recorded for this date: strictly 0 (NO fake estimates!)
        rows.push({
          rawDate: dStr,
          date: formattedDate,
          morning: 0,
          evening: 0,
          total: 0,
          fat: '-',
          rate: defaultRate,
          amount: 0
        });
      }

      cur.setDate(cur.getDate() + 1);
    }

    return rows;
  }, [selectedCustomer, fromDate, toDate, filteredCustomerSales]);

  // Totals for the Date Wise Table
  const tableTotals = useMemo(() => {
    let mTot = 0, eTot = 0, tTot = 0, amtTot = 0, fatSum = 0, fatCount = 0;
    dailyMilkRows.forEach(r => {
      mTot += Number(r.morning || 0);
      eTot += Number(r.evening || 0);
      tTot += Number(r.total || 0);
      amtTot += Number(r.amount || 0);
      const numFat = Number(r.fat);
      if (!isNaN(numFat) && numFat > 0) {
        fatSum += numFat;
        fatCount++;
      }
    });

    const avgFat = fatCount > 0 ? (fatSum / fatCount).toFixed(2) : '-';
    const avgRate = selectedCustomer?.rate || selectedCustomer?.defaultPrice || 70;

    return {
      morningTotal: Number(mTot.toFixed(1)),
      eveningTotal: Number(eTot.toFixed(1)),
      totalMilk: Number(tTot.toFixed(1)),
      avgFat,
      avgRate,
      totalAmount: amtTot
    };
  }, [dailyMilkRows, selectedCustomer]);

  // 7. Payment Ledger Entries for Right Column (REAL Customer Payments)
  const paymentLedgerRows = useMemo(() => {
    const listToDisplay = paymentViewMode === 'all' ? allCustomerPayments : periodPayments;

    return listToDisplay.map(t => {
      const [y, m, d] = (t.date || '').split('-');
      const formattedDate = d ? `${d}-${m}-${y}` : t.date;
      return {
        id: t.id,
        date: formattedDate,
        rawDate: t.date,
        mode: t.paymentMode ? (t.paymentMode.charAt(0).toUpperCase() + t.paymentMode.slice(1)) : 'Cash',
        payment: Number(t.amount || 0),
        bill: '-',
        balance: t.balanceAfter !== undefined ? Number(t.balanceAfter) : Number(selectedCustomer?.balance || 0),
        remark: t.note || 'जमा भुगतान (Payment)'
      };
    }).sort((a, b) => (b.rawDate || '').localeCompare(a.rawDate || ''));
  }, [paymentViewMode, allCustomerPayments, periodPayments, selectedCustomer]);

  // 8. 4 KPI Cards Summary Calculations (100% Real & Accurate)
  const kpiStats = useMemo(() => {
    const totalMilk = tableTotals.totalMilk;
    const totalBill = tableTotals.totalAmount;

    // Actual payments recorded in this period (इस माह में जमा भुगतान)
    const actualPaidInPeriod = periodPayments.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    
    // Balance due for this period (इस माह की बाकी राशि)
    const monthDue = Math.max(0, totalBill - actualPaidInPeriod);
    
    // Total overall outstanding balance in customer record (कुल खाता बकाया)
    const totalCustomerBalance = Number(selectedCustomer?.balance || 0);

    return {
      totalMilk: totalMilk.toFixed(1),
      totalBill: totalBill.toLocaleString('en-IN'),
      paidAmount: actualPaidInPeriod.toLocaleString('en-IN'),
      balanceDue: monthDue.toLocaleString('en-IN'),
      totalCustomerBalance: totalCustomerBalance.toLocaleString('en-IN'),
      monthDueRaw: monthDue,
      actualPaidRaw: actualPaidInPeriod
    };
  }, [tableTotals, periodPayments, selectedCustomer]);

  // 9. Monthly Comparison Chart Data (Last 6 Months - Dynamic from Database)
  const chartData = useMemo(() => {
    if (!selectedCustomer) return [];
    
    const result = [];
    const baseDate = selectedMonth ? new Date(`${selectedMonth}-01`) : new Date();
    
    for (let i = 5; i >= 0; i--) {
      const past = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const mKey = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}`;
      const mName = past.toLocaleString('en-IN', { month: 'short' });
      
      let mMilk = 0;
      let mBill = 0;
      (customerSales || []).forEach(s => {
        if (!isMatchingCustomer(s)) return;
        if (s.date && s.date.startsWith(mKey)) {
          const q = Number(s.quantity || s.liters || 0);
          mMilk += q;
          mBill += Number(s.amount || Math.round(q * (s.rate || selectedCustomer.rate || 70)));
        }
      });
      
      let mPaid = 0;
      (customerTransactions || []).forEach(t => {
        if (!isMatchingCustomer(t)) return;
        if ((t.type === 'payment_received' || t.type === 'payment') && t.date && t.date.startsWith(mKey)) {
          mPaid += Number(t.amount || 0);
        }
      });
      
      result.push({
        month: `${mName} ${String(past.getFullYear()).slice(-2)}`,
        monthKey: mKey,
        milk: Number(mMilk.toFixed(1)),
        bill: Math.round(mBill),
        payment: Math.round(mPaid)
      });
    }
    
    return result;
  }, [selectedCustomer, selectedMonth, customerSales, customerTransactions]);

  // Filtered customers for search combobox
  const searchedCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.mobile && c.mobile.includes(q)) || 
      (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Submit Handler for + New Entry Modal
  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const m = Number(entryMorningQty) || 0;
    const ev = Number(entryEveningQty) || 0;
    const rate = Number(entryRate) || selectedCustomer.rate || selectedCustomer.defaultPrice || 70;

    if (m > 0) {
      recordCustomerDelivery(selectedCustomer.id, 'morning', m, entryDate, rate);
    }
    if (ev > 0) {
      recordCustomerDelivery(selectedCustomer.id, 'evening', ev, entryDate, rate);
    }

    setIsEntryModalOpen(false);
    setEntryMorningQty('');
    setEntryEveningQty('');
  };

  // Submit Handler for + Add Payment Modal
  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;
    recordCustomerPayment(
      selectedCustomer.id,
      Number(paymentAmount),
      paymentMode,
      paymentRemark,
      paymentDate
    );
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentRemark('');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export Excel / CSV Handler
  const handleExportExcel = () => {
    if (!selectedCustomer) return;
    let csv = `Customer Milk Report - ${selectedCustomer.name}\n`;
    csv += `Period: ${fromDate} to ${toDate}\n`;
    csv += `Mobile: ${selectedCustomer.mobile || 'N/A'}, Address: ${selectedCustomer.address || 'N/A'}\n\n`;
    csv += `Date Wise Milk Record\n`;
    csv += `Date,Morning (L),Evening (L),Total (L),Rate (INR),Amount (INR)\n`;
    
    dailyMilkRows.forEach(r => {
      csv += `${r.date},${r.morning},${r.evening},${r.total},${r.rate},${r.amount}\n`;
    });

    csv += `TOTAL,${tableTotals.morningTotal},${tableTotals.eveningTotal},${tableTotals.totalMilk},${tableTotals.avgRate},${tableTotals.totalAmount}\n\n`;

    csv += `Payment History\n`;
    csv += `Date,Mode,Payment (INR),Bill (INR),Balance (INR),Remark\n`;
    paymentLedgerRows.forEach(p => {
      csv += `${p.date},${p.mode},${p.payment},${p.bill},${p.balance},"${p.remark}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Milk_Report_${selectedCustomer.name}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 print:p-0 print:m-0 print:space-y-2">
      {/* 1. TOP PAGE HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>Customer Milk Report</span>
            </h2>
            <p className="text-xs text-slate-400">
              ग्राहक का दूध, भुगतान और खाता विवरण
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEntryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="नया दूध वितरण जोड़ें"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Entry</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="प्रिंट निकालें या PDF सेव करें"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Excel / CSV डाउनलोड करें"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* View Switcher Pills */}
          {(onOpenDirectory || onOpenDeliverySheet) && (
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 mr-1">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm">
                📊 Report
              </span>
              {onOpenDirectory && (
                <button
                  type="button"
                  onClick={onOpenDirectory}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors cursor-pointer"
                  title="ग्राहक सूची (Directory)"
                >
                  👥 Directory
                </button>
              )}
              {onOpenDeliverySheet && (
                <button
                  type="button"
                  onClick={onOpenDeliverySheet}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors cursor-pointer"
                  title="दैनिक डिलीवरी शीट (Delivery Sheet)"
                >
                  📋 Sheet
                </button>
              )}
            </div>
          )}

          {(onBack || onOpenDirectory) && (
            <button
              type="button"
              onClick={onBack ? onBack : onOpenDirectory}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold border border-slate-700 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="वापस जाएं (Back to Directory)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. FILTER BAR (Customer Search, Month, Date Range, Show Button) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md no-print">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Column 1: Select Customer with Searchable Dropdown */}
          <div className="md:col-span-5 relative" ref={dropdownRef}>
            <label className="text-[11px] font-bold text-slate-300 mb-1.5 block">
              Select Customer (ग्राहक चुनें)
            </label>

            <div
              tabIndex={0}
              role="button"
              aria-haspopup="listbox"
              aria-expanded={isCustomerDropdownOpen}
              onClick={() => setIsCustomerDropdownOpen(prev => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCustomerDropdownOpen(true);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-white flex items-center justify-between cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{selectedCustomer?.name || 'ग्राहक चुनें'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-150 ${isCustomerDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
            </div>

            {/* Dropdown Options List */}
            {isCustomerDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-72 flex flex-col animate-in fade-in zoom-in-95">
                {/* Search Input Box */}
                <div className="p-2 border-b border-slate-800 bg-slate-950/80">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      ref={customerSearchInputRef}
                      type="text"
                      autoFocus
                      placeholder="ग्राहक खोजें (Name / Mobile)..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      onKeyDown={handleCustomerSearchKeyDown}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearchQuery('')}
                        className="absolute right-2 text-slate-400 hover:text-slate-200 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-slate-400">
                    <span>{searchedCustomers.length} ग्राहक मिले</span>
                    <span className="text-blue-400 font-semibold hidden sm:inline">एरो कीज़ (↑ / ↓) से चुनें</span>
                  </div>
                </div>

                {/* Scrollable Customer List */}
                <div
                  ref={customerListRef}
                  role="listbox"
                  className="overflow-y-auto max-h-52 divide-y divide-slate-800/60"
                >
                  {searchedCustomers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      🔍 कोई ग्राहक नहीं मिला (No customer found matching "{customerSearchQuery}")
                    </div>
                  ) : (
                    searchedCustomers.map((cust, idx) => {
                      const isHighlighted = idx === highlightedCustomerIndex;
                      const isSelected = selectedCustomer?.id === cust.id;
                      return (
                        <div
                          key={cust.id}
                          data-index={idx}
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setHighlightedCustomerIndex(idx)}
                          onClick={() => {
                            setSelectedCustomerId(cust.id);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearchQuery('');
                          }}
                          className={`px-3 py-2.5 text-xs font-bold cursor-pointer transition-all flex items-center justify-between ${
                            isHighlighted
                              ? 'bg-blue-600 text-white ring-1 ring-blue-400 shadow-sm'
                              : isSelected
                              ? 'bg-blue-950/60 text-blue-300'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div>
                            <div className={`font-extrabold flex items-center gap-1.5 ${isHighlighted ? 'text-white' : 'text-slate-100'}`}>
                              <span>{cust.name}</span>
                              {isSelected && !isHighlighted && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className={`text-[10px] font-normal mt-0.5 ${isHighlighted ? 'text-blue-100' : 'text-slate-400'}`}>
                              {cust.mobile || cust.phone || 'No Mobile'} • Rate: ₹{cust.rate || 58}/L
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSelected && (
                              <CheckCircle2 className={`w-4 h-4 ${isHighlighted ? 'text-white' : 'text-blue-400'}`} />
                            )}
                            {isHighlighted && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono text-white">
                                ↵ Enter
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Keyboard Helper Footer */}
                <div className="p-1.5 px-3 bg-slate-950/90 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>नेविगेशन: <strong className="text-slate-200">↑ ↓</strong> एरो</span>
                  <span>चुनने हेतु: <strong className="text-blue-400">Enter ↵</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Month Dropdown */}
          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-300 mb-1.5 block">
              Month (माह चुनें)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner cursor-pointer"
            >
              {monthOptions.map(opt => (
                <option key={opt.ym} value={opt.ym} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Column 3: Date Range (From & To) */}
          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-300 mb-1.5 block">
              Date Range (दिनांक सीमा)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>
          </div>

          {/* Action: Show Button */}
          <div className="md:col-span-1">
            <button
              type="button"
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Show</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CUSTOMER PROFILE CARD & 4 KPI STATS (In 1 Unified Container) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Left Side: Customer Details */}
          <div className="lg:col-span-5 space-y-1.5 border-b lg:border-b-0 lg:border-r border-slate-800 pb-3 lg:pb-0 lg:pr-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate">
                {selectedCustomer?.name || 'HUKAM SINGH JI MEDICAL'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold tracking-wide uppercase">
                Active
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold flex-wrap">
              <span>Mobile: <strong className="text-slate-200">{selectedCustomer?.mobile || selectedCustomer?.phone || '-'}</strong></span>
              <span>•</span>
              <span>Address: <strong className="text-slate-200">{selectedCustomer?.address || '-'}</strong></span>
              <span>•</span>
              <span>Type: <strong className="text-slate-200">{selectedCustomer?.type || 'Regular'}</strong></span>
              <span>•</span>
              <span>Rate: <strong className="text-emerald-400">₹{selectedCustomer?.rate || 70}.00 / L</strong></span>
            </div>
          </div>

          {/* Right Side: 4 KPI Cards (कुल दूध, कुल बिल, जमा भुगतान, बाकी राशि) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Card 1: कुल दूध */}
            <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 shadow-sm flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0 text-lg">
                🥛
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-sky-300/80">कुल दूध</div>
                <div className="text-sm sm:text-base font-black text-white truncate">{kpiStats.totalMilk} L</div>
                <div className="text-[9px] text-sky-400/80">इस माह</div>
              </div>
            </div>

            {/* Card 2: कुल बिल */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 shadow-sm flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 text-lg font-bold">
                ₹
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-emerald-300/80">कुल बिल</div>
                <div className="text-sm sm:text-base font-black text-white truncate">₹{kpiStats.totalBill}</div>
                <div className="text-[9px] text-emerald-400/80">इस माह</div>
              </div>
            </div>

            {/* Card 3: जमा भुगतान */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 shadow-sm flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 text-lg">
                🤝
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-amber-300/80">जमा भुगतान</div>
                <div className="text-sm sm:text-base font-black text-white truncate">₹{kpiStats.paidAmount}</div>
                <div className="text-[9px] text-amber-400/80">इस माह</div>
              </div>
            </div>

            {/* Card 4: बाकी राशि */}
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 shadow-sm flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0 text-lg">
                📄
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-rose-300/80">बाकी राशि</div>
                <div className="text-sm sm:text-base font-black text-rose-400 truncate">₹{kpiStats.balanceDue}</div>
                <div className="text-[9px] text-rose-400/80 truncate">
                  {kpiStats.totalCustomerBalance && kpiStats.totalCustomerBalance !== '0'
                    ? `कुल खाता: ₹${kpiStats.totalCustomerBalance}`
                    : 'इस माह का बकाया'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. TAB NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm no-print overflow-x-auto">
        {[
          { id: 'milk_detail', label: '🥛 Milk Detail' },
          { id: 'payment_history', label: '💳 Payment History' },
          { id: 'monthly_summary', label: '📅 Monthly Summary' },
          { id: 'chart_view', label: '📊 Chart View' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. TWO-COLUMN SPLIT CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Date Wise Milk Record (दिनवार दूध विवरण) (58% / 7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Date Wise Milk Record (दिनवार दूध विवरण)</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">
                {dailyMilkRows.length} Days
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 text-[11px] font-black uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-2 text-right">Morning (L)</th>
                    <th className="py-2.5 px-2 text-right">Evening (L)</th>
                    <th className="py-2.5 px-2 text-right">Total (L)</th>
                    <th className="py-2.5 px-2 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {dailyMilkRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-800/40 text-slate-200 transition-colors"
                    >
                      <td className="py-2 px-3 font-bold font-sans text-[11px] text-slate-300">
                        {row.date}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {typeof row.morning === 'number' ? row.morning.toFixed(1) : (row.morning || '0.0')}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {typeof row.evening === 'number' ? row.evening.toFixed(1) : (row.evening || '0.0')}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-white">
                        {typeof row.total === 'number' ? row.total.toFixed(1) : (row.total || '0.0')}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {typeof row.rate === 'number' && !isNaN(row.rate) ? row.rate.toFixed(2) : (row.rate || '-')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">
                        {typeof row.amount === 'number' && !isNaN(row.amount) ? row.amount.toFixed(2) : (row.amount || '0.00')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-950 font-black text-white border-t-2 border-slate-700 text-xs font-mono sticky bottom-0 z-10">
                    <td className="py-3 px-3 font-sans uppercase text-blue-400">TOTAL</td>
                    <td className="py-3 px-2 text-right">{tableTotals.morningTotal.toFixed(1)}</td>
                    <td className="py-3 px-2 text-right">{tableTotals.eveningTotal.toFixed(1)}</td>
                    <td className="py-3 px-2 text-right text-blue-300 font-bold">{tableTotals.totalMilk.toFixed(1)}</td>
                    <td className="py-3 px-2 text-right text-slate-400 font-sans">Avg: ₹{tableTotals.avgRate}/L</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">₹{tableTotals.totalAmount.toLocaleString('en-IN')}.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Payment / Khata History + Monthly Comparison Chart (42% / 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* TOP BOX: Payment / Khata History (भुगतान विवरण) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  Payment / Khata History (भुगतान विवरण)
                </h3>
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentViewMode('month')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      paymentViewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    इस माह ({periodPayments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentViewMode('all')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      paymentViewMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    सभी ({allCustomerPayments.length})
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPaymentAmount(kpiStats.monthDueRaw > 0 ? String(kpiStats.monthDueRaw) : '');
                  setIsPaymentModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Payment</span>
              </button>
            </div>

            {/* Payment Table */}
            <div className="overflow-x-auto max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10 font-sans">
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Mode</th>
                    <th className="py-2 px-2 text-right">Payment (₹)</th>
                    <th className="py-2 px-2 text-right">Bill (₹)</th>
                    <th className="py-2 px-2 text-right">Balance (₹)</th>
                    <th className="py-2 px-2">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {paymentLedgerRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-6 h-6 text-amber-500/70" />
                          <p className="font-bold text-slate-300 font-sans">
                            {paymentViewMode === 'month'
                              ? `इस माह (${selectedMonth}) में कोई भुगतान जमा नहीं हुआ है`
                              : 'इस ग्राहक का कोई भुगतान रिकॉर्ड नहीं मिला'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-sans">
                            इस माह का कुल बिल <strong className="text-rose-400 font-bold">₹{kpiStats.balanceDue}</strong> बाकी राशि (Due) है।
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentAmount(kpiStats.monthDueRaw > 0 ? String(kpiStats.monthDueRaw) : '');
                              setIsPaymentModalOpen(true);
                            }}
                            className="mt-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer font-sans"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ अभी भुगतान जमा करें (Add Payment)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paymentLedgerRows.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="py-2 px-2 font-sans font-bold text-slate-200">{p.date}</td>
                        <td className="py-2 px-2">{p.mode}</td>
                        <td className="py-2 px-2 text-right font-bold text-emerald-400">
                          {p.payment ? `${p.payment.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">{p.bill}</td>
                        <td className="py-2 px-2 text-right text-rose-300 font-bold">
                          {p.balance ? `${p.balance.toFixed(2)}` : '0.00'}
                        </td>
                        <td className="py-2 px-2 text-[10px] text-slate-400 font-sans">{p.remark}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM BOX: Monthly Milk & Payment Chart (मासिक तुलना चार्ट) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">
                Monthly Milk & Payment Chart (मासिक तुलना चार्ट)
              </h3>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                Last 6 Months ▾
              </span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#38bdf8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Bar yAxisId="left" dataKey="milk" name="Milk (L)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="bill" name="Bill (₹)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="payment" name="Payment (₹)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* 6. BOTTOM BRANDING FOOTER */}
      <footer className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
        <div>
          Milk Management System | Version 2.0
        </div>
        <div className="italic text-slate-400">
          "Pure Milk • Happy Customers"
        </div>
        <div>
          Designed with ❤️ for Dairy Farmers
        </div>
      </footer>

      {/* MODAL: + New Milk Entry */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🥛</span>
                <span>नया दूध वितरण दर्ज करें ({selectedCustomer?.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-slate-300 block mb-1">दिनांक (Date)</label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Morning (सुबह L)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="उदा. 2.0"
                    value={entryMorningQty}
                    onChange={(e) => setEntryMorningQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Evening (शाम L)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="उदा. 2.5"
                    value={entryEveningQty}
                    onChange={(e) => setEntryEveningQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">दर / Rate (₹/L)</label>
                <input
                  type="number"
                  step="0.5"
                  value={entryRate}
                  onChange={(e) => setEntryRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                <span>कुल राशि (Total):</span>
                <span className="text-emerald-400 text-sm font-black font-mono">
                  ₹{Math.round(((Number(entryMorningQty) || 0) + (Number(entryEveningQty) || 0)) * (Number(entryRate) || 58))}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: + Add Payment */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>💵</span>
                <span>जमा भुगतान जोड़ें ({selectedCustomer?.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-slate-300 block mb-1">भुगतान राशि (Amount ₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="उदा. 2000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/80 rounded-xl px-3 py-2 text-white font-mono text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">दिनांक (Date)</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">माध्यम (Mode)</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="Online">Online / PhonePe</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">टिप्पणी (Remark / Notes)</label>
                <input
                  type="text"
                  placeholder="उदा. एडवांस, Google Pay..."
                  value={paymentRemark}
                  onChange={(e) => setPaymentRemark(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                >
                  भुगतान जमा करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
