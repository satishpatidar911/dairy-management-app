import React, { useState } from 'react';
import { X, Milk, Receipt, CreditCard, CheckCircle2, Layers, Truck, Building2, Users, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { SearchableSelect } from '../common/SearchableSelect';

export const QuickEntryModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const {
    animals,
    addAnimal,
    customers,
    addMilkEntry,
    addBulkMilkEntry,
    addCustomerSale,
    addDairySale,
    calculateRateFromMaster,
    rateMasterConfig,
    addExpense,
    recordCustomerPayment
  } = useApp();

  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const today = getTodayDate();

  const [activeTab, setActiveTab] = useState('milk'); // 'milk' | 'selling' | 'expense' | 'payment'
  const [successMsg, setSuccessMsg] = useState('');

  // Milk Entry Mode in Quick Entry: 'animal_wise' | 'total_production'
  const [quickMilkMode, setQuickMilkMode] = useState('animal_wise');

  // Animal Mode: 'select' | 'manual'
  const [cattleMode, setCattleMode] = useState('select');
  const [manualCattle, setManualCattle] = useState({
    tagNo: '',
    name: '',
    type: 'cow',
    breed: 'Gir (गीर)'
  });

  const quickAnimalOptions = animals.map(a => ({
    value: a.tagNo,
    label: `${a.tagNo} - ${a.name}`,
    tag: a.tagNo,
    name: a.name,
    sublabel: `${a.type === 'cow' ? 'Cow (गाय)' : 'Buffalo (भैंस)'}${a.breed ? ` • ${a.breed}` : ''}`,
    icon: a.type === 'cow' ? '🐄' : '🐃'
  }));

  // Single Animal Milk form state
  const [milkForm, setMilkForm] = useState({
    date: today,
    animalId: animals[0]?.tagNo || '',
    shift: 'morning',
    quantity: '',
    fat: '4.5',
    snf: '8.5',
    rate: '60'
  });

  // Bulk Total Milk form state
  const [bulkQuickForm, setBulkQuickForm] = useState({
    date: today,
    shift: 'morning',
    cowMilk: '',
    cowRate: '55',
    buffaloMilk: '',
    buffaloRate: '75'
  });

  // 🥛 Milk Selling form state in Quick Entry
  const [sellingType, setSellingType] = useState('customer'); // 'customer' | 'dairy'
  const [quickCustomerSale, setQuickCustomerSale] = useState({
    date: today,
    customerId: customers[0]?.id || '',
    customName: '',
    shift: 'morning',
    quantity: '',
    rate: customers[0]?.rate ? String(customers[0].rate) : '60'
  });
  const [quickDairySale, setQuickDairySale] = useState({
    date: today,
    dairyName: 'Amul / Saras Chilling Plant (अमूल डेयरी प्लांट)',
    shift: 'morning',
    quantity: '',
    fat: '6.8',
    snf: '9.0',
    milkType: 'buffalo'
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    date: today,
    category: 'fodder',
    title: '',
    amount: '',
    payee: '',
    paymentMethod: 'cash',
    notes: ''
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    date: today,
    customerId: customers[0]?.id || '',
    amount: '',
    paymentMode: 'cash',
    note: ''
  });

  if (!isOpen) return null;

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  const handleMilkSubmit = (e) => {
    e.preventDefault();

    if (quickMilkMode === 'animal_wise') {
      if (!milkForm.quantity) return;

      let tag = milkForm.animalId;
      let name = 'Unknown';
      let type = 'cow';

      if (cattleMode === 'manual') {
        if (!manualCattle.tagNo || !manualCattle.name) {
          alert('Please enter Tag ID and Name (कृपया टैग नं. और नाम दर्ज करें)');
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
          dailyCapacity: Number(milkForm.quantity) * 2,
          weight: 400
        });
      } else {
        const selectedAnimal = animals.find(a => a.tagNo === milkForm.animalId);
        if (selectedAnimal) {
          tag = selectedAnimal.tagNo;
          name = selectedAnimal.name;
          type = selectedAnimal.type;
        }
      }

      addMilkEntry({
        entryMode: 'animal_wise',
        date: milkForm.date || today,
        animalId: tag,
        animalName: name,
        animalType: type,
        shift: milkForm.shift,
        quantity: Number(milkForm.quantity),
        fat: Number(milkForm.fat),
        snf: Number(milkForm.snf),
        rate: Number(milkForm.rate),
        recordedBy: 'Quick Entry'
      });

      showSuccess(`✓ ${milkForm.date || today} का दूध उत्पादन सुरक्षित हुआ!`);
    } else {
      // Bulk Total Mode
      const cowQ = Number(bulkQuickForm.cowMilk) || 0;
      const bufQ = Number(bulkQuickForm.buffaloMilk) || 0;

      if (cowQ <= 0 && bufQ <= 0) {
        alert('Please enter cow or buffalo milk quantity');
        return;
      }

      addBulkMilkEntry({
        date: bulkQuickForm.date || today,
        shift: bulkQuickForm.shift,
        cowMilk: cowQ,
        cowRate: bulkQuickForm.cowRate,
        buffaloMilk: bufQ,
        buffaloRate: bulkQuickForm.buffaloRate,
        recordedBy: 'Quick Bulk Entry'
      });

      showSuccess(`✓ Recorded total production (${cowQ + bufQ} L) on ${bulkQuickForm.date || today}!`);
    }
  };

  const handleSellingSubmit = (e) => {
    e.preventDefault();

    if (sellingType === 'customer') {
      const qty = Number(quickCustomerSale.quantity);
      if (!qty || qty <= 0) {
        alert('कृपया दूध की मात्रा (Liters) दर्ज करें');
        return;
      }

      let custName = quickCustomerSale.customName.trim();
      let custId = quickCustomerSale.customerId;

      const selected = customers.find(c => c.id === quickCustomerSale.customerId);
      if (selected) {
        custName = selected.name;
        custId = selected.id;
      } else if (!custName && customers.length > 0) {
        custName = customers[0].name;
        custId = customers[0].id;
      } else if (!custName) {
        custName = 'सामान्य ग्राहक';
      }

      const rate = Number(quickCustomerSale.rate) || 60;
      const amount = Math.round(qty * rate);

      addCustomerSale({
        customerId: custId,
        customerName: custName,
        date: quickCustomerSale.date || today,
        shift: quickCustomerSale.shift,
        quantity: qty,
        rate,
        amount,
        source: 'Quick Entry'
      });

      showSuccess(`✓ ग्राहक बिक्री (${quickCustomerSale.date || today}): ${custName} (${qty} L @ ₹${rate}/L = ₹${amount})`);
    } else {
      // Dairy Plant Sale
      const qty = Number(quickDairySale.quantity);
      if (!qty || qty <= 0) {
        alert('कृपया दूध की मात्रा दर्ज करें');
        return;
      }

      const isFatOnly = rateMasterConfig?.pricingMode === 'fat_only';
      const rate = calculateRateFromMaster(quickDairySale.fat, isFatOnly ? null : quickDairySale.snf, quickDairySale.milkType);
      const totalAmount = Math.round(qty * rate);

      addDairySale({
        date: quickDairySale.date || today,
        shift: quickDairySale.shift,
        dairyName: quickDairySale.dairyName,
        milkType: quickDairySale.milkType,
        quantity: qty,
        fat: Number(quickDairySale.fat),
        snf: isFatOnly ? null : Number(quickDairySale.snf),
        pricingMode: isFatOnly ? 'fat_only' : 'fat_snf',
        rate,
        totalAmount
      });

      showSuccess(`✓ डेयरी प्लांट बिक्री (${quickDairySale.date || today}): ${qty} L @ ₹${rate}/L = ₹${totalAmount}`);
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.amount) return;

    addExpense({
      ...expenseForm,
      date: expenseForm.date || today,
      amount: Number(expenseForm.amount)
    });

    showSuccess(`✓ Expense recorded on ${expenseForm.date || today}!`);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.customerId) return;

    recordCustomerPayment(
      paymentForm.customerId,
      Number(paymentForm.amount),
      paymentForm.paymentMode,
      paymentForm.note,
      paymentForm.date || today
    );

    showSuccess(`✓ Customer payment recorded on ${paymentForm.date || today}!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <span>⚡</span>
            <span>{t.actions.quickEntry}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons (4 Tabs: Production, Selling, Expense, Payment) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('milk')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'milk'
                ? 'option-active-light'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Milk className="w-3.5 h-3.5" />
            <span>उत्पादन</span>
          </button>

          <button
            onClick={() => setActiveTab('selling')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'selling'
                ? 'option-active-light'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>दूध बिक्री</span>
          </button>

          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'expense'
                ? 'option-active-light'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>खर्च</span>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'payment'
                ? 'option-active-light'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>भुगतान</span>
          </button>
        </div>

        {/* Success Overlay Notification */}
        {successMsg ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce mb-3" />
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{successMsg}</p>
          </div>
        ) : (
          <div className="p-5">
            {/* TAB 1: MILK PRODUCTION */}
            {activeTab === 'milk' && (
              <form onSubmit={handleMilkSubmit} className="space-y-3.5">
                {/* Milk Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setQuickMilkMode('animal_wise')}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      quickMilkMode === 'animal_wise'
                        ? 'option-active-light'
                        : 'option-inactive-dark'
                    }`}
                  >
                    1. 🐄 पशु-वार (Animal-Wise)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickMilkMode('total_production')}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      quickMilkMode === 'total_production'
                        ? 'option-active-light'
                        : 'option-inactive-dark'
                    }`}
                  >
                    2. 🥛 कुल दूध (Total Yield)
                  </button>
                </div>

                {/* 📅 Date & Shift Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-dairy-600" />
                      <span>दिनांक (Date) *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={quickMilkMode === 'animal_wise' ? milkForm.date : bulkQuickForm.date}
                      onChange={(e) => {
                        const d = e.target.value;
                        setMilkForm(prev => ({ ...prev, date: d }));
                        setBulkQuickForm(prev => ({ ...prev, date: d }));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-dairy-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      शिफ्ट (Shift)
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMilkForm(prev => ({ ...prev, shift: 'morning' }));
                          setBulkQuickForm(prev => ({ ...prev, shift: 'morning' }));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          (quickMilkMode === 'animal_wise' ? milkForm.shift : bulkQuickForm.shift) === 'morning'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        🌅 सुबह
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMilkForm(prev => ({ ...prev, shift: 'evening' }));
                          setBulkQuickForm(prev => ({ ...prev, shift: 'evening' }));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          (quickMilkMode === 'animal_wise' ? milkForm.shift : bulkQuickForm.shift) === 'evening'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        🌇 शाम
                      </button>
                    </div>
                  </div>
                </div>

                {quickMilkMode === 'animal_wise' ? (
                  <>
                    {/* Cattle Selection Mode */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <label className="block text-xs font-bold text-slate-700">
                        पशु चुनें (Select Cattle)
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setCattleMode('select')}
                          className={`px-2 py-0.5 rounded-md ${cattleMode === 'select' ? 'bg-white shadow text-dairy-800 font-bold' : 'text-slate-500'}`}
                        >
                          सूची से
                        </button>
                        <button
                          type="button"
                          onClick={() => setCattleMode('manual')}
                          className={`px-2 py-0.5 rounded-md ${cattleMode === 'manual' ? 'bg-white shadow text-dairy-800 font-bold' : 'text-slate-500'}`}
                        >
                          + मैन्युअल
                        </button>
                      </div>
                    </div>

                    {cattleMode === 'select' ? (
                      animals.length === 0 ? (
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                          कोई पशु नहीं मिला (+ मैन्युअल से नया जोड़ें)
                        </div>
                      ) : (
                        <SearchableSelect
                          options={quickAnimalOptions}
                          value={milkForm.animalId}
                          onChange={(val) => setMilkForm({ ...milkForm, animalId: val })}
                          placeholder="-- पशु चुनें (Select Animal) --"
                          searchPlaceholder="🔍 नाम या टैग से खोजें (Search by Name or Tag)..."
                          accentColor="emerald"
                        />
                      )
                    ) : (
                      <div className="p-3 bg-dairy-50/50 rounded-xl border border-dairy-200 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Tag No (उदा. COW-105)"
                            value={manualCattle.tagNo}
                            onChange={(e) => setManualCattle({ ...manualCattle, tagNo: e.target.value })}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                          />
                          <input
                            type="text"
                            placeholder="नाम (उदा. श्यामा)"
                            value={manualCattle.name}
                            onChange={(e) => setManualCattle({ ...manualCattle, name: e.target.value })}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={manualCattle.type}
                            onChange={(e) => setManualCattle({ ...manualCattle, type: e.target.value })}
                            className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                          >
                            <option value="cow">🐄 गाय (Cow)</option>
                            <option value="buffalo">🐃 भैंस (Buffalo)</option>
                          </select>
                          <input
                            type="text"
                            placeholder="नस्ल (उदा. गीर, मुर्राह)"
                            value={manualCattle.breed}
                            onChange={(e) => setManualCattle({ ...manualCattle, breed: e.target.value })}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        दूध मात्रा (Liters) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="उदा. 7.5"
                        value={milkForm.quantity}
                        onChange={(e) => setMilkForm({ ...milkForm, quantity: e.target.value })}
                        className="w-full px-4 py-2.5 text-lg font-black text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-dairy-500 text-center"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Option 2: Bulk Total Form */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                        <span className="text-[11px] font-bold text-amber-900 block mb-1">🐄 गाय कुल (Liters)</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="85.0"
                          value={bulkQuickForm.cowMilk}
                          onChange={(e) => setBulkQuickForm({ ...bulkQuickForm, cowMilk: e.target.value })}
                          className="w-full p-2 text-base font-black text-slate-900 text-center rounded-lg border border-amber-300 bg-white"
                        />
                      </div>

                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                        <span className="text-[11px] font-bold text-indigo-900 block mb-1">🐃 भैंस कुल (Liters)</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="120.0"
                          value={bulkQuickForm.buffaloMilk}
                          onChange={(e) => setBulkQuickForm({ ...bulkQuickForm, buffaloMilk: e.target.value })}
                          className="w-full p-2 text-base font-black text-slate-900 text-center rounded-lg border border-indigo-300 bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full mt-3 py-2.5 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>दूध उत्पादन सुरक्षित करें</span>
                </button>
              </form>
            )}

            {/* TAB 2: MILK SELLING (बिक्री) */}
            {activeTab === 'selling' && (
              <form onSubmit={handleSellingSubmit} className="space-y-3.5">
                {/* Selling Type: Customer vs Dairy Plant */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSellingType('customer')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      sellingType === 'customer'
                        ? 'bg-white text-blue-800 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>1. ग्राहक बिक्री</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSellingType('dairy')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      sellingType === 'dairy'
                        ? 'bg-white text-indigo-800 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>2. डेयरी प्लांट बिक्री</span>
                  </button>
                </div>

                {/* 📅 Date & Shift Row for Selling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>दिनांक (Date) *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={sellingType === 'customer' ? quickCustomerSale.date : quickDairySale.date}
                      onChange={(e) => {
                        const d = e.target.value;
                        setQuickCustomerSale(prev => ({ ...prev, date: d }));
                        setQuickDairySale(prev => ({ ...prev, date: d }));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      शिफ्ट (Shift)
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const c = customers.find(x => x.id === quickCustomerSale.customerId);
                          const defaultQty = c ? (c.morningQty || '') : '';
                          setQuickCustomerSale(prev => ({
                            ...prev,
                            shift: 'morning',
                            quantity: defaultQty ? String(defaultQty) : prev.quantity
                          }));
                          setQuickDairySale(prev => ({ ...prev, shift: 'morning' }));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          (sellingType === 'customer' ? quickCustomerSale.shift : quickDairySale.shift) === 'morning'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        🌅 सुबह
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const c = customers.find(x => x.id === quickCustomerSale.customerId);
                          const defaultQty = c ? (c.eveningQty || '') : '';
                          setQuickCustomerSale(prev => ({
                            ...prev,
                            shift: 'evening',
                            quantity: defaultQty ? String(defaultQty) : prev.quantity
                          }));
                          setQuickDairySale(prev => ({ ...prev, shift: 'evening' }));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          (sellingType === 'customer' ? quickCustomerSale.shift : quickDairySale.shift) === 'evening'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        🌇 शाम
                      </button>
                    </div>
                  </div>
                </div>

                {sellingType === 'customer' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ग्राहक चुनें (Customer) *
                      </label>
                      <select
                        value={quickCustomerSale.customerId}
                        onChange={(e) => {
                          const c = customers.find(x => x.id === e.target.value);
                          const defaultQty = c ? (quickCustomerSale.shift === 'evening' ? (c.eveningQty || '') : (c.morningQty || '')) : '';
                          setQuickCustomerSale({
                            ...quickCustomerSale,
                            customerId: e.target.value,
                            rate: c?.rate ? String(c.rate) : quickCustomerSale.rate,
                            quantity: defaultQty ? String(defaultQty) : quickCustomerSale.quantity
                          });
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                      >
                        {customers.length === 0 ? (
                          <option value="">सामान्य ग्राहक</option>
                        ) : (
                          customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} (🌅 {c.morningQty || 0}L · 🌇 {c.eveningQty || 0}L - ₹{c.rate}/L)
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          दर (₹/L)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={quickCustomerSale.rate}
                          onChange={(e) => setQuickCustomerSale({ ...quickCustomerSale, rate: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs font-bold text-center rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          कुल अनुमानित (₹)
                        </label>
                        <div className="w-full px-2 py-1.5 text-xs font-black text-center rounded-xl bg-slate-100 border border-slate-200 text-emerald-800">
                          ₹{Math.round((Number(quickCustomerSale.quantity) || 0) * (Number(quickCustomerSale.rate) || 60))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        दूध मात्रा (Liters) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="उदा. 3.0"
                        value={quickCustomerSale.quantity}
                        onChange={(e) => setQuickCustomerSale({ ...quickCustomerSale, quantity: e.target.value })}
                        className="w-full px-4 py-2.5 text-lg font-black text-blue-900 rounded-xl border border-slate-300 text-center"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Dairy Plant Sale */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        डेयरी प्लांट / चिलिंग सेंटर
                      </label>
                      <input
                        type="text"
                        value={quickDairySale.dairyName}
                        onChange={(e) => setQuickDairySale({ ...quickDairySale, dairyName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          FAT %
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={quickDairySale.fat}
                          onChange={(e) => setQuickDairySale({ ...quickDairySale, fat: e.target.value })}
                          className="w-full p-1.5 text-xs font-bold text-center rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          SNF %
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={quickDairySale.snf}
                          onChange={(e) => setQuickDairySale({ ...quickDairySale, snf: e.target.value })}
                          className="w-full p-1.5 text-xs font-bold text-center rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        दूध मात्रा (Liters) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="उदा. 150"
                        value={quickDairySale.quantity}
                        onChange={(e) => setQuickDairySale({ ...quickDairySale, quantity: e.target.value })}
                        className="w-full px-4 py-2.5 text-lg font-black text-indigo-900 rounded-xl border border-slate-300 text-center"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full mt-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>दूध बिक्री सुरक्षित करें</span>
                </button>
              </form>
            )}

            {/* TAB 3: EXPENSE ENTRY */}
            {activeTab === 'expense' && (
              <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
                {/* 📅 Date & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-rose-50/50 p-2.5 rounded-xl border border-rose-200">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      <span>दिनांक (Date) *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      खर्च श्रेणी (Category)
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                    >
                      <option value="fodder">Green & Dry Fodder (चारा एवं भूसा)</option>
                      <option value="feed">Feed, Cake & Bran (दाना, खल व चोकर)</option>
                      <option value="medicine">Medicine & Vet (दवाई व डॉक्टर)</option>
                      <option value="labor">Labor & Wages (मजदूरी व वेतन)</option>
                      <option value="utility">Electricity & Water (बिजली व पानी)</option>
                      <option value="other">Other Misc (अन्य फुटकर खर्च)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount (राशि ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="उदा. 1500"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Mode (माध्यम)
                    </label>
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    >
                      <option value="cash">Cash (नकद)</option>
                      <option value="upi">UPI / PhonePe / GPay</option>
                      <option value="bank">Bank Transfer (बैंक ट्रांसफर)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description / Paid To (विवरण)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. 2 ट्रॉली गेहूं का भूसा खरीदा"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors active:scale-95"
                >
                  Save Expense (खर्च सुरक्षित करें)
                </button>
              </form>
            )}

            {/* TAB 4: CUSTOMER PAYMENT */}
            {activeTab === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                {/* 📅 Date & Customer Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>दिनांक (Date) *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      ग्राहक चुनें (Customer) *
                    </label>
                    <select
                      value={paymentForm.customerId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, customerId: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-bold"
                    >
                      {customers.length === 0 ? (
                        <option value="">No customers found</option>
                      ) : (
                        customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (बकाया: ₹{c.balance})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount Received / प्राप्त राशि (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="उदा. 2000"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Mode (माध्यम)
                    </label>
                    <select
                      value={paymentForm.paymentMode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-bold"
                    >
                      <option value="cash">Cash (नकद)</option>
                      <option value="upi">UPI / PhonePe / GPay</option>
                      <option value="bank">Bank Transfer (बैंक ट्रांसफर)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receipt Note / टिप्पणी
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. मासिक दूध हिसाब भुगतान"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-colors active:scale-95"
                >
                  Save Payment (भुगतान जमा करें)
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
