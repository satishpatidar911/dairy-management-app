import React, { useState } from 'react';
import {
  LineChart as ChartIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Calendar,
  PieChart as PieChartIcon,
  ShieldCheck,
  Percent,
  Sparkles
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

export const ProfitLoss = () => {
  const { t } = useLanguage();
  const { stats, expenses, milkEntries, cattleSales } = useApp();

  const [timeframe, setTimeframe] = useState('monthly'); // 'daily' | 'monthly' | 'yearly'

  // Cattle sales income
  const cattleSalesIncome = (cattleSales || []).reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);

  // Feed vs Non-feed costs
  const feedExpenses = expenses
    .filter(e => e.category === 'feed' || e.category === 'fodder')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const vetExpenses = expenses
    .filter(e => e.category === 'medicine')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const laborExpenses = expenses
    .filter(e => e.category === 'labor')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const utilityExpenses = expenses
    .filter(e => e.category === 'utility')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const otherExpenses = expenses
    .filter(e => !['feed', 'fodder', 'medicine', 'labor', 'utility'].includes(e.category))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalRevenue = (stats.totalMilkRevenue || 65000) + cattleSalesIncome;
  const totalExpenses = stats.totalExpensesMonth;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Feed to revenue ratio (Ideal < 60%)
  const feedRatio = totalRevenue > 0 ? ((feedExpenses / totalRevenue) * 100).toFixed(1) : 0;

  // Monthly comparison for bar chart
  const monthlyFinancials = [
    { month: 'Jan', revenue: 58000, expense: 32000, profit: 26000 },
    { month: 'Feb', revenue: 62000, expense: 34000, profit: 28000 },
    { month: 'Mar', revenue: 65000, expense: 36000, profit: 29000 },
    { month: 'Apr', revenue: 71000, expense: 39000, profit: 32000 },
    { month: 'May', revenue: 68000, expense: 38000, profit: 30000 },
    { month: 'Current', revenue: totalRevenue, expense: totalExpenses, profit: netProfit },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.accounts.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              Net Margin (शुद्ध मार्जिन): {profitMargin}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Milk Revenue, Feed/Fodder/Labor Expenses & Net Profit-Loss Analysis
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          <span>Print P&L Statement (स्टेटमेंट प्रिंट करें)</span>
        </button>
      </div>

      {/* 3 Large KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-5 rounded-2xl shadow-lg">
          <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
            {t.accounts.totalRevenue}
          </span>
          <div className="mt-2 text-3xl font-black">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            Total Milk Recorded: {stats.totalMilkVolume} Liters
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-rose-700 to-rose-900 text-white p-5 rounded-2xl shadow-lg">
          <span className="text-[11px] font-bold text-rose-200 uppercase tracking-wider">
            {t.accounts.totalExpenditure}
          </span>
          <div className="mt-2 text-3xl font-black">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-rose-100 mt-1">
            Feed, Fodder, Medicines & Labor Wages
          </p>
        </div>

        {/* Net Profit / Loss */}
        <div className={`p-5 rounded-2xl shadow-lg text-white ${netProfit >= 0 ? 'bg-gradient-to-br from-dairy-700 to-slate-900' : 'bg-gradient-to-br from-red-700 to-slate-900'}`}>
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            {t.accounts.netProfit}
          </span>
          <div className="mt-2 text-3xl font-black text-dairy-300">
            ₹{netProfit.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Profit Margin (लाभ प्रतिशत): <strong>{profitMargin}%</strong>
          </p>
        </div>
      </div>

      {/* Commercial Dairy Efficiency Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          📊 Farm Financial Health & Ratios (वित्तीय स्वास्थ्य)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Feed-to-Milk Ratio (दाना-चारा लागत अनुपात)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-xl font-extrabold ${Number(feedRatio) <= 60 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {feedRatio}%
              </span>
              <span className="text-[10px] text-slate-400"> (Standard: &lt; 60%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {Number(feedRatio) <= 60 ? '✓ Healthy Profit Margin' : '⚠️ Feed cost needs control'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Average Milk Price (औसत दूध बिक्री मूल्य)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-800">
                ₹{stats.totalMilkVolume > 0 ? (totalRevenue / stats.totalMilkVolume).toFixed(1) : 60}/L
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Retail & Dairy Collection Avg Rate</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Avg Monthly Profit / Cattle (प्रति पशु लाभ)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-emerald-700">
                ₹{stats.totalAnimals > 0 ? Math.round(netProfit / stats.totalAnimals).toLocaleString('en-IN') : 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Based on {stats.totalAnimals} herd strength</p>
          </div>
        </div>
      </div>

      {/* Monthly Financial Trends Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Monthly Revenue vs Expenses Trend (मासिक आमदनी बनाम खर्च)
            </h3>
            <p className="text-xs text-slate-500">6-Month Financial Summary</p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFinancials} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="revenue" name="Total Revenue (कुल आमदनी)" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Total Expenses (कुल खर्च)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit (शुद्ध लाभ)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
