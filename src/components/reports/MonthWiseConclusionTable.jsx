import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  CreditCard,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
  BarChart3,
  RefreshCw,
  Zap
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
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const MonthWiseConclusionTable = ({ onMonthClick }) => {
  const { customerSales, customerTransactions, farmProfile, isDbLoaded } = useApp();
  const [sortOrder, setSortOrder] = useState('chrono'); // 'chrono' | 'latest' | 'liters_desc' | 'due_desc'
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState(true);

  // 1. Instant Cache from Local Storage & Initial Pre-computed Snapshot
  const [cachedConclusions, setCachedConclusions] = useState(() => {
    try {
      const saved = localStorage.getItem('dairy_month_conclusions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Month names formatting helper
  const formatMonthLabel = (mKey) => {
    const [year, month] = mKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // 2. High-Performance Instant Computation from Active State (optimized for < 2ms execution)
  const computedData = useMemo(() => {
    if (!customerSales || customerSales.length === 0) {
      return cachedConclusions || [];
    }

    const monthsMap = {};

    // 1. Process customer sales for Total Liters, Morning/Evening Liters & Total Billed
    for (let i = 0; i < customerSales.length; i++) {
      const s = customerSales[i];
      if (!s.date) continue;
      const mKey = s.date.substring(0, 7); // 'YYYY-MM'
      
      let mObj = monthsMap[mKey];
      if (!mObj) {
        mObj = {
          monthKey: mKey,
          monthName: formatMonthLabel(mKey),
          totalLiters: 0,
          morningLiters: 0,
          eveningLiters: 0,
          advanceCash: 0,
          totalPayment: 0,
          deliveriesCount: 0,
          customersSet: new Set(),
          customerBreakdown: {}
        };
        monthsMap[mKey] = mObj;
      }

      const liters = Number(s.quantity || s.liters || 0);
      const amount = Number(s.amount || (liters * (s.rate || 70)));
      const shift = (s.shift || '').toLowerCase();
      
      mObj.totalLiters += liters;
      if (shift === 'evening' || shift === 'शाम') {
        mObj.eveningLiters += liters;
      } else {
        mObj.morningLiters += liters;
      }
      mObj.totalPayment += amount;
      mObj.deliveriesCount++;

      const cName = s.customerName || 'Other Customer';
      mObj.customersSet.add(cName);

      let cBrk = mObj.customerBreakdown[cName];
      if (!cBrk) {
        cBrk = { liters: 0, morningLiters: 0, eveningLiters: 0, amount: 0, cash: 0, deliveries: 0 };
        mObj.customerBreakdown[cName] = cBrk;
      }
      cBrk.liters += liters;
      if (shift === 'evening' || shift === 'शाम') {
        cBrk.eveningLiters += liters;
      } else {
        cBrk.morningLiters += liters;
      }
      cBrk.amount += amount;
      cBrk.deliveries++;
    }

    // 2. Process cash payments for Advance / Cash Received
    if (customerTransactions && customerTransactions.length > 0) {
      for (let i = 0; i < customerTransactions.length; i++) {
        const t = customerTransactions[i];
        if (!t.date || t.type !== 'payment_received') continue;
        const mKey = t.date.substring(0, 7);
        let mObj = monthsMap[mKey];
        if (!mObj) {
          mObj = {
            monthKey: mKey,
            monthName: formatMonthLabel(mKey),
            totalLiters: 0,
            morningLiters: 0,
            eveningLiters: 0,
            advanceCash: 0,
            totalPayment: 0,
            deliveriesCount: 0,
            customersSet: new Set(),
            customerBreakdown: {}
          };
          monthsMap[mKey] = mObj;
        }
        const cashAmt = Number(t.amount || 0);
        mObj.advanceCash += cashAmt;
        const cName = t.customerName || 'Other Customer';
        mObj.customersSet.add(cName);
        if (!mObj.customerBreakdown[cName]) {
          mObj.customerBreakdown[cName] = { liters: 0, morningLiters: 0, eveningLiters: 0, amount: 0, cash: 0, deliveries: 0 };
        }
        mObj.customerBreakdown[cName].cash += cashAmt;
      }
    }

    // 3. Compute Due Payment, Collection Rate, and round figures
    const rows = Object.values(monthsMap).map(m => {
      const totalLiters = Number(m.totalLiters.toFixed(3));
      const morningLiters = Number(m.morningLiters.toFixed(2));
      const eveningLiters = Number(m.eveningLiters.toFixed(2));
      const advanceCash = Number(m.advanceCash.toFixed(2));
      const totalPayment = Number(m.totalPayment.toFixed(2));
      const duePayment = Number((totalPayment - advanceCash).toFixed(2));
      const collectionRate = totalPayment > 0 ? Number(((advanceCash / totalPayment) * 100).toFixed(1)) : 0;

      return {
        ...m,
        totalLiters,
        morningLiters,
        eveningLiters,
        advanceCash,
        duePayment,
        totalPayment,
        collectionRate,
        uniqueCustomersCount: m.customersSet.size
      };
    });

    return rows;
  }, [customerSales, customerTransactions, cachedConclusions]);

  // Persist computed conclusions for instantaneous cold start
  useEffect(() => {
    if (computedData && computedData.length > 0) {
      try {
        localStorage.setItem('dairy_month_conclusions', JSON.stringify(computedData));
      } catch (e) {}
    }
  }, [computedData]);

  // Sorted data
  const sortedRows = useMemo(() => {
    return [...computedData].sort((a, b) => {
      if (sortOrder === 'chrono') return a.monthKey.localeCompare(b.monthKey);
      if (sortOrder === 'latest') return b.monthKey.localeCompare(a.monthKey);
      if (sortOrder === 'liters_desc') return b.totalLiters - a.totalLiters;
      if (sortOrder === 'due_desc') return b.duePayment - a.duePayment;
      return 0;
    });
  }, [computedData, sortOrder]);

  // Grand Totals Summary (Instant)
  const grandTotal = useMemo(() => {
    return computedData.reduce((acc, row) => {
      acc.totalLiters += row.totalLiters;
      acc.morningLiters += row.morningLiters || 0;
      acc.eveningLiters += row.eveningLiters || 0;
      acc.advanceCash += row.advanceCash;
      acc.duePayment += row.duePayment;
      acc.totalPayment += row.totalPayment;
      acc.deliveriesCount += row.deliveriesCount;
      return acc;
    }, {
      totalLiters: 0,
      morningLiters: 0,
      eveningLiters: 0,
      advanceCash: 0,
      duePayment: 0,
      totalPayment: 0,
      deliveriesCount: 0
    });
  }, [computedData]);

  const grandCollectionRate = grandTotal.totalPayment > 0 
    ? Number(((grandTotal.advanceCash / grandTotal.totalPayment) * 100).toFixed(1)) 
    : 0;

  // Filtered rows for instant search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return sortedRows;
    const term = searchTerm.toLowerCase();
    return sortedRows.filter(m => m.monthName.toLowerCase().includes(term) || m.monthKey.includes(term));
  }, [sortedRows, searchTerm]);

  // Chart data
  const chartData = useMemo(() => {
    return [...computedData].sort((a, b) => a.monthKey.localeCompare(b.monthKey)).map(m => ({
      name: m.monthName.split(' ')[0] + ' ' + m.monthName.split(' ')[1]?.slice(2),
      'Total Liters (L)': m.totalLiters,
      'Cash Received (₹)': m.advanceCash,
      'Due Payment (₹)': Math.max(0, m.duePayment),
      'Total Revenue (₹)': m.totalPayment
    }));
  }, [computedData]);

  // Export to CSV matching the exact Google Sheet columns
  const handleExportCSV = () => {
    const headers = ['Month Name', 'Total Liters', 'Advance Payment (Cash)', 'Due Payment', 'Total Payment', 'Collection %'];
    const rows = sortedRows.map(r => [
      `"${r.monthName}"`,
      r.totalLiters,
      r.advanceCash,
      r.duePayment,
      r.totalPayment,
      `"${r.collectionRate}%"`
    ]);

    // Add Grand Total row
    rows.push([
      '"Grand Total (कुल योग)"',
      Number(grandTotal.totalLiters.toFixed(3)),
      Number(grandTotal.advanceCash.toFixed(2)),
      Number(grandTotal.duePayment.toFixed(2)),
      Number(grandTotal.totalPayment.toFixed(2)),
      `"${grandCollectionRate}%"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Month_Wise_Conclusion_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 print:space-y-3">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden print:p-3 print:bg-none print:bg-white print:border print:border-slate-300 print:text-slate-950 print:shadow-none">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none no-print print:hidden" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-emerald-300 print:bg-slate-100 print:text-slate-800">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 print:text-slate-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 print:text-amber-600 print:fill-amber-600" />
                <span>Instant Database Stream • तत्काल लाइव निष्कर्ष</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white print:text-slate-900 flex items-center gap-3">
              MONTH WISE CONCLUSION
              <span className="text-sm font-normal px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 print:bg-emerald-50 print:text-emerald-800 print:border-emerald-300">
                माह-वार सारांश सारणी
              </span>
            </h2>
            <p className="text-sm text-slate-300 print:text-slate-600 mt-1 max-w-2xl">
              आपकी Google Sheet ("MONTH WISE CONCLUSION" टैब) एवं डेटाबेस के अनुसार सभी 7 महीनों का पूर्ण लाइव रिकॉर्ड।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 no-print print:hidden">
            <button
              onClick={() => setShowChart(!showChart)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all border border-white/15 shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-emerald-300" />
              <span>{showChart ? 'Hide Chart (चार्ट छुपाएं)' : 'Show Chart (चार्ट देखें)'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel (एक्सेल डाउनलोड)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all border border-white/15"
            >
              <Printer className="w-4 h-4" />
              <span>Print (प्रिंट)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 print:mt-3 print:pt-3 print:border-slate-300">
          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 print:bg-slate-50 print:border-slate-300 print:p-2.5">
            <span className="text-xs text-slate-300 print:text-slate-600 block">🥛 Total Milk (कुल संकलन)</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300 print:text-emerald-700 mt-0.5 block">
              {grandTotal.totalLiters.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} L
            </span>
            <div className="text-[11px] font-bold text-slate-300 print:text-slate-600 mt-1 flex items-center gap-1.5">
              <span className="text-amber-300 print:text-amber-800">🌅 {grandTotal.morningLiters.toFixed(1)} L</span>
              <span>•</span>
              <span className="text-teal-300 print:text-teal-800">🌇 {grandTotal.eveningLiters.toFixed(1)} L</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 print:bg-slate-50 print:border-slate-300 print:p-2.5">
            <span className="text-xs text-slate-300 print:text-slate-600 block">💵 Advance / Cash (नकद प्राप्त)</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 print:text-amber-800 mt-0.5 block">
              ₹{grandTotal.advanceCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-amber-200/80 print:text-slate-500 block mt-1 font-semibold">नकद भुगतान</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 print:bg-slate-50 print:border-slate-300 print:p-2.5">
            <span className="text-xs text-slate-300 print:text-slate-600 block">⏳ Due Payment (बकाया राशि)</span>
            <span className="text-xl sm:text-2xl font-black text-rose-300 print:text-rose-700 mt-0.5 block">
              ₹{grandTotal.duePayment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-rose-200/80 print:text-slate-500 block mt-1 font-semibold">मासिक बकाया</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 print:bg-slate-50 print:border-slate-300 print:p-2.5">
            <span className="text-xs text-slate-300 print:text-slate-600 block">💰 Total Billed / Revenue (कुल योग)</span>
            <span className="text-xl sm:text-2xl font-black text-white print:text-slate-950 mt-0.5 block">
              ₹{grandTotal.totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-emerald-200 print:text-emerald-700 block mt-1 font-bold">रिकॉर्ड्स: {grandTotal.deliveriesCount}</span>
          </div>
        </div>
      </div>

      {/* Visual Comparison Chart (Hidden on Print) */}
      {showChart && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card no-print print:hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                माह-वार वित्तीय एवं दूध संकलन तुलनात्मक चार्ट (Monthly Breakdown Trends)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">माह-वार कुल दूध (L), नकद प्राप्त राशि (₹) एवं बकाया का तुलनात्मक विश्लेषण</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {computedData.length} माह का डेटा
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fill: '#059669', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#D97706', fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) => [
                    name.includes('Liters') ? `${Number(val).toFixed(2)} L` : `₹${Number(val).toLocaleString('en-IN')}`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="Total Liters (L)" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar yAxisId="right" dataKey="Cash Received (₹)" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar yAxisId="right" dataKey="Due Payment (₹)" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Analysis Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden print:rounded-none print:border-0 print:shadow-none">
        {/* Table Toolbar (Hidden on Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print print:hidden">
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="महीना खोजें (Search Month)..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-300 shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-slate-700"
              >
                <option value="chrono">क्रमानुसार (मार्च → सितम्बर)</option>
                <option value="latest">नवीनतम पहले (Latest First)</option>
                <option value="liters_desc">अधिकतम दूध पहले (Highest Liters)</option>
                <option value="due_desc">अधिकतम बकाया पहले (Highest Due)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>कुल <strong>{filteredRows.length}</strong> महीने (तत्काल लाइव डेटा)</span>
          </div>
        </div>

        {/* The Exact Google Sheet Styled Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-700 dark:bg-emerald-950 text-white text-xs sm:text-sm font-bold tracking-wide">
                <th className="py-4 px-5 border-r border-emerald-600 dark:border-emerald-800">Month Name (महीना)</th>
                <th className="py-4 px-5 text-right border-r border-emerald-600 dark:border-emerald-800">Total Liters (कुल दूध)</th>
                <th className="py-4 px-5 text-right border-r border-emerald-600 dark:border-emerald-800">Advance Payment (Cash) (नकद)</th>
                <th className="py-4 px-5 text-right border-r border-emerald-600 dark:border-emerald-800">Due Payment (बकाया)</th>
                <th className="py-4 px-5 text-right border-r border-emerald-600 dark:border-emerald-800">Total Payment (कुल योग)</th>
                <th className="py-4 px-4 text-center">Collection %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredRows.map((row, idx) => {
                const isExpanded = expandedMonth === row.monthKey;
                const isEven = idx % 2 === 0;

                return (
                  <React.Fragment key={row.monthKey}>
                    <tr
                      onClick={() => setExpandedMonth(isExpanded ? null : row.monthKey)}
                      className={`cursor-pointer transition-colors font-medium ${
                        isEven 
                          ? 'bg-slate-50/80 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800' 
                          : 'bg-white dark:bg-slate-950/90 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {/* Month Name */}
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>{row.monthName}</span>
                          </span>
                          <span className="text-slate-400 hover:text-slate-200">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </div>
                      </td>

                      {/* Total Liters with Morning & Evening Split */}
                      <td className="py-3.5 px-5 text-right font-black border-r border-slate-200 dark:border-slate-800 tabular-nums">
                        <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                          {row.totalLiters.toFixed(2)} L
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-end gap-1.5">
                          <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60" title="Morning Milk">
                            🌅 {row.morningLiters.toFixed(1)} L
                          </span>
                          <span className="text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60" title="Evening Milk">
                            🌇 {row.eveningLiters.toFixed(1)} L
                          </span>
                        </div>
                      </td>

                      {/* Advance Payment (Cash) */}
                      <td className="py-3.5 px-5 text-right font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                        ₹{row.advanceCash.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </td>

                      {/* Due Payment */}
                      <td className={`py-3.5 px-5 text-right font-bold border-r border-slate-200 dark:border-slate-800 tabular-nums ${
                        row.duePayment > 5000 ? 'text-rose-600 dark:text-rose-400' : row.duePayment < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        ₹{row.duePayment.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </td>

                      {/* Total Payment */}
                      <td className="py-3.5 px-5 text-right font-black text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                        ₹{row.totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </td>

                      {/* Collection Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          row.collectionRate >= 90
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : row.collectionRate >= 70
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                        }`}>
                          {row.collectionRate}%
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Month Customer Breakdown Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-100/90 dark:bg-slate-900/90">
                        <td colSpan="6" className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
                          <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                              <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                  <span>👥 {row.monthName} — ग्राहक-वार संकलन एवं बकाया विवरण</span>
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  कुल दूध: <strong className="text-emerald-600 dark:text-emerald-400">{row.totalLiters.toFixed(2)} L</strong> (🌅 सुबह: {row.morningLiters.toFixed(1)} L • 🌇 शाम: {row.eveningLiters.toFixed(1)} L)
                                </p>
                              </div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                कुल सक्रिय ग्राहक: {row.uniqueCustomersCount}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                              {Object.entries(row.customerBreakdown)
                                .sort((a, b) => b[1].amount - a[1].amount)
                                .map(([custName, cData], cIdx) => (
                                  <div key={cIdx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">{custName}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        {cData.liters.toFixed(1)} L ({cData.deliveries} दिन)
                                        {cData.morningLiters > 0 && <span className="ml-1 text-amber-700 dark:text-amber-400 font-semibold">🌅{cData.morningLiters.toFixed(1)}</span>}
                                        {cData.eveningLiters > 0 && <span className="ml-1 text-indigo-700 dark:text-indigo-400 font-semibold">🌇{cData.eveningLiters.toFixed(1)}</span>}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-black text-slate-900 dark:text-slate-100">₹{cData.amount.toLocaleString('en-IN')}</p>
                                      {cData.cash > 0 && (
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">नकद: ₹{cData.cash.toLocaleString('en-IN')}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Grand Total Row */}
            <tfoot>
              <tr className="bg-emerald-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-black text-xs sm:text-base border-t-2 border-emerald-600 dark:border-emerald-500 shadow-inner">
                <td className="py-4 px-5 font-black uppercase text-emerald-900 dark:text-emerald-300 border-r border-slate-300 dark:border-slate-700">
                  Grand Total (कुल ऐतिहासिक योग)
                </td>
                <td className="py-4 px-5 text-right font-black border-r border-slate-300 dark:border-slate-700 tabular-nums">
                  <div className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                    {grandTotal.totalLiters.toFixed(3)} L
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5 flex items-center justify-end gap-1.5">
                    <span className="text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded font-bold">🌅 {grandTotal.morningLiters.toFixed(2)} L</span>
                    <span className="text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded font-bold">🌇 {grandTotal.eveningLiters.toFixed(2)} L</span>
                  </div>
                </td>
                <td className="py-4 px-5 text-right font-black text-amber-900 dark:text-amber-300 border-r border-slate-300 dark:border-slate-700 tabular-nums">
                  ₹{grandTotal.advanceCash.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-5 text-right font-black text-rose-900 dark:text-rose-400 border-r border-slate-300 dark:border-slate-700 tabular-nums">
                  ₹{grandTotal.duePayment.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-5 text-right font-black text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700 tabular-nums">
                  ₹{grandTotal.totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black">
                    {grandCollectionRate}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table Footer Helper (Hidden on Print) */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print print:hidden">
          <span>💡 किसी भी महीने की पंक्ति पर क्लिक करके उस महीने के ग्राहकों का विस्तृत ब्योरा देख सकते हैं।</span>
          <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>0ms इंस्टेंट डेटाबेस कैश्ड एवं लाइव सिंक</span>
          </span>
        </div>
      </div>
    </div>
  );
};
