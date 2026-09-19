import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  IndianRupee,
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3
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

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1-YeMwL36BtMSzMvlbJs8xm3CHWpsm7SsFfRQPlK6-8E/edit?gid=857195182#gid=857195182';
const GID = '857195182';

export const CustomerDueMatrixReport = () => {
  const { farmProfile } = useAuth();
  const { customerSales, customerTransactions } = useApp();

  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [dataSource, setDataSource] = useState('sheet'); // 'sheet' | 'computed'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'due' | 'clear' | 'advance'
  const [sortField, setSortField] = useState('due_desc'); // 'due_desc' | 'due_asc' | 'name_asc' | 'name_desc'
  const [showChart, setShowChart] = useState(true);

  // Cached matrix state
  const [matrixData, setMatrixData] = useState(() => {
    try {
      const saved = localStorage.getItem('dairy_customer_due_matrix');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      monthColumns: [
        'March-2026',
        'April-2026',
        'May-2026',
        'June-2026',
        'July-2026',
        'August-2026',
        'September-2026'
      ],
      rows: [],
      summaryRow: null
    };
  });

  // 1. Fetch live matrix from Google Sheet tab gid=857195182
  const fetchSheetMatrix = async () => {
    setLoading(true);
    try {
      const sheetUrl = localStorage.getItem('googleSheetUrl') || DEFAULT_SHEET_URL;
      const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = idMatch ? decodeURIComponent(idMatch[1]) : '1-YeMwL36BtMSzMvlbJs8xm3CHWpsm7SsFfRQPlK6-8E';
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${GID}`;

      let res = await fetch(exportUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${GID}`;
        res = await fetch(gvizUrl);
      }

      if (res.ok) {
        const csv = await res.text();
        const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);

        if (lines.length >= 2) {
          const header = lines[1].split(',').map(h => h.trim());
          const monthCols = header.slice(1, -1);

          const rows = [];
          let summary = null;

          for (let i = 2; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            const name = parts[0];
            if (!name) continue;

            const dues = {};
            monthCols.forEach((m, idx) => {
              dues[m] = parseFloat(parts[idx + 1]) || 0;
            });
            const grandTotal = parseFloat(parts[parts.length - 1]) || 0;

            if (name.toLowerCase() === 'grand total') {
              summary = {
                name: 'Grand Total (कुल योग)',
                dues,
                grandTotal
              };
            } else {
              rows.push({
                name,
                dues,
                grandTotal
              });
            }
          }

          const parsedData = {
            monthColumns: monthCols,
            rows,
            summaryRow: summary
          };

          setMatrixData(parsedData);
          localStorage.setItem('dairy_customer_due_matrix', JSON.stringify(parsedData));
          setLastSyncTime(new Date());
          setDataSource('sheet');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Google Sheet live matrix fetch warning:', err);
    }

    // Fallback: Compute dynamically from local database if sheet fetch fails
    computeLocalMatrix();
    setLoading(false);
  };

  // 2. Compute from local sales & transactions as fallback
  const computeLocalMatrix = () => {
    if (!customerSales || customerSales.length === 0) return;

    const monthSet = new Set();
    const custMap = {};

    customerSales.forEach(s => {
      const name = (s.customerName || 'ग्राहक').trim();
      const m = (s.date || '').slice(0, 7);
      if (!m) return;
      monthSet.add(m);

      if (!custMap[name]) custMap[name] = {};
      custMap[name][m] = (custMap[name][m] || 0) + Number(s.amount || 0);
    });

    (customerTransactions || []).filter(t => t.type === 'payment_received').forEach(p => {
      const name = (p.customerName || 'ग्राहक').trim();
      const m = (p.date || '').slice(0, 7);
      if (!m) return;
      monthSet.add(m);

      if (!custMap[name]) custMap[name] = {};
      custMap[name][m] = (custMap[name][m] || 0) - Number(p.amount || 0);
    });

    const sortedMonths = [...monthSet].sort();
    const monthCols = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-');
    });

    const rows = [];
    const colTotals = {};
    monthCols.forEach(m => { colTotals[m] = 0; });
    let grandTotalSum = 0;

    Object.entries(custMap).forEach(([name, mObj]) => {
      const dues = {};
      let custTotal = 0;

      sortedMonths.forEach((mKey, idx) => {
        const colLabel = monthCols[idx];
        const val = Math.round((mObj[mKey] || 0) * 100) / 100;
        dues[colLabel] = val;
        custTotal += val;
        colTotals[colLabel] = (colTotals[colLabel] || 0) + val;
      });

      grandTotalSum += custTotal;
      rows.push({
        name,
        dues,
        grandTotal: Math.round(custTotal * 100) / 100
      });
    });

    const parsedData = {
      monthColumns: monthCols,
      rows,
      summaryRow: {
        name: 'Grand Total (कुल योग)',
        dues: colTotals,
        grandTotal: Math.round(grandTotalSum * 100) / 100
      }
    };

    setMatrixData(parsedData);
    setDataSource('computed');
    setLastSyncTime(new Date());
  };

  useEffect(() => {
    fetchSheetMatrix();
  }, []);

  // 3. Filtered & Sorted Customer Rows
  const filteredRows = useMemo(() => {
    let list = [...(matrixData.rows || [])];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(r => r.name.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter === 'due') {
      list = list.filter(r => r.grandTotal > 0.05);
    } else if (statusFilter === 'clear') {
      list = list.filter(r => Math.abs(r.grandTotal) <= 0.05);
    } else if (statusFilter === 'advance') {
      list = list.filter(r => r.grandTotal < -0.05);
    }

    // Sort
    list.sort((a, b) => {
      if (sortField === 'due_desc') return b.grandTotal - a.grandTotal;
      if (sortField === 'due_asc') return a.grandTotal - b.grandTotal;
      if (sortField === 'name_asc') return a.name.localeCompare(b.name);
      if (sortField === 'name_desc') return b.name.localeCompare(a.name);
      return 0;
    });

    return list;
  }, [matrixData.rows, searchTerm, statusFilter, sortField]);

  // 4. Summary Stats Calculation
  const stats = useMemo(() => {
    const rows = matrixData.rows || [];
    const totalDues = rows.filter(r => r.grandTotal > 0.05).reduce((sum, r) => sum + r.grandTotal, 0);
    const totalAdvance = rows.filter(r => r.grandTotal < -0.05).reduce((sum, r) => sum + Math.abs(r.grandTotal), 0);
    const dueCount = rows.filter(r => r.grandTotal > 0.05).length;
    const clearCount = rows.filter(r => Math.abs(r.grandTotal) <= 0.05).length;
    const advanceCount = rows.filter(r => r.grandTotal < -0.05).length;

    // Current month due
    const currentMonth = matrixData.monthColumns?.[matrixData.monthColumns.length - 1];
    const currentMonthDue = currentMonth && matrixData.summaryRow?.dues?.[currentMonth] !== undefined
      ? matrixData.summaryRow.dues[currentMonth]
      : rows.reduce((s, r) => s + (r.dues?.[currentMonth] || 0), 0);

    return {
      netTotalDue: matrixData.summaryRow?.grandTotal !== undefined ? matrixData.summaryRow.grandTotal : (totalDues - totalAdvance),
      totalDues,
      totalAdvance,
      dueCount,
      clearCount,
      advanceCount,
      currentMonth,
      currentMonthDue
    };
  }, [matrixData]);

  // 5. Chart Data Preparation
  const chartData = useMemo(() => {
    if (!matrixData.summaryRow?.dues || !matrixData.monthColumns) return [];
    return matrixData.monthColumns.map(m => ({
      month: m.replace('-2026', '').replace('-2025', ''),
      fullMonth: m,
      due: Math.max(0, Math.round(matrixData.summaryRow.dues[m] || 0)),
      advance: matrixData.summaryRow.dues[m] < 0 ? Math.abs(Math.round(matrixData.summaryRow.dues[m])) : 0
    }));
  }, [matrixData]);

  // 6. CSV Export
  const exportMatrixCSV = () => {
    if (!matrixData.rows.length) return;
    const months = matrixData.monthColumns || [];
    const headers = ['CUSTOMER NAME', ...months, 'Grand Total'];

    const dataLines = matrixData.rows.map(r => {
      const vals = months.map(m => r.dues[m] !== undefined ? r.dues[m] : 0);
      return [`"${r.name}"`, ...vals, r.grandTotal].join(',');
    });

    if (matrixData.summaryRow) {
      const sVals = months.map(m => matrixData.summaryRow.dues[m] || 0);
      dataLines.push([`"Grand Total (कुल योग)"`, ...sVals, matrixData.summaryRow.grandTotal].join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...dataLines].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_Due_Matrix_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '-';
    if (Math.abs(val) < 0.01) return '-';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-5 pb-12 print:p-0 print:m-0 print:space-y-3">
      {/* 🏛️ PRINT-ONLY FORMAL DAIRY LETTERHEAD */}
      <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shrink-0">
              🥛
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-wide">
                {farmProfile?.farmName || 'SHIVAJI MILK CENTER'}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {farmProfile?.tagline || 'शुद्ध एवं ताजा दूध, स्वस्थ परिवार'}
              </p>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                संचालक: <strong>{farmProfile?.ownerName || 'सतीश पाटीदार'}</strong> • मो: <strong>{farmProfile?.phone || '8770234735'}</strong> • {farmProfile?.address || 'चकरोद कालापीपल'}
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold border border-slate-300">
              माह-वार ग्राहक बकाया रिपोर्ट (OFFICIAL)
            </span>
            <p className="text-[11px] text-slate-600 mt-1 font-semibold">
              दिनांक: {new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              समय: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              ग्राहक-वार माहवार बकाया भुगतान मैट्रिक्स (Customer Monthly Due Report)
            </h2>
            <p className="text-[11px] text-slate-600">
              कुल पंजीकृत ग्राहक: {matrixData.rows.length} | कुल देय बकाया: ₹{Math.round(stats.netTotalDue).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* 🟢 Screen Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              📊
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Auto-Updating Customer Due Report
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700/50">
                  {dataSource === 'sheet' ? 'Google Sheet Tab (gid: 857195182)' : 'Local App DB'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ग्राहक-वार माहवार बकाया भुगतान व लेजर मैट्रिक्स (March 2026 से September 2026)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchSheetMatrix}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Google Sheet से ताज़ा डेटा सिंक करें"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{loading ? 'सिंक हो रहा है...' : 'Live Sync'}</span>
          </button>

          <button
            onClick={exportMatrixCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 📊 KPI Metric Cards (Hidden on Print) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print print:hidden">
        {/* Total Outstanding Dues */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">कुल बकाया राशि (Total Due)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
              ₹{Math.round(stats.netTotalDue).toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.dueCount} ग्राहकों पर कुल बकाया
          </p>
        </div>

        {/* Current Month Due */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {stats.currentMonth || 'September'} बकाया
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              📅
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ₹{Math.round(stats.currentMonthDue).toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            चालू माह का कुल लंबित बिल
          </p>
        </div>

        {/* Customers Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">कुल पंजीकृत ग्राहक</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              👥
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {matrixData.rows.length}
            </h3>
            <span className="text-xs text-slate-500">ग्राहक</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.dueCount} बकाया • {stats.clearCount} चुकता • {stats.advanceCount} अग्रिम
          </p>
        </div>

        {/* Total Advance */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">अग्रिम जमा (Advance)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{Math.round(stats.totalAdvance).toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.advanceCount} ग्राहकों की अग्रिम जमा राशि
          </p>
        </div>
      </div>

      {/* 📈 Visual Monthly Dues Trend Chart (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print print:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              माह-वार कुल बकाया राशि का चार्ट (Monthly Due Trend)
            </h4>
          </div>
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
          >
            {showChart ? 'चार्ट छिपाएं' : 'चार्ट दिखाएं'}
            {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showChart && chartData.length > 0 && (
          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'बकाया राशि']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Bar dataKey="due" fill="#6366F1" radius={[6, 6, 0, 0]} name="बकाया राशि (Due)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 🔍 Search, Filter & Sort Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print print:hidden">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ग्राहक का नाम खोजें (Search Customer Name)..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            सभी ({matrixData.rows.length})
          </button>

          <button
            onClick={() => setStatusFilter('due')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'due'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
            }`}
          >
            केवल बकाया ({stats.dueCount})
          </button>

          <button
            onClick={() => setStatusFilter('clear')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'clear'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
            }`}
          >
            चुकता ({stats.clearCount})
          </button>

          <button
            onClick={() => setStatusFilter('advance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'advance'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50 hover:bg-teal-100'
            }`}
          >
            अग्रिम ({stats.advanceCount})
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 shrink-0">क्रमबद्ध:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="due_desc">सर्वाधिक बकाया पहले (Highest Due)</option>
            <option value="due_asc">कम बकाया पहले (Lowest Due)</option>
            <option value="name_asc">ग्राहक नाम (A to Z)</option>
            <option value="name_desc">ग्राहक नाम (Z to A)</option>
          </select>
        </div>
      </div>

      {/* 📋 THE MAIN PIVOT MATRIX TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead className="sticky top-0 z-20 bg-slate-900 text-white">
              <tr>
                {/* Fixed Customer Column */}
                <th className="py-3.5 px-4 font-black uppercase tracking-wider sticky left-0 z-30 bg-slate-900 min-w-[200px] border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  CUSTOMER NAME (ग्राहक का नाम)
                </th>

                {/* Dynamic Month Columns */}
                {(matrixData.monthColumns || []).map((month) => (
                  <th
                    key={month}
                    className="py-3.5 px-3 font-black text-right whitespace-nowrap min-w-[110px] border-r border-slate-800/60"
                  >
                    {month}
                  </th>
                ))}

                {/* Fixed Grand Total Column */}
                <th className="py-3.5 px-4 font-black text-right uppercase tracking-wider sticky right-0 z-30 bg-slate-950 min-w-[130px] border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  Grand Total (कुल बकाया)
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={(matrixData.monthColumns?.length || 0) + 2}
                    className="py-12 text-center text-slate-400 font-semibold"
                  >
                    {loading ? 'डेटा लोड हो रहा है...' : 'कोई ग्राहक प्रविष्टि नहीं मिली (No customers found)'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isPositiveDue = row.grandTotal > 0.05;
                  const isAdvance = row.grandTotal < -0.05;

                  return (
                    <tr
                      key={row.name + idx}
                      className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      {/* Customer Name Cell (Sticky Left) */}
                      <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-100 sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[170px]" title={row.name}>
                            {row.name}
                          </span>
                        </div>
                      </td>

                      {/* Month Dues Cells */}
                      {(matrixData.monthColumns || []).map((month) => {
                        const val = row.dues?.[month];
                        const hasDue = val > 0.05;
                        const hasAdv = val < -0.05;

                        return (
                          <td
                            key={month}
                            className={`py-2.5 px-3 text-right whitespace-nowrap font-mono border-r border-slate-100 dark:border-slate-800/40 ${
                              hasDue
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : hasAdv
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          >
                            {formatCurrency(val)}
                          </td>
                        );
                      })}

                      {/* Grand Total Cell (Sticky Right) */}
                      <td
                        className={`py-2.5 px-4 text-right font-black font-mono sticky right-0 z-10 bg-inherit border-l border-slate-200 dark:border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap ${
                          isPositiveDue
                            ? 'text-rose-600 dark:text-rose-400'
                            : isAdvance
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {formatCurrency(row.grandTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Summary Row */}
            {matrixData.summaryRow && (
              <tfoot className="sticky bottom-0 z-20 bg-slate-950 text-white font-black border-t-2 border-slate-800 shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.3)]">
                <tr>
                  <td className="py-3.5 px-4 uppercase sticky left-0 z-30 bg-slate-950 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                    Grand Total (कुल योग)
                  </td>

                  {(matrixData.monthColumns || []).map((month) => {
                    const totalVal = matrixData.summaryRow.dues?.[month] || 0;
                    return (
                      <td
                        key={month}
                        className="py-3.5 px-3 text-right font-mono border-r border-slate-800/80 whitespace-nowrap text-amber-300"
                      >
                        ₹{Math.round(totalVal).toLocaleString('en-IN')}
                      </td>
                    );
                  })}

                  <td className="py-3.5 px-4 text-right font-mono sticky right-0 z-30 bg-slate-950 border-l border-slate-800 text-rose-400 text-sm shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)] whitespace-nowrap">
                    ₹{Math.round(matrixData.summaryRow.grandTotal || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1 no-print print:hidden">
        <div>
          कुल प्रविष्टियाँ: <strong>{filteredRows.length}</strong> / {matrixData.rows.length} ग्राहक
          {lastSyncTime && (
            <span className="ml-3 text-[11px] text-slate-400">
              अंतिम सिंक: {lastSyncTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> बकाया (Pending Due)
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ml-2" /> अग्रिम (Advance)
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block ml-2" /> चुकता (Clear)
        </div>
      </div>
    </div>
  );
};
