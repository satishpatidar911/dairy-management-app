import React, { useState, useMemo } from 'react';
import {
  Milk,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Calculator,
  Truck,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { FatSnfCalculator } from './FatSnfCalculator';
import { MilkSales } from './MilkSales';
import { SearchableSelect } from '../common/SearchableSelect';

export const MilkEntry = () => {
  const { t } = useLanguage();
  const { milkEntries, addMilkEntry, addBulkMilkEntry, deleteMilkEntry, animals, addAnimal, stats } = useApp();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('daily_entry'); // 'daily_entry' | 'history' | 'calculator' | 'sales'
  
  // PRIMARY MODE: 'animal_wise' (Option 1) vs 'total_production' (Option 2)
  const [entryMode, setEntryMode] = useState('animal_wise'); 

  const [selectedShift, setSelectedShift] = useState('morning');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [savedBatchMsg, setSavedBatchMsg] = useState('');

  // OPTION 1: ANIMAL WISE STATE
  const [cattleMode, setCattleMode] = useState('select'); // 'select' | 'manual'
  const [manualCattle, setManualCattle] = useState({
    tagNo: '',
    name: '',
    type: 'cow',
    breed: 'Gir (गीर)'
  });

  const [singleForm, setSingleForm] = useState({
    animalId: animals[0]?.tagNo || '',
    quantity: '',
    fat: '4.5',
    snf: '8.5'
  });

  // OPTION 2: TOTAL MILK PRODUCTION (BULK) STATE
  const [bulkForm, setBulkForm] = useState({
    cowMilk: '',
    cowFat: '4.2',
    cowSnf: '8.5',
    buffaloMilk: '',
    buffaloFat: '7.0',
    buffaloSnf: '9.0',
    notes: ''
  });

  // History search and filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyShiftFilter, setHistoryShiftFilter] = useState('all');
  const [historyModeFilter, setHistoryModeFilter] = useState('all');

  // Lower Table Filters State (1. Date to Date, 2. Shift Morning/Evening/Both, 3. Cow/Buffalo/Both)
  const [tableFromDate, setTableFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tableToDate, setTableToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tableShift, setTableShift] = useState('all'); // 'all' (Both) | 'morning' | 'evening'
  const [tableAnimalType, setTableAnimalType] = useState('all'); // 'all' (Both) | 'cow' | 'buffalo'
  const [tableMode, setTableMode] = useState('all'); // 'all' | 'animal_wise' | 'bulk_total'
  const [tableSearch, setTableSearch] = useState('');

  // Quick Date Presets Handler
  const setQuickDateRange = (type) => {
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];
    if (type === 'today') {
      setTableFromDate(todayStr);
      setTableToDate(todayStr);
    } else if (type === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setTableFromDate(yStr);
      setTableToDate(yStr);
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setTableFromDate(past.toISOString().split('T')[0]);
      setTableToDate(todayStr);
    } else if (type === 'month') {
      const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      setTableFromDate(firstDay);
      setTableToDate(todayStr);
    } else if (type === 'all') {
      setTableFromDate('');
      setTableToDate('');
    }
  };

  // Filtered Records for Lower Table
  const tableFilteredEntries = useMemo(() => {
    return milkEntries.filter(item => {
      if (tableFromDate && item.date < tableFromDate) return false;
      if (tableToDate && item.date > tableToDate) return false;
      if (tableShift !== 'all' && item.shift !== tableShift) return false;
      if (tableAnimalType !== 'all' && item.animalType !== tableAnimalType) return false;
      if (tableMode !== 'all' && (item.entryMode || 'animal_wise') !== tableMode) return false;

      if (tableSearch) {
        const q = tableSearch.toLowerCase();
        const match =
          (item.animalName && item.animalName.toLowerCase().includes(q)) ||
          (item.animalId && item.animalId.toLowerCase().includes(q)) ||
          (item.date && item.date.includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [milkEntries, tableFromDate, tableToDate, tableShift, tableAnimalType, tableMode, tableSearch]);

  // Live Dynamic Sum (sum(cow), sum(buffalo), sum(both)) for Lower Table
  const tableSummary = useMemo(() => {
    const cowTotal = tableFilteredEntries
      .filter(m => m.animalType === 'cow')
      .reduce((acc, m) => acc + Number(m.quantity || 0), 0);
    const bufTotal = tableFilteredEntries
      .filter(m => m.animalType === 'buffalo')
      .reduce((acc, m) => acc + Number(m.quantity || 0), 0);
    const grandTotal = cowTotal + bufTotal;

    return {
      count: tableFilteredEntries.length,
      cowTotal: Number(cowTotal.toFixed(1)),
      bufTotal: Number(bufTotal.toFixed(1)),
      grandTotal: Number(grandTotal.toFixed(1))
    };
  }, [tableFilteredEntries]);

  // Calculate live shift stats for the selected date & shift
  const currentShiftSummary = useMemo(() => {
    const shiftList = milkEntries.filter(m => m.date === entryDate && m.shift === selectedShift);
    const cowTotal = shiftList.filter(m => m.animalType === 'cow').reduce((acc, m) => acc + Number(m.quantity || 0), 0);
    const bufTotal = shiftList.filter(m => m.animalType === 'buffalo').reduce((acc, m) => acc + Number(m.quantity || 0), 0);
    const grandTotal = cowTotal + bufTotal;

    return {
      count: shiftList.length,
      cowTotal: Number(cowTotal.toFixed(1)),
      bufTotal: Number(bufTotal.toFixed(1)),
      grandTotal: Number(grandTotal.toFixed(1))
    };
  }, [milkEntries, entryDate, selectedShift]);

  // Handle Option 1: Animal-wise Submit
  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (!singleForm.quantity || Number(singleForm.quantity) <= 0) return;

    let tag = singleForm.animalId;
    let name = 'Unknown';
    let type = 'cow';

    if (cattleMode === 'manual') {
      if (!manualCattle.tagNo || !manualCattle.name) {
        alert('Please enter tag number and name (कृपया टैग नं. और नाम दर्ज करें)');
        return;
      }
      tag = manualCattle.tagNo;
      name = manualCattle.name;
      type = manualCattle.type;

      addAnimal({
        tagNo: tag,
        name: name,
        type: type,
        breed: manualCattle.breed,
        status: 'milking',
        dailyCapacity: Number(singleForm.quantity) * 2,
        weight: 400
      });
    } else {
      const animal = animals.find(a => a.tagNo === singleForm.animalId);
      if (animal) {
        tag = animal.tagNo;
        name = animal.name;
        type = animal.type;
      }
    }

    addMilkEntry({
      entryMode: 'animal_wise',
      animalId: tag,
      animalName: name,
      animalType: type,
      date: entryDate,
      shift: selectedShift,
      quantity: Number(singleForm.quantity),
      fat: Number(singleForm.fat),
      snf: Number(singleForm.snf),
      rate: 0,
      recordedBy: currentUser.name
    });

    setSingleForm({
      ...singleForm,
      quantity: ''
    });

    setSavedBatchMsg(`✓ Recorded ${singleForm.quantity}L for ${name} (${tag})!`);
    setTimeout(() => setSavedBatchMsg(''), 2500);
  };

  // Handle Option 2: Total Production (Bulk) Submit
  const handleBulkSubmit = (e) => {
    e.preventDefault();
    const cowQty = Number(bulkForm.cowMilk) || 0;
    const bufQty = Number(bulkForm.buffaloMilk) || 0;

    if (cowQty <= 0 && bufQty <= 0) {
      alert('Please enter quantity for at least cow or buffalo milk');
      return;
    }

    addBulkMilkEntry({
      date: entryDate,
      shift: selectedShift,
      cowMilk: cowQty,
      cowFat: bulkForm.cowFat,
      cowSnf: bulkForm.cowSnf,
      cowRate: 0,
      buffaloMilk: bufQty,
      buffaloFat: bulkForm.buffaloFat,
      buffaloSnf: bulkForm.buffaloSnf,
      buffaloRate: 0,
      recordedBy: currentUser.name,
      notes: bulkForm.notes
    });

    const totalLiters = Number((cowQty + bufQty).toFixed(1));
    setBulkForm({
      ...bulkForm,
      cowMilk: '',
      buffaloMilk: '',
      notes: ''
    });

    setSavedBatchMsg(`✓ Recorded ${selectedShift === 'morning' ? 'Morning' : 'Evening'} Total Production (${totalLiters} L)!`);
    setTimeout(() => setSavedBatchMsg(''), 3000);
  };

  // Filter history
  const filteredHistory = milkEntries.filter(item => {
    const matchesSearch =
      item.animalId?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.animalName?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.date?.includes(historySearch);

    const matchesShift = historyShiftFilter === 'all' || item.shift === historyShiftFilter;
    const matchesMode = historyModeFilter === 'all' || (item.entryMode || 'animal_wise') === historyModeFilter;

    return matchesSearch && matchesShift && matchesMode;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.milk.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              Today Total (आज कुल): {stats.todayMilkTotal} Liters
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Morning & Evening Shift Milk Collection, Animal-wise Logs & Bulk Production
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveSubTab('daily_entry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'daily_entry' ? 'option-active-light' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🥛 Daily Collection (दैनिक संकलन)
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'history' ? 'option-active-light' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📋 Entry Register (रजिस्टर - {milkEntries.length})
          </button>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'calculator' ? 'option-active-light' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🧮 FAT/SNF Calculator (कैलकुलेटर)
          </button>
          <button
            onClick={() => setActiveSubTab('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'sales' ? 'option-active-light' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🚚 Sales & Supply (दूध बिक्री)
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedBatchMsg && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl font-bold text-center text-sm shadow-lg animate-in fade-in zoom-in-95 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{savedBatchMsg}</span>
        </div>
      )}

      {/* TAB 1: DAILY MILK ENTRY */}
      {activeSubTab === 'daily_entry' && (
        <div className="space-y-4">
          {/* PRIMARY MODE SELECTION TOGGLE */}
          <div className="p-3.5 rounded-2xl border-2 border-emerald-500/40 bg-slate-900/60 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
              <span className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Select Milk Entry Mode (दूध एंट्री का तरीका चुनें):</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-700/60 shadow-xs">
                {entryMode === 'animal_wise' ? '✓ Option 1 Active: Animal Wise (पशु-वार)' : '✓ Option 2 Active: Total Production (कुल दूध)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1 Button */}
              <button
                type="button"
                onClick={() => setEntryMode('animal_wise')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all relative cursor-pointer ${
                  entryMode === 'animal_wise'
                    ? 'option-active-light'
                    : 'option-inactive-dark'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black">
                    Option 1: 🐄 🐃 Animal Wise (पशु के हिसाब से)
                  </span>
                  {entryMode === 'animal_wise' ? (
                    <span className="active-pill text-[10px] font-black px-2 py-0.5 rounded-full">
                      ✓ सक्रिय (Active)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold opacity-60">क्लिक करें</span>
                  )}
                </div>
                <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed">
                  Record milk per cattle. Total production is automatically computed.
                </p>
              </button>

              {/* Option 2 Button */}
              <button
                type="button"
                onClick={() => setEntryMode('total_production')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all relative cursor-pointer ${
                  entryMode === 'total_production'
                    ? 'option-active-light'
                    : 'option-inactive-dark'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black">
                    Option 2: 🥛 Total Production (कुल दूध उत्पादन)
                  </span>
                  {entryMode === 'total_production' ? (
                    <span className="active-pill text-[10px] font-black px-2 py-0.5 rounded-full">
                      ✓ सक्रिय (Active)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold opacity-60">क्लिक करें</span>
                  )}
                </div>
                <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed">
                  Directly enter total Cow Milk (e.g. 85L) and Buffalo Milk (e.g. 120L).
                </p>
              </button>
            </div>
          </div>

          {/* Date, Shift and Live Shift KPI Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Date (तारीख)
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Shift (शिफ्ट)
                </label>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedShift('morning')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedShift === 'morning'
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌅 Morning (सुबह)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShift('evening')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedShift === 'evening'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌇 Evening (शाम)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Shift Totals */}
            <div className="flex items-center gap-2 bg-dairy-50/70 p-2.5 rounded-xl border border-dairy-200">
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 block">🐄 Cow Milk (गाय)</span>
                <strong className="text-xs text-dairy-800 font-extrabold">{currentShiftSummary.cowTotal} L</strong>
              </div>
              <div className="h-6 w-px bg-dairy-200"></div>
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 block">🐃 Buffalo Milk (भैंस)</span>
                <strong className="text-xs text-dairy-800 font-extrabold">{currentShiftSummary.bufTotal} L</strong>
              </div>
              <div className="h-6 w-px bg-dairy-200"></div>
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-dairy-600 block">⚡ Shift Total (कुल)</span>
                <strong className="text-sm text-dairy-700 font-black">{currentShiftSummary.grandTotal} L</strong>
              </div>
            </div>
          </div>

          {/* MODE 1: OPTION 1 UI (ANIMAL WISE ENTRY) */}
          {entryMode === 'animal_wise' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                    <span>🐄 🐃 Option 1: Animal Wise Entry (पशु-वार दूध एंट्री)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record milk per cattle. Total production is automatically computed below.
                  </p>
                </div>
                <span className="text-xs bg-dairy-100 text-dairy-800 px-3 py-1 rounded-xl font-bold">
                  {selectedShift === 'morning' ? '🌅 Morning (सुबह)' : '🌇 Evening (शाम)'}
                </span>
              </div>

              <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Animal Select / Manual Input */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        {cattleMode === 'select' ? 'Select Cattle (पशु चुनें)' : 'Enter Manually (मैन्युअल दर्ज करें)'}
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setCattleMode('select')}
                          className={`px-2 py-0.5 rounded-md transition-all ${cattleMode === 'select' ? 'bg-white shadow text-dairy-800' : 'text-slate-500'}`}
                        >
                          From List
                        </button>
                        <button
                          type="button"
                          onClick={() => setCattleMode('manual')}
                          className={`px-2 py-0.5 rounded-md transition-all ${cattleMode === 'manual' ? 'bg-dairy-600 text-white shadow' : 'text-slate-500'}`}
                        >
                          + Manual
                        </button>
                      </div>
                    </div>

                    {cattleMode === 'select' ? (
                      animals.length > 0 ? (
                        <SearchableSelect
                          options={animals.map(a => ({
                            value: a.tagNo,
                            label: `${a.tagNo} - ${a.name}`,
                            tag: a.tagNo,
                            name: a.name,
                            sublabel: `${a.type === 'cow' ? 'Cow (गाय)' : 'Buffalo (भैंस)'}${a.breed ? ` • ${a.breed}` : ''}`,
                            icon: a.type === 'cow' ? '🐄' : '🐃'
                          }))}
                          value={singleForm.animalId}
                          onChange={(val) => setSingleForm({ ...singleForm, animalId: val })}
                          placeholder="-- पशु चुनें (Select Animal) --"
                          searchPlaceholder="🔍 नाम या टैग से खोजें (Search by Name or Tag)..."
                          accentColor="emerald"
                        />
                      ) : (
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                          No animals found. Click <strong>'+ Manual'</strong> to add.
                        </div>
                      )
                    ) : (
                      <div className="p-3 bg-dairy-50/70 border border-dairy-200 rounded-xl space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Tag ID (टैग नं.) *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. B001, C001"
                              value={manualCattle.tagNo}
                              onChange={(e) => setManualCattle({ ...manualCattle, tagNo: e.target.value })}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono font-bold bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Animal Name (नाम) *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Murrah-1, Gauri"
                              value={manualCattle.name}
                              onChange={(e) => setManualCattle({ ...manualCattle, name: e.target.value })}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Type (प्रकार)
                            </label>
                            <select
                              value={manualCattle.type}
                              onChange={(e) => setManualCattle({ ...manualCattle, type: e.target.value })}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                            >
                              <option value="cow">🐄 Cow (गाय)</option>
                              <option value="buffalo">🐃 Buffalo (भैंस)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Breed (नस्ल)
                            </label>
                            <input
                              type="text"
                              placeholder="Gir / Murrah"
                              value={manualCattle.breed}
                              onChange={(e) => setManualCattle({ ...manualCattle, breed: e.target.value })}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="lg:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Milk Quantity (मात्रा - Liters) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 8.5"
                      value={singleForm.quantity}
                      onChange={(e) => setSingleForm({ ...singleForm, quantity: e.target.value })}
                      className="w-full px-3 py-2.5 text-base rounded-xl border border-slate-300 font-black text-dairy-800 focus:ring-2 focus:ring-dairy-500 bg-white"
                    />
                  </div>

                  {/* FAT & SNF */}
                  <div className="lg:col-span-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1 text-center">
                          FAT % (फैट)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={singleForm.fat}
                          onChange={(e) => setSingleForm({ ...singleForm, fat: e.target.value })}
                          className="w-full px-2 py-2.5 text-xs text-center rounded-xl border border-slate-300 font-bold bg-white focus:ring-2 focus:ring-dairy-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1 text-center">
                          SNF % (एसएनएफ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={singleForm.snf}
                          onChange={(e) => setSingleForm({ ...singleForm, snf: e.target.value })}
                          className="w-full px-2 py-2.5 text-xs text-center rounded-xl border border-slate-300 font-bold bg-white focus:ring-2 focus:ring-dairy-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Cattle Milk (दूध सुरक्षित करें)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: OPTION 2 UI (TOTAL MILK PRODUCTION BULK ENTRY) */}
          {entryMode === 'total_production' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                      <Milk className="w-5 h-5 text-dairy-600" />
                      <span>Option 2: Record Total Production (कुल दूध उत्पादन दर्ज करें)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Directly record bulk total yield for cow and buffalo without selecting individual cattle.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-900 text-xs font-bold">
                    Date: {entryDate} | {selectedShift === 'morning' ? '🌅 Morning (सुबह)' : '🌇 Evening (शाम)'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* COW BULK CARD */}
                  <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🐄</span>
                        <div>
                          <h4 className="font-bold text-sm text-amber-950">Cow Milk Total (गाय का कुल दूध)</h4>
                          <p className="text-[10px] text-amber-700">Total shift cow production</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                        Cow Total
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Total Quantity / मात्रा (Liters)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 85.0"
                          value={bulkForm.cowMilk}
                          onChange={(e) => setBulkForm({ ...bulkForm, cowMilk: e.target.value })}
                          className="w-full px-4 py-3 text-xl font-black text-amber-950 bg-white rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                          LITERS
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 mb-1 text-center">
                          Avg FAT % (फैट)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={bulkForm.cowFat}
                          onChange={(e) => setBulkForm({ ...bulkForm, cowFat: e.target.value })}
                          className="w-full p-2 text-xs text-center rounded-xl border border-amber-300 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 mb-1 text-center">
                          Avg SNF % (एसएनएफ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={bulkForm.cowSnf}
                          onChange={(e) => setBulkForm({ ...bulkForm, cowSnf: e.target.value })}
                          className="w-full p-2 text-xs text-center rounded-xl border border-amber-300 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BUFFALO BULK CARD */}
                  <div className="p-5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🐃</span>
                        <div>
                          <h4 className="font-bold text-sm text-indigo-950">Buffalo Milk Total (भैंस का कुल दूध)</h4>
                          <p className="text-[10px] text-indigo-700">Total shift buffalo production</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-bold">
                        Buffalo Total
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-indigo-900 mb-1">
                        Total Quantity / मात्रा (Liters)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 120.0"
                          value={bulkForm.buffaloMilk}
                          onChange={(e) => setBulkForm({ ...bulkForm, buffaloMilk: e.target.value })}
                          className="w-full px-4 py-3 text-xl font-black text-indigo-950 bg-white rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-700">
                          LITERS
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-800 mb-1 text-center">
                          Avg FAT % (फैट)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={bulkForm.buffaloFat}
                          onChange={(e) => setBulkForm({ ...bulkForm, buffaloFat: e.target.value })}
                          className="w-full p-2 text-xs text-center rounded-xl border border-indigo-300 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-800 mb-1 text-center">
                          Avg SNF % (एसएनएफ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={bulkForm.buffaloSnf}
                          onChange={(e) => setBulkForm({ ...bulkForm, buffaloSnf: e.target.value })}
                          className="w-full p-2 text-xs text-center rounded-xl border border-indigo-300 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto Calculated Grand Total Summary Box */}
                {(() => {
                  const cowL = Number(bulkForm.cowMilk) || 0;
                  const bufL = Number(bulkForm.buffaloMilk) || 0;
                  const totalL = Number((cowL + bufL).toFixed(1));

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-dairy-950 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-dairy-300 font-bold block">
                          {selectedShift === 'morning' ? '🌅 Morning (सुबह)' : '🌇 Evening (शाम)'} Shift Total Production
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-black text-white">{totalL}</span>
                          <span className="text-sm font-bold text-dairy-200">Liters (Cow {cowL}L + Buffalo {bufL}L)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={totalL <= 0}
                          className={`px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 ${
                            totalL > 0
                              ? 'bg-dairy-500 hover:bg-dairy-400 text-white shadow-dairy-500/30 cursor-pointer'
                              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Save Total Production (सुरक्षित करें - {totalL} L)</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </form>
            </div>
          )}

          {/* LOWER SECTION: UNIFIED SHIFT MILK COLLECTION RECORDS TABLE WITH FULL FILTERS & DYNAMIC SUMS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-5">
            {/* Header with Title and Presets */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                  <span>📋 दूध संकलन रिकॉर्ड्स टेबल (Milk Records Register)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  तारीख (Date), शिफ्ट (Shift) व पशु प्रकार (Cow/Buffalo) अनुसार फ़िल्टर व कुल योग देखें
                </p>
              </div>

              {/* Quick Date Range Preset Pills */}
              <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuickDateRange('today')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white shadow-sm text-slate-800 hover:text-dairy-700 transition-colors"
                >
                  आज (Today)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDateRange('yesterday')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg hover:bg-white/80 text-slate-600 transition-colors"
                >
                  कल (Yesterday)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDateRange('7days')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg hover:bg-white/80 text-slate-600 transition-colors"
                >
                  7 दिन (7 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDateRange('month')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg hover:bg-white/80 text-slate-600 transition-colors"
                >
                  यह माह (Month)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDateRange('all')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg hover:bg-white/80 text-slate-600 transition-colors"
                >
                  सभी (All)
                </button>
              </div>
            </div>

            {/* FILTER CONTROLS BAR: 1. Date to Date | 2. Shift Morning/Evening/Both | 3. Cow/Buffalo/Both */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Date to Date (From Date to To Date) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-dairy-600" />
                  <span>1. तारीख रेंज (From - To Date)</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={tableFromDate}
                    onChange={(e) => setTableFromDate(e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-dairy-500"
                    title="From Date (शुरुआती तारीख)"
                  />
                  <span className="text-xs font-bold text-slate-400">से</span>
                  <input
                    type="date"
                    value={tableToDate}
                    onChange={(e) => setTableToDate(e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-dairy-500"
                    title="To Date (अंतिम तारीख)"
                  />
                </div>
              </div>

              {/* 2. Shift (Morning, Evening, Both Shift) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-dairy-600" />
                  <span>2. शिफ्ट (Shift Selection)</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTableShift('all')}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center ${
                      tableShift === 'all'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    दोनों (Both)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableShift('morning')}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center ${
                      tableShift === 'morning'
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌅 सुबह
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableShift('evening')}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center ${
                      tableShift === 'evening'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌇 शाम
                  </button>
                </div>
              </div>

              {/* 3. Cow, Buffalo, Both Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Milk className="w-3 h-3 text-dairy-600" />
                  <span>3. पशु प्रकार (Cattle Type)</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTableAnimalType('all')}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center ${
                      tableAnimalType === 'all'
                        ? 'bg-dairy-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    दोनों (Both)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableAnimalType('cow')}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center ${
                      tableAnimalType === 'cow'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🐄 गाय
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableAnimalType('buffalo')}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center ${
                      tableAnimalType === 'buffalo'
                        ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🐃 भैंस
                  </button>
                </div>
              </div>

              {/* 4. Search Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Search className="w-3 h-3 text-dairy-600" />
                  <span>4. खोजें (Search Cattle / Tag)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="टैग नं., नाम या तारीख..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-dairy-500"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* DYNAMIC SUM CARDS ACCORDING TO FILTERS: sum(cow), sum(buffalo), sum(both) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Card 1: Cow Milk Total */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <span>🐄</span>
                    <span>गाय कुल दूध (Sum Cow)</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-950">{tableSummary.cowTotal}</span>
                    <span className="text-xs font-bold text-amber-800">Liters</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">फ़िल्टर अनुसार गाय का कुल उत्पादन</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-900 text-lg font-bold">
                  🐄
                </div>
              </div>

              {/* Card 2: Buffalo Milk Total */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                    <span>🐃</span>
                    <span>भैंस कुल दूध (Sum Buffalo)</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-950">{tableSummary.bufTotal}</span>
                    <span className="text-xs font-bold text-indigo-800">Liters</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-medium">फ़िल्टर अनुसार भैंस का कुल उत्पादन</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-200/80 flex items-center justify-center text-indigo-900 text-lg font-bold">
                  🐃
                </div>
              </div>

              {/* Card 3: Both Grand Total */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-300 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                    <span>⚡</span>
                    <span>कुल दूध उत्पादन (Sum Both Total)</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-900">{tableSummary.grandTotal}</span>
                    <span className="text-xs font-bold text-emerald-800">Liters</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">कुल {tableSummary.count} रिकॉर्ड्स का महायोग</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-base font-black shadow">
                  🥛
                </div>
              </div>
            </div>

            {/* LOWER TABLE DISPLAY */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Date & Shift (तारीख व शिफ्ट)</th>
                    <th className="p-3">Entry Mode (तरीका)</th>
                    <th className="p-3">Cattle / Description (पशु व विवरण)</th>
                    <th className="p-3">Type (प्रकार)</th>
                    <th className="p-3 text-right">Quantity (L)</th>
                    <th className="p-3 text-center">FAT / SNF</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tableFilteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        दिए गए फ़िल्टर (तारीख, शिफ्ट, पशु) के अनुसार कोई रिकॉर्ड नहीं मिला।
                      </td>
                    </tr>
                  ) : (
                    tableFilteredEntries.map((item) => {
                      const isBulk = item.entryMode === 'bulk_total';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{item.date}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.shift === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.shift === 'morning' ? '🌅 Morning' : '🌇 Evening'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isBulk ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isBulk ? '🥛 Option 2: Total Production' : '🐄 Option 1: Animal Wise'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{item.animalName}</span>
                            {item.animalId && !isBulk && (
                              <span className="font-mono text-[10px] text-slate-400">{item.animalId}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.animalType === 'cow' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.animalType === 'cow' ? '🐄 Cow (गाय)' : '🐃 Buffalo (भैंस)'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 text-sm">
                            {item.quantity} L
                          </td>
                          <td className="p-3 text-center text-[11px]">
                            {item.fat}% / {item.snf}%
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => deleteMilkEntry(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Bar */}
            <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
              <span className="text-slate-500">
                कुल रिकॉर्ड्स (Filtered Entries): {tableSummary.count} Entries
              </span>
              <div className="flex items-center gap-4 flex-wrap">
                <span>🐄 Cow: <strong className="text-amber-900">{tableSummary.cowTotal}L</strong></span>
                <span>🐃 Buffalo: <strong className="text-indigo-900">{tableSummary.bufTotal}L</strong></span>
                <span className="px-3 py-1 rounded-lg bg-dairy-600 text-white font-extrabold shadow-sm">
                  ⚡ Total Sum (Both): {tableSummary.grandTotal} Liters
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORY LOG & TABLE */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Milk Log Register (दूध संकलन रजिस्टर)
              </h3>
              <p className="text-xs text-slate-500">
                All animal-wise logs and bulk shift total records
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search date, tag, animal..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-dairy-500"
                />
              </div>

              {/* Shift Filter */}
              <select
                value={historyShiftFilter}
                onChange={(e) => setHistoryShiftFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="all">All Shifts (सभी शिफ्ट)</option>
                <option value="morning">🌅 Morning (सुबह)</option>
                <option value="evening">🌇 Evening (शाम)</option>
              </select>

              {/* Mode Filter */}
              <select
                value={historyModeFilter}
                onChange={(e) => setHistoryModeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="all">All Modes (सभी तरीके)</option>
                <option value="animal_wise">🐄 Animal Wise (पशु-वार)</option>
                <option value="bulk_total">🥛 Total Production (कुल दूध)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Date & Shift (तारीख व शिफ्ट)</th>
                  <th className="p-3">Mode (तरीका)</th>
                  <th className="p-3">Description / Animal (पशु)</th>
                  <th className="p-3">Type (प्रकार)</th>
                  <th className="p-3 text-right">Quantity (L)</th>
                  <th className="p-3 text-center">FAT / SNF</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No milk records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => {
                    const isBulk = item.entryMode === 'bulk_total';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{item.date}</div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                            item.shift === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {item.shift === 'morning' ? '🌅 Morning (सुबह)' : '🌇 Evening (शाम)'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isBulk ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isBulk ? '🥛 Total Production (कुल दूध)' : '🐄 Animal Wise (पशु-वार)'}
                          </span>
                        </td>
                        <td className="p-3">
                          <strong className="text-slate-900 block">{item.animalName}</strong>
                          <span className="font-mono text-[10px] text-slate-400">{item.animalId}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.animalType === 'cow' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {item.animalType === 'cow' ? '🐄 Cow (गाय)' : '🐃 Buffalo (भैंस)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          {item.quantity} L
                        </td>
                        <td className="p-3 text-center text-[11px]">
                          {item.fat}% / {item.snf}%
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => deleteMilkEntry(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FAT/SNF CALCULATOR */}
      {activeSubTab === 'calculator' && <FatSnfCalculator />}

      {/* TAB 4: MILK SALES */}
      {activeSubTab === 'sales' && <MilkSales />}
    </div>
  );
};
