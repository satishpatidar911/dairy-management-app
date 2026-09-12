import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  Droplets, Users, Truck, Wallet, TrendingUp, TrendingDown, Plus, Trash2,
  Sunrise, Sunset, IndianRupee, PawPrint, LayoutGrid, X, Store, Receipt,
  ArrowDownCircle, ArrowUpCircle, Landmark, RotateCcw, Printer, Sparkles
} from "lucide-react";

// ---------- Design tokens ----------
// Barn green / cream-milk / butter accent / kumkum red for outflows
const T = {
  bg: "#FAF6EC",
  surface: "#FFFFFF",
  ink: "#20301F",
  inkSoft: "#5B6B57",
  primary: "#2F4B3C",
  primaryDark: "#1B2A22",
  accent: "#E3A73D",
  accentSoft: "#F3D68E",
  red: "#B8453B",
  line: "#E1D6BC",
};

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
`;

// ---------- initial seed data ----------
const defaultSeedMilk = [
  { date: "21 Aug", morning: 145, evening: 130 },
  { date: "22 Aug", morning: 148, evening: 132 },
  { date: "23 Aug", morning: 150, evening: 128 },
  { date: "24 Aug", morning: 152, evening: 135 },
  { date: "25 Aug", morning: 149, evening: 131 },
  { date: "26 Aug", morning: 155, evening: 138 },
  { date: "27 Aug", morning: 158, evening: 140 },
];

const defaultSeedCustomerSales = [
  { id: 1, date: "27 Aug", customer: "Sharma जी", liters: 8, rate: 60, amount: 480 },
  { id: 2, date: "27 Aug", customer: "Verma निवास", liters: 5, rate: 60, amount: 300 },
  { id: 3, date: "26 Aug", customer: "Gupta स्टोर", liters: 12, rate: 58, amount: 696 },
  { id: 4, date: "25 Aug", customer: "Sharma जी", liters: 8, rate: 60, amount: 480 },
];

const defaultSeedDairySales = [
  { id: 1, date: "27 Aug", liters: 210, rate: 42, amount: 8820 },
  { id: 2, date: "26 Aug", liters: 205, rate: 42, amount: 8610 },
  { id: 3, date: "25 Aug", liters: 198, rate: 41, amount: 8118 },
];

const defaultSeedExpenses = [
  { id: 1, date: "26 Aug", category: "चारा (Feed)", note: "भूसा + खल", amount: 3200 },
  { id: 2, date: "25 Aug", category: "दवाई (Medicine)", note: "पशु चिकित्सक विज़िट", amount: 900 },
  { id: 3, date: "24 Aug", category: "मजदूरी (Labor)", note: "साप्ताहिक मजदूरी", amount: 2500 },
  { id: 4, date: "22 Aug", category: "बिजली (Electricity)", note: "मिल्किंग मशीन", amount: 650 },
];

const defaultSeedAnimals = [
  { id: 1, date: "20 Aug", type: "खरीद", animal: "भैंस (Buffalo)", tag: "टैग #12", amount: 68000 },
  { id: 2, date: "10 Aug", type: "बिक्री", animal: "बछड़ा (Calf)", tag: "टैग #07", amount: 15000 },
];

const CATEGORY_OPTS = ["चारा (Feed)", "दवाई (Medicine)", "मजदूरी (Labor)", "बिजली (Electricity)", "परिवहन (Transport)", "अन्य (Other)"];
const ANIMAL_OPTS = ["गाय (Cow)", "भैंस (Buffalo)", "बछड़ा (Calf)"];

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Helper to load / save localStorage
const loadStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(`dairy_app_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key, val) => {
  try {
    localStorage.setItem(`dairy_app_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
};

// ---------- Small UI Building Blocks ----------
function StatCard({ icon: Icon, label, sub, value, tone = "primary", trail }) {
  const tones = {
    primary: { bg: T.primary, fg: "#fff", subFg: "#E2EBE5", border: T.primaryDark },
    accent: { bg: T.accent, fg: T.primaryDark, subFg: "#46320B", border: "#C88E28" },
    red: { bg: T.red, fg: "#fff", subFg: "#FBE6E4", border: "#9A3229" },
    ghost: { bg: T.surface, fg: T.ink, subFg: T.inkSoft, border: T.line },
  };
  const c = tones[tone] || tones.ghost;

  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col justify-between shadow-sm border transition-all hover:shadow-md overflow-hidden"
      style={{ background: c.bg, color: c.fg, borderColor: c.border, minHeight: 134 }}
    >
      <div
        className="absolute -right-5 -top-5 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ background: c.fg }}
      />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px] font-bold tracking-wider uppercase opacity-85">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <Icon size={18} strokeWidth={2.2} className="opacity-95" />
        </div>
      </div>
      <div className="relative z-10 my-2">
        <div style={{ fontFamily: "'Zilla Slab', serif" }} className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
          {value}
        </div>
        {sub && <div className="text-xs font-medium mt-1" style={{ color: c.subFg }}>{sub}</div>}
      </div>
      {trail && (
        <div className="flex items-center gap-1 text-xs mt-1 relative z-10 opacity-90">
          {trail}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border shadow-sm transition-all" style={{ background: T.surface, borderColor: T.line }}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b" style={{ borderColor: T.line }}>
        <div>
          <h3 style={{ fontFamily: "'Zilla Slab', serif", color: T.ink }} className="text-lg font-bold tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs font-medium mt-0.5" style={{ color: T.inkSoft }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function AddRow({ fields, onAdd, buttonLabel }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState(() =>
    Object.fromEntries(fields.map(f => [f.key, f.type === "select" ? f.options[0] : (f.defaultValue || "")]))
  );

  const submit = () => {
    for (const f of fields) {
      if (f.type !== "select" && (!vals[f.key] || vals[f.key].toString().trim() === "")) {
        alert(`कृपया ${f.label} भरें`);
        return;
      }
    }
    onAdd(vals);
    setVals(Object.fromEntries(fields.map(f => [f.key, f.type === "select" ? f.options[0] : (f.defaultValue || "")])));
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm hover:opacity-90 active:scale-95 cursor-pointer"
        style={{ background: T.accentSoft, color: T.primaryDark, border: `1px solid ${T.accent}` }}
      >
        <Plus size={15} strokeWidth={2.5} /> {buttonLabel}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl mb-4 transition-all shadow-inner animate-in fade-in" style={{ background: T.bg, border: `1.5px dashed ${T.line}` }}>
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col">
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: T.inkSoft }}>{f.label}</label>
          {f.type === "select" ? (
            <select
              value={vals[f.key]}
              onChange={(e) => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              className="text-xs sm:text-sm px-3 py-2 rounded-lg border outline-none bg-white font-medium shadow-sm transition-all focus:ring-2"
              style={{ borderColor: T.line, minWidth: f.width || 140, color: T.ink }}
            >
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={f.type || "text"}
              value={vals[f.key]}
              placeholder={f.placeholder || ""}
              onChange={(e) => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              className="text-xs sm:text-sm px-3 py-2 rounded-lg border outline-none bg-white font-medium shadow-sm transition-all focus:ring-2"
              style={{ borderColor: T.line, width: f.width || 120, color: T.ink }}
            />
          )}
        </div>
      ))}
      <button
        onClick={submit}
        className="text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
        style={{ background: T.primary, color: "#fff" }}
      >
        ✓ जोड़ें (Add)
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs p-2 rounded-lg hover:bg-black/5 transition-all cursor-pointer"
        style={{ color: T.inkSoft }}
        title="रद्द करें"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function DataTable({ columns, rows, onDelete, emptyText }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: T.line }}>
      <table className="w-full text-sm min-w-[540px]">
        <thead style={{ background: T.bg }}>
          <tr style={{ borderBottom: `2px solid ${T.line}` }}>
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-bold" style={{ color: T.inkSoft }}>
                {c.label}
              </th>
            ))}
            <th className="px-3 py-3 text-right text-[11px] uppercase tracking-wider font-bold" style={{ color: T.inkSoft }}>हटाएं</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: T.line }}>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-8 text-sm font-medium" style={{ color: T.inkSoft }}>
                {emptyText || "अभी कोई रिकॉर्ड नहीं"}
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 font-medium" style={{ fontFamily: c.mono ? "'IBM Plex Mono', monospace" : undefined, color: T.ink }}>
                  {c.render ? c.render(r[c.key], r) : r[c.key]}
                </td>
              ))}
              <td className="px-3 py-3 text-right">
                <button
                  onClick={() => onDelete(r.id)}
                  className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-rose-50 transition-all cursor-pointer"
                  title="डिलीट करें"
                >
                  <Trash2 size={15} style={{ color: T.red }} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Main DairyDashboard Component ----------
export function DairyDashboard() {
  const [tab, setTab] = useState("overview");

  // Persistent States
  const [milk, setMilk] = useState(() => loadStorage("milk", defaultSeedMilk));
  const [customerSales, setCustomerSales] = useState(() => loadStorage("customerSales", defaultSeedCustomerSales));
  const [dairySales, setDairySales] = useState(() => loadStorage("dairySales", defaultSeedDairySales));
  const [expenses, setExpenses] = useState(() => loadStorage("expenses", defaultSeedExpenses));
  const [animals, setAnimals] = useState(() => loadStorage("animals", defaultSeedAnimals));

  // Sync to local storage
  useEffect(() => { saveStorage("milk", milk); }, [milk]);
  useEffect(() => { saveStorage("customerSales", customerSales); }, [customerSales]);
  useEffect(() => { saveStorage("dairySales", dairySales); }, [dairySales]);
  useEffect(() => { saveStorage("expenses", expenses); }, [expenses]);
  useEffect(() => { saveStorage("animals", animals); }, [animals]);

  const resetAllToDefaults = () => {
    if (window.confirm("क्या आप वाकई सभी डेमो डेटा रीसेट करना चाहते हैं?")) {
      setMilk(defaultSeedMilk);
      setCustomerSales(defaultSeedCustomerSales);
      setDairySales(defaultSeedDairySales);
      setExpenses(defaultSeedExpenses);
      setAnimals(defaultSeedAnimals);
    }
  };

  const nextId = (arr) => (arr.length ? Math.max(...arr.map(a => a.id || 0)) + 1 : 1);

  // Calculations
  const todayMilk = milk[milk.length - 1] || { morning: 0, evening: 0 };
  const todayTotal = Number(todayMilk.morning || 0) + Number(todayMilk.evening || 0);
  const weekMilkTotal = milk.reduce((s, m) => s + Number(m.morning || 0) + Number(m.evening || 0), 0);

  const customerTotal = useMemo(() => customerSales.reduce((s, r) => s + Number(r.amount || 0), 0), [customerSales]);
  const customerLiters = useMemo(() => customerSales.reduce((s, r) => s + Number(r.liters || 0), 0), [customerSales]);

  const dairyTotal = useMemo(() => dairySales.reduce((s, r) => s + Number(r.amount || 0), 0), [dairySales]);
  const dairyLiters = useMemo(() => dairySales.reduce((s, r) => s + Number(r.liters || 0), 0), [dairySales]);

  const combinedSales = customerTotal + dairyTotal;
  const expenseTotal = useMemo(() => expenses.reduce((s, r) => s + Number(r.amount || 0), 0), [expenses]);
  const net = combinedSales - expenseTotal;

  const animalPurchases = animals.filter(a => a.type === "खरीद").reduce((s, a) => s + Number(a.amount || 0), 0);
  const animalSalesTotal = animals.filter(a => a.type === "बिक्री").reduce((s, a) => s + Number(a.amount || 0), 0);
  const animalPurchaseCount = animals.filter(a => a.type === "खरीद").length;
  const animalSaleCount = animals.filter(a => a.type === "बिक्री").length;

  // Base herd (गाय + भैंस + बच्चे)
  const baseHerd = { cow: 4, buffalo: 5, calves: 0 };
  const herdCounts = animals.reduce((acc, a) => {
    const delta = a.type === "खरीद" ? 1 : -1;
    if (a.animal.includes("गाय") || a.animal.toLowerCase().includes("cow")) acc.cow += delta;
    else if (a.animal.includes("भैंस") || a.animal.toLowerCase().includes("buffalo")) acc.buffalo += delta;
    else if (a.animal.includes("केड़ा") || a.animal.includes("केडी") || a.animal.includes("बछ") || a.animal.includes("calf")) acc.calves += delta;
    return acc;
  }, { cow: baseHerd.cow, buffalo: baseHerd.buffalo, calves: baseHerd.calves });
  const totalStock = Math.max(0, herdCounts.cow) + Math.max(0, herdCounts.buffalo) + Math.max(0, herdCounts.calves);

  // Sales Chart Data
  const salesChartData = useMemo(() => {
    const byDate = {};
    customerSales.forEach(r => {
      byDate[r.date] = byDate[r.date] || { date: r.date, customer: 0, dairy: 0 };
      byDate[r.date].customer += Number(r.amount || 0);
    });
    dairySales.forEach(r => {
      byDate[r.date] = byDate[r.date] || { date: r.date, customer: 0, dairy: 0 };
      byDate[r.date].dairy += Number(r.amount || 0);
    });
    return Object.values(byDate).reverse();
  }, [customerSales, dairySales]);

  const tabs = [
    { id: "overview", label: "ओवरव्यू", icon: LayoutGrid, count: null },
    { id: "milk", label: "दूध उत्पादन", icon: Droplets, count: `${todayTotal}L` },
    { id: "sales", label: "बिक्री", icon: IndianRupee, count: fmt(combinedSales) },
    { id: "expenses", label: "खर्चा", icon: Wallet, count: fmt(expenseTotal) },
    { id: "animals", label: "पशु लेन-देन", icon: PawPrint, count: `${totalStock} पशु` },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="pb-16 text-slate-900 selection:bg-amber-400 selection:text-slate-900 rounded-2xl overflow-hidden shadow-sm border border-[#E1D6BC]">
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b shadow-md"
        style={{ background: T.primaryDark, borderColor: T.line }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: T.accent }}>
            <Droplets size={22} style={{ color: T.primaryDark }} strokeWidth={2.6} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Zilla Slab', serif" }} className="text-white text-xl font-bold tracking-wide flex items-center gap-2">
              डेयरी प्रबंधन प्रणाली
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: T.accent, color: T.primaryDark }}>
                Live
              </span>
            </h1>
            <p className="text-xs font-medium" style={{ color: T.accentSoft }}>Dairy Farming & Accounts Management Dashboard</p>
          </div>
        </div>

        {/* Right Info & Quick Action Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={resetAllToDefaults}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
            title="डेमो डेटा रीसेट करें"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">रीसेट</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="प्रिंट / PDF सेव करें"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">प्रिंट</span>
          </button>

          <div className="text-right pl-3 border-l border-white/20 hidden md:block">
            <div className="text-white text-xs font-bold">27 अगस्त 2026</div>
            <div className="text-[11px] font-medium" style={{ color: T.accentSoft }}>
              आज का उत्पादन: <b>{todayTotal} L</b>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="px-6 pt-4 flex gap-2 overflow-x-auto no-scrollbar border-b pb-2" style={{ borderColor: T.line }}>
        {tabs.map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm cursor-pointer"
              style={{
                background: active ? T.primary : T.surface,
                color: active ? "#ffffff" : T.ink,
                border: `1.5px solid ${active ? T.primary : T.line}`,
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span>{t.label}</span>
              {t.count && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold"
                  style={{
                    background: active ? "rgba(255,255,255,0.2)" : T.bg,
                    color: active ? "#ffffff" : T.inkSoft
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {tab === "overview" && (
          <>
            {/* Top 9 Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
              <StatCard
                icon={Droplets}
                label="🥛 Total Milk Production"
                value={`${todayTotal} L`}
                sub={`आज · सप्ताह कुल: ${weekMilkTotal} L`}
                tone="primary"
              />
              <StatCard
                icon={Users}
                label="👥 Customer Sale"
                value={fmt(customerTotal)}
                sub={`${customerLiters} L सीधा ग्राहकों को`}
                tone="accent"
              />
              <StatCard
                icon={Store}
                label="🏪 Dairy Sale"
                value={fmt(dairyTotal)}
                sub={`${dairyLiters} L डेयरी थोक में`}
                tone="ghost"
              />
              <StatCard
                icon={Landmark}
                label="💰 Total Sales"
                value={fmt(combinedSales)}
                sub="Customer + Dairy Sale"
                tone="primary"
              />
              <StatCard
                icon={Receipt}
                label="💸 Total Expense"
                value={fmt(expenseTotal)}
                sub="चारा, दवा, बिजली व मजदूरी"
                tone="red"
              />
              <StatCard
                icon={net >= 0 ? TrendingUp : TrendingDown}
                label="📈 Net Profit"
                value={fmt(net)}
                sub="कुल बिक्री − कुल खर्च"
                tone={net >= 0 ? "accent" : "red"}
              />
              <StatCard
                icon={PawPrint}
                label="🐃 Animal Stock"
                value={`${totalStock}`}
                sub={`${herdCounts.cow} गाय · ${herdCounts.buffalo} भैंस${herdCounts.calves ? ` · ${herdCounts.calves} बच्चे` : ''}`}
                tone="ghost"
              />
              <StatCard
                icon={ArrowDownCircle}
                label="🔄 Animal Purchase"
                value={fmt(animalPurchases)}
                sub={`${animalPurchaseCount} पशु खरीदे गए`}
                tone="red"
              />
              <StatCard
                icon={ArrowUpCircle}
                label="🐄 Animal Sale"
                value={fmt(animalSalesTotal)}
                sub={`${animalSaleCount} पशु बेचे गए`}
                tone="accent"
              />
            </div>

            {/* Middle Section: Weekly Yield Line Chart & Animal Capital Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SectionCard
                  title="साप्ताहिक दूध उत्पादन ट्रेंड (Weekly Yield)"
                  subtitle="Morning & evening milk production for the last 7 recorded days"
                  right={
                    <div className="flex items-center gap-3 text-xs font-bold" style={{ color: T.inkSoft }}>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: T.primary }}></span> सुबह</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: T.accent }}></span> शाम</span>
                    </div>
                  }
                >
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={milk}>
                        <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={{ stroke: T.line }} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={false} tickLine={false} unit="L" />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: `1.5px solid ${T.line}`, fontSize: 12, background: T.surface, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                          formatter={(v) => [`${v} Liters`, 'मात्रा']}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <Line type="monotone" dataKey="morning" name="सुबह (Morning)" stroke={T.primary} strokeWidth={3} dot={{ r: 4, fill: T.primary }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="evening" name="शाम (Evening)" stroke={T.accent} strokeWidth={3} dot={{ r: 4, fill: T.accent }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              </div>

              {/* Animal Ledger Overview Summary */}
              <SectionCard title="पशु लेन-देन सार" subtitle="Capital invested in livestock">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border" style={{ background: T.bg, borderColor: T.line }}>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: T.inkSoft }}>कुल खरीद</span>
                      <span className="text-xs" style={{ color: T.ink }}>{animalPurchaseCount} पशु जोड़े गए</span>
                    </div>
                    <span className="text-base font-extrabold" style={{ color: T.red, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(animalPurchases)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border" style={{ background: T.bg, borderColor: T.line }}>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: T.inkSoft }}>कुल बिक्री</span>
                      <span className="text-xs" style={{ color: T.ink }}>{animalSaleCount} पशु बेचे गए</span>
                    </div>
                    <span className="text-base font-extrabold" style={{ color: T.primary, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(animalSalesTotal)}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl shadow-sm" style={{ background: T.primaryDark }}>
                    <div>
                      <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">शुद्ध पूंजी (Net Asset)</span>
                      <span className="text-xs text-white/80">खरीद − बिक्री अंतर</span>
                    </div>
                    <span className="text-lg font-extrabold text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {fmt(animalPurchases - animalSalesTotal)}
                    </span>
                  </div>

                  <button
                    onClick={() => setTab("animals")}
                    className="w-full py-2 text-center text-xs font-bold rounded-lg border transition-all hover:bg-black/5 cursor-pointer mt-2"
                    style={{ borderColor: T.line, color: T.ink }}
                  >
                    पशु रिकॉर्ड देखें व जोड़ें →
                  </button>
                </div>
              </SectionCard>
            </div>

            {/* Bottom Combined Sales & Net Profit Card */}
            <SectionCard title="डेयरी + ग्राहक कुल बिक्री" subtitle="Combined revenue comparison & net profit calculation">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-2">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesChartData}>
                        <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={{ stroke: T.line }} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: `1.5px solid ${T.line}`, fontSize: 12, background: T.surface }}
                          formatter={(v) => [fmt(v), 'आय']}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="customer" name="ग्राहक बिक्री" fill={T.accent} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="dairy" name="डेयरी बिक्री" fill={T.primary} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3.5">
                  <div className="p-4 rounded-xl border shadow-sm" style={{ background: T.bg, borderColor: T.line }}>
                    <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.inkSoft }}>कुल बिक्री कमाई (Combined)</div>
                    <div style={{ fontFamily: "'Zilla Slab', serif", color: T.ink }} className="text-2xl font-extrabold mt-1">{fmt(combinedSales)}</div>
                    <div className="text-xs font-medium text-emerald-800 mt-0.5">Customer ₹{customerTotal} + Dairy ₹{dairyTotal}</div>
                  </div>

                  <div className="p-4 rounded-xl flex items-center justify-between shadow-md" style={{ background: net >= 0 ? T.primary : T.red }}>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">शुद्ध लाभ (Net Profit)</div>
                      <div style={{ fontFamily: "'Zilla Slab', serif" }} className="text-2xl font-black text-white mt-0.5">{fmt(net)}</div>
                      <div className="text-[11px] text-white/80">बिक्री में से खर्च घटाकर</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      {net >= 0 ? <TrendingUp size={24} className="text-white" /> : <TrendingDown size={24} className="text-white" />}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ================= TAB 2: MILK PRODUCTION ================= */}
        {tab === "milk" && (
          <SectionCard
            title="दूध उत्पादन रिकॉर्ड (Milk Production)"
            subtitle="Record daily morning and evening milk collection"
            right={
              <AddRow
                buttonLabel="नई एंट्री जोड़ें"
                fields={[
                  { key: "date", label: "तारीख (Date)", placeholder: "e.g. 28 Aug", defaultValue: "28 Aug", width: 100 },
                  { key: "morning", label: "सुबह (L)", type: "number", placeholder: "0", width: 100 },
                  { key: "evening", label: "शाम (L)", type: "number", placeholder: "0", width: 100 },
                ]}
                onAdd={(v) => setMilk(m => [...m, { date: v.date, morning: Number(v.morning), evening: Number(v.evening) }])}
              />
            }
          >
            {/* Quick Stat Highlights */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border" style={{ background: T.bg, borderColor: T.line }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm" style={{ background: T.accentSoft }}>
                  <Sunrise size={18} style={{ color: T.primaryDark }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold" style={{ color: T.inkSoft }}>कुल सुबह उत्पादन</div>
                  <div className="text-base font-extrabold font-mono" style={{ color: T.ink }}>{milk.reduce((s, m) => s + Number(m.morning || 0), 0)} L</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "#DCEAE0" }}>
                  <Sunset size={18} style={{ color: T.primary }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold" style={{ color: T.inkSoft }}>कुल शाम उत्पादन</div>
                  <div className="text-base font-extrabold font-mono" style={{ color: T.ink }}>{milk.reduce((s, m) => s + Number(m.evening || 0), 0)} L</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm" style={{ background: T.primaryDark }}>
                  <Droplets size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-500">कुल योग (Total)</div>
                  <div className="text-base font-extrabold font-mono" style={{ color: T.primary }}>{weekMilkTotal} L</div>
                </div>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "date", label: "तारीख (Date)" },
                { key: "morning", label: "सुबह (L)", mono: true, render: (v) => `${v} L` },
                { key: "evening", label: "शाम (L)", mono: true, render: (v) => `${v} L` },
                {
                  key: "total",
                  label: "कुल मात्रा (Total L)",
                  mono: true,
                  render: (_, r) => (
                    <span className="font-bold" style={{ color: T.primary }}>
                      {Number(r.morning || 0) + Number(r.evening || 0)} L
                    </span>
                  )
                },
              ]}
              rows={milk.map((m, i) => ({ id: i, ...m }))}
              onDelete={(id) => setMilk(m => m.filter((_, i) => i !== id))}
              emptyText="अभी कोई दूध उत्पादन रिकॉर्ड नहीं है"
            />
          </SectionCard>
        )}

        {/* ================= TAB 3: SALES ================= */}
        {tab === "sales" && (
          <div className="space-y-6">
            {/* Customer Retail Sales */}
            <SectionCard
              title="ग्राहक खुदरा बिक्री (Customer Retail Sale)"
              subtitle="Direct home and local retail sales"
              right={
                <AddRow
                  buttonLabel="नई ग्राहक बिक्री"
                  fields={[
                    { key: "date", label: "तारीख", width: 95, defaultValue: "27 Aug" },
                    { key: "customer", label: "ग्राहक का नाम", placeholder: "e.g. शर्मा जी", width: 140 },
                    { key: "liters", label: "मात्रा (L)", type: "number", placeholder: "0", width: 85 },
                    { key: "rate", label: "दर (₹/L)", type: "number", defaultValue: "60", width: 85 },
                  ]}
                  onAdd={(v) => {
                    const liters = Number(v.liters);
                    const rate = Number(v.rate);
                    setCustomerSales(s => [{
                      id: nextId(s),
                      date: v.date,
                      customer: v.customer,
                      liters: liters,
                      rate: rate,
                      amount: liters * rate
                    }, ...s]);
                  }}
                />
              }
            >
              <DataTable
                columns={[
                  { key: "date", label: "तारीख" },
                  { key: "customer", label: "ग्राहक का नाम" },
                  { key: "liters", label: "दूध (L)", mono: true, render: (v) => `${v} L` },
                  { key: "rate", label: "दर/L", mono: true, render: (v) => fmt(v) },
                  { key: "amount", label: "कुल राशि", mono: true, render: (v) => <b style={{ color: T.primary }}>{fmt(v)}</b> },
                ]}
                rows={customerSales}
                onDelete={(id) => setCustomerSales(s => s.filter(r => r.id !== id))}
                emptyText="अभी कोई ग्राहक बिक्री दर्ज नहीं है"
              />
              <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm font-bold" style={{ borderColor: T.line }}>
                <span style={{ color: T.inkSoft }}>कुल मात्रा: {customerLiters} L</span>
                <span className="text-base" style={{ color: T.primary }}>कुल ग्राहक बिक्री: {fmt(customerTotal)}</span>
              </div>
            </SectionCard>

            {/* Dairy Bulk Sales */}
            <SectionCard
              title="डेयरी थोक बिक्री (Dairy Bulk Sale)"
              subtitle="Wholesale bulk delivery to milk chilling center / dairy plant"
              right={
                <AddRow
                  buttonLabel="नई डेयरी बिक्री"
                  fields={[
                    { key: "date", label: "तारीख", width: 95, defaultValue: "27 Aug" },
                    { key: "liters", label: "मात्रा (L)", type: "number", placeholder: "0", width: 100 },
                    { key: "rate", label: "दर (₹/L)", type: "number", defaultValue: "42", width: 90 },
                  ]}
                  onAdd={(v) => {
                    const liters = Number(v.liters);
                    const rate = Number(v.rate);
                    setDairySales(s => [{
                      id: nextId(s),
                      date: v.date,
                      liters: liters,
                      rate: rate,
                      amount: liters * rate
                    }, ...s]);
                  }}
                />
              }
            >
              <DataTable
                columns={[
                  { key: "date", label: "तारीख" },
                  { key: "liters", label: "मात्रा (L)", mono: true, render: (v) => `${v} L` },
                  { key: "rate", label: "दर/L", mono: true, render: (v) => fmt(v) },
                  { key: "amount", label: "कुल राशि", mono: true, render: (v) => <b style={{ color: T.primary }}>{fmt(v)}</b> },
                ]}
                rows={dairySales}
                onDelete={(id) => setDairySales(s => s.filter(r => r.id !== id))}
                emptyText="अभी कोई डेयरी बिक्री दर्ज नहीं है"
              />
              <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm font-bold" style={{ borderColor: T.line }}>
                <span style={{ color: T.inkSoft }}>कुल मात्रा: {dairyLiters} L</span>
                <span className="text-base" style={{ color: T.primary }}>कुल डेयरी बिक्री: {fmt(dairyTotal)}</span>
              </div>
            </SectionCard>

            {/* Grand Total Highlight */}
            <div className="rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-md" style={{ background: T.primaryDark }}>
              <div>
                <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider block">डेयरी + ग्राहक कुल कमाई</span>
                <span className="text-white text-sm font-semibold">Combined Total Sales Revenue</span>
              </div>
              <span className="text-white text-2xl sm:text-3xl font-black font-mono" style={{ fontFamily: "'Zilla Slab', serif" }}>
                {fmt(combinedSales)}
              </span>
            </div>
          </div>
        )}

        {/* ================= TAB 4: EXPENSES ================= */}
        {tab === "expenses" && (
          <SectionCard
            title="खर्चा प्रबंधन (Farm Expenses)"
            subtitle="Feed, fodder, medicine, labor, electricity & other expenses"
            right={
              <AddRow
                buttonLabel="नया खर्च जोड़ें"
                fields={[
                  { key: "date", label: "तारीख", width: 95, defaultValue: "27 Aug" },
                  { key: "category", label: "खर्च श्रेणी", type: "select", options: CATEGORY_OPTS, width: 160 },
                  { key: "note", label: "विवरण (Note)", placeholder: "e.g. भूसा, खल", width: 140 },
                  { key: "amount", label: "राशि (₹)", type: "number", placeholder: "0", width: 95 },
                ]}
                onAdd={(v) => setExpenses(s => [{
                  id: nextId(s),
                  date: v.date,
                  category: v.category,
                  note: v.note,
                  amount: Number(v.amount)
                }, ...s])}
              />
            }
          >
            <DataTable
              columns={[
                { key: "date", label: "तारीख" },
                {
                  key: "category",
                  label: "श्रेणी",
                  render: (v) => (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold" style={{ background: T.bg, color: T.ink }}>
                      {v}
                    </span>
                  )
                },
                { key: "note", label: "विवरण" },
                { key: "amount", label: "राशि", mono: true, render: (v) => <b style={{ color: T.red }}>{fmt(v)}</b> },
              ]}
              rows={expenses}
              onDelete={(id) => setExpenses(s => s.filter(r => r.id !== id))}
              emptyText="अभी कोई खर्च दर्ज नहीं है"
            />

            <div className="flex justify-end items-center mt-4 pt-3 border-t text-base font-black" style={{ borderColor: T.line }}>
              <span className="mr-3 text-xs uppercase font-bold" style={{ color: T.inkSoft }}>कुल खर्च योग:</span>
              <span style={{ color: T.red, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(expenseTotal)}</span>
            </div>
          </SectionCard>
        )}

        {/* ================= TAB 5: ANIMAL TRADING & STOCK ================= */}
        {tab === "animals" && (
          <SectionCard
            title="पशु खरीद व बिक्री प्रबंधन (Livestock Ledger)"
            subtitle="Animal purchase, sale, tags & herd count tracking"
            right={
              <AddRow
                buttonLabel="नया पशु लेन-देन"
                fields={[
                  { key: "date", label: "तारीख", width: 95, defaultValue: "27 Aug" },
                  { key: "type", label: "प्रकार", type: "select", options: ["खरीद", "बिक्री"], width: 100 },
                  { key: "animal", label: "पशु", type: "select", options: ANIMAL_OPTS, width: 140 },
                  { key: "tag", label: "टैग / पहचान", placeholder: "e.g. टैग #15", width: 120 },
                  { key: "amount", label: "राशि (₹)", type: "number", placeholder: "0", width: 110 },
                ]}
                onAdd={(v) => setAnimals(s => [{
                  id: nextId(s),
                  date: v.date,
                  type: v.type,
                  animal: v.animal,
                  tag: v.tag,
                  amount: Number(v.amount)
                }, ...s])}
              />
            }
          >
            {/* Live Herd Balance Tracker */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border" style={{ background: T.bg, borderColor: T.line }}>
              <div className="p-2">
                <div className="text-[11px] uppercase font-bold" style={{ color: T.inkSoft }}>कुल सक्रिय पशु (Herd Stock)</div>
                <div className="text-xl font-extrabold font-mono mt-0.5" style={{ color: T.ink }}>{totalStock} पशु</div>
                <div className="text-xs font-semibold mt-1" style={{ color: T.primary }}>
                  {herdCounts.cow} गाय · {herdCounts.buffalo} भैंस
                </div>
              </div>

              <div className="p-2">
                <div className="text-[11px] uppercase font-bold" style={{ color: T.inkSoft }}>कुल खरीद खर्च (Purchases)</div>
                <div className="text-xl font-extrabold font-mono mt-0.5" style={{ color: T.red }}>{fmt(animalPurchases)}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">{animalPurchaseCount} पशु खरीदे गए</div>
              </div>

              <div className="p-2">
                <div className="text-[11px] uppercase font-bold" style={{ color: T.inkSoft }}>कुल बिक्री कमाई (Sales)</div>
                <div className="text-xl font-extrabold font-mono mt-0.5" style={{ color: T.primary }}>{fmt(animalSalesTotal)}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">{animalSaleCount} पशु बेचे गए</div>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "date", label: "तारीख" },
                {
                  key: "type",
                  label: "प्रकार",
                  render: (v) => (
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-bold shadow-xs"
                      style={{
                        background: v === "खरीद" ? "#FEE2E2" : "#DCFCE7",
                        color: v === "खरीद" ? T.red : T.primary
                      }}
                    >
                      {v === "खरीद" ? "📥 खरीद" : "📤 बिक्री"}
                    </span>
                  )
                },
                { key: "animal", label: "पशु का प्रकार" },
                { key: "tag", label: "टैग / पहचान" },
                {
                  key: "amount",
                  label: "राशि (₹)",
                  mono: true,
                  render: (v, r) => (
                    <span className="font-extrabold" style={{ color: r.type === "खरीद" ? T.red : T.primary }}>
                      {r.type === "खरीद" ? "- " : "+ "}{fmt(v)}
                    </span>
                  )
                },
              ]}
              rows={animals}
              onDelete={(id) => setAnimals(s => s.filter(r => r.id !== id))}
              emptyText="अभी कोई पशु लेन-देन रिकॉर्ड नहीं है"
            />
          </SectionCard>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs py-6 border-t mt-8" style={{ color: T.inkSoft, borderColor: T.line }}>
        <p className="font-medium">डेयरी प्रबंधन प्रणाली (Dairy Management Dashboard) · डेटा सुरक्षित है</p>
      </footer>
    </div>
  );
}

export default DairyDashboard;
