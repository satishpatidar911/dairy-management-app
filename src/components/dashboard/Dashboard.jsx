import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  Droplets, Users, Truck, Wallet, TrendingUp, TrendingDown, Plus, Trash2,
  Sunrise, Sunset, IndianRupee, PawPrint, LayoutGrid, X, Store, Receipt,
  ArrowDownCircle, ArrowUpCircle, Landmark, RefreshCw, Calendar, ChevronRight,
  Filter, Check, RotateCcw, Clock, Sparkles, Search, UserCheck, Calculator,
  Moon, Sun
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

// ---------- Design tokens ----------
const darkTokens = {
  bg: "#0B1120", // Rich dark slate/navy
  surface: "#111827", // Rich card slate-900
  surfaceElevated: "#1E293B", // slate-800
  ink: "#F9FAFB", // High contrast white
  inkSoft: "#9CA3AF", // Soft gray-400
  primary: "#065F46", // Emerald-700
  primaryFg: "#FFFFFF",
  primaryDark: "#022C22",
  accent: "#B45309", // Amber-700
  accentFg: "#FEF3C7",
  accentSoft: "#F59E0B",
  red: "#9F1239", // Rose-700
  redFg: "#FFE4E6",
  line: "#1F2937", // Slate-800 subtle borders
};

const lightTokens = {
  bg: "#FAF6EC",
  surface: "#FFFFFF",
  surfaceElevated: "#F3F4F6",
  ink: "#20301F",
  inkSoft: "#5B6B57",
  primary: "#2F4B3C",
  primaryFg: "#FFFFFF",
  primaryDark: "#1B2A22",
  accent: "#E3A73D",
  accentFg: "#1B2A22",
  accentSoft: "#F3D68E",
  red: "#B8453B",
  redFg: "#FFFFFF",
  line: "#E1D6BC",
};

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
`;

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Helper to reliably check if a shift is Evening / Night (avoids substring collisions like 'morning'.includes('ni'))
const isEveningShift = (shiftVal) => {
  const s = String(shiftVal || '').toLowerCase().trim();
  return s.includes('ev') || s === 'night' || s.includes('शाम');
};

// ---------- small building blocks ----------
function StatCard({ icon: Icon, label, sub, value, tone = "primary", trail, onClick, isDark = true }) {
  const tonesDark = {
    primary: { bg: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)", fg: "#FFFFFF", border: "#047857" },
    accent: { bg: "linear-gradient(135deg, #78350F 0%, #92400E 100%)", fg: "#FEF3C7", border: "#B45309" },
    red: { bg: "linear-gradient(135deg, #881337 0%, #9F1239 100%)", fg: "#FFE4E6", border: "#BE123C" },
    ghost: { bg: "#111827", fg: "#F9FAFB", border: "#1F2937" },
  };

  const tonesLight = {
    primary: { bg: "#2F4B3C", fg: "#fff", border: "#E1D6BC" },
    accent: { bg: "#E3A73D", fg: "#1B2A22", border: "#E1D6BC" },
    red: { bg: "#B8453B", fg: "#fff", border: "#E1D6BC" },
    ghost: { bg: "#FFFFFF", fg: "#20301F", border: "#E1D6BC" },
  };

  const c = (isDark ? tonesDark : tonesLight)[tone] || (isDark ? tonesDark.ghost : tonesLight.ghost);
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl p-5 flex flex-col justify-between shadow-md border overflow-hidden transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-xl hover:scale-[1.02]" : ""
      }`}
      style={{ background: c.bg, color: c.fg, borderColor: c.border, minHeight: 132 }}
    >
      <div
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-xs pointer-events-none"
        style={{ background: c.fg }}
      />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-black tracking-wider uppercase opacity-90">{label}</span>
        <Icon size={20} strokeWidth={2.3} className="opacity-95" />
      </div>
      <div className="relative z-10">
        <div style={{ fontFamily: "'Zilla Slab', serif" }} className="text-2xl sm:text-3xl font-black leading-tight mt-2">
          {value}
        </div>
        {sub && <div className="text-xs font-semibold opacity-85 mt-0.5">{sub}</div>}
      </div>
      {trail && (
        <div className="flex items-center gap-1 text-xs mt-2 relative z-10 opacity-90 font-medium">
          {trail}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children, right, isDark = true }) {
  return (
    <div 
      className="rounded-2xl border shadow-md overflow-hidden transition-colors" 
      style={{ 
        background: isDark ? "#111827" : "#FFFFFF", 
        borderColor: isDark ? "#1F2937" : "#E1D6BC" 
      }}
    >
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b gap-2" 
        style={{ 
          borderColor: isDark ? "#1F2937" : "#E1D6BC",
          background: isDark ? "#0D1524" : "transparent"
        }}
      >
        <div>
          <h3 
            style={{ 
              fontFamily: "'Zilla Slab', serif", 
              color: isDark ? "#F9FAFB" : "#20301F" 
            }} 
            className="text-lg font-black"
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs mt-0.5 font-medium" style={{ color: isDark ? "#9CA3AF" : "#5B6B57" }}>
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      <div className="p-5" style={{ color: isDark ? "#E5E7EB" : "inherit" }}>
        {children}
      </div>
    </div>
  );
}

