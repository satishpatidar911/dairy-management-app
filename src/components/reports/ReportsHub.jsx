import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle,
  Milk,
  Users,
  Receipt,
  Trophy,
  Search,
  X,
  Award
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

import { MonthWiseConclusionTable } from './MonthWiseConclusionTable';
import { CustomerDueMatrixReport } from './CustomerDueMatrixReport';

export const ReportsHub = () => {
  const { t } = useLanguage();
  const { milkEntries, expenses, customers, animals, stats } = useApp();
  const { farmProfile } = useAuth();

  const [reportType, setReportType] = useState('customer_due_matrix'); // customer_due_matrix, month_conclusion, daily_milk, customer_khata, expense_report, animal_performance
  const [dateRange, setDateRange] = useState('this_month');
  const [animalSearch, setAnimalSearch] = useState('');
  const [animalTypeFilter, setAnimalTypeFilter] = useState('all'); // 'all' | 'with_milk' | 'cow' | 'buffalo'

  // Animal performance ranking
  const animalPerformance = animals.map(animal => {
    const logs = milkEntries.filter(m => m.animalId === animal.tagNo || m.animalName === animal.name);
    const totalYield = logs.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    const avgYield = logs.length > 0 ? (totalYield / logs.length).toFixed(1) : 0;
    return {
      ...animal,
      totalYield: Number(totalYield.toFixed(1)),
      avgYield,
      entriesCount: logs.length
    };
  }).sort((a, b) => b.totalYield - a.totalYield);

  // Filtered performance list
  const filteredPerformance = animalPerformance.filter(animal => {
    if (animalTypeFilter === 'with_milk' && animal.totalYield <= 0) return false;
    if (animalTypeFilter === 'cow' && animal.type !== 'cow') return false;
    if (animalTypeFilter === 'buffalo' && animal.type !== 'buffalo') return false;
    if (animalSearch.trim()) {
      const q = animalSearch.toLowerCase().trim();
      return (
        (animal.name || '').toLowerCase().includes(q) ||
        (animal.tagNo || '').toLowerCase().includes(q) ||
        (animal.breed || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getRankBadge = (idx) => {
    if (idx === 0) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-amber-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/60 shrink-0">
          🥇
        </div>
      );
    }
    if (idx === 1) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900 shadow-md shadow-slate-400/20 ring-2 ring-slate-300/50 shrink-0">
          🥈
        </div>
      );
    }
    if (idx === 2) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-md shadow-orange-600/20 ring-2 ring-orange-500/40 shrink-0">
          🥉
        </div>
      );
    }
    if (idx < 10) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shrink-0">
          #{idx + 1}
        </div>
      );
    }
    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-semibold text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
        #{idx + 1}
      </div>
    );
  };

  const getCardStyle = (idx, hasYield) => {
    if (idx === 0 && hasYield) {
      return 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/60 dark:border-amber-500/50 shadow-md shadow-amber-500/5';
    }
    if (idx === 1 && hasYield) {
      return 'bg-gradient-to-r from-slate-400/10 via-transparent to-transparent border-slate-300 dark:border-slate-700 shadow-sm';
    }
    if (idx === 2 && hasYield) {
      return 'bg-gradient-to-r from-orange-500/10 via-transparent to-transparent border-orange-300 dark:border-orange-800/60 shadow-sm';
    }
    return 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700';
  };

  // CSV Export utility
  const exportToCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12 print:p-0 print:m-0 print:space-y-3">
      {/* PRINT-ONLY FORMAL DAIRY LETTERHEAD */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shrink-0">
              🥛
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-wide">
                {farmProfile?.farmName || 'SHIVAJI COMPUTER MILK'}
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
              डेयरी अधिकृत रिपोर्ट (OFFICIAL)
            </span>
            <p className="text-[11px] text-slate-600 mt-1 font-semibold">
              दिनांक: {new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              समय: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-300 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              {reportType === 'customer_due_matrix' && 'ग्राहक-वार माहवार बकाया मैट्रिक्स (Customer Due Report - gid: 857195182)'}
              {reportType === 'month_conclusion' && 'माह-वार सारांश सारणी रिपोर्ट (Month-Wise Conclusion Summary)'}
              {reportType === 'daily_milk' && 'दूध संकलन ऑडिट रिपोर्ट (Daily Milk Collection Audit Report)'}
              {reportType === 'customer_khata' && 'ग्राहक खाताबही एवं बकाया लेजर (Customer Ledger & Receivables)'}
              {reportType === 'expense_report' && 'फार्म खर्च ऑडिट रिपोर्ट (Farm Expense Audit Report)'}
              {reportType === 'animal_performance' && 'पशु दुग्ध उत्पादन रैंकिंग रिपोर्ट (Cattle Milk Yield Performance)'}
            </h2>
            <p className="text-[11px] text-slate-600">
              {reportType === 'customer_due_matrix' && 'माह-वार सभी ग्राहकों का देय व बकाया ब्योरा (Google Sheet Auto-Updating Due Pivot)'}
              {reportType === 'month_conclusion' && 'माह-वार कुल दूध (L), नकद प्राप्त व मासिक बकाया का आधिकारिक रिकॉर्ड'}
              {reportType === 'daily_milk' && `कुल रिकॉर्ड्स: ${milkEntries.length} | पशु एवं तारीख वार संकलन`}
              {reportType === 'customer_khata' && `कुल पंजीकृत ग्राहक: ${customers.length} | वर्तमान देय/बकाया विवरण`}
              {reportType === 'expense_report' && `कुल खर्च प्रविष्टियां: ${expenses.length} | श्रेणी वार खर्च ब्योरा`}
              {reportType === 'animal_performance' && `कुल पशु: ${animals.length} | कुल दूध उत्पादन अनुसार वरीयता क्रम`}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card no-print print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.reports.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Google Sheet & Excel Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer Due Matrix, Month-Wise Conclusion, Milk Production, Ledger & Cattle Performance Reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (प्रिंट करें)</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs (Hidden on Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print print:hidden">
        <button
          onClick={() => setReportType('customer_due_matrix')}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            reportType === 'customer_due_matrix'
              ? 'option-active-light'
              : 'option-inactive-dark'
          }`}
        >
          <CreditCard className="w-5 h-5 mb-1.5" />
          <h4 className="font-bold text-xs">Customer Due Matrix</h4>
          <p className="text-[10px] mt-0.5 opacity-80 font-medium">माहवार बकाया (Due Report)</p>
        </button>

        <button
          onClick={() => setReportType('month_conclusion')}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            reportType === 'month_conclusion'
              ? 'option-active-light'
              : 'option-inactive-dark'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 mb-1.5" />
          <h4 className="font-bold text-xs">Month Conclusion</h4>
          <p className="text-[10px] mt-0.5 opacity-80 font-medium">माह-वार सारांश सारणी</p>
        </button>

        <button
          onClick={() => setReportType('daily_milk')}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            reportType === 'daily_milk'
              ? 'option-active-light'
              : 'option-inactive-dark'
          }`}
        >
          <Milk className="w-5 h-5 mb-1.5" />
          <h4 className="font-bold text-xs">Milk Report (दूध)</h4>
          <p className="text-[10px] mt-0.5 opacity-80 font-medium">Daily & Monthly Yield</p>
        </button>

        <button
          onClick={() => setReportType('customer_khata')}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            reportType === 'customer_khata'
              ? 'option-active-light'
              : 'option-inactive-dark'
          }`}
        >
          <Users className="w-5 h-5 mb-1.5" />
          <h4 className="font-bold text-xs">Customer Ledger (खाता)</h4>
          <p className="text-[10px] mt-0.5 opacity-80 font-medium">Dues & Collections</p>
        </button>

        <button
          onClick={() => setReportType('expense_report')}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            reportType === 'expense_report'
              ? 'option-active-light'
              : 'option-inactive-dark'
          }`}
        >
          <Receipt className="w-5 h-5 mb-1.5" />
          <h4 className="font-bold text-xs">Expense Report (खर्च)</h4>
          <p className="text-[10px] mt-0.5 opacity-80 font-medium">Feed & Vet Bills</p>
        </button>

        <button
          onClick={() => setReportType('animal_performance')}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            reportType === 'animal_performance'
              ? 'option-active-light'
              : 'option-inactive-dark'
          }`}
        >
          <Trophy className="w-5 h-5 mb-1.5" />
          <h4 className="font-bold text-xs">Cattle Ranking</h4>
          <p className="text-[10px] mt-0.5 opacity-80 font-medium">Top Milking Animals</p>
        </button>
      </div>

      {/* REPORT CONTENT AREA */}
      {reportType === 'customer_due_matrix' ? (
        <CustomerDueMatrixReport />
      ) : reportType === 'month_conclusion' ? (
        <MonthWiseConclusionTable />
      ) : (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4 print:p-0 print:border-0 print:shadow-none">
        {/* REPORT 1: MILK REPORT */}
        {reportType === 'daily_milk' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print print:hidden">
              <h3 className="font-bold text-slate-800 text-sm">
                Milk Collection Audit (दूध संकलन रिपोर्ट)
              </h3>
              <button
                onClick={() => exportToCSV(milkEntries, 'Milk_Entries')}
                className="px-3 py-1.5 rounded-xl bg-dairy-50 hover:bg-dairy-100 text-dairy-800 text-xs font-bold flex items-center gap-1 no-print print:hidden cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV (डाउनलोड करें)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Date (तारीख)</th>
                    <th className="px-3 py-2.5">Shift (शिफ्ट)</th>
                    <th className="px-3 py-2.5">Tag (टैग)</th>
                    <th className="px-3 py-2.5">Name (नाम)</th>
                    <th className="px-3 py-2.5">Quantity (L)</th>
                    <th className="px-3 py-2.5">FAT %</th>
                    <th className="px-3 py-2.5">SNF %</th>
                    <th className="px-3 py-2.5">Rate (₹/L)</th>
                    <th className="px-3 py-2.5">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {milkEntries.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-600">{m.date}</td>
                      <td className="px-3 py-2.5">{m.shift === 'morning' ? 'Morning (सुबह)' : 'Evening (शाम)'}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{m.animalId}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">{m.animalName}</td>
                      <td className="px-3 py-2.5 font-black text-dairy-700">{m.quantity} L</td>
                      <td className="px-3 py-2.5">{m.fat}%</td>
                      <td className="px-3 py-2.5">{m.snf}%</td>
                      <td className="px-3 py-2.5">₹{m.rate}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">₹{Math.round(m.quantity * m.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 2: CUSTOMER KHATA */}
        {reportType === 'customer_khata' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print print:hidden">
              <h3 className="font-bold text-slate-800 text-sm">
                Customer Receivables & Ledger Summary (ग्राहक खाताबही एवं बकाया)
              </h3>
              <button
                onClick={() => exportToCSV(customers, 'Customer_Ledger')}
                className="px-3 py-1.5 rounded-xl bg-dairy-50 hover:bg-dairy-100 text-dairy-800 text-xs font-bold flex items-center gap-1 no-print print:hidden cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV (डाउनलोड करें)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Customer Name (ग्राहक का नाम)</th>
                    <th className="px-3 py-2.5">Mobile (मोबाइल)</th>
                    <th className="px-3 py-2.5">Address (पता)</th>
                    <th className="px-3 py-2.5">Daily Quota (दैनिक कोटा L)</th>
                    <th className="px-3 py-2.5">Rate (दर ₹/L)</th>
                    <th className="px-3 py-2.5">Advance (अग्रिम)</th>
                    <th className="px-3 py-2.5 text-right">Balance Due (बकाया)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-800">{c.name}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">{c.mobile}</td>
                      <td className="px-3 py-2.5 text-slate-500">{c.address}</td>
                      <td className="px-3 py-2.5 font-semibold">M: {c.morningQty}L + E: {c.eveningQty}L</td>
                      <td className="px-3 py-2.5 font-bold">₹{c.rate}</td>
                      <td className="px-3 py-2.5 text-emerald-700 font-semibold">₹{c.advance}</td>
                      <td className="px-3 py-2.5 text-right font-black text-rose-600 text-sm">₹{c.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 3: EXPENSE REPORT */}
        {reportType === 'expense_report' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print print:hidden">
              <h3 className="font-bold text-slate-800 text-sm">
                Farm Expense Audit (फार्म खर्च ऑडिट रिपोर्ट)
              </h3>
              <button
                onClick={() => exportToCSV(expenses, 'Expense_Report')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1 no-print print:hidden cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV (डाउनलोड करें)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Date (तारीख)</th>
                    <th className="px-3 py-2.5">Category (श्रेणी)</th>
                    <th className="px-3 py-2.5">Description (विवरण)</th>
                    <th className="px-3 py-2.5">Paid To (प्राप्तकर्ता)</th>
                    <th className="px-3 py-2.5">Method (माध्यम)</th>
                    <th className="px-3 py-2.5 text-right">Amount (राशि ₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-600">{e.date}</td>
                      <td className="px-3 py-2.5 uppercase font-bold text-[10px] text-slate-700">{e.category}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{e.title}</td>
                      <td className="px-3 py-2.5 text-slate-600">{e.payee || '-'}</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] uppercase">{e.paymentMethod}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-rose-600">₹{e.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 4: ANIMAL PERFORMANCE */}
        {reportType === 'animal_performance' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Top Milk Producing Herd (पशु दुग्ध उत्पादन रैंकिंग)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  दूध रिकॉर्ड्स के आधार पर उच्चतम उत्पादन देने वाले पशुओं की वरीयता सूची
                </p>
              </div>

              {/* Quick Search & Filters (Hidden on Print) */}
              <div className="flex items-center gap-2 flex-wrap no-print print:hidden">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={animalSearch}
                    onChange={(e) => setAnimalSearch(e.target.value)}
                    placeholder="पशु खोजें (नाम / टैग)..."
                    className="pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-52 font-medium"
                  />
                  {animalSearch && (
                    <button
                      onClick={() => setAnimalSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setAnimalTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      animalTypeFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    सभी ({animalPerformance.length})
                  </button>
                  <button
                    onClick={() => setAnimalTypeFilter('with_milk')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      animalTypeFilter === 'with_milk'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    दूध चालू ({animalPerformance.filter(a => a.totalYield > 0).length})
                  </button>
                  <button
                    onClick={() => setAnimalTypeFilter('cow')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      animalTypeFilter === 'cow'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    🐄 गाय
                  </button>
                  <button
                    onClick={() => setAnimalTypeFilter('buffalo')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      animalTypeFilter === 'buffalo'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    🐃 भैंस
                  </button>
                </div>
              </div>
            </div>

            {/* Screen Cards Grid (Hidden on Print) */}
            {filteredPerformance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                🔍 कोई पशु नहीं मिला (No cattle match current filter)
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:hidden">
                {filteredPerformance.map((animal) => {
                  const originalRank = animalPerformance.findIndex(a => a.id === animal.id);
                  return (
                    <div
                      key={animal.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-200 hover:shadow-md ${getCardStyle(originalRank, animal.totalYield > 0)}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getRankBadge(originalRank)}

                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                          {animal.type === 'cow' ? '🐄' : '🐃'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-wide truncate">
                              {animal.name}
                            </h4>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {animal.tagNo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {animal.type === 'cow' ? 'Cow (गाय)' : 'Buffalo (भैंस)'} • {animal.breed || 'Murrah'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {animal.totalYield > 0 ? (
                          <>
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-black text-xs sm:text-sm shadow-xs">
                              <span>🥛</span>
                              <span>{animal.totalYield} L</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-1">
                              Avg: {animal.avgYield} L/entry
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="inline-block px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-bold text-xs">
                              0 Liters
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 font-medium">
                              कोई रिकॉर्ड नहीं
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Print-Only High Density Cattle Ranking Table */}
            <table className="hidden print:table w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                  <th className="px-3 py-2 text-center w-12">रैंक (#)</th>
                  <th className="px-3 py-2">टैग नं (Tag)</th>
                  <th className="px-3 py-2">नाम (Name)</th>
                  <th className="px-3 py-2">प्रकार व नस्ल (Type/Breed)</th>
                  <th className="px-3 py-2 text-right">कुल उत्पादन (Total Yield)</th>
                  <th className="px-3 py-2 text-right">औसत (Avg Yield)</th>
                  <th className="px-3 py-2 text-center">प्रविष्टियां (Entries)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPerformance.map((animal, idx) => (
                  <tr key={animal.id}>
                    <td className="px-3 py-2 font-black text-center">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold">{animal.tagNo}</td>
                    <td className="px-3 py-2 font-bold">{animal.name}</td>
                    <td className="px-3 py-2">{animal.type === 'cow' ? 'गाय (Cow)' : 'भैंस (Buffalo)'} • {animal.breed || 'Murrah'}</td>
                    <td className="px-3 py-2 text-right font-black">{animal.totalYield} L</td>
                    <td className="px-3 py-2 text-right font-semibold">{animal.avgYield} L</td>
                    <td className="px-3 py-2 text-center">{animal.entriesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Print-Only Official Footer */}
      <div className="hidden print:flex justify-between items-center text-[10px] text-slate-500 pt-6 mt-8 border-t border-slate-300">
        <span>* यह एक कंप्यूटर जनरेटेड आधिकारिक रिपोर्ट है — {farmProfile?.farmName || 'SHIVAJI COMPUTER MILK'}</span>
        <span>हस्ताक्षर / प्राधिकृत मुहर (Authorized Signature): _______________________</span>
      </div>
    </div>
  );
};
