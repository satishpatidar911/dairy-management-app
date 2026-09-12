import React, { useState } from 'react';
import { 
  Bell, 
  Languages, 
  UserCheck, 
  Menu, 
  X, 
  PlusCircle, 
  Sparkles,
  ShieldAlert,
  ChevronDown,
  Settings,
  Edit2,
  Moon,
  Sun,
  RefreshCw,
  Link2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { GoogleFormSyncModal } from '../customers/GoogleFormSyncModal';

export const Navbar = ({ 
  isSidebarOpen,
  onToggleSidebar, 
  onOpenQuickEntry, 
  onToggleNotifications, 
  isNotificationOpen,
  onOpenFarmSettings
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { currentUser, farmProfile, switchRole, logout, isLoginEnabled } = useAuth();
  const { alerts, isDark, toggleTheme, reloadFromDatabase } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isDbSyncing, setIsDbSyncing] = useState(false);
  const [dbSyncSuccess, setDbSyncSuccess] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);

  const handleDatabaseSync = async (e) => {
    e.stopPropagation();
    if (isDbSyncing) return;
    setIsDbSyncing(true);
    setDbSyncSuccess(false);
    try {
      if (reloadFromDatabase) {
        await reloadFromDatabase(true);
      }
      setDbSyncSuccess(true);
      setTimeout(() => {
        setDbSyncSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Database reload error:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return isDark ? 'bg-amber-950/80 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300';
      case ROLES.MANAGER:
        return isDark ? 'bg-blue-950/80 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300';
      case ROLES.WORKER:
        return isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <header className={`sticky top-0 z-30 transition-colors border-b no-print print:hidden ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left Side: Brand and Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl border shadow-xs focus:outline-none transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              !isSidebarOpen 
                ? isDark ? 'bg-dairy-950/60 border-dairy-700 text-dairy-400' : 'bg-dairy-50 border-dairy-300 text-dairy-800'
                : isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-dairy-50'
            }`}
            aria-label="Toggle navigation menu"
            title={isSidebarOpen ? "मेनू छुपाएं (Hide Menu)" : "मेनू खोलें (Open Menu)"}
          >
            <Menu className="w-5 h-5 text-current" />
            <span className="hidden md:inline text-xs font-black tracking-wide">
              {isSidebarOpen ? "MAIN MENU" : "OPEN MENU"}
            </span>
          </button>

          <div 
            onClick={onOpenFarmSettings}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 group transition-all"
            title="Edit Farm Profile / फार्म प्रोफाइल बदलें"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-dairy-700 to-dairy-500 flex items-center justify-center text-white shadow-md shadow-dairy-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">🥛</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`font-black text-sm sm:text-base tracking-tight leading-tight group-hover:text-dairy-400 transition-colors flex items-center gap-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span>{farmProfile?.farmName || t.appName}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
                <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isDark ? 'bg-dairy-950 text-dairy-400 border border-dairy-800' : 'bg-dairy-100 text-dairy-800'
                }`}>
                  PRO
                </span>
              </div>
              <p className={`text-[11px] hidden md:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {farmProfile?.ownerName ? `${farmProfile.ownerName} • ` : ''}{farmProfile?.tagline || 'Smart Dairy Management'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action, Settings, Language, Role Switcher, Alerts */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* ⭐ DATABASE LINK & SYNC BUTTON (सबसे ऊपर Top Navbar में) */}
          <div className="flex items-center shadow-xs">
            <button
              onClick={handleDatabaseSync}
              disabled={isDbSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl text-xs font-black transition-all active:scale-95 cursor-pointer border ${
                dbSyncSuccess
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30'
                  : isDark
                    ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-700 text-emerald-300 shadow-emerald-950/50'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 shadow-emerald-100'
              } ${isDbSyncing ? 'opacity-75 cursor-wait' : ''}`}
              title="डेटाबेस लिंक: क्लिक करके तुरंत डेटाबेस रीलोड और सिंक करें (Reload from Database)"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dbSyncSuccess ? 'bg-white' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dbSyncSuccess ? 'bg-white' : 'bg-emerald-500'}`}></span>
              </span>
              <RefreshCw className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin text-emerald-400' : (dbSyncSuccess ? 'text-white' : 'text-emerald-600')}`} />
              <span className="tracking-tight font-extrabold whitespace-nowrap">
                {isDbSyncing ? 'सिंक हो रहा है...' : (dbSyncSuccess ? '✓ सिंक सफल!' : 'डेटाबेस लिंक')}
              </span>
            </button>

            {/* Config Database / Google Sheet Link Button */}
            <button
              onClick={() => setIsGoogleSyncOpen(true)}
              className={`px-2 py-1.5 rounded-r-xl border-y border-r text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-emerald-900/60 hover:bg-emerald-800/80 border-emerald-700 text-emerald-300' 
                  : 'bg-emerald-100/70 hover:bg-emerald-200 border-emerald-300 text-emerald-900'
              }`}
              title="डेटाबेस लिंक सेटिंग्स / Google Sheet ऑटो-सिंक लिंक"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Access / Pending Login Mode Indicator */}
          {!isLoginEnabled && (
            <div className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm ${
              isDark ? 'bg-amber-950/60 border border-amber-700/60 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-900'
            }`} title="अपडेट कार्य के लिए लॉगिन पेंडिंग पर है - डायरेक्ट एक्सेस चालू">
              <span>⚡ डायरेक्ट मोड (अपडेट हेतु)</span>
            </div>
          )}

          {/* Quick Entry Button */}
          {currentUser.role !== ROLES.WORKER && (
            <button
              onClick={onOpenQuickEntry}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.actions.quickEntry}</span>
            </button>
          )}

          {/* Theme Toggle Button (🌙 Dark / ☀️ Light) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isDark ? "Light Mode (लाइट थीम)" : "Dark Mode (डार्क थीम)"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span className="hidden lg:inline text-[11px]">{isDark ? "Light" : "Dark"}</span>
          </button>

          {/* Farm Settings Button */}
          <button
            onClick={onOpenFarmSettings}
            className={`p-2 rounded-lg border transition-colors hidden xs:flex items-center gap-1 text-xs font-medium cursor-pointer ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Farm Settings / फार्म सेटिंग्स"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline font-semibold">Settings</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Switch Language / भाषा बदलें"
          >
            <Languages className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-dairy-400">
              {lang === 'hi' ? 'ENG' : 'हिंदी'}
            </span>
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${getRoleBadgeColor(currentUser.role)}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="font-semibold hidden xs:inline">
                {t.roles[currentUser.role]}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {roleDropdownOpen && (
              <div 
                className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}
                onClick={() => setRoleDropdownOpen(false)}
              >
                <div className={`px-3 py-1.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    {t.roles.switchRole}
                  </p>
                  <p className={`text-xs mt-0.5 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {currentUser.name}
                  </p>
                </div>

                <div className="p-1 space-y-1">
                  <button
                    onClick={() => switchRole(ROLES.ADMIN)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col cursor-pointer transition-colors ${
                      currentUser.role === ROLES.ADMIN 
                        ? (isDark ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-800/60' : 'bg-amber-50 text-amber-900 font-bold') 
                        : (isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>👑 {t.roles.admin}</span>
                      {currentUser.role === ROLES.ADMIN && <span className="text-[10px] text-amber-500 font-bold">✓ Active</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">{t.roles.adminDesc}</span>
                  </button>

                  <button
                    onClick={() => switchRole(ROLES.MANAGER)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col cursor-pointer transition-colors ${
                      currentUser.role === ROLES.MANAGER 
                        ? (isDark ? 'bg-blue-950/80 text-blue-300 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-900 font-bold') 
                        : (isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>📋 {t.roles.manager}</span>
                      {currentUser.role === ROLES.MANAGER && <span className="text-[10px] text-blue-400 font-bold">✓ Active</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">{t.roles.managerDesc}</span>
                  </button>

                  <button
                    onClick={() => switchRole(ROLES.WORKER)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col cursor-pointer transition-colors ${
                      currentUser.role === ROLES.WORKER 
                        ? (isDark ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/60' : 'bg-emerald-50 text-emerald-900 font-bold') 
                        : (isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>📱 {t.roles.worker}</span>
                      {currentUser.role === ROLES.WORKER && <span className="text-[10px] text-emerald-400 font-bold">✓ Active</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">{t.roles.workerDesc}</span>
                  </button>

                  {/* Divider and Logout Action */}
                  <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                  <button
                    onClick={() => logout()}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-rose-950/50 text-rose-400' : 'hover:bg-rose-50 text-rose-600 font-semibold'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span>🚪</span>
                      <span>लॉगआउट (Logout)</span>
                    </span>
                    <span className="text-[10px] opacity-75">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell with Badge */}
          <button
            onClick={onToggleNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Google Form / Sheet Database Link Modal */}
      {isGoogleSyncOpen && (
        <GoogleFormSyncModal
          isOpen={isGoogleSyncOpen}
          onClose={() => setIsGoogleSyncOpen(false)}
        />
      )}
    </header>
  );
};