function AddRow({ fields, onAdd, buttonLabel, isDark = true }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.type === "select" ? f.options[0] : ""])));

  const submit = () => {
    for (const f of fields) {
      if (f.type !== "select" && !vals[f.key]) return;
    }
    onAdd(vals);
    setVals(Object.fromEntries(fields.map(f => [f.key, f.type === "select" ? f.options[0] : ""])));
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-transform active:scale-95 shadow-xs cursor-pointer"
        style={{ 
          background: isDark ? "#1E293B" : "#F3D68E", 
          color: isDark ? "#34D399" : "#1B2A22",
          border: isDark ? "1px solid #374151" : "none"
        }}
      >
        <Plus size={14} /> {buttonLabel}
      </button>
    );
  }

  return (
    <div 
      className="flex flex-wrap items-end gap-2 p-3.5 rounded-xl mb-3" 
      style={{ 
        background: isDark ? "#0F172A" : "#FAF6EC", 
        border: `1px dashed ${isDark ? "#374151" : "#E1D6BC"}` 
      }}
    >
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: isDark ? "#9CA3AF" : "#5B6B57" }}>{f.label}</label>
          {f.type === "select" ? (
            <select
              value={vals[f.key]}
              onChange={(e) => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
              style={{ minWidth: 140 }}
            >
              {f.options.map(o => <option key={o} value={o} className={isDark ? "bg-slate-900 text-slate-100" : ""}>{o}</option>)}
            </select>
          ) : (
            <input
              type={f.type || "text"}
              value={vals[f.key]}
              placeholder={f.placeholder || ""}
              onChange={(e) => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
              }`}
              style={{ width: f.width || 110 }}
            />
          )}
        </div>
      ))}
      <button 
        onClick={submit} 
        className="text-xs font-black px-3.5 py-2 rounded-lg transition-transform active:scale-95 shadow-xs cursor-pointer" 
        style={{ background: "#059669", color: "#fff" }}
      >
        जोड़ें (Save)
      </button>
      <button 
        onClick={() => setOpen(false)} 
        className="text-xs p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" 
        style={{ color: isDark ? "#9CA3AF" : "#5B6B57" }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

function DataTable({ columns, rows, onDelete, emptyText, isDark = true }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs sm:text-sm min-w-[540px]">
        <thead>
          <tr style={{ borderBottom: `2px solid ${isDark ? "#374151" : "#E1D6BC"}` }}>
            {columns.map(c => (
              <th 
                key={c.key} 
                className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wide font-black" 
                style={{ color: isDark ? "#9CA3AF" : "#5B6B57" }}
              >
                {c.label}
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td 
                colSpan={columns.length + 1} 
                className="text-center py-8 text-xs font-medium" 
                style={{ color: isDark ? "#9CA3AF" : "#5B6B57" }}
              >
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr 
              key={r.id} 
              className={`transition-colors ${isDark ? "hover:bg-slate-800/60" : "hover:bg-amber-50/40"}`} 
              style={{ borderBottom: `1px solid ${isDark ? "#1F2937" : "#E1D6BC"}` }}
            >
              {columns.map(c => (
                <td 
                  key={c.key} 
                  className="px-3 py-2.5 font-medium" 
                  style={{ 
                    fontFamily: c.mono ? "'IBM Plex Mono', monospace" : undefined, 
                    color: isDark ? "#F3F4F6" : "#20301F" 
                  }}
                >
                  {c.render ? c.render(r[c.key], r) : r[c.key]}
                </td>
              ))}
              <td className="px-2 text-right">
                {onDelete && (
                  <button 
                    onClick={() => onDelete(r.id)} 
                    className="opacity-40 hover:opacity-100 hover:text-rose-400 transition-all p-1 cursor-pointer" 
                    title="Delete"
                  >
                    <Trash2 size={14} style={{ color: isDark ? "#F87171" : "#B8453B" }} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Dashboard = ({ onNavigate, onOpenQuickEntry, onOpenFarmSettings }) => {
  const { t } = useLanguage();
  const { farmProfile } = useAuth();
  const {
    stats,
    animals,
    milkEntries,
    customerSales,
    dairySales,
    expenses,
    cattleSales,
    reloadFromDatabase,
    addMilkEntry,
    addCustomerSale,
    addDairySale,
    addExpense,
    sellAnimal,
    deleteMilkEntry,
    deleteCustomerSale,
    deleteDairySale,
    deleteExpense,
    deleteCattleSale,
    isDark,
    toggleTheme
  } = useApp();

  const T = useMemo(() => isDark ? darkTokens : lightTokens, [isDark]);

  const [tab, setTab] = useState("overview");
  const [isDbReloading, setIsDbReloading] = useState(false);
  const [dbReloadSuccess, setDbReloadSuccess] = useState(false);

  const handleDashboardReload = async () => {
    if (isDbReloading) return;
    setIsDbReloading(true);
    setDbReloadSuccess(false);
    try {
      if (reloadFromDatabase) {
        await reloadFromDatabase(true);
      }
      setDbReloadSuccess(true);
      setTimeout(() => setDbReloadSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDbReloading(false);
    }
  };

  // Filter State: "this_month" | "last_3_months" | "last_month" | "this_year" | "last_year" | "today" | "all" | "custom"
  const [filterMode, setFilterMode] = useState("this_month");
  
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format today's date string
  const todayDateObj = new Date();
  const todayStr = formatLocalDate(todayDateObj);
  const todayFormattedDate = todayDateObj.toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const [startDateInput, setStartDateInput] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [endDateInput, setEndDateInput] = useState(() => formatLocalDate(new Date()));
  const [appliedCustomRange, setAppliedCustomRange] = useState(null);

  // Calculate Active Date Range based on Filter Selection
  const activeRange = useMemo(() => {
    const now = new Date();
    const todayISO = formatLocalDate(now);

    if (filterMode === "today") {
      return { start: todayISO, end: todayISO, label: "आज (Today)", subtitle: todayFormattedDate, daysCount: 1 };
    }
    if (filterMode === "this_week") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const start = formatLocalDate(monday);
      return { start, end: todayISO, label: "यह हफ़्ता (This Week)", subtitle: `${start} से ${todayISO}`, daysCount: Math.ceil((now - monday) / 86400000) + 1 };
    }
    if (filterMode === "this_month") {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return {
        start,
        end: todayISO,
        label: "इस महीने (This Month)",
        subtitle: `${now.toLocaleDateString("hi-IN", { month: "long", year: "numeric" })} (1 से ${now.getDate()} तारीख)`,
        daysCount: now.getDate()
      };
    }
    if (filterMode === "last_month") {
      const prevMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthLast = new Date(now.getFullYear(), now.getMonth(), 0);
      const start = formatLocalDate(prevMonthFirst);
      const end = formatLocalDate(prevMonthLast);
      return {
        start,
        end,
        label: "पिछला महीना (Last Month)",
        subtitle: `${prevMonthFirst.toLocaleDateString("hi-IN", { month: "long", year: "numeric" })} (1 से ${prevMonthLast.getDate()} तारीख)`,
        daysCount: prevMonthLast.getDate()
      };
    }
    if (filterMode === "last_3_months") {
      const threeMonthsFirst = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const start = formatLocalDate(threeMonthsFirst);
      return {
        start,
        end: todayISO,
        label: "पिछले 3 महीने (Last 3 Months)",
        subtitle: `${start} से ${todayISO}`,
        daysCount: Math.ceil((now - threeMonthsFirst) / 86400000) + 1
      };
    }
    if (filterMode === "this_year") {
      const start = `${now.getFullYear()}-01-01`;
      return {
        start,
        end: todayISO,
        label: "इस साल (This Year)",
        subtitle: `वर्ष ${now.getFullYear()}`,
        daysCount: Math.ceil((now - new Date(`${now.getFullYear()}-01-01`)) / 86400000) + 1
      };
    }
    if (filterMode === "last_year") {
      const start = `${now.getFullYear() - 1}-01-01`;
      const end = `${now.getFullYear() - 1}-12-31`;
      return {
        start,
        end,
        label: "पिछला साल (Last Year)",
        subtitle: `वर्ष ${now.getFullYear() - 1}`,
        daysCount: 365
      };
    }
    if (filterMode === "custom" && appliedCustomRange) {
      const s = new Date(appliedCustomRange.start);
      const e = new Date(appliedCustomRange.end);
      const count = Math.max(1, Math.ceil((e - s) / 86400000) + 1);
      return {
        start: appliedCustomRange.start,
        end: appliedCustomRange.end,
        label: "कस्टम अवधि (Custom Range)",
        subtitle: `${appliedCustomRange.start} से ${appliedCustomRange.end}`,
        daysCount: count
      };
    }
    return {
      start: "2020-01-01",
      end: "2099-12-31",
      label: "सम्पूर्ण समय (All Time)",
      subtitle: "शुरू से अब तक का कुल रिकॉर्ड",
      daysCount: null
    };
  }, [filterMode, appliedCustomRange, todayFormattedDate]);

  // Date In-Range Checker
  const isInRange = (dateStr) => {
    if (!dateStr) return false;
    const clean = String(dateStr).trim().split("T")[0];
    return clean >= activeRange.start && clean <= activeRange.end;
  };

  // 1. FILTERED DATASETS BASED ON ACTIVE RANGE
  const filteredMilkEntries = useMemo(() => milkEntries.filter(m => isInRange(m.date)), [milkEntries, activeRange]);
  const filteredCustomerSales = useMemo(() => customerSales.filter(s => isInRange(s.date)), [customerSales, activeRange]);
  const filteredDairySales = useMemo(() => dairySales.filter(s => isInRange(s.date)), [dairySales, activeRange]);
  const filteredExpenses = useMemo(() => expenses.filter(e => isInRange(e.date)), [expenses, activeRange]);
  const filteredCattleSales = useMemo(() => (cattleSales || []).filter(s => isInRange(s.saleDate || s.date)), [cattleSales, activeRange]);
  const filteredAnimalPurchases = useMemo(() => animals.filter(a => isInRange(a.purchaseDate || a.createdAt)), [animals, activeRange]);

  // Customer Filter State
  const [customerFilter, setCustomerFilter] = useState("");
  const [customerSearchInput, setCustomerSearchInput] = useState("");

  // List of unique customers in current filtered range and all-time
  const customerSummaryList = useMemo(() => {
    const map = new Map();
    filteredCustomerSales.forEach(s => {
      const name = (s.customerName || '').trim();
      if (!name) return;
      if (!map.has(name)) {
        map.set(name, { name, count: 0, morningLiters: 0, eveningLiters: 0, totalLiters: 0, totalAmount: 0 });
      }
      const item = map.get(name);
      const q = Number(s.quantity || s.liters || 0);
      const a = Number(s.amount || (q * (s.rate || 70)));
      item.count++;
      if (isEveningShift(s.shift)) {
        item.eveningLiters = Number((item.eveningLiters + q).toFixed(2));
      } else {
        item.morningLiters = Number((item.morningLiters + q).toFixed(2));
      }
      item.totalLiters = Number((item.totalLiters + q).toFixed(2));
      item.totalAmount = Number((item.totalAmount + a).toFixed(2));
    });
    return Array.from(map.values()).sort((a, b) => b.totalLiters - a.totalLiters);
  }, [filteredCustomerSales]);

  // Filtered customer sales based on customerFilter or customerSearchInput
  const customerFilteredSales = useMemo(() => {
    const q = (customerFilter || customerSearchInput || '').toLowerCase().trim();
    if (!q) return filteredCustomerSales;
    return filteredCustomerSales.filter(s =>
      (s.customerName || '').toLowerCase().includes(q)
    );
  }, [filteredCustomerSales, customerFilter, customerSearchInput]);

  // Selected customer specific stats
  const activeCustomerStats = useMemo(() => {
    const q = (customerFilter || customerSearchInput || '').trim();
    if (!q) return null;
    let mQty = 0, eQty = 0, totQty = 0, totAmt = 0;
    customerFilteredSales.forEach(s => {
      const qVal = Number(s.quantity || s.liters || 0);
      const aVal = Number(s.amount || (qVal * (s.rate || 70)));
      totQty += qVal;
      totAmt += aVal;
      if (isEveningShift(s.shift)) eQty += qVal;
      else mQty += qVal;
    });
    return {
      query: q,
      count: customerFilteredSales.length,
      morningLiters: Number(mQty.toFixed(2)),
      eveningLiters: Number(eQty.toFixed(2)),
      totalLiters: Number(totQty.toFixed(2)),
      totalAmount: Number(totAmt.toFixed(2)),
      avgRate: totQty > 0 ? Number((totAmt / totQty).toFixed(2)) : 70
    };
  }, [customerFilter, customerSearchInput, customerFilteredSales]);

  // 2. MILK AGGREGATIONS (Filtered Period & Today)
  // 2. MILK AGGREGATIONS (Filtered Period & Today)
  const todayCustSales = useMemo(() => customerSales.filter(s => s.date === todayStr), [customerSales, todayStr]);
  const todayDairySalesList = useMemo(() => dairySales.filter(s => s.date === todayStr), [dairySales, todayStr]);
  const todayMilkEntries = useMemo(() => milkEntries.filter(m => m.date === todayStr), [milkEntries, todayStr]);

  const rawMorningYield = useMemo(() => {
    const entries = todayMilkEntries.filter(m => !isEveningShift(m.shift)).reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    const cust = todayCustSales.filter(s => !isEveningShift(s.shift)).reduce((sum, s) => sum + Number(s.quantity || s.liters || 0), 0);
    const dairy = todayDairySalesList.filter(s => !isEveningShift(s.shift)).reduce((sum, s) => sum + Number(s.quantity || s.liters || 0), 0);
    const sales = cust + dairy;
    return sales > 0 ? sales : entries;
  }, [todayMilkEntries, todayCustSales, todayDairySalesList]);

  const rawEveningYield = useMemo(() => {
    const entries = todayMilkEntries.filter(m => isEveningShift(m.shift)).reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    const cust = todayCustSales.filter(s => isEveningShift(s.shift)).reduce((sum, s) => sum + Number(s.quantity || s.liters || 0), 0);
    const dairy = todayDairySalesList.filter(s => isEveningShift(s.shift)).reduce((sum, s) => sum + Number(s.quantity || s.liters || 0), 0);
    const sales = cust + dairy;
    return sales > 0 ? sales : entries;
  }, [todayMilkEntries, todayCustSales, todayDairySalesList]);

  const todayMorningYield = Number((stats?.morningMilk !== undefined && stats?.morningMilk !== null && stats?.morningMilk > 0 ? stats.morningMilk : rawMorningYield).toFixed(1));
  const todayEveningYield = Number((stats?.eveningMilk !== undefined && stats?.eveningMilk !== null && stats?.eveningMilk > 0 ? stats.eveningMilk : rawEveningYield).toFixed(1));
  const todayTotal = Number((todayMorningYield + todayEveningYield).toFixed(1));

  // Period Milk Calculations (Sum of Customer Sales + Dairy Sales + Milking Entries)
  const periodMilkMorning = useMemo(() => {
    const fromEntries = filteredMilkEntries.filter(m => !isEveningShift(m.shift)).reduce((s, m) => s + Number(m.quantity || 0), 0);
    const fromCustSales = filteredCustomerSales.filter(s => !isEveningShift(s.shift)).reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0);
    const fromDairySales = filteredDairySales.filter(s => !isEveningShift(s.shift)).reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0);
    const fromSales = fromCustSales + fromDairySales;
    const val = fromSales > 0 ? fromSales : fromEntries;
    return Number(val.toFixed(2));
  }, [filteredMilkEntries, filteredCustomerSales, filteredDairySales]);

  const periodMilkEvening = useMemo(() => {
    const fromEntries = filteredMilkEntries.filter(m => isEveningShift(m.shift)).reduce((s, m) => s + Number(m.quantity || 0), 0);
    const fromCustSales = filteredCustomerSales.filter(s => isEveningShift(s.shift)).reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0);
    const fromDairySales = filteredDairySales.filter(s => isEveningShift(s.shift)).reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0);
    const fromSales = fromCustSales + fromDairySales;
    const val = fromSales > 0 ? fromSales : fromEntries;
    return Number(val.toFixed(2));
  }, [filteredMilkEntries, filteredCustomerSales, filteredDairySales]);

  const periodTotalMilk = useMemo(() => {
    if (filterMode === "today") return todayTotal;
    const entriesSum = filteredMilkEntries.reduce((s, m) => s + Number(m.quantity || 0), 0);
    const custSum = filteredCustomerSales.reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0);
    const dairySum = filteredDairySales.reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0);
    const salesSum = custSum + dairySum;
    const val = salesSum > 0 ? salesSum : entriesSum;
    return Number(val.toFixed(2));
  }, [filterMode, todayTotal, filteredMilkEntries, filteredCustomerSales, filteredDairySales]);

  const weekMilkTotal = useMemo(() => {
    const d = new Date();
    const sevenDaysAgo = new Date(d.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const last7Entries = milkEntries.filter(m => m.date >= sevenDaysAgo);
    const last7Sales = customerSales.filter(s => s.date >= sevenDaysAgo);
    const last7Dairy = dairySales.filter(s => s.date >= sevenDaysAgo);
    const sumE = last7Entries.reduce((s, m) => s + Number(m.quantity || 0), 0);
    const sumS = last7Sales.reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0) + last7Dairy.reduce((s, r) => s + Number(r.quantity || r.liters || 0), 0);
    return sumS > 0 ? sumS : sumE;
  }, [milkEntries, customerSales, dairySales]);

  // Current Month daily average calculation (combining customer sales + dairy wholesale)
  const currentMonthStats = useMemo(() => {
    const currentMonthPrefix = todayStr.slice(0, 7); // e.g. "2026-09"
    const currentDayNum = Math.max(1, (new Date()).getDate());
    const mCustSales = customerSales.filter(s => s.date && s.date.startsWith(currentMonthPrefix));
    const mDairySales = dairySales.filter(s => s.date && s.date.startsWith(currentMonthPrefix));
    const mEntries = milkEntries.filter(m => m.date && m.date.startsWith(currentMonthPrefix));
    
    const custSum = mCustSales.reduce((sum, s) => sum + Number(s.quantity || s.liters || 0), 0);
    const custAmtSum = mCustSales.reduce((sum, s) => sum + Number(s.amount || ((s.quantity || s.liters || 0) * (s.rate || 70))), 0);
    
    const dairySum = mDairySales.reduce((sum, s) => sum + Number(s.quantity || s.liters || 0), 0);
    const dairyAmtSum = mDairySales.reduce((sum, s) => sum + Number(s.totalAmount || s.amount || 0), 0);
    
    const entriesSum = mEntries.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    const totalMilkSold = custSum + dairySum;
    const totalM = totalMilkSold > 0 ? totalMilkSold : entriesSum;
    
    const avg = totalM / currentDayNum;
    const avgCustAmt = custAmtSum / currentDayNum;
    const avgCustQty = custSum / currentDayNum;
    const avgDairyQty = dairySum / currentDayNum;
    const avgDairyAmt = dairyAmtSum / currentDayNum;
    const avgTotalSalesAmt = (custAmtSum + dairyAmtSum) / currentDayNum;

    return {
      monthTotal: Number(totalM.toFixed(2)),
      monthTotalAmount: Number((custAmtSum + dairyAmtSum).toFixed(2)),
      monthCustomerAmount: Number(custAmtSum.toFixed(2)),
      monthDairyAmount: Number(dairyAmtSum.toFixed(2)),
      daysElapsed: currentDayNum,
      avgDaily: Number(avg.toFixed(2)),
      avgDailyCustomerAmount: Number(avgCustAmt.toFixed(2)),
      avgDailyCustomerLiters: Number(avgCustQty.toFixed(2)),
      avgDailyDairyLiters: Number(avgDairyQty.toFixed(2)),
      avgDailyDairyAmount: Number(avgDairyAmt.toFixed(2)),
      avgDailyTotalSalesAmount: Number(avgTotalSalesAmt.toFixed(2))
    };
  }, [customerSales, dairySales, milkEntries, todayStr]);

  // Selected Period Daily Average Milk (प्रति दिन औसत दूध)
  const periodDailyAvgMilk = useMemo(() => {
    if (filterMode === "today") {
      return currentMonthStats.avgDaily;
    }
    const days = activeRange.daysCount || Math.max(1, Math.ceil((new Date(activeRange.end) - new Date(activeRange.start)) / 86400000) + 1);
    if (!days || days <= 0) return Number(periodTotalMilk.toFixed(2));
    return Number((periodTotalMilk / days).toFixed(2));
  }, [filterMode, periodTotalMilk, activeRange, currentMonthStats]);

  // 3. SALES AGGREGATIONS (Period)
  const periodCustomerTotal = useMemo(() => {
    return filteredCustomerSales.reduce((sum, r) => sum + Number(r.amount || ((r.quantity || r.liters || 0) * (r.rate || 60))), 0);
  }, [filteredCustomerSales]);

  const periodCustomerLiters = useMemo(() => {
    return Number(filteredCustomerSales.reduce((sum, r) => sum + Number(r.quantity || r.liters || 0), 0).toFixed(2));
  }, [filteredCustomerSales]);

  const periodCustomerMorningLiters = useMemo(() => {
    return Number(
      customerFilteredSales
        .filter(s => !isEveningShift(s.shift))
        .reduce((sum, r) => sum + Number(r.quantity || r.liters || 0), 0)
        .toFixed(2)
    );
  }, [customerFilteredSales]);

  const periodCustomerEveningLiters = useMemo(() => {
    return Number(
      customerFilteredSales
        .filter(s => isEveningShift(s.shift))
        .reduce((sum, r) => sum + Number(r.quantity || r.liters || 0), 0)
        .toFixed(2)
    );
  }, [customerFilteredSales]);

  // Derived Customer Sale Stats for display
  const displayCustLiters = customerFilter && activeCustomerStats ? activeCustomerStats.totalLiters : periodCustomerLiters;
  const displayCustAmount = customerFilter && activeCustomerStats ? activeCustomerStats.totalAmount : periodCustomerTotal;
  const displayCustAvgRate = displayCustLiters > 0 ? Number((displayCustAmount / displayCustLiters).toFixed(2)) : 70;
  const displayCustMorningLiters = customerFilter && activeCustomerStats ? activeCustomerStats.morningLiters : periodCustomerMorningLiters;
  const displayCustEveningLiters = customerFilter && activeCustomerStats ? activeCustomerStats.eveningLiters : periodCustomerEveningLiters;

  // Selected Period Daily Average Customer Sales Amount and Liters (प्रति दिन औसत बिक्री राशि)
  const periodDailyAvgCustomerAmount = useMemo(() => {
    if (filterMode === "today") {
      return currentMonthStats.avgDailyCustomerAmount;
    }
    const days = activeRange.daysCount || Math.max(1, Math.ceil((new Date(activeRange.end) - new Date(activeRange.start)) / 86400000) + 1);
    if (!days || days <= 0) return Number(periodCustomerTotal.toFixed(2));
    return Number((periodCustomerTotal / days).toFixed(2));
  }, [filterMode, periodCustomerTotal, activeRange, currentMonthStats]);

  const periodDailyAvgCustomerLiters = useMemo(() => {
    if (filterMode === "today") {
      return currentMonthStats.avgDailyCustomerLiters;
    }
    const days = activeRange.daysCount || Math.max(1, Math.ceil((new Date(activeRange.end) - new Date(activeRange.start)) / 86400000) + 1);
    if (!days || days <= 0) return Number(periodCustomerLiters.toFixed(2));
    return Number((periodCustomerLiters / days).toFixed(2));
  }, [filterMode, periodCustomerLiters, activeRange, currentMonthStats]);

  const displayDailyAvgCustomerLiters = useMemo(() => {
    if (customerFilter && activeCustomerStats) {
      const days = activeRange.daysCount || Math.max(1, Math.ceil((new Date(activeRange.end) - new Date(activeRange.start)) / 86400000) + 1);
      return days > 0 ? Number((activeCustomerStats.totalLiters / days).toFixed(2)) : activeCustomerStats.totalLiters;
    }
    return periodDailyAvgCustomerLiters;
  }, [customerFilter, activeCustomerStats, activeRange, periodDailyAvgCustomerLiters]);

  const displayDailyAvgCustomerAmount = useMemo(() => {
    if (customerFilter && activeCustomerStats) {
      const days = activeRange.daysCount || Math.max(1, Math.ceil((new Date(activeRange.end) - new Date(activeRange.start)) / 86400000) + 1);
      return days > 0 ? Number((activeCustomerStats.totalAmount / days).toFixed(2)) : activeCustomerStats.totalAmount;
    }
    return periodDailyAvgCustomerAmount;
  }, [customerFilter, activeCustomerStats, activeRange, periodDailyAvgCustomerAmount]);

  const periodDairyTotal = useMemo(() => {
    return filteredDairySales.reduce((sum, r) => sum + Number(r.totalAmount || r.amount || ((r.quantity || r.liters || 0) * (r.rate || 42))), 0);
  }, [filteredDairySales]);

  const periodDairyLiters = useMemo(() => {
    return Number(filteredDairySales.reduce((sum, r) => sum + Number(r.quantity || r.liters || 0), 0).toFixed(2));
  }, [filteredDairySales]);

  const periodDailyAvgDairyLiters = useMemo(() => {
    if (filterMode === "today") {
      return currentMonthStats.avgDailyDairyLiters;
    }
    const days = activeRange.daysCount || Math.max(1, Math.ceil((new Date(activeRange.end) - new Date(activeRange.start)) / 86400000) + 1);
    if (!days || days <= 0) return Number(periodDairyLiters.toFixed(2));
    return Number((periodDairyLiters / days).toFixed(2));
  }, [filterMode, periodDairyLiters, activeRange, currentMonthStats]);

  const periodCombinedSales = periodCustomerTotal + periodDairyTotal;

  const periodDailyAvgTotalSalesAmount = useMemo(() => {
    if (filterMode === "today") {
      return currentMonthStats.avgDailyTotalSalesAmount;
    }
    const days = activeRange.daysCount || Math.max(1, Math.ceil((new Date(activeRange.end) - new Date(activeRange.start)) / 86400000) + 1);
    if (!days || days <= 0) return Number(periodCombinedSales.toFixed(2));
    return Number((periodCombinedSales / days).toFixed(2));
  }, [filterMode, periodCombinedSales, activeRange, currentMonthStats]);

  // Combined Average Milk Price (ग्राहक बिक्री + डेयरी बिक्री का संयुक्त औसत भाव प्रति लीटर)
  const periodCombinedLiters = useMemo(() => {
    return Number((periodCustomerLiters + periodDairyLiters).toFixed(2));
  }, [periodCustomerLiters, periodDairyLiters]);

  const periodCustomerAvgRate = useMemo(() => {
    if (periodCustomerLiters <= 0) return 70;
    return Number((periodCustomerTotal / periodCustomerLiters).toFixed(2));
  }, [periodCustomerTotal, periodCustomerLiters]);

  const periodDairyAvgRate = useMemo(() => {
    if (periodDairyLiters <= 0) return 58;
    return Number((periodDairyTotal / periodDairyLiters).toFixed(2));
  }, [periodDairyTotal, periodDairyLiters]);

  const periodCombinedAvgRate = useMemo(() => {
    const totalL = periodCombinedLiters > 0 ? periodCombinedLiters : periodTotalMilk;
    if (totalL <= 0) return 0;
    return Number((periodCombinedSales / totalL).toFixed(2));
  }, [periodCombinedSales, periodCombinedLiters, periodTotalMilk]);

  // 4. EXPENSES AGGREGATIONS (Period)
  const periodExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  // 5. NET PROFIT (Period)
  const periodNetProfit = periodCombinedSales - periodExpenses;

  // 6. ANIMAL ASSETS & LIVESTOCK METRICS
  const periodAnimalPurchases = useMemo(() => {
    if (filterMode === "all" || filterMode === "this_year") {
      return animals.reduce((sum, a) => sum + Number(a.purchasePrice || a.purchase_price || 0), 0);
    }
    const filteredSum = filteredAnimalPurchases.reduce((sum, a) => sum + Number(a.purchasePrice || a.purchase_price || 0), 0);
    return filteredSum > 0 ? filteredSum : animals.reduce((sum, a) => sum + Number(a.purchasePrice || a.purchase_price || 0), 0);
  }, [animals, filteredAnimalPurchases, filterMode]);

  const periodAnimalPurchaseCount = useMemo(() => {
    if (filterMode === "all" || filterMode === "this_year") {
      return animals.filter(a => Number(a.purchasePrice || a.purchase_price || 0) > 0 || a.origin === "purchased").length;
    }
    const filteredCount = filteredAnimalPurchases.filter(a => Number(a.purchasePrice || a.purchase_price || 0) > 0 || a.origin === "purchased").length;
    return filteredCount > 0 ? filteredCount : animals.length;
  }, [animals, filteredAnimalPurchases, filterMode]);

  const periodAnimalSales = useMemo(() => {
    return filteredCattleSales.reduce((sum, a) => sum + Number(a.salePrice || a.paidAmount || 0), 0);
  }, [filteredCattleSales]);

  const periodAnimalSaleCount = filteredCattleSales.length;

  const herdCounts = useMemo(() => {
    const active = animals.filter(a => a.status !== "sold");
    const cow = active.filter(a => a.type === "cow").length;
    const buffalo = active.filter(a => a.type === "buffalo").length;
    const keda = active.filter(a => a.type === "keda" || a.status === "keda").length;
    const kedi = active.filter(a => a.type === "kedi" || a.status === "kedi" || a.status === "heifer").length;
    const calves = keda + kedi;
    const total = cow + buffalo + calves;
    return { cow, buffalo, keda, kedi, calves, total };
  }, [animals]);

  const totalStock = herdCounts.total;

  // 7. DYNAMIC MILK LINE CHART DATA FOR SELECTED PERIOD
  const periodMilkChartData = useMemo(() => {
    const mapByDate = {};
    const now = new Date();
    const effectiveEndStr = activeRange.end > todayStr ? todayStr : activeRange.end;
    const effectiveStartStr = activeRange.start < "2024-01-01" ? (filterMode === "all" ? "2026-08-01" : activeRange.start) : activeRange.start;

    const startDateObj = new Date(effectiveStartStr);
    const endDateObj = new Date(effectiveEndStr);
    const diffDays = Math.max(1, Math.min(31, Math.ceil((endDateObj - startDateObj) / 86400000) + 1));

    // Create baseline for date slots
    for (let i = diffDays - 1; i >= 0; i--) {
      const d = new Date(endDateObj.getTime() - i * 86400000);
      const dStr = formatLocalDate(d);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      mapByDate[dStr] = { date: label, fullDate: dStr, morning: 0, evening: 0, total: 0 };
    }

    filteredMilkEntries.forEach(m => {
      if (mapByDate[m.date]) {
        if (m.shift === "morning") mapByDate[m.date].morning += Number(m.quantity || 0);
        else mapByDate[m.date].evening += Number(m.quantity || 0);
      }
    });

    filteredCustomerSales.forEach(s => {
      const d = s.date;
      if (mapByDate[d] && mapByDate[d].morning === 0 && mapByDate[d].evening === 0) {
        if (s.shift === "morning") mapByDate[d].morning += Number(s.quantity || s.liters || 0);
        else mapByDate[d].evening += Number(s.quantity || s.liters || 0);
      }
    });

    filteredDairySales.forEach(s => {
      const d = s.date;
      if (mapByDate[d] && mapByDate[d].morning === 0 && mapByDate[d].evening === 0) {
        if (s.shift === "morning") mapByDate[d].morning += Number(s.quantity || s.liters || 0);
        else mapByDate[d].evening += Number(s.quantity || s.liters || 0);
      }
    });

    return Object.values(mapByDate).map(d => ({
      ...d,
      morning: Number(d.morning.toFixed(1)),
      evening: Number(d.evening.toFixed(1)),
      total: Number((d.morning + d.evening).toFixed(1))
    }));
  }, [activeRange, todayStr, filterMode, filteredMilkEntries, filteredCustomerSales, filteredDairySales]);

  // 8. DYNAMIC SALES BAR CHART DATA FOR SELECTED PERIOD
  const periodSalesChartData = useMemo(() => {
    const mapByDate = {};
    const effectiveEndStr = activeRange.end > todayStr ? todayStr : activeRange.end;
    const effectiveStartStr = activeRange.start < "2024-01-01" ? (filterMode === "all" ? "2026-08-01" : activeRange.start) : activeRange.start;

    const startDateObj = new Date(effectiveStartStr);
    const endDateObj = new Date(effectiveEndStr);
    const diffDays = Math.max(1, Math.min(31, Math.ceil((endDateObj - startDateObj) / 86400000) + 1));

    for (let i = diffDays - 1; i >= 0; i--) {
      const d = new Date(endDateObj.getTime() - i * 86400000);
      const dStr = formatLocalDate(d);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      mapByDate[dStr] = { date: label, customer: 0, dairy: 0 };
    }

    filteredCustomerSales.forEach(r => {
      const dKey = r.date;
      if (mapByDate[dKey]) {
        mapByDate[dKey].customer += Number(r.amount || ((r.quantity || r.liters || 0) * (r.rate || 60)));
      }
    });

    filteredDairySales.forEach(r => {
      const dKey = r.date;
      if (mapByDate[dKey]) {
        mapByDate[dKey].dairy += Number(r.totalAmount || r.amount || ((r.quantity || r.liters || 0) * (r.rate || 42)));
      }
    });

    return Object.values(mapByDate);
  }, [activeRange, filteredCustomerSales, filteredDairySales]);

  const handleApplyCustomFilter = () => {
    if (!startDateInput || !endDateInput) {
      alert("कृपया दोनों दिनांक (Start Date व End Date) चुनें।");
      return;
    }
    if (startDateInput > endDateInput) {
      alert("प्रारंभिक दिनांक (Start Date) अंतिम दिनांक से पहले होनी चाहिए।");
      return;
    }
    setAppliedCustomRange({ start: startDateInput, end: endDateInput });
    setFilterMode("custom");
  };

  const handleResetFilter = () => {
    setFilterMode("this_month");
    setAppliedCustomRange(null);
    const d = new Date();
    setStartDateInput(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    setEndDateInput(formatLocalDate(d));
  };

  const tabs = [
    { id: "overview", label: "ओवरव्यू (Overview)", icon: LayoutGrid },
    { id: "milk", label: "दूध उत्पादन (Milk)", icon: Droplets },
    { id: "sales", label: "बिक्री (Sales)", icon: IndianRupee },
    { id: "expenses", label: "खर्चा (Expenses)", icon: Wallet },
    { id: "animals", label: "पशु लेन-देन (Animals)", icon: PawPrint },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300" style={{ background: T.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {/* Header Banner */}
      <header
        className="rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border shadow-lg gap-4 transition-all"
        style={{ 
          background: isDark ? "linear-gradient(135deg, #091322 0%, #064E3B 100%)" : T.primaryDark, 
          borderColor: isDark ? "#1F2937" : T.line 
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0" style={{ background: T.accent }}>
            <Droplets size={20} style={{ color: "#FFFFFF" }} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ fontFamily: "'Zilla Slab', serif" }} className="text-white text-lg sm:text-xl font-bold leading-none">
                {farmProfile?.farmName || "SHIVAJI MILK CENTER"}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                isDark 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
              }`}>
                PRO LIVE
              </span>
            </div>
            <p className="text-xs tracking-wide mt-0.5 font-medium" style={{ color: isDark ? "#FCD34D" : T.accentSoft }}>
              {farmProfile?.ownerName || "SATISH PATIDAR"} · Dairy Farming & Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isDark 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-xs' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-blue-300" />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            onClick={handleDashboardReload}
            disabled={isDbReloading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              dbReloadSuccess
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30'
                : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border-white/15'
            } ${isDbReloading ? 'opacity-75 cursor-wait' : ''}`}
            title="Reload from Database (डेटाबेस से पुनः लोड करें)"
          >
            <RefreshCw size={13} className={`text-emerald-400 ${isDbReloading ? 'animate-spin' : ''}`} />
            <span>{isDbReloading ? 'सिंक हो रहा है...' : (dbReloadSuccess ? '✓ सिंक सफल!' : 'डेटाबेस लिंक (सिंक)')}</span>
          </button>

          <div className="text-right hidden sm:block border-l border-white/20 pl-3">
            <div className="text-white text-xs font-bold">{todayFormattedDate}</div>
            <div className="text-[11px] font-semibold" style={{ color: isDark ? "#FCD34D" : T.accentSoft }}>
              आज का कुल दूध: {todayTotal} L
            </div>
          </div>
        </div>
      </header>

      {/* ⭐ ADVANCED FILTER CONTROL PANEL (Clean, Beautiful & Organized 3-Tier Layout) */}
      <section
        className="rounded-2xl border shadow-md transition-all overflow-hidden"
        style={{ 
          background: isDark ? "#111827" : T.surface, 
          borderColor: isDark ? "#1F2937" : T.line 
        }}
      >
        {/* TIER 1: QUICK PRESET PERIODS BAR */}
        <div 
          className={`p-3.5 sm:px-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isDark ? "border-slate-800/80 bg-slate-900/50" : "border-emerald-100 bg-emerald-50/30"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mr-1 ${
              isDark ? "text-emerald-400" : "text-emerald-800"
            }`}>
              <Filter size={15} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
              <span>अवधि (Period):</span>
            </div>

            {/* Quick Pills in Logical Sequence: Today -> Week -> This Month -> Last Month -> 3M -> This Year -> All */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { 
                  id: "today", 
                  label: "☀️ आज (Today)", 
                  action: () => {
                    setFilterMode("today");
                    setAppliedCustomRange(null);
                    const n = new Date();
                    setStartDateInput(formatLocalDate(n));
                    setEndDateInput(formatLocalDate(n));
                  }
                },
                { 
                  id: "this_week", 
                  label: "📅 यह हफ़्ता", 
                  action: () => {
                    setFilterMode("this_week");
                    setAppliedCustomRange(null);
                    const now = new Date();
                    const day = now.getDay();
                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(now.setDate(diff));
                    setStartDateInput(formatLocalDate(monday));
                    setEndDateInput(formatLocalDate(new Date()));
                  }
                },
                { 
                  id: "this_month", 
                  label: "🗓️ इस महीने (This Month)", 
                  action: () => {
                    setFilterMode("this_month");
                    setAppliedCustomRange(null);
                    const n = new Date();
                    setStartDateInput(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`);
                    setEndDateInput(formatLocalDate(n));
                  }
                },
                { 
                  id: "last_month", 
                  label: "⏪ पिछला महीना", 
                  action: () => {
                    setFilterMode("last_month");
                    setAppliedCustomRange(null);
                    const n = new Date();
                    const pmf = new Date(n.getFullYear(), n.getMonth() - 1, 1);
                    const pml = new Date(n.getFullYear(), n.getMonth(), 0);
                    setStartDateInput(formatLocalDate(pmf));
                    setEndDateInput(formatLocalDate(pml));
                  }
                },
                { 
                  id: "last_3_months", 
                  label: "📊 पिछले 3 माह", 
                  action: () => {
                    setFilterMode("last_3_months");
                    setAppliedCustomRange(null);
                    const n = new Date();
                    const threeM = new Date(n.getFullYear(), n.getMonth() - 2, 1);
                    setStartDateInput(formatLocalDate(threeM));
                    setEndDateInput(formatLocalDate(n));
                  }
                },
                { 
                  id: "this_year", 
                  label: "📆 इस साल", 
                  action: () => {
                    setFilterMode("this_year");
                    setAppliedCustomRange(null);
                    const n = new Date();
                    setStartDateInput(`${n.getFullYear()}-01-01`);
                    setEndDateInput(formatLocalDate(n));
                  }
                },
                { 
                  id: "all", 
                  label: "🌐 सम्पूर्ण (All Time)", 
                  action: () => {
                    setFilterMode("all");
                    setAppliedCustomRange(null);
                    setStartDateInput("2025-04-01");
                    setEndDateInput(formatLocalDate(new Date()));
                  }
                },
              ].map(p => {
                const isActive = filterMode === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={p.action}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md scale-[1.02]"
                        : isDark
                        ? "bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                        : "bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50 shadow-xs"
                    }`}
                  >
                    {isActive && <Check size={12} strokeWidth={3} />}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset All Filters button on right */}
          {(filterMode !== "this_month" || customerFilter || customerSearchInput || appliedCustomRange) && (
            <button
              onClick={() => {
                handleResetFilter();
                setCustomerFilter("");
                setCustomerSearchInput("");
              }}
              className={`self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isDark 
                  ? "bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/50" 
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              }`}
              title="सभी फ़िल्टर रीसेट करें"
            >
              <RotateCcw size={13} />
              <span>फ़िल्टर रीसेट (Reset)</span>
            </button>
          )}
        </div>

        {/* TIER 2: CUSTOM DATE RANGE & CUSTOMER FILTER */}
        <div className="p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3">
          {/* Custom Date Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1 text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              <Calendar size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
              <span>कस्टम तारीख (Custom Dates):</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              filterMode === "custom" 
                ? (isDark ? "border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50" : "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30")
                : (isDark ? "bg-slate-800/90 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800")
            }`}>
              <span className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>से (From):</span>
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className={`text-xs font-semibold bg-transparent outline-none cursor-pointer ${
                  isDark ? "text-slate-100" : "text-slate-800"
                }`}
              />
            </div>

            <span className={`text-xs font-black ${isDark ? "text-slate-500" : "text-slate-400"}`}>→</span>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              filterMode === "custom" 
                ? (isDark ? "border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50" : "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30")
                : (isDark ? "bg-slate-800/90 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800")
            }`}>
              <span className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>तक (To):</span>
              <input
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                className={`text-xs font-semibold bg-transparent outline-none cursor-pointer ${
                  isDark ? "text-slate-100" : "text-slate-800"
                }`}
              />
            </div>

            <button
              onClick={handleApplyCustomFilter}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check size={14} strokeWidth={3} />
              <span>लागू करें (Apply)</span>
            </button>
          </div>

          {/* Customer Dropdown Filter */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              customerFilter
                ? (isDark ? "border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/50" : "border-amber-500 bg-amber-50 ring-1 ring-amber-500/30")
                : (isDark ? "bg-slate-800/90 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800")
            }`}>
              <Users size={14} className={customerFilter ? "text-amber-400" : (isDark ? "text-emerald-400" : "text-emerald-700")} />
              <select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
                  setCustomerSearchInput("");
                }}
                className={`text-xs font-semibold bg-transparent outline-none cursor-pointer max-w-[210px] ${
                  isDark ? "text-slate-100" : "text-slate-800"
                }`}
              >
                <option value="" className={isDark ? "bg-slate-900 text-slate-200" : ""}>👥 सभी ग्राहक (All Customers)</option>
                {customerSummaryList.map(c => (
                  <option key={c.name} value={c.name} className={isDark ? "bg-slate-900 text-slate-200" : ""}>
                    {c.name} ({c.morningLiters > 0 ? `🌅 ${c.morningLiters}L` : ''}{c.morningLiters > 0 && c.eveningLiters > 0 ? ' · ' : ''}{c.eveningLiters > 0 ? `🌇 ${c.eveningLiters}L` : ''})
                  </option>
                ))}
              </select>
              {customerFilter && (
                <button
                  onClick={() => { setCustomerFilter(""); setCustomerSearchInput(""); }}
                  className="hover:text-rose-400 p-0.5 rounded cursor-pointer"
                  title="ग्राहक फ़िल्टर हटाएं"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TIER 3: ACTIVE FILTER STATUS STRIP */}
        <div className={`px-4 sm:px-5 py-2.5 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${
          isDark ? "border-slate-800/80 bg-slate-900/30 text-slate-400" : "border-slate-100 bg-slate-50/50 text-slate-600"
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold border shadow-xs ${
              isDark 
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700" 
                : "bg-emerald-100 text-emerald-900 border-emerald-200"
            }`}>
              <Clock size={12} />
              <span>{activeRange.label}</span>
            </span>

            <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {activeRange.subtitle}
            </span>

            {(customerFilter || customerSearchInput) && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold border ${
                isDark 
                  ? "bg-amber-950/80 text-amber-300 border-amber-800" 
                  : "bg-amber-100 text-amber-900 border-amber-300"
              }`}>
                <Users size={12} />
                <span>
                  ग्राहक: <strong>{customerFilter || customerSearchInput}</strong> · 🌅 सुबह: <strong>{activeCustomerStats?.morningLiters || periodCustomerMorningLiters} L</strong> · 🌇 शाम: <strong>{activeCustomerStats?.eveningLiters || periodCustomerEveningLiters} L</strong> (कुल: <strong>{activeCustomerStats?.totalLiters || periodCustomerLiters} L</strong>)
                </span>
                <button
                  onClick={() => { setCustomerFilter(""); setCustomerSearchInput(""); }}
                  className="hover:text-rose-400 ml-1 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          <div className={`flex items-center gap-3 text-xs font-bold ${isDark ? "text-emerald-400" : "text-emerald-800"}`}>
            <span>⏱️ {activeRange.daysCount ? `अवधि: ${activeRange.daysCount} दिन` : 'सम्पूर्ण रिकॉर्ड्स'}</span>
            <span>•</span>
            <span>📦 {customerFilteredSales.length + filteredDairySales.length} प्रविष्टियाँ</span>
            <span>•</span>
            <span>🥛 {Number(((customerFilter && activeCustomerStats ? activeCustomerStats.totalLiters : periodCustomerLiters) + periodDairyLiters).toFixed(1))} L कुल दूध</span>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all shadow-xs cursor-pointer"
              style={{
                background: active ? (isDark ? "#059669" : T.primary) : (isDark ? "#111827" : T.surface),
                color: active ? "#FFFFFF" : (isDark ? "#9CA3AF" : T.ink),
                border: `1px solid ${active ? (isDark ? "#059669" : T.primary) : (isDark ? "#1F2937" : T.line)}`,
              }}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* 9 Core Stat Cards Grid (Filtered in Real-Time) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Total Milk Production */}
            <StatCard
              icon={Droplets}
              label="🥛 Total Milk Production"
              value={`${filterMode === "today" ? todayTotal : periodTotalMilk} L`}
              sub={
                filterMode === "today"
                  ? `औसत: ${currentMonthStats.avgDaily} L/दिन (माह औसत · ${currentMonthStats.daysElapsed} दिन)`
                  : `औसत: ${periodDailyAvgMilk} L/दिन (${activeRange.daysCount ? `${activeRange.daysCount} दिन का औसत` : activeRange.label})`
              }
              trail={
                <span className={`text-[11px] font-bold flex flex-wrap items-center gap-1 ${isDark ? "text-emerald-300" : "text-emerald-200"}`}>
                  <span>🌅 सुबह: <strong>{filterMode === "today" ? todayMorningYield : periodMilkMorning} L</strong></span>
                  <span>+</span>
                  <span>🌇 शाम: <strong>{filterMode === "today" ? todayEveningYield : periodMilkEvening} L</strong></span>
                  <span>=</span>
                  <span>🥛 कुल: <strong>{filterMode === "today" ? todayTotal : periodTotalMilk} L</strong></span>
                </span>
              }
              tone="primary"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('milk')}
            />

            {/* 2. Customer Sale */}
            <StatCard
              icon={Users}
              label={customerFilter ? `👥 ${customerFilter} (बिक्री)` : "👥 Customer Sale"}
              value={fmt(displayCustAmount)}
              sub={
                filterMode === "today"
                  ? `कुल: ${displayCustLiters} L · औसत दर: ₹${displayCustAvgRate}/L`
                  : `औसत: ${displayDailyAvgCustomerLiters} L/दिन (${activeRange.daysCount ? `${activeRange.daysCount} दिन का औसत` : activeRange.label})`
              }
              trail={
                <div className="space-y-1 w-full">
                  <div className={`text-[11px] font-black flex flex-wrap items-center gap-1 ${isDark ? "text-amber-300" : "text-amber-950"}`}>
                    <span>🌅 सुबह: <strong>{displayCustMorningLiters} L</strong></span>
                    <span>+</span>
                    <span>🌇 शाम: <strong>{displayCustEveningLiters} L</strong></span>
                    <span>=</span>
                    <span>🥛 कुल दूध: <strong>{displayCustLiters} L</strong> <span className="opacity-90 font-bold">({displayDailyAvgCustomerLiters} L/दिन)</span></span>
                  </div>
                  <div className={`text-[10px] font-bold flex items-center justify-between ${isDark ? "text-amber-200" : "text-amber-900"}`}>
                    <span>💰 औसत दर: <strong>₹{displayCustAvgRate} / L</strong> · दैनिक: <strong>{fmt(displayDailyAvgCustomerAmount)}/दिन</strong></span>
                    <span className="opacity-80">{customerFilter ? `चयनित ग्राहक` : `${customerFilteredSales.length} प्रविष्टियां`}</span>
                  </div>
                </div>
              }
              tone="accent"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('customers')}
            />

            {/* 3. Dairy Sale */}
            <StatCard
              icon={Store}
              label="🏪 Dairy Sale"
              value={fmt(periodDairyTotal)}
              sub={
                filterMode === "today"
                  ? `${periodDairyLiters} L थोक प्लांट में`
                  : `औसत: ${periodDailyAvgDairyLiters} L/दिन (${activeRange.daysCount ? `${activeRange.daysCount} दिन का औसत` : activeRange.label})`
              }
              trail={
                <span className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  🥛 कुल: {periodDairyLiters} L थोक · दर: ₹{(periodDairyLiters > 0 ? (periodDairyTotal / periodDairyLiters) : 58).toFixed(2)}/L
                </span>
              }
              tone="ghost"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('selling')}
            />

            {/* 4. Total Sales */}
            <StatCard
              icon={Landmark}
              label="💰 Total Sales"
              value={fmt(periodCombinedSales)}
              sub={
                filterMode === "today"
                  ? `आज की कुल बिक्री राशि`
                  : `औसत: ${fmt(periodDailyAvgTotalSalesAmount)}/दिन (${activeRange.daysCount ? `${activeRange.daysCount} दिन का औसत` : activeRange.label})`
              }
              trail={
                <span className={`text-[11px] font-bold ${isDark ? "text-emerald-300" : "text-emerald-200"}`}>
                  Customer {fmt(periodCustomerTotal)} + Dairy {fmt(periodDairyTotal)}
                </span>
              }
              tone="primary"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('selling')}
            />

            {/* 5. ⭐ Combined Average Milk Price (औसत दूध भाव ₹/L) */}
            <StatCard
              icon={Calculator}
              label="⚡ Average Milk Price"
              value={`₹${periodCombinedAvgRate} / L`}
              sub={`Customer + Dairy संयुक्त औसत दर`}
              trail={
                <span className={`text-[11px] font-bold ${isDark ? "text-amber-200" : "text-amber-950"}`}>
                  👥 ग्राहक: ₹{displayCustAvgRate}/L · 🏪 डेयरी: ₹{periodDairyAvgRate}/L
                </span>
              }
              tone="accent"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('selling')}
            />

            {/* 6. Total Expense */}
            <StatCard
              icon={Receipt}
              label="💸 Total Expense"
              value={fmt(periodExpenses)}
              sub={`चारा, दवा, मजदूरी (${activeRange.label})`}
              tone="red"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('expenses')}
            />

            {/* 6. Net Profit */}
            <StatCard
              icon={periodNetProfit >= 0 ? TrendingUp : TrendingDown}
              label="📈 Net Profit"
              value={fmt(periodNetProfit)}
              sub={`बिक्री − खर्च (${activeRange.label})`}
              tone={periodNetProfit >= 0 ? "accent" : "red"}
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('accounts')}
            />

            {/* 7. Animal Stock */}
            <StatCard
              icon={PawPrint}
              label="🐃 Animal Stock"
              value={`${totalStock} पशु`}
              sub={`${herdCounts.cow} गाय · ${herdCounts.buffalo} भैंस · ${herdCounts.calves} बच्चे`}
              trail={
                herdCounts.calves > 0 ? (
                  <span className={`text-[11px] font-bold ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                    🍼 {herdCounts.keda} केड़ा (नर) · {herdCounts.kedi} केडी (मादा)
                  </span>
                ) : null
              }
              tone="ghost"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('animals')}
            />

            {/* 8. Animal Purchase */}
            <StatCard
              icon={ArrowDownCircle}
              label="🔄 Animal Purchase"
              value={fmt(periodAnimalPurchases)}
              sub={`${periodAnimalPurchaseCount} पशु पूंजी निवेश`}
              tone="red"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('animals')}
            />

            {/* 9. Animal Sale */}
            <StatCard
              icon={ArrowUpCircle}
              label="🐄 Animal Sale"
              value={fmt(periodAnimalSales)}
              sub={`${periodAnimalSaleCount} पशु बिक्री राजस्व`}
              tone="accent"
              isDark={isDark}
              onClick={() => onNavigate && onNavigate('animal-sales')}
            />
          </div>

          {/* Charts Row: Milk Yield + Animal Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionCard
                title={`दूध उत्पादन ट्रेंड (${activeRange.label})`}
                subtitle={`Morning & evening milk yield trend for ${activeRange.subtitle}`}
                isDark={isDark}
                right={
                  <button
                    onClick={() => onNavigate && onNavigate('milk')}
                    className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      isDark ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-800 hover:text-emerald-950"
                    }`}
                  >
                    <span>दूध रजिस्टर देखें</span>
                    <ChevronRight size={14} />
                  </button>
                }
              >
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={periodMilkChartData}>
                    <CartesianGrid stroke={isDark ? "#374151" : T.line} vertical={false} strokeDasharray="3 3" opacity={0.6} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? "#9CA3AF" : T.inkSoft }} axisLine={{ stroke: isDark ? "#374151" : T.line }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? "#9CA3AF" : T.inkSoft }} axisLine={false} tickLine={false} unit="L" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        borderColor: isDark ? "#374151" : T.line,
                        color: isDark ? "#F9FAFB" : T.ink,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                      }}
                      formatter={(val) => [`${val} L`, 'मात्रा']}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: isDark ? "#E5E7EB" : "#374151" }} />
                    <Line type="monotone" dataKey="morning" name="सुबह (Morning)" stroke={isDark ? "#10B981" : T.primary} strokeWidth={2.8} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="evening" name="शाम (Evening)" stroke={isDark ? "#F59E0B" : T.accent} strokeWidth={2.8} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            <SectionCard title="पशु लेन-देन सार" subtitle="Livestock Capital & Summary" isDark={isDark}>
              <div className="space-y-3.5">
                <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  isDark ? "bg-slate-800/80 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-xs font-bold" style={{ color: isDark ? "#E5E7EB" : T.ink }}>कुल खरीद (Purchases)</span>
                  <span className="font-bold text-sm" style={{ color: isDark ? "#F87171" : T.red, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(periodAnimalPurchases)}</span>
                </div>
                <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  isDark ? "bg-slate-800/80 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-xs font-bold" style={{ color: isDark ? "#E5E7EB" : T.ink }}>कुल बिक्री (Sales)</span>
                  <span className="font-bold text-sm" style={{ color: isDark ? "#34D399" : T.primary, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(periodAnimalSales)}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl shadow-xs" style={{ background: isDark ? "#064E3B" : T.primaryDark }}>
                  <span className="text-xs font-bold text-white">शुद्ध निवेश / अंतर (Net)</span>
                  <span className="font-bold text-sm text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(periodAnimalPurchases - periodAnimalSales)}</span>
                </div>

                <button
                  onClick={() => onNavigate && onNavigate('animal-sales')}
                  className="w-full mt-2 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white transition-all text-center shadow-xs cursor-pointer"
                >
                  🏷️ CATTLE SALES HUB (पशु बिक्री पोर्टल)
                </button>
              </div>
            </SectionCard>
          </div>

          {/* Section: Dairy + Customer Sales Trend & Net Profit BarChart */}
          <SectionCard
            title={`डेयरी + ग्राहक कुल बिक्री (${activeRange.label})`}
            subtitle={`Combined sales trend & net profit analysis for ${activeRange.subtitle}`}
            isDark={isDark}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={periodSalesChartData}>
                    <CartesianGrid stroke={isDark ? "#374151" : T.line} vertical={false} strokeDasharray="3 3" opacity={0.6} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? "#9CA3AF" : T.inkSoft }} axisLine={{ stroke: isDark ? "#374151" : T.line }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? "#9CA3AF" : T.inkSoft }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        borderColor: isDark ? "#374151" : T.line,
                        color: isDark ? "#F9FAFB" : T.ink,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                      }}
                      formatter={(v) => fmt(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: isDark ? "#E5E7EB" : "#374151" }} />
                    <Bar dataKey="customer" name="ग्राहक (Customer)" fill={isDark ? "#F59E0B" : T.accent} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="dairy" name="डेयरी (Dairy)" fill={isDark ? "#10B981" : T.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center gap-2.5">
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className={`text-xs font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>कुल बिक्री (Total Sales)</div>
                  <div style={{ fontFamily: "'Zilla Slab', serif", color: isDark ? "#F9FAFB" : T.ink }} className="text-2xl font-black mt-0.5">{fmt(periodCombinedSales)}</div>
                  <div className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-emerald-400" : "text-emerald-800"}`}>
                    Customer {fmt(periodCustomerTotal)} + Dairy {fmt(periodDairyTotal)}
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-amber-950/60 border-amber-800 text-amber-200" : "border-amber-300 bg-amber-50/80 text-amber-950"
                }`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-amber-400" : "text-amber-900"}`}>औसत दूध दर (Combined Avg Rate)</div>
                  <div style={{ fontFamily: "'Zilla Slab', serif" }} className="text-xl font-black mt-0.5">₹{periodCombinedAvgRate} / L</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                    खुदरा: ₹{periodCustomerAvgRate}/L · थोक: ₹{periodDairyAvgRate}/L
                  </div>
                </div>

                <div className="p-3.5 rounded-xl flex items-center justify-between shadow-xs" style={{ background: periodNetProfit >= 0 ? (isDark ? "#064E3B" : T.primary) : (isDark ? "#881337" : T.red) }}>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-white/80">शुद्ध लाभ (Net Profit)</div>
                    <div style={{ fontFamily: "'Zilla Slab', serif" }} className="text-xl font-bold text-white mt-0.5">{fmt(periodNetProfit)}</div>
                  </div>
                  {periodNetProfit >= 0 ? <TrendingUp size={24} className="text-white" /> : <TrendingDown size={24} className="text-white" />}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 2: MILK PRODUCTION */}
      {tab === "milk" && (
        <SectionCard
          title="दूध उत्पादन रिकॉर्ड (Milk Production)"
          subtitle="Total milk production — morning & evening yield entries"
          isDark={isDark}
          right={
            <AddRow
              isDark={isDark}
              buttonLabel="नई एंट्री (Add Milk)"
              fields={[
                { key: "date", label: "Date (तारीख)", type: "date", width: 130 },
                { key: "shift", label: "Shift (शिफ्ट)", type: "select", options: ["morning", "evening"], width: 110 },
                { key: "quantity", label: "मात्रा (L)", type: "number", width: 90 },
                { key: "fat", label: "FAT %", type: "number", width: 75, placeholder: "6.5" },
              ]}
              onAdd={(v) => {
                addMilkEntry({
                  entryMode: "bulk_total",
                  date: v.date || todayStr,
                  shift: v.shift || "morning",
                  quantity: Number(v.quantity || 0),
                  fat: Number(v.fat || 6.5),
                  snf: 9.0,
                  animalName: "Bulk Total Production",
                  animalType: "buffalo"
                });
              }}
            />
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-1.5"><Sunrise size={16} style={{ color: isDark ? "#F59E0B" : T.accent }} /> कुल सुबह: <b style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{todayMorningYield} L</b></div>
            <div className="flex items-center gap-1.5"><Sunset size={16} style={{ color: isDark ? "#10B981" : T.primary }} /> कुल शाम: <b style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{todayEveningYield} L</b></div>
            <div className="flex items-center gap-1.5">7 दिन कुल: <b style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{weekMilkTotal.toFixed(1)} L</b></div>
          </div>
          <DataTable
            isDark={isDark}
            columns={[
              { key: "date", label: "Date (तारीख)" },
              { key: "shift", label: "Shift", render: (v) => <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${v === 'morning' ? (isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-900') : (isDark ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-indigo-100 text-indigo-900')}`}>{v === 'morning' ? '🌅 सुबह' : '🌇 शाम'}</span> },
              { key: "animalName", label: "विवरण / पशु" },
              { key: "quantity", label: "मात्रा (L)", mono: true, render: (v) => `${v} L` },
              { key: "fat", label: "FAT / SNF", mono: true, render: (v, r) => `${v || 0}% / ${r.snf || 0}%` }
            ]}
            rows={filteredMilkEntries.length > 0 ? filteredMilkEntries : milkEntries.slice(0, 50)}
            onDelete={deleteMilkEntry}
            emptyText="इस चयनित अवधि में कोई दूध संकलन रिकॉर्ड नहीं है"
          />
        </SectionCard>
      )}

      {/* TAB 3: SALES */}
      {tab === "sales" && (
        <div className="space-y-6">
          <SectionCard
            title={`ग्राहक बिक्री - Customer Retail Sales (${activeRange.label})`}
            subtitle="Direct retail milk deliveries to customers with customer filter"
            isDark={isDark}
            right={
              <AddRow
                isDark={isDark}
                buttonLabel="नई ग्राहक बिक्री"
                fields={[
                  { key: "date", label: "Date", type: "date", width: 130 },
                  { key: "shift", label: "Shift", type: "select", options: ["morning", "evening"], width: 110 },
                  { key: "customer", label: "ग्राहक नाम", width: 140, placeholder: "e.g. Ramesh" },
                  { key: "liters", label: "Liters", type: "number", width: 80 },
                  { key: "rate", label: "दर/L", type: "number", width: 80, placeholder: "70" },
                ]}
                onAdd={(v) => {
                  addCustomerSale({
                    date: v.date || todayStr,
                    shift: v.shift || "morning",
                    customerName: v.customer || "Customer",
                    quantity: Number(v.liters || 0),
                    rate: Number(v.rate || 70),
                    amount: Number(v.liters || 0) * Number(v.rate || 70)
                  });
                }}
              />
            }
          >
            {/* 🔍 CUSTOMER FILTER TOOLBAR */}
            <div className={`mb-4 p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
              isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className={`flex items-center gap-1.5 text-xs font-black ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  <Filter size={15} className={isDark ? "text-emerald-400" : "text-emerald-700"} />
                  <span>ग्राहक फ़िल्टर (Customer Filter):</span>
                </div>

                {/* Dropdown Selector */}
                <select
                  value={customerFilter}
                  onChange={(e) => {
                    setCustomerFilter(e.target.value);
                    setCustomerSearchInput("");
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none shadow-xs cursor-pointer max-w-[260px] ${
                    isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-800"
                  }`}
                >
                  <option value="" className={isDark ? "bg-slate-900 text-slate-100" : ""}>सभी ग्राहक (All Customers - {customerSummaryList.length})</option>
                  {customerSummaryList.map(c => (
                    <option key={c.name} value={c.name} className={isDark ? "bg-slate-900 text-slate-100" : ""}>
                      {c.name} (🌅 {c.morningLiters}L · 🌇 {c.eveningLiters}L · कुल: {c.totalLiters} L)
                    </option>
                  ))}
                </select>

                {/* Live Search Input Box */}
                <div className="relative flex-1 min-w-[200px] max-w-[320px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearchInput}
                    onChange={(e) => {
                      setCustomerSearchInput(e.target.value);
                      if (customerFilter) setCustomerFilter("");
                    }}
                    placeholder="ग्राहक नाम से खोजें..."
                    className={`w-full pl-8 pr-7 py-1.5 text-xs font-semibold rounded-xl border outline-none shadow-xs ${
                      isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300 text-slate-800"
                    }`}
                  />
                  {(customerFilter || customerSearchInput) && (
                    <button
                      onClick={() => {
                        setCustomerFilter("");
                        setCustomerSearchInput("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      title="फ़िल्टर साफ़ करें"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {(customerFilter || customerSearchInput) && (
                  <button
                    onClick={() => {
                      setCustomerFilter("");
                      setCustomerSearchInput("");
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      isDark ? "text-rose-300 bg-rose-950/80 hover:bg-rose-900 border-rose-800" : "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                    }`}
                  >
                    <RotateCcw size={12} />
                    <span>रीसेट</span>
                  </button>
                )}
              </div>

              <div className={`text-[11px] font-bold self-end md:self-auto px-2.5 py-1 rounded-xl border ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white/80 border-slate-200 text-slate-600"
              }`}>
                रिकॉर्ड्स: <span className={isDark ? "text-emerald-400 font-extrabold" : "text-emerald-800 font-extrabold"}>{customerFilteredSales.length}</span> / {filteredCustomerSales.length}
              </div>
            </div>

            {/* ⭐ SELECTED CUSTOMER STATS BANNER */}
            {activeCustomerStats && (
              <div className={`mb-4 p-4 rounded-2xl border shadow-xs animate-in fade-in duration-200 ${
                isDark ? "bg-emerald-950/60 border-emerald-800 text-slate-100" : "bg-emerald-50/90 border-emerald-300"
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                  isDark ? "border-emerald-800" : "border-emerald-200"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      {activeCustomerStats.query.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        <span className={isDark ? "text-white" : "text-emerald-950"}>{activeCustomerStats.query}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isDark ? "bg-emerald-900 text-emerald-300 border-emerald-700" : "bg-emerald-200 text-emerald-900 border-emerald-300"
                        }`}>
                          चयनित ग्राहक
                        </span>
                      </div>
                      <div className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                        अवधि: {activeRange.label} ({activeRange.start} से {activeRange.end})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-800"}`}>कुल बिल राशि</div>
                    <div style={{ fontFamily: "'Zilla Slab', serif" }} className={`text-2xl font-black ${isDark ? "text-emerald-300" : "text-emerald-950"}`}>
                      {fmt(activeCustomerStats.totalAmount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className={`p-2.5 rounded-xl border shadow-2xs ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                  }`}>
                    <div className={`text-[10px] uppercase font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>कुल दूध मात्रा</div>
                    <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#34D399" : "#064E3B" }}>
                      {activeCustomerStats.totalLiters} L
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border shadow-2xs ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                  }`}>
                    <div className={`text-[10px] uppercase font-bold flex items-center gap-1 ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                      <Sunrise size={11} /> सुबह का दूध
                    </div>
                    <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#FBBF24" : "#78350F" }}>
                      {activeCustomerStats.morningLiters} L
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border shadow-2xs ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                  }`}>
                    <div className={`text-[10px] uppercase font-bold flex items-center gap-1 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                      <Sunset size={11} /> शाम का दूध
                    </div>
                    <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#818CF8" : "#312E81" }}>
                      {activeCustomerStats.eveningLiters} L
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border shadow-2xs ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                  }`}>
                    <div className={`text-[10px] uppercase font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>कुल डिलीवरी / औसत दर</div>
                    <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#F3F4F6" : "#0F172A" }}>
                      {activeCustomerStats.count} दिन · ₹{activeCustomerStats.avgRate}/L
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!activeCustomerStats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
                <div className={`p-2.5 rounded-xl border shadow-2xs ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                }`}>
                  <div className={`text-[10px] uppercase font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>कुल ग्राहक दूध</div>
                  <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#34D399" : "#064E3B" }}>
                    {periodCustomerLiters} L
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border shadow-2xs ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                }`}>
                  <div className={`text-[10px] uppercase font-bold flex items-center gap-1 ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                    <Sunrise size={11} /> सुबह (Morning)
                  </div>
                  <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#FBBF24" : "#78350F" }}>
                    {periodCustomerMorningLiters} L
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border shadow-2xs ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                }`}>
                  <div className={`text-[10px] uppercase font-bold flex items-center gap-1 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                    <Sunset size={11} /> शाम (Evening)
                  </div>
                  <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#818CF8" : "#312E81" }}>
                    {periodCustomerEveningLiters} L
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border shadow-2xs ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                }`}>
                  <div className={`text-[10px] uppercase font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}>औसत दर (Avg Rate)</div>
                  <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#FBBF24" : "#B45309" }}>
                    ₹{periodCustomerAvgRate}/L
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border shadow-2xs col-span-2 sm:col-span-1 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-200"
                }`}>
                  <div className={`text-[10px] uppercase font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>कुल बिक्री राशि</div>
                  <div className="text-base font-black mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#F3F4F6" : "#0F172A" }}>
                    {fmt(periodCustomerTotal)}
                  </div>
                </div>
              </div>
            )}

            <DataTable
              isDark={isDark}
              columns={[
                { key: "date", label: "Date (तारीख)" },
                {
                  key: "shift",
                  label: "Shift (शिफ्ट)",
                  render: (v) => {
                    const isMorning = !isEveningShift(v);
                    return (
                      <span className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${
                        isMorning 
                          ? (isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-900 border-amber-200') 
                          : (isDark ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-900 border-indigo-200')
                      }`}>
                        {isMorning ? '🌅 सुबह' : '🌇 शाम'}
                      </span>
                    );
                  }
                },
                { key: "customerName", label: "ग्राहक का नाम" },
                { key: "quantity", label: "मात्रा (L)", mono: true, render: (v, r) => `${v || r.liters || 0} L` },
                { key: "rate", label: "दर/L", mono: true, render: (v) => fmt(v || 70) },
                { key: "amount", label: "कुल राशि", mono: true, render: (v, r) => fmt(v || ((r.quantity || r.liters || 0) * (r.rate || 70))) },
              ]}
              rows={customerFilteredSales}
              onDelete={deleteCustomerSale}
              emptyText={
                (customerFilter || customerSearchInput)
                  ? `ग्राहक "${customerFilter || customerSearchInput}" का इस चयनित अवधि में कोई रिकॉर्ड नहीं मिला`
                  : "इस चयनित अवधि में कोई ग्राहक बिक्री दर्ज नहीं"
              }
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3.5 gap-2 border-t pt-3" style={{ borderColor: isDark ? "#1F2937" : T.line }}>
              <div className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-600"} flex flex-wrap items-center gap-1.5`}>
                <span>{(customerFilter || customerSearchInput) ? `चयनित ग्राहक: ${customerFilter || customerSearchInput}` : `सभी ग्राहक कुल (${activeRange.label})`}</span>
                <span className="hidden sm:inline opacity-40">•</span>
                <span className="text-amber-500 font-extrabold">🌅 {activeCustomerStats ? activeCustomerStats.morningLiters : periodCustomerMorningLiters} L</span>
                <span>+</span>
                <span className="text-indigo-500 font-extrabold">🌇 {activeCustomerStats ? activeCustomerStats.eveningLiters : periodCustomerEveningLiters} L</span>
                <span>=</span>
                <span className="text-emerald-500 font-extrabold">🥛 कुल: {activeCustomerStats ? activeCustomerStats.totalLiters : periodCustomerLiters} L</span>
                <span className="hidden sm:inline opacity-40">•</span>
                <span className="text-cyan-400 font-extrabold">📊 औसत: {displayDailyAvgCustomerLiters} L/दिन</span>
                <span className="hidden sm:inline opacity-40">•</span>
                <span className="text-amber-400 font-extrabold">💰 औसत दर: ₹{displayCustAvgRate}/L</span>
              </div>
              <div className="text-right text-sm font-black" style={{ color: isDark ? "#34D399" : T.primary }}>
                कुल राशि: {fmt(activeCustomerStats ? activeCustomerStats.totalAmount : periodCustomerTotal)}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={`डेयरी बिक्री - Wholesale Plant Sales (${activeRange.label})`}
            subtitle="Bulk sales to dairy chilling center / plant with FAT & SNF"
            isDark={isDark}
            right={
              <AddRow
                isDark={isDark}
                buttonLabel="नई डेयरी बिक्री"
                fields={[
                  { key: "date", label: "Date", type: "date", width: 130 },
                  { key: "dairyName", label: "डेयरी नाम", width: 140, placeholder: "HARIHAR DAIRY" },
                  { key: "liters", label: "Liters", type: "number", width: 80 },
                  { key: "rate", label: "दर/L", type: "number", width: 80, placeholder: "42" },
                ]}
                onAdd={(v) => {
                  addDairySale({
                    date: v.date || todayStr,
                    dairyName: v.dairyName || "HARIHAR DAIRY",
                    quantity: Number(v.liters || 0),
                    rate: Number(v.rate || 42),
                    totalAmount: Number(v.liters || 0) * Number(v.rate || 42),
                    shift: "morning"
                  });
                }}
              />
            }
          >
            <DataTable
              isDark={isDark}
              columns={[
                { key: "date", label: "Date" },
                { key: "dairyName", label: "डेयरी प्लांट" },
                { key: "quantity", label: "Liters", mono: true, render: (v, r) => `${v || r.liters || 0} L` },
                { key: "rate", label: "दर/L", mono: true, render: (v) => fmt(v || 42) },
                { key: "totalAmount", label: "कुल राशि", mono: true, render: (v, r) => fmt(v || r.amount || ((r.quantity || r.liters || 0) * (r.rate || 42))) },
              ]}
              rows={filteredDairySales.length > 0 ? filteredDairySales : dairySales.slice(0, 50)}
              onDelete={deleteDairySale}
              emptyText="इस चयनित अवधि में कोई डेयरी बिक्री दर्ज नहीं"
            />
            <div className="text-right mt-3 text-sm font-black" style={{ color: isDark ? "#34D399" : T.primary }}>
              कुल डेयरी बिक्री ({activeRange.label}): {fmt(periodDairyTotal)} ({periodDairyLiters} L)
            </div>
          </SectionCard>

          <div className="rounded-2xl p-5 flex items-center justify-between shadow-md" style={{ background: isDark ? "#064E3B" : T.primaryDark }}>
            <span className="text-white font-extrabold text-sm sm:text-base">डेयरी + ग्राहक कुल बिक्री ({activeRange.label})</span>
            <span className="text-white text-xl sm:text-2xl font-black" style={{ fontFamily: "'Zilla Slab', serif" }}>{fmt(periodCombinedSales)}</span>
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSES */}
      {tab === "expenses" && (
        <SectionCard
          title={`खर्चा प्रबंधन - Expense Management (${activeRange.label})`}
          subtitle="Feed, medicine, labor & other dairy farm expenses"
          isDark={isDark}
          right={
            <AddRow
              isDark={isDark}
              buttonLabel="नया खर्चा (Add Expense)"
              fields={[
                { key: "date", label: "Date", type: "date", width: 130 },
                { key: "category", label: "श्रेणी", type: "select", options: ["feed", "medicine", "labor", "utility", "other"], width: 130 },
                { key: "title", label: "विवरण / नोट", width: 140, placeholder: "e.g. भूसा + खल" },
                { key: "amount", label: "राशि (₹)", type: "number", width: 90 },
              ]}
              onAdd={(v) => {
                addExpense({
                  date: v.date || todayStr,
                  category: v.category || "feed",
                  title: v.title || "Expense",
                  amount: Number(v.amount || 0),
                  paymentMode: "cash"
                });
              }}
            />
          }
        >
          <DataTable
            isDark={isDark}
            columns={[
              { key: "date", label: "Date" },
              { key: "category", label: "श्रेणी", render: (v) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700'}`}>{v}</span> },
              { key: "title", label: "विवरण / नोट" },
              { key: "amount", label: "राशि", mono: true, render: (v) => fmt(v) },
            ]}
            rows={filteredExpenses.length > 0 ? filteredExpenses : expenses.slice(0, 50)}
            onDelete={deleteExpense}
            emptyText="इस चयनित अवधि में कोई खर्चा दर्ज नहीं"
          />
          <div className="text-right mt-3 text-sm font-black" style={{ color: isDark ? "#F87171" : T.red }}>
            कुल खर्चा ({activeRange.label}): {fmt(periodExpenses)}
          </div>
        </SectionCard>
      )}

      {/* TAB 5: ANIMALS */}
      {tab === "animals" && (
        <SectionCard
          title="पशु खरीद व बिक्री प्रबंधन (Animal Ledger)"
          subtitle="Cattle purchase & sale management with live database sync"
          isDark={isDark}
          right={
            <button
              onClick={() => onNavigate && onNavigate('animal-sales')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              🏷️ ANIMAL SALES HUB
            </button>
          }
        >
          <DataTable
            isDark={isDark}
            columns={[
              { key: "saleDate", label: "Date", render: (v, r) => v || r.purchaseDate || r.dob || todayStr },
              { key: "animalName", label: "पशु नाम" },
              { key: "tagNo", label: "टैग नं.", mono: true },
              { key: "animalType", label: "प्रकार", render: (v) => v === 'cow' ? '🐄 Cow' : '🐃 Buffalo' },
              { key: "buyerName", label: "खरीदार", render: (v) => v || 'Farm Asset' },
              { key: "salePrice", label: "बिक्री मूल्य", mono: true, render: (v, r) => fmt(v || r.paidAmount || 0) }
            ]}
            rows={(filteredCattleSales.length > 0 ? filteredCattleSales : cattleSales).slice(0, 50)}
            onDelete={deleteCattleSale}
            emptyText="अभी कोई पशु बिक्री रिकॉर्ड नहीं है। 'ANIMAL SALES HUB' में जाकर नया पशु बेचें।"
          />
          <div className={`flex flex-wrap justify-end gap-6 mt-4 text-xs sm:text-sm font-black pt-3 border-t ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}>
            <span style={{ color: isDark ? "#F87171" : T.red }}>कुल पशु खरीद (Herd Assets): {fmt(periodAnimalPurchases)}</span>
            <span style={{ color: isDark ? "#34D399" : T.primary }}>कुल पशु बिक्री (Sales Revenue): {fmt(periodAnimalSales)}</span>
          </div>
        </SectionCard>
      )}
    </div>
  );
};
