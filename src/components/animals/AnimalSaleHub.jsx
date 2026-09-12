import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  FileText,
  Printer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  CreditCard,
  Building2,
  Wallet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SearchableSelect } from '../common/SearchableSelect';

export const AnimalSaleHub = () => {
  const { animals, cattleSales, sellAnimal, deleteCattleSale } = useApp();
  const { farmProfile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, cow, buffalo, keda, kedi
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, full, due
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState(null);

  // Active animals available for sale (exclude already sold)
  const availableAnimals = useMemo(() => {
    return animals.filter(a => a.status !== 'sold');
  }, [animals]);

  // Form state for selling an animal
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [sellForm, setSellForm] = useState({
    animalSelectionType: 'existing', // 'existing' | 'manual'
    animalId: '',
    tagNo: '',
    animalName: '',
    animalType: 'cow',
    breed: 'Gir (गीर)',
    saleDate: getTodayDate(),
    salePrice: '',
    paidAmount: '',
    paymentMode: 'cash',
    buyerName: '',
    buyerPhone: '',
    buyerAddress: '',
    reason: 'Farm Management / Profit',
    notes: ''
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Handle animal selection change in form
  const handleAnimalSelect = (eOrId) => {
    const selectedId = (typeof eOrId === 'object' && eOrId?.target) ? eOrId.target.value : eOrId;
    if (!selectedId) {
      setSellForm(prev => ({
        ...prev,
        animalId: '',
        tagNo: '',
        animalName: '',
        animalType: 'cow',
        breed: ''
      }));
      return;
    }

    const animal = animals.find(a => a.id === selectedId || a.tagNo === selectedId);
    if (animal) {
      setSellForm(prev => ({
        ...prev,
        animalId: animal.id,
        tagNo: animal.tagNo,
        animalName: animal.name,
        animalType: animal.type || 'cow',
        breed: animal.breed || ''
      }));
    }
  };

  // Submit Animal Sale
  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (sellForm.animalSelectionType === 'existing' && !sellForm.animalId) {
      setFormError('कृपया बिक्री के लिए एक पशु चुनें (Please select an animal)');
      return;
    }

    if (sellForm.animalSelectionType === 'manual' && (!sellForm.tagNo || !sellForm.animalName)) {
      setFormError('कृपया पशु का टैग नं. और नाम दर्ज करें (Enter Tag No and Name)');
      return;
    }

    if (!sellForm.salePrice || Number(sellForm.salePrice) <= 0) {
      setFormError('कृपया वैध बिक्री मूल्य दर्ज करें (Please enter a valid sale price)');
      return;
    }

    if (!sellForm.buyerName.trim()) {
      setFormError('कृपया खरीदार का नाम दर्ज करें (Please enter Buyer Name)');
      return;
    }

    const salePrice = Number(sellForm.salePrice);
    const paidAmount = sellForm.paidAmount !== '' ? Number(sellForm.paidAmount) : salePrice;

    try {
      await sellAnimal({
        animalId: sellForm.animalId || `MANUAL-${Date.now()}`,
        tagNo: sellForm.tagNo,
        animalName: sellForm.animalName,
        animalType: sellForm.animalType,
        breed: sellForm.breed,
        saleDate: sellForm.saleDate || getTodayDate(),
        salePrice: salePrice,
        paidAmount: paidAmount,
        paymentMode: sellForm.paymentMode,
        buyerName: sellForm.buyerName.trim(),
        buyerPhone: sellForm.buyerPhone.trim(),
        buyerAddress: sellForm.buyerAddress.trim(),
        reason: sellForm.reason,
        notes: sellForm.notes
      });

      setFormSuccess('🎉 पशु बिक्री सफलतापूर्वक दर्ज हो गई है! (Animal Sale Recorded)');
      setTimeout(() => {
        setIsSellModalOpen(false);
        setFormSuccess('');
        // Reset form
        setSellForm({
          animalSelectionType: 'existing',
          animalId: '',
          tagNo: '',
          animalName: '',
          animalType: 'cow',
          breed: 'Gir (गीर)',
          saleDate: getTodayDate(),
          salePrice: '',
          paidAmount: '',
          paymentMode: 'cash',
          buyerName: '',
          buyerPhone: '',
          buyerAddress: '',
          reason: 'Farm Management / Profit',
          notes: ''
        });
      }, 1200);
    } catch (err) {
      setFormError('त्रुटि: बिक्री दर्ज नहीं हो सकी (Failed to save sale)');
    }
  };

  // Filtered Sales List
  const filteredSales = useMemo(() => {
    return cattleSales.filter(sale => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          (sale.animalName && sale.animalName.toLowerCase().includes(q)) ||
          (sale.tagNo && sale.tagNo.toLowerCase().includes(q)) ||
          (sale.buyerName && sale.buyerName.toLowerCase().includes(q)) ||
          (sale.buyerPhone && sale.buyerPhone.includes(q));
        if (!match) return false;
      }

      // Type Filter
      if (typeFilter !== 'all' && sale.animalType !== typeFilter) return false;

      // Payment Filter
      if (paymentFilter === 'full' && Number(sale.paidAmount) < Number(sale.salePrice)) return false;
      if (paymentFilter === 'due' && Number(sale.paidAmount) >= Number(sale.salePrice)) return false;

      // Date Range
      if (fromDate && sale.saleDate < fromDate) return false;
      if (toDate && sale.saleDate > toDate) return false;

      return true;
    });
  }, [cattleSales, searchQuery, typeFilter, paymentFilter, fromDate, toDate]);

  // Dynamic KPI Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCount = filteredSales.length;
    const totalSalesAmount = filteredSales.reduce((sum, s) => sum + Number(s.salePrice || 0), 0);
    const totalPaidAmount = filteredSales.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
    const totalDueAmount = Math.max(0, totalSalesAmount - totalPaidAmount);

    return {
      totalCount,
      totalSalesAmount,
      totalPaidAmount,
      totalDueAmount
    };
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 shadow-sm">🏷️</span>
            <span>CATTLE SALES (पशु बिक्री प्रबंधन)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            पशु बिक्री, खरीदार का विवरण, भुगतान एवं रसीद रिकॉर्ड्स
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setIsSellModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>SELL ANIMAL (नया पशु बेचें)</span>
        </button>
      </div>

      {/* KPI Metrics Strip (4 Dynamic Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Animals Sold */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              कुल बेचे गए पशु
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">{summaryMetrics.totalCount}</span>
              <span className="text-xs font-bold text-slate-400">पशु</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Sold Cattle Count</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-xl font-bold">
            🏷️
          </div>
        </div>

        {/* Card 2: Total Sales Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              कुल बिक्री मूल्य (Revenue)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">₹{summaryMetrics.totalSalesAmount.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-[10px] text-emerald-600/80 font-medium">Total Cattle Income</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xl font-bold">
            💰
          </div>
        </div>

        {/* Card 3: Total Paid Amount */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              प्राप्त राशि (Received)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-600">₹{summaryMetrics.totalPaidAmount.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-[10px] text-blue-600/80 font-medium">Cash / Online Paid</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xl font-bold">
            💵
          </div>
        </div>

        {/* Card 4: Due Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              बकाया राशि (Pending Due)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-black ${summaryMetrics.totalDueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                ₹{summaryMetrics.totalDueAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] text-rose-600/80 font-medium">Remaining to Collect</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 text-xl font-bold">
            ⏳
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="खोजें (टैग, पशु का नाम, खरीदार, फोन)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="all">सभी पशु प्रकार (All Types)</option>
            <option value="cow">🐄 गाय (Cow)</option>
            <option value="buffalo">🐃 भैंस (Buffalo)</option>
            <option value="keda">🐂 केड़ा (Keda)</option>
            <option value="kedi">🐃 केडी (Kedi)</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="all">सभी भुगतान स्थिति (All Payment)</option>
            <option value="full">✅ पूरा भुगतान (Fully Paid)</option>
            <option value="due">⏳ बकाया राशि (Due Balance)</option>
          </select>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
              title="From Date"
            />
            <span className="text-xs font-bold text-slate-400">से</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Sold Cattle Register Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
              <span>📋 CATTLE SALES REGISTER (पशु बिक्री रजिस्टर)</span>
            </h3>
            <p className="text-xs text-slate-500">
              कुल {filteredSales.length} बिक्री रिकॉर्ड्स
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">तारीख (Sale Date)</th>
                <th className="p-3">पशु विवरण (Animal / Tag)</th>
                <th className="p-3">प्रकार (Type)</th>
                <th className="p-3">खरीदार (Buyer Details)</th>
                <th className="p-3 text-right">बिक्री मूल्य (₹)</th>
                <th className="p-3 text-right">प्राप्त राशि (₹)</th>
                <th className="p-3 text-center">स्थिति (Status)</th>
                <th className="p-3 text-center">रसीद / एक्शन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-3xl">🏷️</p>
                      <p className="font-bold text-slate-600">कोई पशु बिक्री रिकॉर्ड नहीं मिला।</p>
                      <p className="text-xs text-slate-400">ऊपर 'SELL ANIMAL' बटन दबाकर नया पशु बिक्री दर्ज करें।</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const salePrice = Number(sale.salePrice || 0);
                  const paidAmount = Number(sale.paidAmount || 0);
                  const dueAmount = Math.max(0, salePrice - paidAmount);
                  const isFullyPaid = dueAmount === 0;

                  return (
                    <tr key={sale.id} className="hover:bg-amber-50/50 transition-colors">
                      {/* Sale Date */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{sale.saleDate}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{sale.id}</span>
                      </td>

                      {/* Animal Details */}
                      <td className="p-3">
                        <strong className="text-slate-900 block text-xs">{sale.animalName}</strong>
                        <span className="font-mono text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {sale.tagNo}
                        </span>
                      </td>

                      {/* Type & Breed */}
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.animalType === 'cow' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                        }`}>
                          {sale.animalType === 'cow' ? '🐄 Cow (गाय)' : '🐃 Buffalo (भैंस)'}
                        </span>
                        {sale.breed && <span className="block text-[10px] text-slate-400 mt-0.5">{sale.breed}</span>}
                      </td>

                      {/* Buyer Details */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{sale.buyerName}</span>
                        {sale.buyerPhone && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" /> {sale.buyerPhone}
                          </span>
                        )}
                        {sale.buyerAddress && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {sale.buyerAddress}
                          </span>
                        )}
                      </td>

                      {/* Sale Price */}
                      <td className="p-3 text-right font-black text-slate-900 text-sm">
                        ₹{salePrice.toLocaleString('en-IN')}
                      </td>

                      {/* Paid Amount */}
                      <td className="p-3 text-right">
                        <span className="font-black text-emerald-700 block">
                          ₹{paidAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          via {sale.paymentMode || 'Cash'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {isFullyPaid ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            ✅ पूरा भुगतान
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold block">
                            ⏳ बकाया: ₹{dueAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedReceiptSale(sale)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="रसीद देखें / प्रिंट करें (Print Receipt)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`क्या आप ${sale.animalName} (${sale.tagNo}) का बिक्री रिकॉर्ड हटाना चाहते हैं?`)) {
                                deleteCattleSale(sale.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="हटाएं (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SELL ANIMAL FORM */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/20 text-white text-lg">🏷️</span>
                <div>
                  <h3 className="font-black text-base uppercase tracking-wider">SELL ANIMAL (पशु बिक्री फॉर्म)</h3>
                  <p className="text-xs text-amber-100">पशु की बिक्री, मूल्य एवं खरीदार का विवरण दर्ज करें</p>
                </div>
              </div>
              <button
                onClick={() => setIsSellModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaleSubmit} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* 1. Animal Selection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    1. पशु चुनें (Select Animal)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSellForm(prev => ({ ...prev, animalSelectionType: 'existing' }))}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        sellForm.animalSelectionType === 'existing'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      मौजूदा पशु सूची ({availableAnimals.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellForm(prev => ({ ...prev, animalSelectionType: 'manual' }))}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        sellForm.animalSelectionType === 'manual'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      अन्य / नया पशु
                    </button>
                  </div>
                </div>

                {sellForm.animalSelectionType === 'existing' ? (
                  <>
                    <SearchableSelect
                      options={availableAnimals.map(a => ({
                        value: a.id,
                        label: `${a.name} (${a.tagNo})`,
                        tag: a.tagNo,
                        name: a.name,
                        sublabel: `${a.type === 'cow' ? 'Cow (गाय)' : 'Buffalo (भैंस)'}${a.breed ? ` • ${a.breed}` : ''}`,
                        icon: a.type === 'cow' ? '🐄' : '🐃'
                      }))}
                      value={sellForm.animalId}
                      onChange={handleAnimalSelect}
                      placeholder="-- उपलब्ध पशु चुनें (Select from list) --"
                      searchPlaceholder="🔍 नाम या टैग से खोजें (Search by Name or Tag)..."
                      accentColor="amber"
                    />

                    {/* SHOW PURCHASE AMOUNT AND PURCHASE DATE RIGHT BELOW SELECTED ANIMAL */}
                    {sellForm.animalId && (() => {
                      const animal = animals.find(a => a.id === sellForm.animalId || a.tagNo === sellForm.animalId);
                      if (!animal) return null;

                      const purchasePrice = Number(animal.purchasePrice || animal.purchase_price || 0);
                      const purchaseDate = animal.purchaseDate || animal.purchase_date || animal.dob || 'Farm Born';
                      const isOwn = animal.origin === 'own' || purchaseDate === 'Farm Born' || purchasePrice === 0;

                      // Profit calculation if salePrice is entered
                      const salePriceNum = Number(sellForm.salePrice || 0);
                      const profitGain = salePriceNum > 0 && purchasePrice > 0 ? (salePriceNum - purchasePrice) : null;

                      return (
                        <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-300 shadow-sm space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* 1. Purchase Amount */}
                            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                💰 खरीद मूल्य (Purchase Amount)
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">
                                {purchasePrice > 0 ? `₹${purchasePrice.toLocaleString('en-IN')}` : (isOwn ? '🌾 फार्म पर जन्मी' : '₹0')}
                              </span>
                            </div>

                            {/* 2. Purchase Date */}
                            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                📅 खरीद तारीख (Purchase Date)
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">
                                {purchaseDate}
                              </span>
                            </div>

                            {/* 3. Breed & Origin */}
                            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                🧬 नस्ल व उत्पत्ति (Breed)
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                                {animal.breed || (animal.type === 'cow' ? 'Gir (गीर)' : 'Murrah (मुर्राह)')}
                              </span>
                            </div>

                            {/* 4. Capacity & Status */}
                            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                🥛 दूध क्षमता (Capacity)
                              </span>
                              <span className="text-xs font-black text-dairy-700 block mt-0.5">
                                {animal.dailyCapacity ? `${animal.dailyCapacity} L/day` : 'N/A'} • {animal.status || 'Active'}
                              </span>
                            </div>
                          </div>

                          {/* Instant Profit/Loss Difference Preview */}
                          {profitGain !== null && (
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-between border ${
                              profitGain >= 0 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}>
                              <span>📊 बिक्री लाभ / अंतर (Profit/Margin):</span>
                              <span className="text-sm font-black">
                                {profitGain >= 0 ? `+₹${profitGain.toLocaleString('en-IN')} (मुनाफा)` : `-₹${Math.abs(profitGain).toLocaleString('en-IN')} (अंतर)`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">टैग नं. (Tag No)</label>
                      <input
                        type="text"
                        placeholder="e.g. COW-101"
                        value={sellForm.tagNo}
                        onChange={(e) => setSellForm(prev => ({ ...prev, tagNo: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">पशु का नाम (Name)</label>
                      <input
                        type="text"
                        placeholder="e.g. Gouri"
                        value={sellForm.animalName}
                        onChange={(e) => setSellForm(prev => ({ ...prev, animalName: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">प्रकार (Type)</label>
                      <select
                        value={sellForm.animalType}
                        onChange={(e) => setSellForm(prev => ({ ...prev, animalType: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                      >
                        <option value="cow">🐄 Cow (गाय)</option>
                        <option value="buffalo">🐃 Buffalo (भैंस)</option>
                        <option value="keda">🐂 केड़ा (Keda)</option>
                        <option value="kedi">🐃 केडी (Kedi)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Sale Price & Payment Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  2. बिक्री मूल्य व भुगतान (Sale Price & Payment)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      बिक्री की तारीख (Sale Date)
                    </label>
                    <input
                      type="date"
                      value={sellForm.saleDate}
                      onChange={(e) => setSellForm(prev => ({ ...prev, saleDate: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      कुल बिक्री मूल्य (Sale Price ₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 65000"
                      value={sellForm.salePrice}
                      onChange={(e) => setSellForm(prev => ({ ...prev, salePrice: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 bg-white text-slate-900"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      प्राप्त राशि (Received ₹)
                    </label>
                    <input
                      type="number"
                      placeholder={sellForm.salePrice || '0'}
                      value={sellForm.paidAmount}
                      onChange={(e) => setSellForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-black rounded-xl border border-slate-300 bg-white text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      भुगतान का माध्यम (Payment Mode)
                    </label>
                    <select
                      value={sellForm.paymentMode}
                      onChange={(e) => setSellForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="cash">💵 Cash (नकद)</option>
                      <option value="online">📱 Online / UPI (PhonePe / GPay)</option>
                      <option value="bank">🏦 Bank Transfer (बैंक खाता)</option>
                      <option value="khata">📒 Udhaar / Khata (उधार)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      बिक्री का कारण (Reason for Sale)
                    </label>
                    <select
                      value={sellForm.reason}
                      onChange={(e) => setSellForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Farm Management / Profit">मुनाफा / नियमित बिक्री (Profit)</option>
                      <option value="Low Yield">कम दूध उत्पादन (Low Yield)</option>
                      <option value="Dry / Old Age">सूखा / अधिक उम्र (Old Age)</option>
                      <option value="Calf / Heifer Sale">बछड़ा / बछड़ी बिक्री (Calf Sale)</option>
                      <option value="Space / Feed Limitation">स्थान / आहार सीमा</option>
                      <option value="Other">अन्य (Other)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Buyer Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  3. खरीदार की जानकारी (Buyer Information)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      खरीदार का नाम (Buyer Name) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={sellForm.buyerName}
                      onChange={(e) => setSellForm(prev => ({ ...prev, buyerName: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      मोबाइल नंबर (Mobile No)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={sellForm.buyerPhone}
                      onChange={(e) => setSellForm(prev => ({ ...prev, buyerPhone: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      गाँव / पता (Village / City)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kalapipal"
                      value={sellForm.buyerAddress}
                      onChange={(e) => setSellForm(prev => ({ ...prev, buyerAddress: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    अतिरिक्त टिप्पणी / विवरण (Notes / Remarks)
                  </label>
                  <input
                    type="text"
                    placeholder="वैकल्पिक टिप्पणी..."
                    value={sellForm.notes}
                    onChange={(e) => setSellForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-600/30 transition-all transform active:scale-95 flex items-center gap-2"
                >
                  <span>CONFIRM ANIMAL SALE (बिक्री सुरक्षित करें)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SALE RECEIPT PRINT PREVIEW */}
      {selectedReceiptSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm uppercase">CATTLE SALE RECEIPT (पशु बिक्री रसीद)</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptSale(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-medium text-slate-800" id="cattle-sale-receipt">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-base font-black uppercase text-slate-900">{farmProfile?.farmName || 'SHIVAJI MILK CENTER'}</h2>
                <p className="text-[11px] text-slate-600 font-bold">मालिक: {farmProfile?.ownerName || 'SATISH PATIDAR'} | 📞 {farmProfile?.phone || '8770234735'}</p>
                <p className="text-[10px] text-slate-400">{farmProfile?.address || 'CHAKROD KALAPIPAL'}</p>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                  पशु बिक्री प्रमाण पत्र / रसीद
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">रसीद क्र. (Receipt ID)</span>
                  <span className="font-mono font-bold text-slate-800">{selectedReceiptSale.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">बिक्री तारीख (Sale Date)</span>
                  <span className="font-bold text-slate-800">{selectedReceiptSale.saleDate}</span>
                </div>
              </div>

              {/* Animal & Buyer Details */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] text-slate-700">1. बेचे गए पशु का विवरण</div>
                <div className="p-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>पशु नाम: <strong>{selectedReceiptSale.animalName}</strong></div>
                  <div>टैग नं.: <strong className="font-mono">{selectedReceiptSale.tagNo}</strong></div>
                  <div>प्रकार: <strong>{selectedReceiptSale.animalType === 'cow' ? 'गाय (Cow)' : 'भैंस (Buffalo)'}</strong></div>
                  <div>नस्ल: <strong>{selectedReceiptSale.breed || 'N/A'}</strong></div>
                </div>

                <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-t border-slate-200">2. खरीदार का विवरण</div>
                <div className="p-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>खरीदार का नाम: <strong>{selectedReceiptSale.buyerName}</strong></div>
                  <div>फोन नंबर: <strong>{selectedReceiptSale.buyerPhone || 'N/A'}</strong></div>
                  <div className="col-span-2">पता/गाँव: <strong>{selectedReceiptSale.buyerAddress || 'N/A'}</strong></div>
                </div>

                <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-t border-slate-200">3. भुगतान विवरण (Payment Breakdown)</div>
                <div className="p-3 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>कुल बिक्री मूल्य (Total Price):</span>
                    <strong>₹{Number(selectedReceiptSale.salePrice || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>प्राप्त राशि (Paid via {selectedReceiptSale.paymentMode}):</span>
                    <strong>₹{Number(selectedReceiptSale.paidAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-rose-700 pt-1 border-t border-dashed border-slate-200">
                    <span>बकाया राशि (Due Balance):</span>
                    <strong>₹{Math.max(0, Number(selectedReceiptSale.salePrice || 0) - Number(selectedReceiptSale.paidAmount || 0)).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1 mx-auto"></div>
                  <span>खरीदार के हस्ताक्षर</span>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1 mx-auto"></div>
                  <span>डेयरी मालिक / अधिकृत हस्ताक्षर</span>
                </div>
              </div>
            </div>

            {/* Receipt Modal Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReceiptSale(null)}
                className="px-4 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
              >
                बंद करें (Close)
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 text-xs font-black rounded-xl bg-slate-900 text-white flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>प्रिंट करें (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
