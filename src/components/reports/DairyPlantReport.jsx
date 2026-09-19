import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Building2,
  Printer,
  Download,
  Search,
  Filter,
  Milk,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const DairyPlantReport = ({ initialPlant = 'HARIHAR DAIRY' }) => {
  const { dairySales, dairyCenters, rateMasterConfig } = useApp();
  const { farmProfile } = useAuth();

  // Get current date strings
  const today = new Date();
  const curYear = today.getFullYear();
  const curMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayIso = today.toISOString().split('T')[0];

  // Available unique dairy plants
  const availablePlants = useMemo(() => {
    const s = new Set();
    dairyCenters?.forEach(c => { if (c.name) s.add(c.name); });
    dairySales?.forEach(d => { if (d.dairyName) s.add(d.dairyName); });
    if (s.size === 0) s.add('HARIHAR DAIRY');
    return Array.from(s).sort();
  }, [dairyCenters, dairySales]);

  // Selected Plant: defaults to initialPlant or first plant or 'all'
  const [selectedPlant, setSelectedPlant] = useState(() => {
    if (availablePlants.includes(initialPlant)) return initialPlant;
    if (availablePlants.length > 0) return availablePlants[0];
    return 'HARIHAR DAIRY';
  });

  // Date Range State: default to current month 1st to today
  const [startDate, setStartDate] = useState(`${curYear}-${curMonth}-01`);
  const [endDate, setEndDate] = useState(todayIso);
  const [shiftFilter, setShiftFilter] = useState('all'); // 'all' | 'morning' | 'evening'
  const [milkTypeFilter, setMilkTypeFilter] = useState('all'); // 'all' | 'buffalo' | 'cow'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' (oldest first for bill) | 'desc'

  // Quick Preset Billing Cycles
  const handleSetCycle = (cycle) => {
    let ym = `${curYear}-${curMonth}`;
    if (startDate && startDate.includes('-')) {
      const parts = startDate.split('-');
      ym = `${parts[0]}-${parts[1]}`;
    }
    const [y, m] = ym.split('-');
    const daysInMonth = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();

    if (cycle === '1-10') {
      setStartDate(`${ym}-01`);
      setEndDate(`${ym}-10`);
    } else if (cycle === '11-20') {
      setStartDate(`${ym}-11`);
      setEndDate(`${ym}-20`);
    } else if (cycle === '21-end') {
      setStartDate(`${ym}-21`);
      setEndDate(`${ym}-${String(daysInMonth).padStart(2, '0')}`);
    } else if (cycle === 'month') {
      setStartDate(`${ym}-01`);
      setEndDate(`${ym}-${String(daysInMonth).padStart(2, '0')}`);
    } else if (cycle === 'today') {
      setStartDate(todayIso);
      setEndDate(todayIso);
    } else if (cycle === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered entries
  const filteredSales = useMemo(() => {
    return (dairySales || [])
      .filter(s => {
        // Plant filter
        if (selectedPlant !== 'all') {
          if ((s.dairyName || '').trim().toLowerCase() !== selectedPlant.trim().toLowerCase()) {
            return false;
          }
        }
        // Date range
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;

        // Shift filter
        if (shiftFilter !== 'all' && s.shift !== shiftFilter) return false;

        // Milk type
        if (milkTypeFilter !== 'all' && s.milkType !== milkTypeFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchSlip = (s.slipNo || '').toLowerCase().includes(q);
          const matchDate = (s.date || '').includes(q);
          const matchPlant = (s.dairyName || '').toLowerCase().includes(q);
          if (!matchSlip && !matchDate && !matchPlant) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          const dDiff = (a.date || '').localeCompare(b.date || '');
          if (dDiff !== 0) return dDiff;
          return (a.shift || '').localeCompare(b.shift || '');
        } else {
          const dDiff = (b.date || '').localeCompare(a.date || '');
          if (dDiff !== 0) return dDiff;
          return (b.shift || '').localeCompare(a.shift || '');
        }
      });
  }, [dairySales, selectedPlant, startDate, endDate, shiftFilter, milkTypeFilter, searchQuery, sortOrder]);

  // Grand Totals Calculations
  const grandTotals = useMemo(() => {
    let totalQty = 0;
    let totalAmt = 0;
    let totalFatPoints = 0;
    let totalSnfPoints = 0;
    let snfCount = 0;
    let morningQty = 0;
    let eveningQty = 0;
    let morningAmt = 0;
    let eveningAmt = 0;

    filteredSales.forEach(s => {
      const q = Number(s.quantity) || 0;
      const a = Number(s.totalAmount) || 0;
      const f = Number(s.fat) || 0;
      const snf = Number(s.snf) || 0;

      totalQty += q;
      totalAmt += a;
      totalFatPoints += (q * f);

      if (snf > 0) {
        totalSnfPoints += (q * snf);
        snfCount++;
      }

      if (s.shift === 'morning') {
        morningQty += q;
        morningAmt += a;
      } else {
        eveningQty += q;
        eveningAmt += a;
      }
    });

    const weightedAvgFat = totalQty > 0 ? (totalFatPoints / totalQty) : 0;
    const weightedAvgSnf = totalQty > 0 && snfCount > 0 ? (totalSnfPoints / totalQty) : 0;
    const avgRate = totalQty > 0 ? (totalAmt / totalQty) : 0;

    return {
      count: filteredSales.length,
      totalQty,
      totalAmt,
      weightedAvgFat,
      weightedAvgSnf,
      avgRate,
      morningQty,
      eveningQty,
      morningAmt,
      eveningAmt
    };
  }, [filteredSales]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredSales.length === 0) {
      alert('एक्सपोर्ट करने के लिए कोई रिकॉर्ड उपलब्ध नहीं है');
      return;
    }

    const headers = [
      'क्रमांक (S.No.)',
      'तारीख (Date)',
      'शिफ्ट (Shift)',
      'पर्ची नं (Slip No)',
      'डेयरी प्लांट (Dairy Plant)',
      'दूध प्रकार (Type)',
      'मात्रा लीटर (Qty L)',
      'फैट (FAT %)',
      'एसएनएफ (SNF %)',
      'दर प्रति लीटर (Rate ₹/L)',
      'कुल राशि (Total ₹)'
    ];

    const rows = filteredSales.map((s, idx) => [
      idx + 1,
      s.date,
      s.shift === 'morning' ? 'Morning' : 'Evening',
      `"${s.slipNo || ''}"`,
      `"${s.dairyName || selectedPlant}"`,
      s.milkType === 'buffalo' ? 'भैंस (Buffalo)' : 'गाय (Cow)',
      s.quantity,
      s.fat || '',
      s.snf || '',
      s.rate,
      s.totalAmount
    ]);

    // Grand total row
    rows.push([
      'कुल महायोग (Grand Total)',
      `${startDate || 'प्रारंभ'} से ${endDate || 'आज'}`,
      `${grandTotals.count} प्रविष्टियां`,
      '',
      `"${selectedPlant === 'all' ? 'सभी प्लांट' : selectedPlant}"`,
      '',
      grandTotals.totalQty.toFixed(1),
      grandTotals.weightedAvgFat.toFixed(2),
      grandTotals.weightedAvgSnf > 0 ? grandTotals.weightedAvgSnf.toFixed(2) : '',
      grandTotals.avgRate.toFixed(2),
      grandTotals.totalAmt
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPlant.replace(/\s+/g, '_')}_Milk_Report_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & ACTION BAR (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>डेयरी प्लांट (हरिहर डेयरी) दुग्ध आपूर्ति एवं बिल रिपोर्ट</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-xs font-bold">
                  Date to Date
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                तारीख-से-तारीख दुग्ध संकलन, पर्ची विवरण, औसत फैट व आधिकारिक बिल स्टेटमेंट
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>आधिकारिक बिल प्रिंट करें</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV डाउनलोड</span>
          </button>
        </div>
      </div>

      {/* 2. DATE-TO-DATE FILTER TOOLBAR (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print print:hidden">
        {/* Row 1: Plant + Date Range + Shift Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Plant Dropdown */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
              1. डेयरी प्लांट चुनें:
            </label>
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">🏢 सभी डेयरी प्लांट (All Dairies)</option>
              {availablePlants.map(p => (
                <option key={p} value={p}>🏢 {p}</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
              2. प्रारंभिक दिनांक (From Date):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
              3. अंतिम दिनांक (To Date):
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Shift Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
              4. शिफ्ट:
            </label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">🌅/🌇 सुबह व शाम (दोनों)</option>
              <option value="morning">🌅 केवल सुबह (Morning)</option>
              <option value="evening">🌇 केवल शाम (Evening)</option>
            </select>
          </div>

          {/* Search Slip */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
              5. पर्ची नं. खोजें:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="उदा. SLIP-2452..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Row 2: 10-Day Billing Cycle Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
            ⚡ त्वरित भुगतान चक्र (Billing Cycles):
          </span>
          <button
            type="button"
            onClick={() => handleSetCycle('1-10')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            📅 1 से 10 तारीख
          </button>
          <button
            type="button"
            onClick={() => handleSetCycle('11-20')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            📅 11 से 20 तारीख
          </button>
          <button
            type="button"
            onClick={() => handleSetCycle('21-end')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            📅 21 से माह अंत
          </button>
          <button
            type="button"
            onClick={() => handleSetCycle('month')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            🗓️ पूरा महीना
          </button>
          <button
            type="button"
            onClick={() => handleSetCycle('today')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            ☀️ केवल आज
          </button>
          <button
            type="button"
            onClick={() => handleSetCycle('all')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer ml-auto"
          >
            🔄 रीसेट (सभी रिकॉर्ड्स)
          </button>
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:bg-slate-200 transition-colors cursor-pointer"
            title="तारीख क्रम बदलें"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>{sortOrder === 'asc' ? 'तारीख: पुरानी पहले ↑' : 'तारीख: ताज़ा पहले ↓'}</span>
          </button>
        </div>
      </div>

      {/* 3. PRINT LETTERHEAD (Visible only on Print) */}
      <div className="hidden print:block mb-4 p-4 border-b-2 border-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-950 uppercase tracking-wide">
            {farmProfile?.farmName || 'SHIVAJI MILK CENTER'}
          </h1>
          <p className="text-xs text-slate-700 font-bold mt-1">
            {farmProfile?.tagline || 'शुद्ध एवं ताजा दूध, स्वस्थ परिवार'}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            स्थान: {farmProfile?.address || 'चकरोद, कालापीपल, मध्य प्रदेश'} | मो: {farmProfile?.phone || '8770234735'}
          </p>
          <div className="my-2 py-1 px-4 inline-block bg-slate-100 border border-slate-400 rounded-md font-black text-sm uppercase">
            दुग्ध प्रदाय बिल एवं आपूर्ति स्टेटमेंट (Dairy Plant Milk Supply Statement)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mt-3 pt-2 border-t border-slate-300">
          <div>
            <p><strong>प्रदायक फार्म:</strong> {farmProfile?.farmName || 'SHIVAJI MILK CENTER'}</p>
            <p><strong>संचालक:</strong> {farmProfile?.ownerName || 'SATISH PATIDAR'}</p>
            <p><strong>UPI आईडी:</strong> {farmProfile?.upiId || '8770234735@upi'}</p>
          </div>
          <div className="text-right">
            <p><strong>प्राप्तकर्ता डेयरी प्लांट:</strong> <span className="font-black text-sm">{selectedPlant === 'all' ? 'सभी डेयरी प्लांट' : selectedPlant}</span></p>
            <p><strong>बिल अवधि:</strong> {startDate || 'प्रारंभ'} से {endDate || 'आज तक'}</p>
            <p><strong>स्टेटमेंट दिनांक:</strong> {new Date().toLocaleDateString('hi-IN')}</p>
          </div>
        </div>
      </div>

      {/* 4. SUMMARY KPI CARDS (Both Screen & Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Liters */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">कुल दुग्ध आपूर्ति</span>
            <Milk className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-blue-950 dark:text-white">
              {grandTotals.totalQty.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Liters</span>
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-1 flex justify-between font-medium">
            <span>🌅 सुबह: {grandTotals.morningQty.toFixed(1)} L</span>
            <span>🌇 शाम: {grandTotals.eveningQty.toFixed(1)} L</span>
          </div>
        </div>

        {/* Weighted Average FAT */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/20 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">भारित औसत फैट (FAT)</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-indigo-950 dark:text-white">
              {grandTotals.weightedAvgFat.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">% FAT</span>
          </div>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1 font-medium">
            कुल प्रविष्टियां: <strong>{grandTotals.count} रिकॉर्ड्स</strong>
          </div>
        </div>

        {/* Average Rate */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">औसत प्रभावी दर</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-950 dark:text-white">
              ₹{grandTotals.avgRate.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">/ Liter</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
            मास्टर फैट दर: ₹{rateMasterConfig?.buffaloFatRate || 9.40}/FAT
          </div>
        </div>

        {/* Grand Total Amount */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 p-4 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">कुल देय राशि (Net Payable)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300">
              ₹{grandTotals.totalAmt.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex justify-between font-bold">
            <span>🌅 ₹{grandTotals.morningAmt.toLocaleString('en-IN')}</span>
            <span>🌇 ₹{grandTotals.eveningAmt.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 5. ITEMIZED CHRONOLOGICAL TABLE (WITH STICKY & PRINT GRAND TOTAL FOOTER) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            📋 दुग्ध प्रदाय दैनिक विवरण ({filteredSales.length} प्रविष्टियां — {startDate || 'प्रारंभ'} से {endDate || 'आज तक'})
          </span>
          <span className="text-[11px] text-slate-500 font-bold no-print print:hidden">
            प्लांट: {selectedPlant === 'all' ? 'सभी प्लांट' : selectedPlant}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto print:max-h-none print:overflow-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-black sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 text-center w-12">क्र.</th>
                <th className="p-3">तारीख (Date)</th>
                <th className="p-3 text-center">शिफ्ट</th>
                <th className="p-3">पर्ची नं. (Slip)</th>
                <th className="p-3">डेयरी प्लांट</th>
                <th className="p-3 text-center">प्रकार</th>
                <th className="p-3 text-right">मात्रा (L)</th>
                <th className="p-3 text-center">FAT %</th>
                <th className="p-3 text-center">SNF %</th>
                <th className="p-3 text-right">दर (₹/L)</th>
                <th className="p-3 text-right">कुल राशि (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-10 text-center text-slate-400">
                    चयनित दिनांक सीमा ({startDate} से {endDate}) और प्लांट ({selectedPlant}) के लिए कोई रिकॉर्ड उपलब्ध नहीं है।
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, idx) => (
                  <tr key={sale.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{sale.date}</td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        sale.shift === 'morning'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300'
                      }`}>
                        {sale.shift === 'morning' ? '🌅 Morning' : '🌇 Evening'}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {sale.slipNo || '-'}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {sale.dairyName || selectedPlant}
                    </td>
                    <td className="p-2.5 text-center text-[11px] whitespace-nowrap">
                      {sale.milkType === 'buffalo' ? '🐃 भैंस' : '🐄 गाय'}
                    </td>
                    <td className="p-2.5 text-right font-black text-slate-950 dark:text-white text-sm whitespace-nowrap">
                      {Number(sale.quantity || 0).toFixed(1)} L
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      {sale.fat ? `${Number(sale.fat).toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-500 whitespace-nowrap">
                      {sale.snf ? `${Number(sale.snf).toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      ₹{Number(sale.rate || 0).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-400 text-sm whitespace-nowrap">
                      ₹{Number(sale.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* GRAND TOTAL ROW IN TFOOT */}
            <tfoot className="bg-indigo-50/95 dark:bg-slate-800/95 text-slate-950 dark:text-white font-black border-t-2 border-indigo-300 dark:border-indigo-700 sticky bottom-0 z-10 shadow-lg">
              <tr className="border-b border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm">
                <td colSpan="6" className="p-3 text-indigo-950 dark:text-indigo-100 font-extrabold">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <span>कुल महायोग (GRAND TOTAL): {grandTotals.count} प्रविष्टियां</span>
                    <span className="text-[11px] font-normal text-slate-600 dark:text-slate-300 ml-2">
                      ({selectedPlant === 'all' ? 'सभी प्लांट' : selectedPlant})
                    </span>
                  </div>
                </td>
                <td className="p-3 text-right font-black text-slate-950 dark:text-white text-sm sm:text-base whitespace-nowrap">
                  {grandTotals.totalQty.toFixed(1)} L
                </td>
                <td className="p-3 text-center font-mono font-black text-blue-800 dark:text-blue-300 text-xs sm:text-sm whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700">
                    {grandTotals.weightedAvgFat.toFixed(2)}%
                  </span>
                </td>
                <td className="p-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {grandTotals.weightedAvgSnf > 0 ? `${grandTotals.weightedAvgSnf.toFixed(2)}%` : '-'}
                </td>
                <td className="p-3 text-right font-black text-indigo-950 dark:text-indigo-200 text-xs sm:text-sm whitespace-nowrap">
                  ₹{grandTotals.avgRate.toFixed(2)}/L
                </td>
                <td className="p-3 text-right font-black text-emerald-800 dark:text-emerald-300 text-base sm:text-lg whitespace-nowrap">
                  ₹{grandTotals.totalAmt.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. SIGNATURE BLOCK FOR OFFICIAL BILL (Visible on Print) */}
      <div className="hidden print:grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-slate-400 text-xs">
        <div className="text-center">
          <div className="h-16"></div>
          <p className="font-black text-sm text-slate-900 border-t border-slate-700 pt-1 inline-block px-8">
            अधिकृत हस्ताक्षर — दुग्ध उत्पादक
          </p>
          <p className="text-slate-600 font-bold mt-0.5">
            {farmProfile?.ownerName || 'SATISH PATIDAR'} ({farmProfile?.farmName || 'SHIVAJI MILK CENTER'})
          </p>
        </div>

        <div className="text-center">
          <div className="h-16"></div>
          <p className="font-black text-sm text-slate-900 border-t border-slate-700 pt-1 inline-block px-8">
            प्राप्तकर्ता हस्ताक्षर एवं सील
          </p>
          <p className="text-slate-600 font-bold mt-0.5">
            अधिकृत प्रतिनिधि ({selectedPlant === 'all' ? 'HARIHAR DAIRY PLANT' : selectedPlant})
          </p>
        </div>
      </div>

      {/* Print Footer Notice */}
      <div className="hidden print:block text-center text-[10px] text-slate-500 mt-6">
        यह चालान व बिल शिवाजी मिल्क सेंटर कंप्यूटराइज्ड डेयरी सिस्टम द्वारा स्वतः जनरेट किया गया है।
      </div>
    </div>
  );
};
