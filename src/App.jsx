import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';

import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { QuickEntryModal } from './components/dashboard/QuickEntryModal';
import { FarmSettingsModal } from './components/settings/FarmSettingsModal';

import { Dashboard } from './components/dashboard/Dashboard';
import { AnimalList } from './components/animals/AnimalList';
import { AnimalSaleHub } from './components/animals/AnimalSaleHub';
import { MilkEntry } from './components/milk/MilkEntry';
import { MilkSellingHub } from './components/selling/MilkSellingHub';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerAnalysisHub } from './components/customers/CustomerAnalysisHub';
import { ExpenseList } from './components/expenses/ExpenseList';
import { FeedInventory } from './components/feed/FeedInventory';
import { HealthManagement } from './components/health/HealthManagement';
import { BreedingTracker } from './components/health/BreedingTracker';
import { ProfitLoss } from './components/accounts/ProfitLoss';
import { ReportsHub } from './components/reports/ReportsHub';
import { WorkerMobileView } from './components/worker/WorkerMobileView';
import { LoginPage } from './components/auth/LoginPage';

// Robust Error Boundary Component to prevent blank/black screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Crash caught by ErrorBoundary:', error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-lg w-full space-y-4">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              एप्लिकेशन रीसेट / लोड समस्या
            </h2>
            <p className="text-xs text-slate-300">
              ब्राउज़र के पुराने कैश या डेटा सिंक के कारण पेज लोड नहीं हो पा रहा है। नीचे दिए बटन से कैश साफ़ करके रीलोड करें।
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 p-3 rounded-xl border border-rose-500/30 overflow-x-auto max-h-40 text-[11px] font-mono text-rose-300">
                <strong>Error: </strong>{this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                🔄 सामान्य रीलोड (Reload)
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                🧹 कैश साफ़ करके रीलोड (Clear Cache)
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { t } = useLanguage();
  const { currentUser, isAuthenticated } = useAuth();
  const { isDbLoaded, reloadFromDatabase, isDark, toggleTheme, syncToast, setSyncToast } = useApp();

  // If user is not logged in, render high-tech LoginPage immediately
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 🛡️ Smooth Zero-Flicker Loader: Waits for Supabase data to load in ONE clean atomic pass
  if (!isDbLoaded) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🥛</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-wide text-emerald-500">SHIVAJI MILK CENTER</h2>
            <p className="text-xs text-slate-400 mt-1">डेटाबेस लोड हो रहा है, कृपया प्रतीक्षा करें...</p>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState(() => {
    return currentUser.role === ROLES.WORKER ? 'worker' : 'dashboard';
  });

  const [analysisCustomerId, setAnalysisCustomerId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dairy_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isFarmSettingsOpen, setIsFarmSettingsOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dairy_sidebar_open', String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem('dairy_sidebar_open', 'false');
    } catch (e) {}
  };

  // Auto-switch to worker view if worker role is activated
  React.useEffect(() => {
    if (currentUser.role === ROLES.WORKER && activeTab === 'dashboard') {
      setActiveTab('worker');
    }
  }, [currentUser.role]);

  const handleOpenCustomerAnalysis = (custId) => {
    setAnalysisCustomerId(custId);
    setActiveTab('customer-analysis');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
            onOpenFarmSettings={() => setIsFarmSettingsOpen(true)}
          />
        );
      case 'animals':
        return <AnimalList onNavigateSale={() => setActiveTab('animal-sales')} />;
      case 'animal-sales':
        return <AnimalSaleHub />;
      case 'milk':
        return <MilkEntry />;
      case 'selling':
        return <MilkSellingHub />;
      case 'customers':
        return <CustomerList onOpenAnalysis={handleOpenCustomerAnalysis} />;
      case 'customer-analysis':
        return (
          <CustomerAnalysisHub
            preselectedCustomerId={analysisCustomerId}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'expenses':
        return <ExpenseList />;
      case 'feed':
        return <FeedInventory />;
      case 'health':
        return <HealthManagement />;
      case 'breeding':
        return <BreedingTracker />;
      case 'accounts':
        return <ProfitLoss />;
      case 'reports':
        return <ReportsHub />;
      case 'worker':
        return <WorkerMobileView />;
      default:
        return (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
            onOpenFarmSettings={() => setIsFarmSettingsOpen(true)}
          />
        );
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden select-none transition-colors duration-200 print:h-auto print:overflow-visible print:block print:bg-white print:text-black ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onToggle={handleToggleSidebar}
        onOpenFarmSettings={() => setIsFarmSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 print:h-auto print:overflow-visible print:block print:w-full">
        {/* Top Navbar */}
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
          onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
          isNotificationOpen={isNotificationOpen}
          onOpenFarmSettings={() => setIsFarmSettingsOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className={`flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 lg:pb-6 print:h-auto print:overflow-visible print:p-0 print:m-0 print:bg-white print:text-black ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full print:p-0">
            {renderContent()}
          </div>
        </main>

        {/* Mobile Bottom Navigation (Android View) */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMore={() => setIsSidebarOpen(true)}
        />
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsNotificationOpen(false);
        }}
      />

      {/* Quick Entry Modal */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
      />

      {/* Farm Settings / Manual Name Editor Modal */}
      <FarmSettingsModal
        isOpen={isFarmSettingsOpen}
        onClose={() => setIsFarmSettingsOpen(false)}
      />

      {/* 🚀 Real-Time Live Sync Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full shadow-2xl rounded-2xl p-4 border flex items-start gap-3 backdrop-blur-md transition-all border-emerald-500/50 bg-slate-900/95 text-white animate-fade-in no-print print:hidden">
          <div className={`p-2 rounded-xl mt-0.5 ${syncToast.type === 'danger' ? 'bg-rose-500/20 text-rose-400' : (syncToast.type === 'info' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400')}`}>
            {syncToast.type === 'danger' ? <AlertCircle size={20} /> : (syncToast.type === 'info' ? <Info size={20} /> : <CheckCircle2 size={20} />)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide truncate">
                {syncToast.title}
              </h4>
              <button 
                onClick={() => setSyncToast(null)} 
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-emerald-300 font-semibold mt-1">
              {syncToast.message}
            </p>
            {syncToast.details && (
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {syncToast.details}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
