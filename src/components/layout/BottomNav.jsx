import React from 'react';
import {
  LayoutDashboard,
  Milk,
  Truck,
  HeartPulse,
  Users,
  Smartphone,
  Layers
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const BottomNav = ({ activeTab, setActiveTab, onOpenMore }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { isDark } = useApp();

  if (currentUser.role === ROLES.WORKER) {
    return (
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t lg:hidden shadow-android pb-safe transition-colors no-print print:hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center justify-around h-16 px-2">
          <button
            onClick={() => setActiveTab('worker')}
            className={`flex flex-col items-center justify-center flex-1 py-1 ${
              activeTab === 'worker' ? (isDark ? 'text-emerald-400 font-bold' : 'text-dairy-600 font-bold') : (isDark ? 'text-slate-400' : 'text-slate-500')
            }`}
          >
            <Smartphone className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Quick Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('milk')}
            className={`flex flex-col items-center justify-center flex-1 py-1 ${
              activeTab === 'milk' ? (isDark ? 'text-emerald-400 font-bold' : 'text-dairy-600 font-bold') : (isDark ? 'text-slate-400' : 'text-slate-500')
            }`}
          >
            <Milk className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Milk Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('animals')}
            className={`flex flex-col items-center justify-center flex-1 py-1 ${
              activeTab === 'animals' ? (isDark ? 'text-emerald-400 font-bold' : 'text-dairy-600 font-bold') : (isDark ? 'text-slate-400' : 'text-slate-500')
            }`}
          >
            <HeartPulse className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Cattle List</span>
          </button>
        </div>
      </nav>
    );
  }

  const items = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'milk', label: 'MILK ENTRY', icon: Milk },
    { id: 'selling', label: 'MILK SALES', icon: Truck },
    { id: 'customers', label: 'CUSTOMERS', icon: Users },
    { id: 'more', label: 'MORE', icon: Layers, isAction: true },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t lg:hidden shadow-android pb-safe transition-colors no-print print:hidden ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
    }`}>
      <div className="flex items-center justify-around h-16 px-1">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isAction) {
                  onOpenMore();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive 
                  ? (isDark ? 'text-emerald-400 font-black' : 'text-dairy-600 font-black') 
                  : (isDark ? 'text-slate-400 hover:text-slate-200 font-bold' : 'text-slate-500 hover:text-slate-700 font-bold')
              }`}
            >
              <div className={`relative p-1 rounded-xl ${
                isActive 
                  ? (isDark ? 'bg-emerald-950/80 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-dairy-50 text-dairy-600') 
                  : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider leading-tight mt-0.5 truncate max-w-[70px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
