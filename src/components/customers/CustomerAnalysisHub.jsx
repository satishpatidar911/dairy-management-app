import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Download,
  Printer,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  Scale,
  ChevronRight,
  FileText
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

import { MonthWiseConclusionTable } from '../reports/MonthWiseConclusionTable';
import { CustomerDueMatrixReport } from '../reports/CustomerDueMatrixReport';
import { CustomerLedgerModal } from './CustomerLedgerModal';

export const CustomerAnalysisHub = ({ preselectedCustomerId = null, onNavigate }) => {
  const { t } = useLanguage();
  const { customers, customerSales, customerTransactions } = useApp();
  const { farmProfile } = useAuth();

  const [activeMainTab, setActiveMainTab] = useState('due_matrix'); // 'due_matrix' | 'month_conclusion' | 'payment_register' | 'individual' | 'owner_dashboard'
  const [activeSubTab, setActiveSubTab] = useState('monthly'); // 'monthly' | 'daily' | 'trends' | 'ledger'
  
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    if (preselectedCustomerId) return preselectedCustomerId;
    return customers.length > 0 ? customers[0].id : '';
  });
  const [dateFilterMode, setDateFilterMode] = useState('month'); // 'month' | 'custom'
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all'); // 'all' or 'YYYY-MM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dailySearchDate, setDailySearchDate] = useState('');

  // Payment Register tab states
  const [payRegisterSearch, setPayRegisterSearch] = useState('');
  const [payRegisterMonth, setPayRegisterMonth] = useState('all');
  const [payRegisterMode, setPayRegisterMode] = useState('all');
  const [payRegisterSubTab, setPayRegisterSubTab] = useState('receipts'); // 'receipts' | 'customer_balances'
  const [ledgerModalCustomer, setLedgerModalCustomer] = useState(null);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find(c => String(c.id) === String(selectedCustomerId)) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Quick Preset Helper for Custom Date Filter
  const setPresetRange = (preset) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    
    if (preset === 'this_month') {
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setCustomStartDate(`${y}-${m}-01`);
      setCustomEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
      setDateFilterMode('custom');
    } else if (preset === 'last_month') {
      const prevDate = new Date(y, now.getMonth() - 1, 1);
      const py = prevDate.getFullYear();
      const pm = String(prevDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(py, prevDate.getMonth() + 1, 0).getDate();
      setCustomStartDate(`${py}-${pm}-01`);
      setCustomEndDate(`${py}-${pm}-${String(lastDay).padStart(2, '0')}`);
      setDateFilterMode('custom');
    } else if (preset === 'first_15') {
      setCustomStartDate(`${y}-${m}-01`);
      setCustomEndDate(`${y}-${m}-15`);
      setDateFilterMode('custom');
    } else if (preset === 'second_15') {
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setCustomStartDate(`${y}-${m}-16`);
      setCustomEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
      setDateFilterMode('custom');
    } else if (preset === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      const py = past30.getFullYear();
      const pm = String(past30.getMonth() + 1).padStart(2, '0');
      const pd = String(past30.getDate()).padStart(2, '0');
      const nowStr = `${y}-${m}-${String(now.getDate()).padStart(2, '0')}`;
      setCustomStartDate(`${py}-${pm}-${pd}`);
      setCustomEndDate(nowStr);
      setDateFilterMode('custom');
    } else if (preset === 'all') {
      setCustomStartDate('');
      setCustomEndDate('');
      setSelectedMonthFilter('all');
      setDateFilterMode('month');
    }
  };

  // Helper to check if a record's date falls within active filter
  const isDateInSelectedRange = (dateStr) => {
    if (!dateStr) return false;
    if (dateFilterMode === 'month') {
      if (selectedMonthFilter === 'all') return true;
      return dateStr.startsWith(selectedMonthFilter);
    } else if (dateFilterMode === 'custom') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }
    return true;
  };

  // Customer deliveries & sales
  const customerDeliveries = useMemo(() => {
    if (!selectedCustomer) return [];
    const custIdStr = String(selectedCustomer.id);
    const rawIdStr = selectedCustomer.rawId ? String(selectedCustomer.rawId) : '';
    const custNameNorm = (selectedCustomer.name || '').trim().toLowerCase();

    return customerSales.filter(s => {
      const itemCustId = String(s.customerId || '').trim();
      if (itemCustId && (itemCustId === custIdStr || (rawIdStr && (itemCustId === rawIdStr || itemCustId === `CUST-${rawIdStr}`)))) {
        return true;
      }
      if (s.customerName && s.customerName.trim().toLowerCase() === custNameNorm) {
        return true;
      }
      return false;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedCustomer, customerSales]);

  // Customer payments
  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    const custIdStr = String(selectedCustomer.id);
    const rawIdStr = selectedCustomer.rawId ? String(selectedCustomer.rawId) : '';
    const custNameNorm = (selectedCustomer.name || '').trim().toLowerCase();

    return customerTransactions.filter(t => {
      const itemCustId = String(t.customerId || '').trim();
      const isMatch = (itemCustId && (itemCustId === custIdStr || (rawIdStr && (itemCustId === rawIdStr || itemCustId === `CUST-${rawIdStr}`)))) ||
                      (t.customerName && t.customerName.trim().toLowerCase() === custNameNorm);
      return isMatch && t.type === 'payment_received';
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedCustomer, customerTransactions]);

  // Available Months for selected customer
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    customerDeliveries.forEach(d => {
      if (d.date) {
        monthsSet.add(d.date.slice(0, 7)); // 'YYYY-MM'
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [customerDeliveries]);

  // Monthly aggregated data for selected customer
  const monthlyBreakdown = useMemo(() => {
    if (!selectedCustomer) return [];

    const monthMap = {};

    customerDeliveries.forEach(d => {
      if (!d.date) return;
      const monthKey = d.date.slice(0, 7);
      if (!monthMap[monthKey]) {
        const dObj = new Date(monthKey + '-01');
        const monthName = dObj.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
        const monthNameEn = dObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        monthMap[monthKey] = {
          monthKey,
          monthName,
          monthNameEn,
          daysSet: new Set(),
          morningMilk: 0,
          eveningMilk: 0,
          totalMilk: 0,
          billAmount: 0,
          rateSum: 0,
          rateCount: 0
        };
      }

      const l = Number(d.quantity || 0);
      const b = Number(d.amount || Math.round(l * (d.rate || selectedCustomer?.rate || 70)));
      monthMap[monthKey].daysSet.add(d.date);
      monthMap[monthKey].totalMilk += l;
      monthMap[monthKey].billAmount += b;
      if (d.shift === 'evening' || d.shift === 'शाम') {
        monthMap[monthKey].eveningMilk += l;
      } else {
        monthMap[monthKey].morningMilk += l;
      }
      if (d.rate) {
        monthMap[monthKey].rateSum += Number(d.rate);
        monthMap[monthKey].rateCount += 1;
      }
    });

    // Merge payments by month
    const paymentMonthMap = {};
    customerPayments.forEach(p => {
      if (!p.date) return;
      const monthKey = p.date.slice(0, 7);
      paymentMonthMap[monthKey] = (paymentMonthMap[monthKey] || 0) + Number(p.amount || 0);
    });

    const result = Object.values(monthMap).map(m => {
      const totalDays = m.daysSet.size;
      const avgDaily = totalDays > 0 ? (m.totalMilk / totalDays) : 0;
      const avgRate = m.rateCount > 0 ? Math.round(m.rateSum / m.rateCount) : (selectedCustomer?.rate || 70);
      const paid = paymentMonthMap[m.monthKey] || 0;
      const balance = Math.max(0, m.billAmount - paid);

      return {
        monthKey: m.monthKey,
        monthName: m.monthName,
        monthNameEn: m.monthNameEn,
        totalDays,
        morningMilk: Number(m.morningMilk.toFixed(1)),
        eveningMilk: Number(m.eveningMilk.toFixed(1)),
        totalMilk: Number(m.totalMilk.toFixed(1)),
        avgDaily: Number(avgDaily.toFixed(2)),
        avgRate,
        billAmount: Math.round(m.billAmount),
        paidAmount: Math.round(paid),
        balance: Math.round(balance)
      };
    });

    return result.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [selectedCustomer, customerDeliveries, customerPayments]);

  // Overall Stats for selected customer (filtered by selectedMonthFilter or custom date range)
  const currentFilteredStats = useMemo(() => {
    if (!selectedCustomer) {
      return {
        totalDays: 0,
        morningMilk: 0,
        eveningMilk: 0,
        totalMilk: 0,
        avgDaily: 0,
        billAmount: 0,
        paidAmount: 0,
        advance: 0,
        balance: 0,
        rangeLabel: 'सभी तारीखें'
      };
    }

    const filteredDeliveries = customerDeliveries.filter(d => isDateInSelectedRange(d.date));
    const filteredPayments = customerPayments.filter(p => isDateInSelectedRange(p.date));

    let mTotal = 0, eTotal = 0, tTotal = 0, billTot = 0;
    const days = new Set();

    filteredDeliveries.forEach(d => {
      const l = Number(d.quantity || 0);
      const b = Number(d.amount || Math.round(l * (d.rate || selectedCustomer?.rate || 70)));
      days.add(d.date);
      tTotal += l;
      billTot += b;
      if (d.shift === 'evening' || d.shift === 'शाम') eTotal += l;
      else mTotal += l;
    });

    const totalPaid = filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalDays = days.size;
    const avgDaily = totalDays > 0 ? (tTotal / totalDays) : 0;
    
    // Overall balance vs filtered period balance
    const isAllTime = (dateFilterMode === 'month' && selectedMonthFilter === 'all') || 
                      (dateFilterMode === 'custom' && !customStartDate && !customEndDate);
    const balance = isAllTime ? (Number(selectedCustomer.balance) || Math.max(0, billTot - totalPaid)) : Math.max(0, billTot - totalPaid);
    const advance = isAllTime ? (Number(selectedCustomer.advance) || (totalPaid > billTot ? totalPaid - billTot : 0)) : (totalPaid > billTot ? totalPaid - billTot : 0);

    let rangeLabel = 'सभी तारीखें (All Time)';
    if (dateFilterMode === 'month') {
      if (selectedMonthFilter !== 'all') {
        const dObj = new Date(selectedMonthFilter + '-01');
        rangeLabel = `${dObj.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' })} (${selectedMonthFilter})`;
      }
    } else if (dateFilterMode === 'custom') {
      if (customStartDate && customEndDate) {
        rangeLabel = `${customStartDate} से ${customEndDate}`;
      } else if (customStartDate) {
        rangeLabel = `${customStartDate} से आगे`;
      } else if (customEndDate) {
        rangeLabel = `${customEndDate} तक`;
      }
    }

    return {
      totalDays,
      morningMilk: Number(mTotal.toFixed(1)),
      eveningMilk: Number(eTotal.toFixed(1)),
      totalMilk: Number(tTotal.toFixed(1)),
      avgDaily: Number(avgDaily.toFixed(2)),
      billAmount: Math.round(billTot),
      paidAmount: Math.round(totalPaid),
      advance: Math.round(advance),
      balance: Math.round(balance),
      rangeLabel
    };
  }, [selectedCustomer, customerDeliveries, customerPayments, dateFilterMode, selectedMonthFilter, customStartDate, customEndDate]);

  // Month-over-month comparison trend
  const monthComparisonTrend = useMemo(() => {
    if (monthlyBreakdown.length < 2) return null;
    const current = monthlyBreakdown[0];
    const previous = monthlyBreakdown[1];

    const diff = current.totalMilk - previous.totalMilk;
    const pct = previous.totalMilk > 0 ? ((diff / previous.totalMilk) * 100).toFixed(1) : 0;

    return {
      currentMonth: current.monthNameEn,
      currentVolume: current.totalMilk,
      previousMonth: previous.monthNameEn,
      previousVolume: previous.totalMilk,
      diff: Number(diff.toFixed(1)),
      pct: Number(pct),
      isGrowing: diff > 0,
      isDropping: diff < 0
    };
  }, [monthlyBreakdown]);

  // Filtered daily entries for selected customer
  const filteredDailyDeliveries = useMemo(() => {
    return customerDeliveries.filter(d => {
      if (!isDateInSelectedRange(d.date)) {
        return false;
      }
      if (dailySearchDate && !d.date.includes(dailySearchDate)) {
        return false;
      }
      return true;
    });
  }, [customerDeliveries, dateFilterMode, selectedMonthFilter, customStartDate, customEndDate, dailySearchDate]);

  // Filtered payments for selected customer
  const filteredCustomerPayments = useMemo(() => {
    return customerPayments.filter(p => isDateInSelectedRange(p.date));
  }, [customerPayments, dateFilterMode, selectedMonthFilter, customStartDate, customEndDate]);

  // Dairy Owner Rankings & Insights
  const findCustomerForRecord = (rec) => {
    if (!rec) return null;
    const recCustId = String(rec.customerId || '').trim();
    const recCustName = (rec.customerName || '').trim().toLowerCase();

    return customers.find(c => {
      const cId = String(c.id || '').trim();
      const cRaw = c.rawId !== undefined && c.rawId !== null ? String(c.rawId).trim() : '';
      if (recCustId && (recCustId === cId || (cRaw && (recCustId === cRaw || recCustId === `CUST-${cRaw}`)))) {
        return true;
      }
      if (recCustName && (c.name || '').trim().toLowerCase() === recCustName) {
        return true;
      }
      return false;
    });
  };

  const ownerInsights = useMemo(() => {
    const custMap = {};

    customers.forEach(c => {
      custMap[c.id] = {
        customer: c,
        totalLiters: 0,
        totalBill: 0,
        totalPaid: 0,
        currentMonthLiters: 0,
        prevMonthLiters: 0,
        deliveriesCount: 0
      };
    });

    const now = new Date();
    const currMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    customerSales.forEach(s => {
      const cObj = findCustomerForRecord(s);

      if (cObj && custMap[cObj.id]) {
        const l = Number(s.quantity || 0);
        const b = Number(s.amount || Math.round(l * (s.rate || 70)));
        custMap[cObj.id].totalLiters += l;
        custMap[cObj.id].totalBill += b;
        custMap[cObj.id].deliveriesCount += 1;

        if (s.date && s.date.startsWith(currMonthKey)) {
          custMap[cObj.id].currentMonthLiters += l;
        } else if (s.date && s.date.startsWith(prevMonthKey)) {
          custMap[cObj.id].prevMonthLiters += l;
        }
      }
    });

    customerTransactions.filter(t => t.type === 'payment_received').forEach(p => {
      const cObj = findCustomerForRecord(p);

      if (cObj && custMap[cObj.id]) {
        custMap[cObj.id].totalPaid += Number(p.amount || 0);
      }
    });

    const allCustData = Object.values(custMap).map(item => {
      const c = item.customer;
      const balance = Number(c.balance) || Math.max(0, item.totalBill - item.totalPaid);
      const diff = item.currentMonthLiters - item.prevMonthLiters;
      const growthPct = item.prevMonthLiters > 0 ? ((diff / item.prevMonthLiters) * 100).toFixed(1) : (item.currentMonthLiters > 0 ? 100 : 0);

      return {
        ...item,
        balance: Math.round(balance),
        growthDiff: Number(diff.toFixed(1)),
        growthPct: Number(growthPct)
      };
    });

    const topConsumers = [...allCustData].sort((a, b) => b.totalLiters - a.totalLiters).slice(0, 10);
    const highestBalances = [...allCustData].sort((a, b) => b.balance - a.balance).slice(0, 10);
    const growingCustomers = allCustData.filter(c => c.growthDiff > 0 && c.currentMonthLiters > 0).sort((a, b) => b.growthDiff - a.growthDiff).slice(0, 6);
    const droppingCustomers = allCustData.filter(c => c.growthDiff < 0 && c.prevMonthLiters > 0).sort((a, b) => a.growthDiff - b.growthDiff).slice(0, 6);

    const currentMonthTotalMilk = allCustData.reduce((acc, c) => acc + c.currentMonthLiters, 0);
    const currentMonthTotalSale = allCustData.reduce((acc, c) => acc + (c.currentMonthLiters * (c.customer.rate || 70)), 0);
    const totalMarketUdhaari = allCustData.reduce((acc, c) => acc + c.balance, 0);

    return {
      topConsumers,
      highestBalances,
      growingCustomers,
      droppingCustomers,
      currentMonthTotalMilk: Number(currentMonthTotalMilk.toFixed(1)),
      currentMonthTotalSale: Math.round(currentMonthTotalSale),
      totalMarketUdhaari: Math.round(totalMarketUdhaari),
      totalActiveCustomers: allCustData.filter(c => c.totalLiters > 0).length
    };
  }, [customers, customerSales, customerTransactions]);

  // Available Months for all payments
  const allPaymentMonths = useMemo(() => {
    const monthsSet = new Set();
    customerTransactions.forEach(t => {
      if (t.date && t.type === 'payment_received') monthsSet.add(t.date.substring(0, 7));
    });
    customerSales.forEach(s => {
      if (s.date) monthsSet.add(s.date.substring(0, 7));
    });
    return Array.from(monthsSet).sort().reverse();
  }, [customerTransactions, customerSales]);

  // All Customer Payment Receipts List (enriched with customer info)
  const allPaymentDeposits = useMemo(() => {
    return customerTransactions
      .filter(t => t.type === 'payment_received')
      .map(t => {
        const cObj = findCustomerForRecord(t);
        return {
          ...t,
          customerObj: cObj || null,
          displayCustomerName: cObj?.name || t.customerName || 'Customer',
          displayMobile: cObj?.mobile || cObj?.phone || '-'
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [customerTransactions, customers]);

  // Filtered Payments for Payment Register
  const filteredPaymentDeposits = useMemo(() => {
    return allPaymentDeposits.filter(p => {
      // Month filter
      if (payRegisterMonth !== 'all' && (!p.date || !p.date.startsWith(payRegisterMonth))) {
        return false;
      }
      // Mode filter
      if (payRegisterMode !== 'all' && (p.paymentMode || 'cash').toLowerCase() !== payRegisterMode.toLowerCase()) {
        return false;
      }
      // Search filter
      if (payRegisterSearch) {
        const term = payRegisterSearch.trim().toLowerCase();
        const matchName = p.displayCustomerName.toLowerCase().includes(term);
        const matchMobile = p.displayMobile.includes(term);
        const matchNote = (p.note || '').toLowerCase().includes(term);
        const matchDate = (p.date || '').includes(term);
        if (!matchName && !matchMobile && !matchNote && !matchDate) return false;
      }
      return true;
    });
  }, [allPaymentDeposits, payRegisterMonth, payRegisterMode, payRegisterSearch]);

  // Full Customer Dues & Payment Status Register
  const allCustomerRegisters = useMemo(() => {
    const custMap = {};

    customers.forEach(c => {
      custMap[c.id] = {
        customer: c,
        totalLiters: 0,
        totalBill: 0,
        totalPaid: 0,
        deliveriesCount: 0,
        paymentsCount: 0,
        lastPaymentDate: null,
        lastPaymentAmount: 0
      };
    });

    customerSales.forEach(s => {
      const cObj = findCustomerForRecord(s);
      if (cObj && custMap[cObj.id]) {
        const l = Number(s.quantity || s.liters || 0);
        const b = Number(s.amount || (l * (s.rate || 70)));
        custMap[cObj.id].totalLiters += l;
        custMap[cObj.id].totalBill += b;
        custMap[cObj.id].deliveriesCount += 1;
      }
    });

    // Process payments sorted chronologically ascending
    const sortedPaymentsAsc = [...customerTransactions]
      .filter(t => t.type === 'payment_received')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedPaymentsAsc.forEach(p => {
      const cObj = findCustomerForRecord(p);
      if (cObj && custMap[cObj.id]) {
        const amt = Number(p.amount || 0);
        custMap[cObj.id].totalPaid += amt;
        custMap[cObj.id].paymentsCount += 1;
        custMap[cObj.id].lastPaymentDate = p.date;
        custMap[cObj.id].lastPaymentAmount = amt;
      }
    });

    const result = Object.values(custMap).map(item => {
      const c = item.customer;
      const balance = Number(c.balance) || Math.max(0, item.totalBill - item.totalPaid);
      const advance = Number(c.advance) || (item.totalPaid > item.totalBill ? item.totalPaid - item.totalBill : 0);
      return {
        ...item,
        totalLiters: Number(item.totalLiters.toFixed(1)),
        totalBill: Math.round(item.totalBill),
        totalPaid: Math.round(item.totalPaid),
        balance: Math.round(balance),
        advance: Math.round(advance)
      };
    });

    return result.sort((a, b) => b.balance - a.balance);
  }, [customers, customerSales, customerTransactions]);

  // Filtered Customer Register
  const filteredCustomerRegisters = useMemo(() => {
    if (!payRegisterSearch) return allCustomerRegisters;
    const term = payRegisterSearch.trim().toLowerCase();
    return allCustomerRegisters.filter(item => {
      return item.customer.name.toLowerCase().includes(term) ||
             (item.customer.mobile && item.customer.mobile.includes(term)) ||
             (item.customer.phone && item.customer.phone.includes(term)) ||
             (item.customer.address && item.customer.address.toLowerCase().includes(term));
    });
  }, [allCustomerRegisters, payRegisterSearch]);

  // Payment register summary KPIs
  const payRegisterKPIs = useMemo(() => {
    const totalCollected = filteredPaymentDeposits.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const cashCollected = filteredPaymentDeposits.filter(p => !p.paymentMode || p.paymentMode.toLowerCase() === 'cash').reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const onlineCollected = totalCollected - cashCollected;
    const totalMarketDues = allCustomerRegisters.reduce((acc, c) => acc + c.balance, 0);

    return {
      totalCollected: Math.round(totalCollected),
      cashCollected: Math.round(cashCollected),
      onlineCollected: Math.round(onlineCollected),
      receiptsCount: filteredPaymentDeposits.length,
      totalMarketDues: Math.round(totalMarketDues),
      avgDeposit: filteredPaymentDeposits.length > 0 ? Math.round(totalCollected / filteredPaymentDeposits.length) : 0
    };
  }, [filteredPaymentDeposits, allCustomerRegisters]);

  // WhatsApp Share Generator
  const shareOnWhatsApp = () => {
    if (!selectedCustomer) return;
    const phone = (selectedCustomer.phone || selectedCustomer.mobile || '').replace(/\D/g, '');
    const farmName = farmProfile?.farmName || 'SHIVAJI MILK CENTER';

    let msg = `🥛 *${farmName}* - दूध बिल व हिसाब 📊\n`;
    msg += `नमस्ते *${selectedCustomer.name}* जी,\n`;
    msg += `------------------------------------\n`;
    msg += `📅 *अवधि (Period):* ${currentFilteredStats.rangeLabel}\n`;
    msg += `🥛 *कुल दूध:* ${currentFilteredStats.totalMilk} L (🌅 ${currentFilteredStats.morningMilk}L + 🌇 ${currentFilteredStats.eveningMilk}L)\n`;
    msg += `📅 *कुल दिन:* ${currentFilteredStats.totalDays} दिन (दैनिक औसत: ${currentFilteredStats.avgDaily} L)\n`;
    msg += `💵 *कुल बिल राशि:* ₹${currentFilteredStats.billAmount.toLocaleString('en-IN')}\n`;
    msg += `💳 *जमा राशि:* ₹${currentFilteredStats.paidAmount.toLocaleString('en-IN')}\n`;
    msg += `⚖️ *शेष बकाया राशि:* ₹${currentFilteredStats.balance.toLocaleString('en-IN')}\n`;
    if (currentFilteredStats.advance > 0) {
      msg += `🟢 *अग्रिम जमा:* ₹${currentFilteredStats.advance.toLocaleString('en-IN')}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `धन्यवाद! शुद्ध एवं ताजा दूध। 🙏\n📞 संपर्क: ${farmProfile?.phone || '8770234735'}`;

    const encodedMsg = encodeURIComponent(msg);
    const waUrl = phone ? `https://wa.me/91${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Top Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Customer Milk Analysis</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              विश्लेषण
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ग्राहक वार दूध खपत, मासिक रिपोर्ट, दैनिक लॉग व बकाया हिसाब
          </p>
        </div>

        {/* Main View Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto gap-1 flex-wrap">
          <button
            onClick={() => setActiveMainTab('due_matrix')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'due_matrix'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 ग्राहक माहवार बकाया (Due Report)
          </button>

          <button
            onClick={() => setActiveMainTab('month_conclusion')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'month_conclusion'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 माह-वार सारांश (Month Conclusion)
          </button>

          <button
            onClick={() => setActiveMainTab('payment_register')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'payment_register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💳 जमा भुगतान व बकाया रजिस्टर (Payments)
          </button>

          <button
            onClick={() => setActiveMainTab('individual')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'individual'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 व्यक्तिगत ग्राहक रिपोर्ट
          </button>

          <button
            onClick={() => setActiveMainTab('owner_dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'owner_dashboard'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👑 डेयरी मालिक डैशबोर्ड
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB -1: CUSTOMER DUE MATRIX (GOOGLE SHEET GID 857195182)  */}
      {/* ========================================================= */}
      {activeMainTab === 'due_matrix' && (
        <CustomerDueMatrixReport />
      )}

      {/* ========================================================= */}
      {/* TAB 0: MONTH WISE CONCLUSION (GOOGLE SHEET STYLE)         */}
      {/* ========================================================= */}
      {activeMainTab === 'month_conclusion' && (
        <MonthWiseConclusionTable />
      )}

      {/* ========================================================= */}
      {/* TAB 1: INDIVIDUAL CUSTOMER VIEW                           */}
      {/* ========================================================= */}
      {activeMainTab === 'individual' && (
        <div className="space-y-6">
          {/* Customer Selection & Date Range Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Customer Selector */}
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>ग्राहक चुनें (Select Customer):</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {c.balance > 0 ? `— बकाया: ₹${c.balance}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Mode Switcher (Month vs Custom Date Range) */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setDateFilterMode('month')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      dateFilterMode === 'month'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>📅 महीना वार</span>
                  </button>

                  <button
                    onClick={() => setDateFilterMode('custom')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      dateFilterMode === 'custom'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>📆 तारीख से तारीख (Custom)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Print report"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={shareOnWhatsApp}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    title="Send WhatsApp invoice"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp बिल</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DYNAMIC FILTER ROW: Month Dropdown OR Custom Date Range Inputs */}
            <div className="border-t border-slate-100 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
              {dateFilterMode === 'month' ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                      महीना (Month):
                    </label>
                    <select
                      value={selectedMonthFilter}
                      onChange={(e) => setSelectedMonthFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="all">📅 सभी महीने (All Months)</option>
                      {availableMonths.map(m => {
                        const d = new Date(m + '-01');
                        const mLabel = d.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
                        return (
                          <option key={m} value={m}>
                            {mLabel} ({m})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    वर्तमान अवधि: <strong className="text-blue-700">{currentFilteredStats.rangeLabel}</strong>
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5 w-full">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* From Date */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        तारीख से (From Date):
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>

                    {/* To Date */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        तारीख तक (To Date):
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>

                    {/* Active Period Badge */}
                    <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black">
                      📅 {currentFilteredStats.rangeLabel}
                    </span>
                  </div>

                  {/* Quick Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      त्वरित तारीखें (Quick Pick):
                    </span>
                    <button
                      onClick={() => setPresetRange('this_month')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                    >
                      इस माह
                    </button>
                    <button
                      onClick={() => setPresetRange('last_month')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                    >
                      पिछला माह
                    </button>
                    <button
                      onClick={() => setPresetRange('first_15')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                    >
                      1 से 15 तारीख
                    </button>
                    <button
                      onClick={() => setPresetRange('second_15')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                    >
                      16 से 31 तारीख
                    </button>
                    <button
                      onClick={() => setPresetRange('last_30_days')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                    >
                      पिछले 30 दिन
                    </button>
                    <button
                      onClick={() => setPresetRange('all')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-all cursor-pointer"
                    >
                      ✕ रीसेट (All Time)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4 Big, Clean, High-Contrast KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Milk */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-100">
                🥛 कुल दूध (Total Milk)
              </div>
              <div className="text-3xl font-black mt-1">
                {currentFilteredStats.totalMilk} <span className="text-base font-semibold text-blue-200">L</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
                <span>🌅 सुबह: <strong>{currentFilteredStats.morningMilk}L</strong></span>
                <span>🌇 शाम: <strong>{currentFilteredStats.eveningMilk}L</strong></span>
              </div>
            </div>

            {/* Card 2: Total Days & Daily Average */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                📅 डिलीवरी दिन व औसत
              </div>
              <div className="text-3xl font-black text-slate-800 mt-1">
                {currentFilteredStats.totalDays} <span className="text-base font-semibold text-slate-400">दिन</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>दैनिक औसत:</span>
                <strong className="text-blue-700 text-sm">{currentFilteredStats.avgDaily} L/दिन</strong>
              </div>
            </div>

            {/* Card 3: Total Bill & Paid Amount */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                💵 कुल बिल राशि (Total Bill)
              </div>
              <div className="text-3xl font-black text-emerald-800 mt-1">
                ₹{currentFilteredStats.billAmount.toLocaleString('en-IN')}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>जमा राशि:</span>
                <strong className="text-slate-800">₹{currentFilteredStats.paidAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Card 4: Remaining Net Balance */}
            <div className={`p-5 rounded-2xl border shadow-md ${
              currentFilteredStats.balance > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="text-xs font-bold uppercase tracking-wider">
                ⚖️ {currentFilteredStats.balance > 0 ? '🔴 शुद्ध बकाया (Due Balance)' : '🟢 खाता पूर्ण (0 Due)'}
              </div>
              <div className="text-3xl font-black mt-1">
                ₹{currentFilteredStats.balance.toLocaleString('en-IN')}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-current/15 text-xs font-semibold">
                {currentFilteredStats.balance > 0 ? 'कृपया समय पर भुगतान लें' : '✓ कोई बकाया नहीं है'}
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs (One Focus at a Time) */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('monthly')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📅 1. मासिक रिपोर्ट (Monthly Table)
            </button>

            <button
              onClick={() => setActiveSubTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'daily'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📋 2. दैनिक डिलीवरी रिकॉर्ड (Daily Logs)
            </button>

            <button
              onClick={() => setActiveSubTab('trends')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'trends'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📈 3. खपत तुलना व ग्राफ (Trends)
            </button>

            <button
              onClick={() => setActiveSubTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              💳 4. भुगतान हिसाब (Ledger)
            </button>
          </div>

          {/* SUB-VIEW 1: MONTHLY REPORT TABLE */}
          {activeSubTab === 'monthly' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  मासिक दूध रिपोर्ट: <span className="text-blue-700">{selectedCustomer?.name}</span>
                </h3>
                <span className="text-xs text-slate-500">कुल {monthlyBreakdown.length} महीने</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">महीना</th>
                      <th className="py-3 px-3 text-center">दिन</th>
                      <th className="py-3 px-3 text-right">🌅 सुबह (L)</th>
                      <th className="py-3 px-3 text-right">🌇 शाम (L)</th>
                      <th className="py-3 px-3 text-right font-black text-blue-900 bg-blue-50/50">🥛 कुल दूध (L)</th>
                      <th className="py-3 px-3 text-right">दैनिक औसत</th>
                      <th className="py-3 px-4 text-right font-bold text-emerald-700">कुल बिल (₹)</th>
                      <th className="py-3 px-4 text-right text-slate-700">जमा राशि (₹)</th>
                      <th className="py-3 px-4 text-right font-bold text-rose-600">बकाया (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                          कोई मासिक रिकॉर्ड नहीं मिला।
                        </td>
                      </tr>
                    ) : (
                      monthlyBreakdown.map((m) => (
                        <tr key={m.monthKey} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{m.monthName}</td>
                          <td className="py-3.5 px-3 text-center text-slate-600">{m.totalDays} दिन</td>
                          <td className="py-3.5 px-3 text-right text-blue-700 font-semibold">{m.morningMilk} L</td>
                          <td className="py-3.5 px-3 text-right text-indigo-700 font-semibold">{m.eveningMilk} L</td>
                          <td className="py-3.5 px-3 text-right font-black text-blue-900 bg-blue-50/50">{m.totalMilk} L</td>
                          <td className="py-3.5 px-3 text-right text-slate-600">{m.avgDaily} L/दिन</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">₹{m.billAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-right text-slate-700">₹{m.paidAmount.toLocaleString('en-IN')}</td>
                          <td className={`py-3.5 px-4 text-right font-bold ${m.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {m.balance > 0 ? `₹${m.balance.toLocaleString('en-IN')}` : '✓ 0'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: DAILY DELIVERIES LOG */}
          {activeSubTab === 'daily' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  दैनिक डिलीवरी विवरण: <span className="text-blue-700">{selectedCustomer?.name}</span>
                </h3>

                <input
                  type="date"
                  value={dailySearchDate}
                  onChange={(e) => setDailySearchDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4">तारीख</th>
                      <th className="py-2.5 px-3">समय / Shift</th>
                      <th className="py-2.5 px-3 text-right">मात्रा (Liters)</th>
                      <th className="py-2.5 px-3 text-right">दर (Rate)</th>
                      <th className="py-2.5 px-4 text-right">बिल राशि (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDailyDeliveries.slice(0, 100).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{d.date}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            d.shift === 'evening' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {d.shift === 'evening' ? 'शाम' : 'सुबह'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-900">{d.quantity} L</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">₹{d.rate || 70}</td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-emerald-700">
                          ₹{d.amount || Math.round((d.quantity || 0) * (d.rate || 70))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: MONTHLY TRENDS & CHARTS */}
          {activeSubTab === 'trends' && (
            <div className="space-y-6">
              {/* Trend Badge */}
              {monthComparisonTrend && (
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      {monthComparisonTrend.isGrowing ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">पिछले महीने से तुलना:</div>
                      <div className="text-base font-extrabold text-white">
                        {monthComparisonTrend.previousMonth} ({monthComparisonTrend.previousVolume}L) → {monthComparisonTrend.currentMonth} ({monthComparisonTrend.currentVolume}L)
                      </div>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                    monthComparisonTrend.isGrowing ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {monthComparisonTrend.isGrowing ? `+${monthComparisonTrend.diff}L बढ़ रहा है` : `${monthComparisonTrend.diff}L कम हुआ`}
                  </span>
                </div>
              )}

              {/* Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-4">
                  मासिक दूध खपत चार्ट (Monthly Milk Trend)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...monthlyBreakdown].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="monthNameEn" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val) => [`${val} L`, 'कुल दूध']} />
                      <Bar dataKey="totalMilk" name="कुल दूध (L)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: PAYMENT LEDGER */}
          {activeSubTab === 'ledger' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span>जमा भुगतान इतिहास: <span className="text-emerald-700">{selectedCustomer?.name}</span></span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    इस ग्राहक द्वारा अवधि ({currentFilteredStats.rangeLabel}) में जमा की गई राशि का विवरण।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    अवधि में {filteredCustomerPayments.length} भुगतान = ₹{filteredCustomerPayments.reduce((a, b) => a + Number(b.amount || 0), 0).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => setLedgerModalCustomer(selectedCustomer)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>लेजर पॉपअप खोलें</span>
                  </button>
                </div>
              </div>

              {filteredCustomerPayments.length === 0 ? (
                <div className="text-xs text-slate-400 py-10 text-center border border-dashed rounded-xl">
                  चयनित अवधि ({currentFilteredStats.rangeLabel}) में कोई जमा भुगतान रिकॉर्ड नहीं मिला।
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">क्र. (No.)</th>
                          <th className="py-2.5 px-3">तारीख (Payment Date)</th>
                          <th className="py-2.5 px-3">माध्यम (Mode)</th>
                          <th className="py-2.5 px-3 text-right">जमा राशि (Amount ₹)</th>
                          <th className="py-2.5 px-4">रसीद विवरण / नोट</th>
                          <th className="py-2.5 px-3 text-center">स्थिति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCustomerPayments.map((p, idx) => (
                          <tr key={p.id || idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">
                              #{filteredCustomerPayments.length - idx}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              {p.date}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-700">
                                {p.paymentMode || 'CASH'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                              +₹{Number(p.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 text-xs">
                              {p.note || 'CASH PAYMENT'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ जमा प्राप्त
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: PAYMENT & DUES REGISTER (जमा भुगतान व बकाया रजिस्टर) */}
      {/* ========================================================= */}
      {activeMainTab === 'payment_register' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Collected */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center justify-between">
                <span>💳 कुल जमा राशि (Total Collected)</span>
              </div>
              <div className="text-3xl font-black mt-1">
                ₹{payRegisterKPIs.totalCollected.toLocaleString('en-IN')}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100">
                <span>💵 नकद (Cash): <strong>₹{payRegisterKPIs.cashCollected.toLocaleString('en-IN')}</strong></span>
                <span>📱 UPI: <strong>₹{payRegisterKPIs.onlineCollected.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            {/* Card 2: Receipts Count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                🧾 भुगतान रसीदें (Receipts)
              </div>
              <div className="text-3xl font-black text-slate-800 mt-1">
                {payRegisterKPIs.receiptsCount} <span className="text-base font-semibold text-slate-400">रसीदें</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>औसतन जमा:</span>
                <strong className="text-emerald-700 text-sm">₹{payRegisterKPIs.avgDeposit.toLocaleString('en-IN')}/रसीद</strong>
              </div>
            </div>

            {/* Card 3: Total Market Dues */}
            <div className="bg-gradient-to-br from-rose-600 to-pink-700 text-white p-5 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-100">
                🔴 कुल बाजार बकाया (उधारी)
              </div>
              <div className="text-3xl font-black mt-1">
                ₹{payRegisterKPIs.totalMarketDues.toLocaleString('en-IN')}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-rose-100">
                <span>बकाया वाले ग्राहक:</span>
                <strong>{allCustomerRegisters.filter(c => c.balance > 0).length} ग्राहक</strong>
              </div>
            </div>

            {/* Card 4: Total Customers & Advances */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                👥 कुल ग्राहक व अग्रिम जमा
              </div>
              <div className="text-3xl font-black text-blue-900 mt-1">
                {allCustomerRegisters.length} <span className="text-base font-semibold text-slate-400">ग्राहक</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>अग्रिम जमा (Advance):</span>
                <strong className="text-emerald-700 text-sm">₹{allCustomerRegisters.reduce((a, b) => a + b.advance, 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* Search, Filter and Sub-Tab Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="flex-1 min-w-[260px] relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ग्राहक का नाम, मोबाइल, तारीख (YYYY-MM-DD) या विवरण खोजें..."
                  value={payRegisterSearch}
                  onChange={(e) => setPayRegisterSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div>
                  <select
                    value={payRegisterMonth}
                    onChange={(e) => setPayRegisterMonth(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">📅 सभी महीने (All Months)</option>
                    {allPaymentMonths.map(m => {
                      const d = new Date(m + '-01');
                      const mLabel = d.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
                      return (
                        <option key={m} value={m}>
                          {mLabel} ({m})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Mode Filter */}
                <div>
                  <select
                    value={payRegisterMode}
                    onChange={(e) => setPayRegisterMode(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">💳 सभी माध्यम (All Modes)</option>
                    <option value="cash">Cash (नकद)</option>
                    <option value="upi">UPI / Online</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Print Register"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs: 1. Payment Receipts List vs 2. Customer Balances Summary */}
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setPayRegisterSubTab('receipts')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  payRegisterSubTab === 'receipts'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>💳 1. सभी जमा रसीदें ({filteredPaymentDeposits.length} Records)</span>
              </button>

              <button
                onClick={() => setPayRegisterSubTab('customer_balances')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  payRegisterSubTab === 'customer_balances'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>👥 2. ग्राहक-वार बकाया व जमा रजिस्टर ({filteredCustomerRegisters.length} Customers)</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: ALL PAYMENT RECEIPTS TABLE */}
          {payRegisterSubTab === 'receipts' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>जमा भुगतान रजिस्टर (All Customer Cash & UPI Receipts)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    किस ग्राहक ने कब-कब और कितना भुगतान जमा किया है।
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  कुल जमा: ₹{payRegisterKPIs.totalCollected.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-3">क्र. (#)</th>
                      <th className="py-3 px-3.5">तारीख (Payment Date)</th>
                      <th className="py-3 px-4">ग्राहक का नाम (Customer)</th>
                      <th className="py-3 px-3">मोबाइल</th>
                      <th className="py-3 px-3">माध्यम (Mode)</th>
                      <th className="py-3 px-3.5 text-right font-black text-emerald-800">जमा राशि (Amount ₹)</th>
                      <th className="py-3 px-4">रसीद विवरण / नोट</th>
                      <th className="py-3 px-3 text-center">एक्शन</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPaymentDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                          कोई भुगतान रिकॉर्ड नहीं मिला।
                        </td>
                      </tr>
                    ) : (
                      filteredPaymentDeposits.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-400 text-xs">
                            #{filteredPaymentDeposits.length - idx}
                          </td>
                          <td className="py-3 px-3.5 font-bold text-slate-800 whitespace-nowrap">
                            {p.date}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">
                            {p.displayCustomerName}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-500">
                            {p.displayMobile}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-700">
                              {p.paymentMode || 'CASH'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-black text-emerald-700 text-sm whitespace-nowrap">
                            +₹{Number(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs">
                            {p.note || 'CASH PAYMENT'}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (p.customerObj) {
                                  setLedgerModalCustomer(p.customerObj);
                                } else {
                                  const c = customers.find(x => (x.name || '').trim().toLowerCase() === (p.displayCustomerName || '').trim().toLowerCase());
                                  if (c) setLedgerModalCustomer(c);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                              title="View Customer Statement"
                            >
                              खाता देखें
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: CUSTOMER BALANCES & DUES REGISTER TABLE */}
          {payRegisterSubTab === 'customer_balances' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>ग्राहक वार कुल दूध, बिल, जमा भुगतान व बकाया रजिस्टर</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    सभी ग्राहकों का कुल दूध, कुल बिल राशि, कुल जमा राशि और शुद्ध बकाया (उधारी)।
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                  कुल बकाया: ₹{payRegisterKPIs.totalMarketDues.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-3">क्र. (#)</th>
                      <th className="py-3 px-4">ग्राहक का नाम (Customer)</th>
                      <th className="py-3 px-3 text-right">कुल दूध (L)</th>
                      <th className="py-3 px-3 text-right">दर (₹/L)</th>
                      <th className="py-3 px-3.5 text-right font-bold text-slate-800">कुल बिल (₹)</th>
                      <th className="py-3 px-3.5 text-right font-bold text-emerald-700">कुल जमा (₹)</th>
                      <th className="py-3 px-3.5 text-right font-black text-rose-700">वर्तमान बकाया (₹)</th>
                      <th className="py-3 px-3 text-right text-emerald-700">अग्रिम (₹)</th>
                      <th className="py-3 px-3.5">अंतिम भुगतान</th>
                      <th className="py-3 px-3 text-center">एक्शन</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomerRegisters.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-slate-400 font-medium">
                          कोई ग्राहक रिकॉर्ड नहीं मिला।
                        </td>
                      </tr>
                    ) : (
                      filteredCustomerRegisters.map((item, idx) => (
                        <tr key={item.customer.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-400 text-xs">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900">{item.customer.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{item.customer.mobile || item.customer.phone || 'No Mobile'}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-blue-700">
                            {item.totalLiters} L
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500">
                            ₹{item.customer.rate || 70}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-800">
                            ₹{item.totalBill.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-emerald-700">
                            ₹{item.totalPaid.toLocaleString('en-IN')}
                          </td>
                          <td className={`py-3 px-3.5 text-right font-black ${
                            item.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {item.balance > 0 ? `₹${item.balance.toLocaleString('en-IN')}` : '✓ ₹0'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">
                            {item.advance > 0 ? `₹${item.advance}` : '-'}
                          </td>
                          <td className="py-3 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                            {item.lastPaymentDate ? (
                              <div>
                                <span className="font-bold">{item.lastPaymentDate}</span>
                                <span className="text-[11px] text-emerald-700 font-semibold block">₹{item.lastPaymentAmount}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => setLedgerModalCustomer(item.customer)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              खाताबही
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DAIRY OWNER DASHBOARD                              */}
      {/* ========================================================= */}
      {activeMainTab === 'owner_dashboard' && (
        <div className="space-y-6">
          {/* Top Monthly Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-100">
                🥛 मासिक कुल दूध बिक्री
              </div>
              <div className="text-3xl font-black mt-1">
                {ownerInsights.currentMonthTotalMilk} <span className="text-base font-semibold text-blue-200">L</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                💵 मासिक कुल बिक्री राशि
              </div>
              <div className="text-3xl font-black mt-1">
                ₹{ownerInsights.currentMonthTotalSale.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-600 to-pink-700 text-white p-5 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-100">
                💰 कुल बाजार बकाया (उधारी)
              </div>
              <div className="text-3xl font-black mt-1">
                ₹{ownerInsights.totalMarketUdhaari.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* 2 Clean Lists: Top 10 Buyers & Top Pending Udhaari */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Buyers */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>🥛 सबसे ज्यादा दूध लेने वाले Top 10 ग्राहक</span>
              </h3>

              <div className="space-y-2">
                {ownerInsights.topConsumers.map((item, idx) => (
                  <div
                    key={item.customer.id}
                    onClick={() => {
                      setSelectedCustomerId(item.customer.id);
                      setActiveMainTab('individual');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/50 border border-slate-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{item.customer.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-blue-700 text-sm">{item.totalLiters.toFixed(1)} L</div>
                      <div className="text-[11px] text-slate-400">₹{item.totalBill.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Pending Udhaari */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>💰 सबसे ज्यादा बकाया वाले ग्राहक</span>
              </h3>

              <div className="space-y-2">
                {ownerInsights.highestBalances.map((item, idx) => (
                  <div key={item.customer.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center text-xs font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{item.customer.name}</div>
                        <div className="text-[11px] text-slate-400">{item.customer.phone || 'No Phone'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-rose-600 text-sm">₹{item.balance.toLocaleString('en-IN')}</span>
                      {item.customer.phone && (
                        <button
                          onClick={() => {
                            const phone = item.customer.phone.replace(/\D/g, '');
                            const msg = encodeURIComponent(`नमस्ते ${item.customer.name} जी, ${farmProfile?.farmName || 'SHIVAJI MILK CENTER'} पर आपका कुल बकाया ₹${item.balance} है। कृपया भुगतान करने का कष्ट करें। धन्यवाद! 🙏`);
                            window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
                          }}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white"
                          title="WhatsApp Reminder"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Ledger Modal Popup */}
      {ledgerModalCustomer && (
        <CustomerLedgerModal
          customer={ledgerModalCustomer}
          onClose={() => setLedgerModalCustomer(null)}
        />
      )}
    </div>
  );
};
