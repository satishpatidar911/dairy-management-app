import {
  LayoutDashboard,
  Droplets,
  Milk,
  Truck,
  Users,
  Receipt,
  Wheat,
  HeartPulse,
  LineChart,
  FileSpreadsheet,
  Smartphone,
  CalendarHeart,
  Settings,
  HelpCircle,
  LogOut,
  Edit2,
  BarChart3,
  Tag,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, onToggle, onOpenFarmSettings }) => {
  const { t } = useLanguage();
  const { currentUser, farmProfile, logout } = useAuth();
  const { stats, alerts, cattleSales } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard, badge: null },
    { id: 'animals', label: 'CATTLE MANAGEMENT', icon: HeartPulse, badge: stats.totalAnimals },
    { id: 'animal-sales', label: 'ANIMAL SALES', icon: Tag, badge: cattleSales && cattleSales.length > 0 ? cattleSales.length : null, badgeColor: 'bg-amber-600' },
    { id: 'milk', label: 'MILK PRODUCTION', icon: Milk, badge: `${stats.todayMilkTotal}L` },
    { id: 'selling', label: 'MILK SALES', icon: Truck, badge: `${stats.todayTotalSaleVolume}L`, badgeColor: 'bg-emerald-600' },
    { id: 'customers', label: 'CUSTOMERS & KHATA', icon: Users, badge: null },
    { id: 'customer-analysis', label: 'CUSTOMER ANALYSIS', icon: BarChart3, badge: 'NEW', badgeColor: 'bg-blue-600' },
    { id: 'expenses', label: 'EXPENSE TRACKER', icon: Receipt, badge: `₹${stats.todayExpensesTotal}` },
    { id: 'feed', label: 'FEED & INVENTORY', icon: Wheat, badge: null },
    { id: 'health', label: 'HEALTH & VACCINE', icon: HeartPulse, badge: alerts.length > 0 ? alerts.length : null, badgeColor: 'bg-rose-500' },
    { id: 'breeding', label: 'BREEDING & CALVING', icon: CalendarHeart, badge: null },
    { id: 'accounts', label: 'ACCOUNTS & P&L', icon: LineChart, badge: null, adminOnly: true },
    { id: 'reports', label: 'REPORTS & EXPORT', icon: FileSpreadsheet, badge: null },
    { id: 'worker', label: 'WORKER MOBILE VIEW', icon: Smartphone, highlight: true }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && currentUser.role !== ROLES.ADMIN) return false;
    return true;
  });

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 no-print print:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container (Full width w-64 when open, Icon Rail lg:w-20 when collapsed on desktop) */}
      <aside
        className={`fixed lg:relative top-0 bottom-0 left-0 z-40 h-screen flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none no-print print:hidden ${
          isOpen 
            ? 'w-64 translate-x-0' 
            : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Header: Full Branding or Compact Icon Toggle */}
        <div className={`h-16 px-3 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} border-b border-slate-800 bg-slate-950 transition-all`}>
          {isOpen ? (
            <>
              <div 
                onClick={() => {
                  if (onOpenFarmSettings) onOpenFarmSettings();
                  if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) onClose();
                }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-90 group transition-all min-w-0 flex-1"
                title="Edit Farm Profile / फार्म प्रोफाइल बदलें"
              >
                <div className="w-9 h-9 rounded-lg bg-dairy-500 flex items-center justify-center text-white text-lg font-bold shadow group-hover:scale-105 transition-transform flex-shrink-0">
                  🥛
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold text-white text-xs sm:text-sm tracking-wider uppercase truncate group-hover:text-dairy-400 transition-colors">
                      {farmProfile?.farmName || 'SHIVAJI MILK CENTER'}
                    </h2>
                    <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 truncate uppercase">
                    {farmProfile?.ownerName || 'SATISH PATIDAR'}
                  </p>
                </div>
              </div>

              {/* Collapse to Icon-Only Rail button */}
              <button
                onClick={onToggle || onClose}
                className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex-shrink-0 cursor-pointer"
                title="मेनू छोटा करें (Collapse to Icons)"
                aria-label="Collapse to Icons"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-dairy-600/30 text-dairy-400 hover:text-white border border-slate-800 flex items-center justify-center transition-all group cursor-pointer shadow-sm"
              title="मेनू खोलें (Expand Menu)"
              aria-label="Expand Sidebar"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🥛</span>
            </button>
          )}
        </div>

        {/* Navigation Links with visible Icons */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {isOpen && (
            <div className="px-3 pb-2 text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
              <span>MAIN MENU</span>
            </div>
          )}

          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={`${item.label} ${item.badge ? `(${item.badge})` : ''}`}
                className={`w-full flex items-center ${
                  isOpen ? 'justify-between px-3 py-2.5' : 'justify-center py-3 px-2'
                } rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 ease-out transform hover:scale-[1.04] hover:shadow-lg group relative cursor-pointer ${
                  isActive
                    ? 'bg-dairy-600 text-white shadow-md shadow-dairy-600/30'
                    : item.highlight
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isOpen ? 'gap-3 min-w-0' : 'justify-center'}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-125 ${
                    isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'
                  }`} />
                  {isOpen && (
                    <span className="font-extrabold tracking-wide uppercase transition-colors duration-150 truncate">
                      {item.label}
                    </span>
                  )}
                </div>

                {/* Badge in Open state */}
                {isOpen && item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex-shrink-0 transition-transform group-hover:scale-110 ${
                    item.badgeColor 
                      ? `${item.badgeColor} text-white` 
                      : isActive 
                      ? 'bg-dairy-700 text-white' 
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Dot Badge in Mini Rail state */}
                {!isOpen && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-dairy-500 ring-2 ring-slate-900 animate-pulse"></span>
                )}
              </button>
            );
          })}

          {/* Farm Profile Settings Menu Item */}
          <button
            onClick={() => {
              if (onOpenFarmSettings) onOpenFarmSettings();
              if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) onClose();
            }}
            title="FARM SETTINGS (फार्म सेटिंग्स)"
            className={`w-full flex items-center ${
              isOpen ? 'justify-between px-3 py-2.5' : 'justify-center py-3 px-2'
            } rounded-xl text-xs font-black tracking-wider uppercase text-slate-400 hover:bg-slate-800/90 hover:text-white transition-all duration-200 ease-out transform hover:scale-[1.04] hover:shadow-lg group cursor-pointer`}
          >
            <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
              <Settings className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:scale-125 transition-transform duration-200" />
              {isOpen && (
                <span className="font-extrabold tracking-wide uppercase transition-colors duration-150">FARM SETTINGS</span>
              )}
            </div>
          </button>
        </div>

        {/* Footer info & Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-center">
          {isOpen ? (
            <div className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-200 tracking-wider truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ONLINE SYNC</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => logout()}
                  title="लॉगआउट (Logout)"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className="text-[18px]">🐄</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div 
                onClick={onToggle}
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-lg cursor-pointer transition-transform hover:scale-105" 
                title={`${currentUser.name} • Online Sync (Click to Expand)`}
              >
                🐄
              </div>
              <button
                onClick={() => logout()}
                title="लॉगआउट (Logout)"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
