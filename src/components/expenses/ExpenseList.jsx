import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  CreditCard,
  Wheat,
  Syringe,
  Zap,
  Users,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { ExpenseFormModal } from './ExpenseFormModal';

export const ExpenseList = () => {
  const { t } = useLanguage();
  const { expenses, deleteExpense, stats } = useApp();
  const { currentUser } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'fodder':
      case 'feed':
        return <Wheat className="w-4 h-4 text-amber-600" />;
      case 'medicine':
        return <Syringe className="w-4 h-4 text-rose-600" />;
      case 'labor':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'utility':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadge = (category) => {
    const labels = {
      fodder: 'Green & Dry Fodder (चारा व भूसा)',
      feed: 'Cattle Feed (दाना व खल)',
      medicine: 'Veterinary (दवाई व डॉक्टर)',
      labor: 'Labor & Wages (मजदूरी)',
      utility: 'Utility (बिजली व पानी)',
      animalPurchase: 'Animal Purchase (पशु खरीद)',
      equipment: 'Equipment (उपकरण)',
      other: 'Other (अन्य)'
    };
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
        {labels[category] || category}
      </span>
    );
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.payee && e.payee.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.date.includes(searchQuery);

    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.expenses.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
              Total Expenses (कुल खर्च): ₹{stats.totalExpensesMonth.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Green/Dry Fodder, Cattle Feed, Vet Bills, Wages, Electricity & Farm Maintenance
          </p>
        </div>

        {currentUser.role !== ROLES.WORKER && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.expenses.addExpense}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title, date, or vendor (खर्च विवरण, तारीख या दुकानदार खोजें)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All (सभी)' },
              { id: 'fodder', label: '🌾 Fodder (चारा/भूसा)' },
              { id: 'feed', label: '🥣 Feed (दाना/खल)' },
              { id: 'medicine', label: '🩺 Vet (दवाई)' },
              { id: 'labor', label: '👷 Wages (मजदूरी)' },
              { id: 'utility', label: '⚡ Utility (बिजली/पानी)' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Date (तारीख)</th>
                <th className="px-4 py-3">Category (श्रेणी)</th>
                <th className="px-4 py-3">Description (विवरण)</th>
                <th className="px-4 py-3">Paid To / Vendor (प्राप्तकर्ता)</th>
                <th className="px-4 py-3">Mode (माध्यम)</th>
                <th className="px-4 py-3">Amount (राशि ₹)</th>
                <th className="px-4 py-3 text-right">Action (कार्य)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{expense.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {getCategoryIcon(expense.category)}
                      {getCategoryBadge(expense.category)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {expense.title}
                    {expense.notes && <p className="text-[11px] text-slate-400 font-normal mt-0.5">{expense.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{expense.payee || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] uppercase font-bold text-slate-700">
                      {expense.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-extrabold text-rose-600 text-sm">
                    ₹{expense.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {currentUser.role === ROLES.ADMIN && (
                      <button
                        onClick={() => {
                          if (confirm(`Do you want to delete this expense entry?`)) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Total Entries (कुल प्रविष्टियां): {filteredExpenses.length}</span>
          <span>Filtered Total (चयनित खर्चों का योग): <strong className="text-rose-600 text-sm font-extrabold">₹{totalFilteredAmount.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* Modal */}
      {isFormOpen && (
        <ExpenseFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};
