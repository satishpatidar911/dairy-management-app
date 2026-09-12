import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Users,
  Building2,
  Table,
  UploadCloud,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Calculator,
  CheckCircle2,
  Search,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  FileText,
  X,
  Zap,
  RefreshCw,
  Settings,
  Edit2,
  Save,
  Pencil
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { GoogleFormSyncModal } from '../customers/GoogleFormSyncModal';

export const MilkSellingHub = () => {
  const { t } = useLanguage();
  const {
    customerSales,
    addCustomerSale,
    updateCustomerSale,
    syncGoogleSheetCustomerSales,
    deleteCustomerSale,
    dairySales,
    addDairySale,
    updateDairySale,
    deleteDairySale,
    dairyCenters,
    addDairyCenter,
    deleteDairyCenter,
    rateMasterConfig,
    updateRateMaster,
    calculateRateFromMaster,
    recalculateDairySalesWithMasterRate,
    stats,
    customers,
    milkEntries,
    googleSheetsConfig,
    fetchAndSyncGoogleSheet,
    isDark
  } = useApp();
  const { currentUser, farmProfile } = useAuth();

  // Primary active tab default: 'dairy_sale'
  const [activeTab, setActiveTab] = useState('dairy_sale'); // 'dairy_sale' | 'customer_sale' | 'rate_master' | 'reconciliation'
  const [successMsg, setSuccessMsg] = useState('');
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  // Edit Dairy Sale Modal State
  const [editingDairySale, setEditingDairySale] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDairyForm, setEditDairyForm] = useState({
    date: '',
    shift: 'morning',
    dairyName: '',
    milkType: 'buffalo',
    quantity: '',
    pricingMode: 'fat_only',
    fat: '6.5',
    snf: '',
    customFatRate: '',
    manualRate: '',
    slipNo: '',
    status: 'completed'
  });

  // Edit Customer Sale Modal State
  const [editingCustomerSale, setEditingCustomerSale] = useState(null);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({
    date: '',
    shift: 'morning',
    customerName: '',
    quantity: '',
    rate: '',
    amount: ''
  });

  const openEditDairySale = (sale) => {
    setEditingDairySale(sale);
    const isFatOnly = sale.pricingMode === 'fat_only' || (!sale.pricingMode && !sale.snf) || (sale.snf === 9);
    setEditDairyForm({
      date: sale.date || new Date().toISOString().split('T')[0],
      shift: sale.shift || 'morning',
      dairyName: sale.dairyName || (dairyCenters[0]?.name || 'HARIHAR DAIRY'),
      milkType: sale.milkType || 'buffalo',
      quantity: String(sale.quantity || ''),
      pricingMode: isFatOnly ? 'fat_only' : (sale.pricingMode || 'fat_only'),
      fat: String(sale.fat || '6.5'),
      snf: isFatOnly ? '' : String(sale.snf || ''),
      customFatRate: '',
      manualRate: String(sale.rate || '60'),
      slipNo: sale.slipNo || '',
      status: sale.status || 'completed'
    });
    setIsEditModalOpen(true);
  };

  const openEditCustomerSale = (sale) => {
    setEditingCustomerSale(sale);
    setEditCustomerForm({
      date: sale.date || new Date().toISOString().split('T')[0],
      shift: sale.shift || 'morning',
      customerName: sale.customerName || '',
      quantity: String(sale.quantity || ''),
      rate: String(sale.rate || '60'),
      amount: String(sale.amount || '')
    });
    setIsEditCustomerModalOpen(true);
  };

  // Edit Modal Effective FAT Rate
  const editEffectiveFatRate = useMemo(() => {
    if (editDairyForm.customFatRate && Number(editDairyForm.customFatRate) > 0) {
      return Number(editDairyForm.customFatRate);
    }
    return editDairyForm.milkType === 'buffalo'
      ? (Number(rateMasterConfig.buffaloFatRate) || 9.33)
      : (Number(rateMasterConfig.cowFatRate) || 8.50);
  }, [editDairyForm.customFatRate, editDairyForm.milkType, rateMasterConfig]);

  // Edit Modal Auto-Calculated Rate
  const editAutoCalculatedRate = useMemo(() => {
    if (editDairyForm.pricingMode === 'fixed') {
      return Number(editDairyForm.manualRate) || 60;
    }
    const snfVal = editDairyForm.pricingMode === 'fat_snf' ? editDairyForm.snf : null;
    return calculateRateFromMaster(
      editDairyForm.fat,
      snfVal,
      editDairyForm.milkType,
      editDairyForm.pricingMode,
      editDairyForm.customFatRate ? Number(editDairyForm.customFatRate) : null
    );
  }, [editDairyForm.fat, editDairyForm.snf, editDairyForm.milkType, editDairyForm.pricingMode, editDairyForm.customFatRate, editDairyForm.manualRate, calculateRateFromMaster]);

  const editAutoCalculatedAmount = useMemo(() => {
    const qty = Number(editDairyForm.quantity) || 0;
    return Math.round(qty * editAutoCalculatedRate * 100) / 100;
  }, [editDairyForm.quantity, editAutoCalculatedRate]);

  const handleUpdateDairySaleSubmit = (e) => {
    e.preventDefault();
    if (!editingDairySale) return;
    const qty = Number(editDairyForm.quantity);
    if (!qty || qty <= 0) {
      alert('कृपया दूध की मात्रा (Liters) दर्ज करें');
      return;
    }

    const isFatOnly = editDairyForm.pricingMode === 'fat_only';
    updateDairySale(editingDairySale.id, {
      date: editDairyForm.date,
      shift: editDairyForm.shift,
      dairyName: editDairyForm.dairyName,
      milkType: editDairyForm.milkType,
      pricingMode: editDairyForm.pricingMode,
      quantity: qty,
      fat: Number(editDairyForm.fat) || 0,
      snf: isFatOnly ? null : (Number(editDairyForm.snf) || null),
      appliedFatRate: isFatOnly ? editEffectiveFatRate : null,
      rate: editAutoCalculatedRate,
      totalAmount: editAutoCalculatedAmount,
      slipNo: editDairyForm.slipNo,
      status: editDairyForm.status
    });

    setIsEditModalOpen(false);
    setEditingDairySale(null);
    setSuccessMsg(`✓ डेयरी प्लांट बिक्री रिकॉर्ड (${editDairyForm.date}, ${qty} L) सफलतापूर्वक अपडेट हुआ!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUpdateCustomerSaleSubmit = (e) => {
    e.preventDefault();
    if (!editingCustomerSale) return;
    const qty = Number(editCustomerForm.quantity) || 0;
    const rate = Number(editCustomerForm.rate) || 0;
    const amount = Number(editCustomerForm.amount) || Math.round(qty * rate);

    updateCustomerSale(editingCustomerSale.id, {
      date: editCustomerForm.date,
      shift: editCustomerForm.shift,
      customerName: editCustomerForm.customerName,
      quantity: qty,
      rate,
      amount
    });

    setIsEditCustomerModalOpen(false);
    setEditingCustomerSale(null);
    setSuccessMsg(`✓ ग्राहक बिक्री रिकॉर्ड (${editCustomerForm.customerName}) सफलतापूर्वक अपडेट हुआ!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // TAB 1: DIRECT CUSTOMER SALE FORM STATE
  const [directCustomerMode, setDirectCustomerMode] = useState('select'); // 'select' | 'manual'
  const [directSaleForm, setDirectSaleForm] = useState({
    customerId: customers[0]?.id || '',
    customName: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    quantity: '',
    rate: customers[0]?.rate ? String(customers[0].rate) : '60'
  });

  // TAB 1: GOOGLE SHEETS CUSTOMER SALE STATE
  const [sheetInput, setSheetInput] = useState('');
  const [isSheetPreviewOpen, setIsSheetPreviewOpen] = useState(false);
  const [parsedSheetRows, setParsedSheetRows] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerShiftFilter, setCustomerShiftFilter] = useState('all');

  // Trigger Live Google Sheets Sync
  const handleTriggerLiveSync = async () => {
    if (!googleSheetsConfig.sheetUrl) {
      setIsGoogleSyncModalOpen(true);
      return;
    }

    setIsLiveSyncing(true);
    const res = await fetchAndSyncGoogleSheet();
    setIsLiveSyncing(false);

    if (res.success) {
      setSuccessMsg(`✓ ${res.message}`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } else {
      alert(`Sync Error: ${res.error || 'Failed to sync'}`);
    }
  };

  // Parse pasted Google Sheets or CSV data
  const handleParseSheetData = () => {
    if (!sheetInput.trim()) return;

    const lines = sheetInput.trim().split('\n');
    const rows = [];

    lines.forEach((line) => {
      // Split by tab (if copied from Google Sheets) or comma (if CSV)
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cols.length >= 2) {
        const name = cols[0]?.trim();
        // Skip header row if present
        if (name.toLowerCase().includes('name') || name.toLowerCase().includes('ग्राहक')) return;

        const qty = parseFloat(cols[1]?.trim()) || 0;
        const rate = parseFloat(cols[2]?.trim()) || 60;
        const shift = cols[3]?.trim().toLowerCase().includes('ev') || cols[3]?.trim().includes('शाम') ? 'evening' : 'morning';
        const date = cols[4]?.trim() || new Date().toISOString().split('T')[0];
        const amount = Math.round(qty * rate);

        if (name && qty > 0) {
          rows.push({
            customerName: name,
            quantity: qty,
            rate,
            shift,
            date,
            amount
          });
        }
      }
    });

    if (rows.length === 0) {
      alert('Please paste valid Google Sheets data (Columns: Name, Quantity, Rate, Shift, Date)');
      return;
    }

    setParsedSheetRows(rows);
    setIsSheetPreviewOpen(true);
  };

  // Direct Customer Sale Handler
  const handleDirectCustomerSaleSubmit = (e) => {
    e.preventDefault();
    const qty = Number(directSaleForm.quantity);
    if (!qty || qty <= 0) {
      alert('कृपया दूध की मात्रा (Liters) दर्ज करें');
      return;
    }

    let custName = directSaleForm.customName.trim();
    let custId = directSaleForm.customerId;

    if (directCustomerMode === 'select') {
      const selected = customers.find(c => c.id === directSaleForm.customerId);
      if (selected) {
        custName = selected.name;
        custId = selected.id;
      } else if (customers.length > 0) {
        custName = customers[0].name;
        custId = customers[0].id;
      } else {
        custName = 'सामान्य ग्राहक (General Customer)';
      }
    }

    if (!custName) {
      alert('कृपया ग्राहक का नाम चुनें या दर्ज करें');
      return;
    }

    const rate = Number(directSaleForm.rate) || 60;
    const amount = Math.round(qty * rate);

    addCustomerSale({
      customerId: custId,
      customerName: custName,
      date: directSaleForm.date,
      shift: directSaleForm.shift,
      quantity: qty,
      rate,
      amount,
      source: 'Direct Entry'
    });

    setDirectSaleForm(prev => ({
      ...prev,
      quantity: '',
      customName: ''
    }));

    setSuccessMsg(`✓ ग्राहक बिक्री (${custName}: ${qty} L @ ₹${rate}/L = ₹${amount}) सफलतापूर्वक दर्ज हो गई!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleConfirmSheetSync = () => {
    syncGoogleSheetCustomerSales(parsedSheetRows, 'Google Sheets (Paste)');
    setIsSheetPreviewOpen(false);
    setSheetInput('');
    setParsedSheetRows([]);
    setSuccessMsg(`✓ Synced ${parsedSheetRows.length} customer sale records from Google Sheets!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLoadSampleSheetData = () => {
    const today = new Date().toISOString().split('T')[0];
    const sample = `Ramesh Sharma\t2.5\t60\tmorning\t${today}\nSuresh Verma\t1.5\t60\tmorning\t${today}\nRajesh Choudhary\t3.0\t60\tmorning\t${today}\nHotel Royal Palace\t25.0\t58\tmorning\t${today}\nAmit Kirana Store\t15.0\t58\tmorning\t${today}`;
    setSheetInput(sample);
  };

  // TAB 2: DAIRY WHOLESALE SALE STATE
  const [isAddDairyModalOpen, setIsAddDairyModalOpen] = useState(false);
  const [newDairyNameInput, setNewDairyNameInput] = useState('');

  const [dairyForm, setDairyForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    dairyName: dairyCenters?.[0]?.name || 'HARIHAR DAIRY',
    milkType: 'buffalo',
    pricingMode: 'fat_only', // 'fat_only' | 'fat_snf' | 'fixed'
    quantity: '',
    fat: '6.5',
    customFatRate: '',
    snf: '',
    manualRate: '',
    slipNo: ''
  });

  // Ensure default dairyName is synced
  useEffect(() => {
    if (!dairyForm.dairyName && dairyCenters && dairyCenters.length > 0) {
      setDairyForm(prev => ({ ...prev, dairyName: dairyCenters[0].name }));
    }
  }, [dairyCenters, dairyForm.dairyName]);

  const handleAddNewDairy = (e) => {
    e.preventDefault();
    const name = newDairyNameInput.trim();
    if (!name) {
      alert('कृपया डेयरी का नाम दर्ज करें');
      return;
    }
    addDairyCenter(name);
    setDairyForm(prev => ({ ...prev, dairyName: name }));
    setNewDairyNameInput('');
    setIsAddDairyModalOpen(false);
    setSuccessMsg(`✓ नई डेयरी "${name}" लिस्ट में सुरक्षित हो गई!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const [selectedSlipToPrint, setSelectedSlipToPrint] = useState(null);

  // Effective FAT Rate for Only FAT Mode
  const effectiveFatRate = useMemo(() => {
    if (dairyForm.customFatRate && Number(dairyForm.customFatRate) > 0) {
      return Number(dairyForm.customFatRate);
    }
    return dairyForm.milkType === 'buffalo'
      ? (Number(rateMasterConfig.buffaloFatRate) || 9.33)
      : (Number(rateMasterConfig.cowFatRate) || 8.50);
  }, [dairyForm.customFatRate, dairyForm.milkType, rateMasterConfig]);

  // Auto-calculated Dairy Sale Rate based on selected mode (Only FAT or FAT+SNF)
  const autoCalculatedRate = useMemo(() => {
    if (dairyForm.pricingMode === 'fixed') {
      return Number(dairyForm.manualRate) || 60;
    }
    const snfVal = dairyForm.pricingMode === 'fat_snf' ? dairyForm.snf : null;
    return calculateRateFromMaster(
      dairyForm.fat,
      snfVal,
      dairyForm.milkType,
      dairyForm.pricingMode,
      dairyForm.customFatRate ? Number(dairyForm.customFatRate) : null
    );
  }, [dairyForm.fat, dairyForm.snf, dairyForm.milkType, dairyForm.pricingMode, dairyForm.customFatRate, dairyForm.manualRate, calculateRateFromMaster]);

  const autoCalculatedAmount = useMemo(() => {
    const qty = Number(dairyForm.quantity) || 0;
    return Math.round(qty * autoCalculatedRate);
  }, [dairyForm.quantity, autoCalculatedRate]);

  const handleDairySaleSubmit = (e) => {
    e.preventDefault();
    if (!dairyForm.quantity || Number(dairyForm.quantity) <= 0) {
      alert('Please enter milk quantity (Liters)');
      return;
    }

    const isFatOnly = dairyForm.pricingMode === 'fat_only';
    addDairySale({
      ...dairyForm,
      pricingMode: dairyForm.pricingMode,
      snf: isFatOnly ? null : (Number(dairyForm.snf) || null),
      appliedFatRate: isFatOnly ? effectiveFatRate : null,
      quantity: Number(dairyForm.quantity),
      rate: autoCalculatedRate
    });

    setDairyForm({
      ...dairyForm,
      quantity: '',
      slipNo: ''
    });

    setSuccessMsg(`✓ Saved Dairy Sale (${dairyForm.quantity} L @ ₹${autoCalculatedRate}/L = ₹${autoCalculatedAmount})!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // TAB 3: RATE MASTER TESTER STATE
  const [testFat, setTestFat] = useState('6.5');
  const [testSnf, setTestSnf] = useState('9.0');
  const [testType, setTestType] = useState('buffalo');

  const testedRate = useMemo(() => {
    return calculateRateFromMaster(testFat, testSnf, testType);
  }, [testFat, testSnf, testType, calculateRateFromMaster]);

  // Rate Matrix Grid Generator
  const rateGrid = useMemo(() => {
    const fats = [3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
    const snfs = [8.0, 8.5, 8.8, 9.0, 9.2];
    return { fats, snfs };
  }, []);

  // Dairy Sales Filter & Pagination State
  const [dairyMonthFilter, setDairyMonthFilter] = useState('all');
  const [dairySearch, setDairySearch] = useState('');
  const [dairyShiftFilter, setDairyShiftFilter] = useState('all');
  const [dairyPage, setDairyPage] = useState(1);
  const dairyItemsPerPage = 30;

  // Customer Sales Filter & Pagination State
  const [customerMonthFilter, setCustomerMonthFilter] = useState('all');
  const [customerPage, setCustomerPage] = useState(1);
  const customerItemsPerPage = 30;

  // Available Dairy Sales Months
  const availableDairyMonths = useMemo(() => {
    const s = new Set();
    dairySales.forEach(d => {
      if (d.date) s.add(d.date.substring(0, 7));
    });
    return Array.from(s).sort().reverse();
  }, [dairySales]);

  // Available Customer Sales Months
  const availableCustomerMonths = useMemo(() => {
    const s = new Set();
    customerSales.forEach(c => {
      if (c.date) s.add(c.date.substring(0, 7));
    });
    return Array.from(s).sort().reverse();
  }, [customerSales]);

  // Sorted and Filtered Dairy Sales (Latest Date First)
  const filteredDairySales = useMemo(() => {
    return dairySales
      .filter(s => {
        const matchesMonth = dairyMonthFilter === 'all' || (s.date && s.date.startsWith(dairyMonthFilter));
        const matchesSearch = !dairySearch ||
          (s.dairyName && s.dairyName.toLowerCase().includes(dairySearch.toLowerCase())) ||
          (s.date && s.date.includes(dairySearch)) ||
          (s.slipNo && s.slipNo.toLowerCase().includes(dairySearch.toLowerCase()));
        const matchesShift = dairyShiftFilter === 'all' || s.shift === dairyShiftFilter;
        return matchesMonth && matchesSearch && matchesShift;
      })
      .sort((a, b) => {
        const dDiff = (b.date || '') > (a.date || '') ? 1 : ((b.date || '') < (a.date || '') ? -1 : 0);
        if (dDiff !== 0) return dDiff;
        return (b.createdAt || '') > (a.createdAt || '') ? 1 : ((b.createdAt || '') < (a.createdAt || '') ? -1 : 0);
      });
  }, [dairySales, dairyMonthFilter, dairySearch, dairyShiftFilter]);

  const paginatedDairySales = useMemo(() => {
    const start = (dairyPage - 1) * dairyItemsPerPage;
    return filteredDairySales.slice(start, start + dairyItemsPerPage);
  }, [filteredDairySales, dairyPage]);

  const totalDairyPages = Math.max(1, Math.ceil(filteredDairySales.length / dairyItemsPerPage));

  // Sorted and Filtered Customer Sales (Latest Date First)
  const filteredCustomerSales = useMemo(() => {
    return customerSales
      .filter(s => {
        const matchesMonth = customerMonthFilter === 'all' || (s.date && s.date.startsWith(customerMonthFilter));
        const matchesSearch = !customerSearch ||
          (s.customerName && s.customerName.toLowerCase().includes(customerSearch.toLowerCase())) ||
          (s.date && s.date.includes(customerSearch));
        const matchesShift = customerShiftFilter === 'all' || s.shift === customerShiftFilter;
        return matchesMonth && matchesSearch && matchesShift;
      })
      .sort((a, b) => {
        const dDiff = (b.date || '') > (a.date || '') ? 1 : ((b.date || '') < (a.date || '') ? -1 : 0);
        if (dDiff !== 0) return dDiff;
        return (b.id || '') > (a.id || '') ? 1 : ((b.id || '') < (a.id || '') ? -1 : 0);
      });
  }, [customerSales, customerMonthFilter, customerSearch, customerShiftFilter]);

  const paginatedCustomerSales = useMemo(() => {
    const start = (customerPage - 1) * customerItemsPerPage;
    return filteredCustomerSales.slice(start, start + customerItemsPerPage);
  }, [filteredCustomerSales, customerPage]);

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomerSales.length / customerItemsPerPage));

  // Calculated morning & evening liters for customer sales
  const customerMorningLiters = useMemo(() => {
    return Number(
      filteredCustomerSales
        .filter(s => {
          const sh = String(s.shift || '').toLowerCase().trim();
          return !sh.includes('ev') && sh !== 'night' && !sh.includes('शाम');
        })
        .reduce((sum, s) => sum + Number(s.quantity || 0), 0)
        .toFixed(1)
    );
  }, [filteredCustomerSales]);

  const customerEveningLiters = useMemo(() => {
    return Number(
      filteredCustomerSales
        .filter(s => {
          const sh = String(s.shift || '').toLowerCase().trim();
          return sh.includes('ev') || sh === 'night' || sh.includes('शाम');
        })
        .reduce((sum, s) => sum + Number(s.quantity || 0), 0)
        .toFixed(1)
    );
  }, [filteredCustomerSales]);

  const customerTotalLiters = useMemo(() => {
    return Number(
      filteredCustomerSales
        .reduce((sum, s) => sum + Number(s.quantity || 0), 0)
        .toFixed(1)
    );
  }, [filteredCustomerSales]);

  const customerTotalAmount = useMemo(() => {
    return Math.round(
      filteredCustomerSales
        .reduce((sum, s) => sum + Number(s.amount || 0), 0)
    );
  }, [filteredCustomerSales]);

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* 🌟 1. Top Modern Header & Navigation */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Truck className="w-6 h-6" />
              </span>
              <span>दूध बिक्री प्रबंधन (Milk Sales Hub)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              डेयरी प्लांट बिक्री, ग्राहक बिक्री, और केवल फैट आधारित दर प्रणाली
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-2xl border border-emerald-200">
            <span className="text-xs font-bold uppercase">आज कुल बिक्री:</span>
            <span className="text-base sm:text-lg font-black text-emerald-700">
              {stats.todayTotalSaleVolume} L (₹{stats.todayTotalSaleAmount.toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        {/* Big Clean Sub-tab Navigation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('dairy_sale')}
            className={`p-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
              activeTab === 'dairy_sale'
                ? 'option-active-light'
                : 'option-inactive-dark'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. 🏭 डेयरी प्लांट बिक्री</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customer_sale')}
            className={`p-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
              activeTab === 'customer_sale'
                ? 'option-active-light'
                : 'option-inactive-dark'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. 👥 ग्राहक दूध बिक्री</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rate_master')}
            className={`p-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
              activeTab === 'rate_master'
                ? 'option-active-light'
                : 'option-inactive-dark'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>3. 🧮 फैट रेट मास्टर</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reconciliation')}
            className={`p-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'option-active-light'
                : 'option-inactive-dark'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>4. ⚖️ स्टॉक व हिसाब</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl font-bold text-center text-sm sm:text-base shadow-lg animate-in fade-in zoom-in-95 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 🌟 TAB 1 (PRIMARY): DAIRY WHOLESALE SALE */}
      {activeTab === 'dairy_sale' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Dairy Plant Wholesale Entry Form (5 Cols on large) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    थोक डेयरी बिक्री फॉर्म
                  </h3>
                  <p className="text-xs text-slate-500">डेयरी प्लांट / संकलन केंद्र को दूध सप्लाई</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleDairySaleSubmit} className="space-y-4">
              {/* STEP 1: Date & Shift (Large Pill Selector) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  1. तारीख व शिफ्ट (Date & Shift)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dairyForm.date}
                    onChange={(e) => setDairyForm({ ...dairyForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white"
                  />

                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDairyForm({ ...dairyForm, shift: 'morning' })}
                      className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                        dairyForm.shift === 'morning'
                          ? 'bg-amber-400 text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🌅 सुबह
                    </button>
                    <button
                      type="button"
                      onClick={() => setDairyForm({ ...dairyForm, shift: 'evening' })}
                      className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                        dairyForm.shift === 'evening'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🌇 शाम
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 2: Dairy Center Selection (Dropdown + Add New Button) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. डेयरी का नाम (Dairy Selection)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddDairyModalOpen(true)}
                    className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-xl border border-indigo-200 flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ नई डेयरी जोड़ें</span>
                  </button>
                </div>

                <select
                  value={dairyForm.dairyName}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddDairyModalOpen(true);
                    } else {
                      setDairyForm({ ...dairyForm, dairyName: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 text-sm font-extrabold rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {dairyCenters && dairyCenters.map((center) => (
                    <option key={center.id || center.name} value={center.name}>
                      🏢 {center.name}
                    </option>
                  ))}
                  <option value="__add_new__" className="text-indigo-600 font-bold bg-indigo-50">
                    ➕ + नई डेयरी का नाम जोड़ें (Add New Dairy)...
                  </option>
                </select>
              </div>

              {/* STEP 3: Milk Type (Large Buttons) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  3. दूध का प्रकार (Milk Type)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDairyForm({ ...dairyForm, milkType: 'buffalo', fat: '6.5' })}
                    className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all flex items-center justify-center gap-2 ${
                      dairyForm.milkType === 'buffalo'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">🐃</span>
                    <span>भैंस दूध (Buffalo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDairyForm({ ...dairyForm, milkType: 'cow', fat: '4.0' })}
                    className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all flex items-center justify-center gap-2 ${
                      dairyForm.milkType === 'cow'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">🐄</span>
                    <span>गाय दूध (Cow)</span>
                  </button>
                </div>
              </div>

              {/* STEP 4: Quantity (Liters) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  4. दूध की मात्रा (Quantity in Liters) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="उदा. 15.0"
                    value={dairyForm.quantity}
                    onChange={(e) => setDairyForm({ ...dairyForm, quantity: e.target.value })}
                    className="w-full px-4 py-3 text-xl font-black text-slate-900 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 bg-slate-200 px-2 py-1 rounded-lg">
                    LITERS
                  </span>
                </div>
              </div>

              {/* STEP 5: Rate System Mode (Only FAT vs FAT+SNF vs Fixed) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                    5. दर गणना प्रणाली (Pricing System)
                  </label>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    {dairyForm.pricingMode === 'fat_only' && '🧈 केवल फैट दर (Only FAT)'}
                    {dairyForm.pricingMode === 'fat_snf' && '🥛 फैट + SNF फॉर्मूला'}
                    {dairyForm.pricingMode === 'fixed' && '💵 सीधा फिक्स रेट'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDairyForm({ ...dairyForm, pricingMode: 'fat_only' })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      dairyForm.pricingMode === 'fat_only'
                        ? 'bg-white text-indigo-700 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧈 केवल फैट
                  </button>

                  <button
                    type="button"
                    onClick={() => setDairyForm({ ...dairyForm, pricingMode: 'fat_snf' })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      dairyForm.pricingMode === 'fat_snf'
                        ? 'bg-white text-indigo-700 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="यदि SNF भी लेना हो तो यहाँ से चुनें"
                  >
                    🥛 फैट + SNF
                  </button>

                  <button
                    type="button"
                    onClick={() => setDairyForm({ ...dairyForm, pricingMode: 'fixed' })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      dairyForm.pricingMode === 'fixed'
                        ? 'bg-white text-emerald-700 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💵 फिक्स दर
                  </button>
                </div>

                {/* DYNAMIC INPUTS FOR PRICING MODE */}
                {/* 1. Only FAT Mode */}
                {dairyForm.pricingMode === 'fat_only' && (
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-blue-900 mb-1 text-center">
                          FAT % (फैट) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="6.5"
                          value={dairyForm.fat}
                          onChange={(e) => setDairyForm({ ...dairyForm, fat: e.target.value })}
                          className="w-full p-2.5 text-lg text-center font-black rounded-xl border border-blue-300 bg-white shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-blue-900 mb-1 text-center">
                          फैट भाव (₹/FAT)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={String(effectiveFatRate)}
                          value={dairyForm.customFatRate}
                          onChange={(e) => setDairyForm({ ...dairyForm, customFatRate: e.target.value })}
                          className="w-full p-2.5 text-lg text-center font-bold rounded-xl border border-blue-300 bg-white shadow-sm"
                        />
                        <span className="block text-[10px] text-center text-blue-700 font-bold mt-1">
                          मास्टर दर: ₹{effectiveFatRate}/FAT
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-blue-900 font-bold flex items-center justify-between pt-1 border-t border-blue-200">
                      <span>💡 {dairyForm.fat || 0} FAT × ₹{effectiveFatRate} = <strong className="text-indigo-700">₹{autoCalculatedRate}/L</strong></span>
                      <button
                        type="button"
                        onClick={() => setDairyForm({
                          ...dairyForm,
                          pricingMode: 'fat_snf',
                          snf: String(dairyForm.milkType === 'buffalo' ? (rateMasterConfig.buffaloBaseSnf || 9.4) : (rateMasterConfig.cowBaseSnf || 8.5))
                        })}
                        className="text-[11px] text-indigo-600 underline font-bold cursor-pointer"
                      >
                        + SNF जोड़ें
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. FAT + SNF Mode */}
                {dairyForm.pricingMode === 'fat_snf' && (
                  <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-indigo-900 mb-1 text-center">
                          FAT % (फैट) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="6.5"
                          value={dairyForm.fat}
                          onChange={(e) => setDairyForm({ ...dairyForm, fat: e.target.value })}
                          className="w-full p-2.5 text-lg text-center font-black rounded-xl border border-indigo-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-indigo-900 mb-1 text-center">
                          SNF % (एसएनएफ) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="9.0"
                          value={dairyForm.snf}
                          onChange={(e) => setDairyForm({ ...dairyForm, snf: e.target.value })}
                          className="w-full p-2.5 text-lg text-center font-black rounded-xl border border-indigo-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Fixed Manual Rate Mode */}
                {dairyForm.pricingMode === 'fixed' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      सीधा दूध दर (Rate ₹ / Liter) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      placeholder="उदा. 60"
                      value={dairyForm.manualRate}
                      onChange={(e) => setDairyForm({ ...dairyForm, manualRate: e.target.value })}
                      className="w-full p-3 text-lg font-black rounded-xl border border-emerald-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* STEP 6: Live Billing Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>लागू दूध दर (Milk Rate):</span>
                  </span>
                  <span className="font-black text-lg text-amber-300">
                    ₹{autoCalculatedRate} / L
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-indigo-800">
                  <span className="text-xs sm:text-sm font-bold text-slate-200">Total Payout (कुल भुगतान राशि):</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹{autoCalculatedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Slip No (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Slip / चालान पर्ची नंबर (Optional)
                </label>
                <input
                  type="text"
                  placeholder="उदा. SLIP-1082"
                  value={dairyForm.slipNo}
                  onChange={(e) => setDairyForm({ ...dairyForm, slipNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm sm:text-base font-black shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>💾 बिक्री सुरक्षित करें (Save Dairy Sale)</span>
              </button>
            </form>
          </div>

          {/* RIGHT: Dairy Sales Log (7 Cols on large) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    डेयरी प्लांट बिक्री रिकॉर्ड ({filteredDairySales.length} प्रविष्टियां)
                  </h3>
                  <p className="text-xs text-slate-500">प्लांट सप्लाई का संपूर्ण इतिहास, पर्ची एवं माह-वार विवरण</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 text-xs font-black border border-indigo-200">
                    चयनित कुल: {filteredDairySales.reduce((a, b) => a + Number(b.quantity || 0), 0).toFixed(1)} L (₹{filteredDairySales.reduce((a, b) => a + Number(b.totalAmount || 0), 0).toLocaleString('en-IN')})
                  </span>
                </div>
              </div>

              {/* Dairy Sales Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="सर्च प्लांट / पर्ची नं..."
                    value={dairySearch}
                    onChange={(e) => { setDairySearch(e.target.value); setDairyPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                  />
                </div>

                <select
                  value={dairyMonthFilter}
                  onChange={(e) => { setDairyMonthFilter(e.target.value); setDairyPage(1); }}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="all">📅 सभी महीने (All Months)</option>
                  {availableDairyMonths.map(m => (
                    <option key={m} value={m}>{m} ({m.startsWith('2026-09') ? 'September 2026' : m.startsWith('2026-08') ? 'August 2026' : m})</option>
                  ))}
                </select>

                <select
                  value={dairyShiftFilter}
                  onChange={(e) => { setDairyShiftFilter(e.target.value); setDairyPage(1); }}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="all">🌅/🌇 सभी शिफ्ट</option>
                  <option value="morning">🌅 Morning</option>
                  <option value="evening">🌇 Evening</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const buf = Number(rateMasterConfig.buffaloFatRate) || 9.40;
                    const cow = Number(rateMasterConfig.cowFatRate) || 8.50;
                    const count = recalculateDairySalesWithMasterRate(rateMasterConfig);
                    setSuccessMsg(`✓ सभी ${count} प्रविष्टियाँ मास्टर दर (भैंस: ₹${buf}/FAT, गाय: ₹${cow}/FAT) से अपडेट हो गईं!`);
                    setTimeout(() => setSuccessMsg(''), 4000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  title="सभी प्रविष्टियों को सक्रिय मास्टर फैट दर से तुरंत री-कैलकुलेट करें"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🔄 मास्टर रेट (₹{rateMasterConfig.buffaloFatRate || 9.40}/FAT) से अपडेट करें</span>
                </button>
              </div>

              {/* Sales Table */}
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
                      <th className="p-3">तारीख व शिफ्ट</th>
                      <th className="p-3">डेयरी प्लांट</th>
                      <th className="p-3 text-right">मात्रा (L)</th>
                      <th className="p-3 text-center">FAT / SNF</th>
                      <th className="p-3 text-right">दर (₹/L)</th>
                      <th className="p-3 text-right">कुल राशि (₹)</th>
                      <th className="p-3 text-center">कार्रवाई</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedDairySales.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400">
                          कोई रिकॉर्ड मौजूद नहीं है। बाएँ फॉर्म से बिक्री दर्ज करें या फ़िल्टर बदलें।
                        </td>
                      </tr>
                    ) : (
                      paginatedDairySales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{sale.date}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              sale.shift === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {sale.shift === 'morning' ? '🌅 Morning' : '🌇 Evening'}
                            </span>
                          </td>
                          <td className="p-3">
                            <strong className="text-slate-900 block">{sale.dairyName}</strong>
                            <span className="font-mono text-[10px] text-slate-400">{sale.slipNo}</span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 text-sm">
                            {sale.quantity} L
                          </td>
                          <td className="p-3 text-center font-mono">
                            {(() => {
                              const isFatOnly = sale.pricingMode === 'fat_only' || !sale.snf || (sale.snf === 9 && sale.fat && Math.abs(sale.rate - sale.fat * (rateMasterConfig.buffaloFatRate || 9.4)) < 0.1);
                              return (
                                <span className={`px-2 py-0.5 rounded-lg font-bold border ${isFatOnly ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-indigo-50 text-indigo-900 border-indigo-100'}`}>
                                  {isFatOnly ? `${sale.fat}% FAT` : `${sale.fat}% / ${sale.snf}%`}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-indigo-900 block">₹{sale.rate}</span>
                            {sale.fat > 0 && (
                              <span className="text-[10px] text-slate-500 font-semibold block">
                                (@ ₹{(sale.rate / sale.fat).toFixed(2)}/FAT)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-700 text-sm">
                            ₹{sale.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditDairySale(sale)}
                                className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                                title="Edit & Update / संपादित करें"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedSlipToPrint(sale)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Print Slip"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`क्या आप ${sale.date} (${sale.dairyName}) का ${sale.quantity}L रिकॉर्ड हटाना चाहते हैं?`)) {
                                    deleteDairySale(sale.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dairy Pagination Controls */}
              {totalDairyPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                  <span>पृष्ठ {dairyPage} of {totalDairyPages} ({filteredDairySales.length} कुल रिकॉर्ड)</span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={dairyPage <= 1}
                      onClick={() => setDairyPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                    >
                      ← पिछला
                    </button>
                    <button
                      disabled={dairyPage >= totalDairyPages}
                      onClick={() => setDairyPage(p => Math.min(totalDairyPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                    >
                      अगला →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Slip Modal View */}
            {selectedSlipToPrint && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="text-center border-b border-slate-200 pb-3">
                    <h3 className="font-black text-lg text-slate-900">{farmProfile?.farmName || 'श्री कृष्णा डेयरी फार्म'}</h3>
                    <p className="text-xs text-slate-500">दुग्ध आपूर्ति चालान पर्ची (Milk Supply Slip)</p>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">पर्ची नं:</span>
                      <strong className="font-mono">{selectedSlipToPrint.slipNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">तारीख व शिफ्ट:</span>
                      <strong>{selectedSlipToPrint.date} ({selectedSlipToPrint.shift === 'morning' ? 'Morning' : 'Evening'})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">डेयरी प्लांट:</span>
                      <strong>{selectedSlipToPrint.dairyName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">दूध मात्रा:</span>
                      <strong className="text-base text-slate-900">{selectedSlipToPrint.quantity} Liters</strong>
                    </div>
                    {(() => {
                      const isSlipFatOnly = selectedSlipToPrint.pricingMode === 'fat_only' || !selectedSlipToPrint.snf || (selectedSlipToPrint.snf === 9 && selectedSlipToPrint.fat && Math.abs(selectedSlipToPrint.rate - selectedSlipToPrint.fat * (rateMasterConfig.buffaloFatRate || 9.4)) < 0.1);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{isSlipFatOnly ? 'FAT:' : 'FAT / SNF:'}</span>
                            <strong>{selectedSlipToPrint.fat}% {!isSlipFatOnly && selectedSlipToPrint.snf ? `/ ${selectedSlipToPrint.snf}%` : ''}</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">लागू दर:</span>
                            <div className="text-right">
                              <strong>₹{selectedSlipToPrint.rate} / Liter</strong>
                              {isSlipFatOnly && selectedSlipToPrint.fat > 0 && (
                                <span className="text-[11px] text-indigo-600 block">
                                  (@ ₹{(selectedSlipToPrint.rate / selectedSlipToPrint.fat).toFixed(2)}/FAT)
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-base">
                      <span className="font-bold text-slate-800">कुल भुगतान:</span>
                      <strong className="text-emerald-700 font-black">₹{selectedSlipToPrint.totalAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <button
                      onClick={() => setSelectedSlipToPrint(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      बंद करें (Close)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow"
                    >
                      प्रिंट करें (Print)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Dairy Sale Modal */}
            {isEditModalOpen && editingDairySale && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-slate-900 text-slate-100 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Edit2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base sm:text-lg text-white">
                          डेयरी प्लांट बिक्री रिकॉर्ड संपादित करें
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          ID: {editingDairySale.id} {editingDairySale.slipNo ? `| पर्ची: ${editingDairySale.slipNo}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateDairySaleSubmit} className="space-y-4">
                    {/* Date & Shift */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                          दिनांक (Date) *
                        </label>
                        <input
                          type="date"
                          required
                          value={editDairyForm.date}
                          onChange={(e) => setEditDairyForm({ ...editDairyForm, date: e.target.value })}
                          className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-700 bg-slate-950 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                          शिफ्ट (Shift) *
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditDairyForm({ ...editDairyForm, shift: 'morning' })}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              editDairyForm.shift === 'morning'
                                ? 'bg-amber-400 text-amber-950 font-black shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🌅 सुबह
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditDairyForm({ ...editDairyForm, shift: 'evening' })}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              editDairyForm.shift === 'evening'
                                ? 'bg-indigo-600 text-white font-black shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🌇 शाम
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dairy Center & Milk Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                          डेयरी प्लांट (Dairy Center) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editDairyForm.dairyName}
                          onChange={(e) => setEditDairyForm({ ...editDairyForm, dairyName: e.target.value })}
                          className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-700 bg-slate-950 text-white"
                          placeholder="HARIHAR DAIRY"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                          दूध का प्रकार (Milk Type) *
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditDairyForm({ ...editDairyForm, milkType: 'buffalo' })}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              editDairyForm.milkType === 'buffalo'
                                ? 'bg-slate-200 text-slate-900 font-black shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🐃 भैंस
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditDairyForm({ ...editDairyForm, milkType: 'cow' })}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              editDairyForm.milkType === 'cow'
                                ? 'bg-amber-400 text-amber-950 font-black shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🐄 गाय
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Milk Quantity */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        दूध मात्रा (Quantity in Liters) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={editDairyForm.quantity}
                        onChange={(e) => setEditDairyForm({ ...editDairyForm, quantity: e.target.value })}
                        className="w-full px-3 py-2.5 text-base font-black rounded-xl border border-slate-700 bg-slate-950 text-emerald-400"
                        placeholder="उदा. 25.0"
                      />
                    </div>

                    {/* Pricing Mode */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        दर गणना प्रणाली (Pricing Mode)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditDairyForm({ ...editDairyForm, pricingMode: 'fat_only' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            editDairyForm.pricingMode === 'fat_only'
                              ? 'option-active-light font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ⚡ केवल फैट
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditDairyForm({ ...editDairyForm, pricingMode: 'fat_snf' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            editDairyForm.pricingMode === 'fat_snf'
                              ? 'option-active-light font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🥛 फैट + SNF
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditDairyForm({ ...editDairyForm, pricingMode: 'fixed' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            editDairyForm.pricingMode === 'fixed'
                              ? 'option-active-light font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          💵 फिक्स दर
                        </button>
                      </div>
                    </div>

                    {/* FAT & SNF Inputs based on mode */}
                    {editDairyForm.pricingMode === 'fat_only' && (
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 text-center">
                              FAT % (फैट) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={editDairyForm.fat}
                              onChange={(e) => setEditDairyForm({ ...editDairyForm, fat: e.target.value })}
                              className="w-full p-2 text-base text-center font-black rounded-xl border border-slate-700 bg-slate-900 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 text-center">
                              फैट भाव (₹/FAT)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder={String(editEffectiveFatRate)}
                              value={editDairyForm.customFatRate}
                              onChange={(e) => setEditDairyForm({ ...editDairyForm, customFatRate: e.target.value })}
                              className="w-full p-2 text-base text-center font-bold rounded-xl border border-slate-700 bg-slate-900 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {editDairyForm.pricingMode === 'fat_snf' && (
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 text-center">
                              FAT % (फैट) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={editDairyForm.fat}
                              onChange={(e) => setEditDairyForm({ ...editDairyForm, fat: e.target.value })}
                              className="w-full p-2 text-base text-center font-black rounded-xl border border-slate-700 bg-slate-900 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 text-center">
                              SNF % (एसएनएफ) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={editDairyForm.snf}
                              onChange={(e) => setEditDairyForm({ ...editDairyForm, snf: e.target.value })}
                              className="w-full p-2 text-base text-center font-black rounded-xl border border-slate-700 bg-slate-900 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {editDairyForm.pricingMode === 'fixed' && (
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          सीधा दर (Rate ₹ / Liter) *
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={editDairyForm.manualRate}
                          onChange={(e) => setEditDairyForm({ ...editDairyForm, manualRate: e.target.value })}
                          className="w-full p-2.5 text-base font-black rounded-xl border border-slate-700 bg-slate-900 text-white"
                        />
                      </div>
                    )}

                    {/* Slip No */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        चालान / पर्ची नंबर (Slip No)
                      </label>
                      <input
                        type="text"
                        value={editDairyForm.slipNo}
                        onChange={(e) => setEditDairyForm({ ...editDairyForm, slipNo: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-white"
                        placeholder="SLIP-1082"
                      />
                    </div>

                    {/* Live Calculation Preview Card */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950 border border-indigo-900/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-indigo-300 block">लागू दूध दर:</span>
                        <strong className="text-base text-amber-400 font-black">₹{editAutoCalculatedRate} / L</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-indigo-300 block">कुल भुगतान राशि:</span>
                        <strong className="text-xl text-emerald-400 font-black">₹{editAutoCalculatedAmount.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                      >
                        रद्द करें (Cancel)
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>💾 रिकॉर्ड अपडेट करें (Update)</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 TAB 2: CUSTOMER SALES (DIRECT & GOOGLE SHEETS) */}
      {activeTab === 'customer_sale' && (
        <div className="space-y-5">
          {/* Quick Direct Customer Sale Form */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>➕ त्वरित ग्राहक दूध बिक्री (Direct Customer Sale)</span>
                </h3>
                <p className="text-xs text-slate-500">ग्राहक को बेचे गए दूध की सीधी एंट्री दर्ज करें</p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDirectCustomerMode('select')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    directCustomerMode === 'select'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👥 लिस्ट से चुनें
                </button>
                <button
                  type="button"
                  onClick={() => setDirectCustomerMode('manual')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    directCustomerMode === 'manual'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 नया नाम लिखें
                </button>
              </div>
            </div>

            <form onSubmit={handleDirectCustomerSaleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">दिनांक (Date)</label>
                <input
                  type="date"
                  required
                  value={directSaleForm.date}
                  onChange={(e) => setDirectSaleForm({ ...directSaleForm, date: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 bg-white"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">शिफ्ट (Shift)</label>
                <select
                  value={directSaleForm.shift}
                  onChange={(e) => {
                    const newShift = e.target.value;
                    const selected = customers.find(c => c.id === directSaleForm.customerId);
                    const defaultQty = selected ? (newShift === 'evening' ? (selected.eveningQty || '') : (selected.morningQty || '')) : '';
                    setDirectSaleForm(prev => ({
                      ...prev,
                      shift: newShift,
                      quantity: defaultQty ? String(defaultQty) : prev.quantity
                    }));
                  }}
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 bg-white"
                >
                  <option value="morning">🌅 Morning (सुबह)</option>
                  <option value="evening">🌇 Evening (शाम)</option>
                </select>
              </div>

              {/* Customer Selector / Input */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ग्राहक का नाम (Customer Name) *
                </label>
                {directCustomerMode === 'select' ? (
                  <select
                    value={directSaleForm.customerId}
                    onChange={(e) => {
                      const selected = customers.find(c => c.id === e.target.value);
                      const defaultQty = selected ? (directSaleForm.shift === 'evening' ? (selected.eveningQty || '') : (selected.morningQty || '')) : '';
                      setDirectSaleForm(prev => ({
                        ...prev,
                        customerId: e.target.value,
                        rate: selected?.rate ? String(selected.rate) : prev.rate,
                        quantity: defaultQty ? String(defaultQty) : prev.quantity
                      }));
                    }}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-slate-300 bg-white"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (🌅 {c.morningQty || 0}L · 🌇 {c.eveningQty || 0}L | दर: ₹{c.rate || 60}/L)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="उदा. अमित पटेल"
                    value={directSaleForm.customName}
                    onChange={(e) => setDirectSaleForm({ ...directSaleForm, customName: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-slate-300 bg-white"
                  />
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">मात्रा (Liters) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="उदा. 2.5"
                  value={directSaleForm.quantity}
                  onChange={(e) => setDirectSaleForm({ ...directSaleForm, quantity: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm font-black rounded-2xl border border-slate-300 bg-white"
                />
              </div>

              {/* Rate & Submit Button */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">दर (₹/L)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={directSaleForm.rate}
                    onChange={(e) => setDirectSaleForm({ ...directSaleForm, rate: e.target.value })}
                    className="w-full px-2 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 bg-white text-center"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer h-[42px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>दर्ज करें</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Customer Sales Table */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  ग्राहक दूध बिक्री रिकॉर्ड ({filteredCustomerSales.length} प्रविष्टियां)
                </h3>
                <p className="text-xs text-slate-500">सभी खुदरा ग्राहकों की डिलीवरी, तारीख एवं शिफ्ट विवरण</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 flex items-center gap-1 shadow-xs">
                  🌅 सुबह: <strong className="font-black text-amber-950">{customerMorningLiters} L</strong>
                </span>
                <span className="text-slate-400 font-bold text-xs">+</span>
                <span className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 text-xs font-bold border border-indigo-200 flex items-center gap-1 shadow-xs">
                  🌇 शाम: <strong className="font-black text-indigo-950">{customerEveningLiters} L</strong>
                </span>
                <span className="text-slate-400 font-bold text-xs">=</span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 text-xs font-black border border-blue-200 shadow-xs">
                  🥛 कुल: {customerTotalLiters} L (₹{customerTotalAmount.toLocaleString('en-IN')})
                </span>
                <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200 shadow-xs">
                  💰 औसत दर: <strong className="font-black text-emerald-950">₹{customerTotalLiters > 0 ? (customerTotalAmount / customerTotalLiters).toFixed(2) : 70}/L</strong>
                </span>
              </div>
            </div>

            {/* Customer Sales Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ग्राहक का नाम / तारीख..."
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setCustomerPage(1); }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <select
                value={customerMonthFilter}
                onChange={(e) => { setCustomerMonthFilter(e.target.value); setCustomerPage(1); }}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                <option value="all">📅 सभी महीने (All Months)</option>
                {availableCustomerMonths.map(m => (
                  <option key={m} value={m}>{m} ({m.startsWith('2026-09') ? 'September 2026' : m.startsWith('2026-08') ? 'August 2026' : m.startsWith('2026-07') ? 'July 2026' : m})</option>
                ))}
              </select>

              <select
                value={customerShiftFilter}
                onChange={(e) => { setCustomerShiftFilter(e.target.value); setCustomerPage(1); }}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                <option value="all">🌅/🌇 सभी शिफ्ट</option>
                <option value="morning">🌅 Morning</option>
                <option value="evening">🌇 Evening</option>
              </select>

              <button
                type="button"
                onClick={handleTriggerLiveSync}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
                <span>Google Sheets Sync</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                  <tr>
                    <th className="p-3">तारीख व शिफ्ट</th>
                    <th className="p-3">ग्राहक का नाम</th>
                    <th className="p-3 text-right">मात्रा (L)</th>
                    <th className="p-3 text-right">दर (₹/L)</th>
                    <th className="p-3 text-right">कुल राशि (₹)</th>
                    <th className="p-3">सोर्स</th>
                    <th className="p-3 text-center">हटाएं</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedCustomerSales.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        कोई ग्राहक बिक्री रिकॉर्ड नहीं मिला।
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomerSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{sale.date}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            sale.shift === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {sale.shift === 'morning' ? '🌅 Morning' : '🌇 Evening'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {sale.customerName}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          {sale.quantity} L
                        </td>
                        <td className="p-3 text-right">
                          ₹{sale.rate}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          ₹{sale.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {sale.source || 'Direct'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditCustomerSale(sale)}
                              className="p-1 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 cursor-pointer"
                              title="Edit & Update / संपादित करें"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`क्या आप ${sale.customerName} का ${sale.date} का रिकॉर्ड हटाना चाहते हैं?`)) {
                                  deleteCustomerSale(sale.id);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Customer Sales Pagination Controls */}
            {totalCustomerPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                <span>पृष्ठ {customerPage} of {totalCustomerPages} ({filteredCustomerSales.length} कुल रिकॉर्ड)</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={customerPage <= 1}
                    onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                  >
                    ← पिछला
                  </button>
                  <button
                    disabled={customerPage >= totalCustomerPages}
                    onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                  >
                    अगला →
                  </button>
                </div>
              </div>
            )}

            {/* Edit Customer Sale Modal */}
            {isEditCustomerModalOpen && editingCustomerSale && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-slate-900 text-slate-100 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-white">
                          ग्राहक बिक्री रिकॉर्ड संपादित करें
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {editingCustomerSale.customerName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditCustomerModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateCustomerSaleSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">दिनांक (Date) *</label>
                      <input
                        type="date"
                        required
                        value={editCustomerForm.date}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, date: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-700 bg-slate-950 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">शिफ्ट (Shift) *</label>
                      <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditCustomerForm({ ...editCustomerForm, shift: 'morning' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            editCustomerForm.shift === 'morning'
                              ? 'bg-amber-400 text-amber-950 font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🌅 सुबह
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCustomerForm({ ...editCustomerForm, shift: 'evening' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            editCustomerForm.shift === 'evening'
                              ? 'bg-indigo-600 text-white font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🌇 शाम
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">ग्राहक का नाम *</label>
                      <input
                        type="text"
                        required
                        value={editCustomerForm.customerName}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, customerName: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-700 bg-slate-950 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">मात्रा (Liters) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={editCustomerForm.quantity}
                          onChange={(e) => {
                            const q = e.target.value;
                            const r = Number(editCustomerForm.rate) || 0;
                            setEditCustomerForm({
                              ...editCustomerForm,
                              quantity: q,
                              amount: String(Math.round(Number(q) * r))
                            });
                          }}
                          className="w-full px-3 py-2 text-sm font-black rounded-xl border border-slate-700 bg-slate-950 text-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">दर (₹/L) *</label>
                        <input
                          type="number"
                          step="1"
                          required
                          value={editCustomerForm.rate}
                          onChange={(e) => {
                            const r = e.target.value;
                            const q = Number(editCustomerForm.quantity) || 0;
                            setEditCustomerForm({
                              ...editCustomerForm,
                              rate: r,
                              amount: String(Math.round(q * Number(r)))
                            });
                          }}
                          className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-700 bg-slate-950 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">कुल राशि (Total Amount ₹)</label>
                      <input
                        type="number"
                        value={editCustomerForm.amount}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, amount: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-black rounded-xl border border-slate-700 bg-slate-950 text-amber-400"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditCustomerModalOpen(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
                      >
                        रद्द करें
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>अपडेट करें</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 TAB 3: FAT RATE MASTER */}
      {activeTab === 'rate_master' && (
        <div className="space-y-5">
          {/* SECTION 1: ONLY FAT RATE MASTER */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <span>🧈 केवल फैट दर मास्टर (Only FAT Rate Master)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  दूध का दर केवल फैट प्रतिशत के आधार पर तय करने के लिए फैट भाव सेट करें (दर = FAT × भाव)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 w-fit">
                Only FAT Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buffalo Fat Rate */}
              <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3">
                <h4 className="font-extrabold text-sm sm:text-base text-indigo-950 flex items-center gap-2">
                  <span>🐃</span>
                  <span>भैंस दूध फैट भाव (Buffalo FAT Rate)</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-indigo-800 mb-1">
                    दर प्रति 1.0 FAT (₹ / FAT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rateMasterConfig.buffaloFatRate || 9.33}
                    onChange={(e) => updateRateMaster({ buffaloFatRate: parseFloat(e.target.value) || 9.33 })}
                    className="w-full p-3 text-lg font-black rounded-2xl border border-indigo-300 bg-white text-center text-indigo-950 shadow-sm"
                  />
                </div>

                <p className="text-xs text-indigo-900 font-bold bg-white p-2.5 rounded-xl border border-indigo-100">
                  💡 6.5 FAT × ₹{rateMasterConfig.buffaloFatRate || 9.33} = <strong className="text-indigo-700">₹{((6.5) * (rateMasterConfig.buffaloFatRate || 9.33)).toFixed(2)}/L</strong>
                </p>
              </div>

              {/* Cow Fat Rate */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                <h4 className="font-extrabold text-sm sm:text-base text-amber-950 flex items-center gap-2">
                  <span>🐄</span>
                  <span>गाय दूध फैट भाव (Cow FAT Rate)</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    दर प्रति 1.0 FAT (₹ / FAT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rateMasterConfig.cowFatRate || 8.50}
                    onChange={(e) => updateRateMaster({ cowFatRate: parseFloat(e.target.value) || 8.50 })}
                    className="w-full p-3 text-lg font-black rounded-2xl border border-amber-300 bg-white text-center text-amber-950 shadow-sm"
                  />
                </div>

                <p className="text-xs text-amber-900 font-bold bg-white p-2.5 rounded-xl border border-amber-100">
                  💡 4.0 FAT × ₹{rateMasterConfig.cowFatRate || 8.50} = <strong className="text-amber-700">₹{((4.0) * (rateMasterConfig.cowFatRate || 8.50)).toFixed(2)}/L</strong>
                </p>
              </div>
            </div>

            {/* Save Master Fat Rate & Batch Update Action Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-700/50 shadow-lg mt-4">
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Save className="w-5 h-5" />
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    मास्टर फैट दर सहेजें व प्रविष्टियों को अपडेट करें
                  </h4>
                </div>
                <p className="text-xs text-indigo-200">
                  वर्तमान मास्टर दर: भैंस <strong>₹{rateMasterConfig.buffaloFatRate || 9.40}/FAT</strong> | गाय <strong>₹{rateMasterConfig.cowFatRate || 8.50}/FAT</strong>
                  <br />
                  यह बटन दबाते ही मास्टर दर सुरक्षित हो जाएगी और डेयरी प्लांट की पिछली व आगामी सभी प्रविष्टियाँ तुरंत इसी दर से अपडेट हो जाएँगी।
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const buf = Number(rateMasterConfig.buffaloFatRate) || 9.40;
                  const cow = Number(rateMasterConfig.cowFatRate) || 8.50;
                  const updatedCount = recalculateDairySalesWithMasterRate({
                    ...rateMasterConfig,
                    pricingMode: 'fat_only',
                    buffaloFatRate: buf,
                    cowFatRate: cow
                  });
                  setSuccessMsg(`✓ मास्टर दर सुरक्षित (भैंस: ₹${buf}/FAT, गाय: ₹${cow}/FAT)! कुल ${updatedCount} प्रविष्टियाँ नए भाव से सफलतापूर्वक अपडेट हो गईं!`);
                  setTimeout(() => setSuccessMsg(''), 4500);
                }}
                className="w-full md:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>💾 मास्टर दर सेव करें व सभी प्रविष्टियाँ अपडेट करें</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: FAT + SNF ADVANCED MATRIX */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span>🥛 FAT + SNF Dual Formula Matrix (फैट + एसएनएफ तालिका)</span>
              </h3>
              <p className="text-xs text-slate-500">
                यदि डेयरी में फैट और एसएनएफ दोनों के आधार पर भाव तय होता है, तो बेस रेट व अंतर सेट करें।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buffalo FAT+SNF */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                <h4 className="font-bold text-xs text-indigo-950">🐃 Buffalo FAT+SNF Formula</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 mb-1">Base FAT</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rateMasterConfig.buffaloBaseFat}
                      onChange={(e) => updateRateMaster({ buffaloBaseFat: parseFloat(e.target.value) || 6.5 })}
                      className="w-full p-2 text-xs font-bold rounded-lg border border-indigo-300 bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 mb-1">Base SNF</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rateMasterConfig.buffaloBaseSnf}
                      onChange={(e) => updateRateMaster({ buffaloBaseSnf: parseFloat(e.target.value) || 9.0 })}
                      className="w-full p-2 text-xs font-bold rounded-lg border border-indigo-300 bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 mb-1">Base Rate (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={rateMasterConfig.buffaloBaseRate}
                      onChange={(e) => updateRateMaster({ buffaloBaseRate: parseFloat(e.target.value) || 68.0 })}
                      className="w-full p-2 text-xs font-bold rounded-lg border border-indigo-300 bg-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Cow FAT+SNF */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <h4 className="font-bold text-xs text-amber-950">🐄 Cow FAT+SNF Formula</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-1">Base FAT</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rateMasterConfig.cowBaseFat}
                      onChange={(e) => updateRateMaster({ cowBaseFat: parseFloat(e.target.value) || 3.5 })}
                      className="w-full p-2 text-xs font-bold rounded-lg border border-amber-300 bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-1">Base SNF</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rateMasterConfig.cowBaseSnf}
                      onChange={(e) => updateRateMaster({ cowBaseSnf: parseFloat(e.target.value) || 8.5 })}
                      className="w-full p-2 text-xs font-bold rounded-lg border border-amber-300 bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-1">Base Rate (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={rateMasterConfig.cowBaseRate}
                      onChange={(e) => updateRateMaster({ cowBaseRate: parseFloat(e.target.value) || 38.0 })}
                      className="w-full p-2 text-xs font-bold rounded-lg border border-amber-300 bg-white text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 TAB 4: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Production Box */}
          <div className="p-5 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3">
            <span className="text-xs font-black text-blue-900 uppercase">1. कुल उत्पादन (Production)</span>
            <div className="text-3xl font-black text-blue-950">{stats.todayMilkTotal} <span className="text-sm font-semibold">L</span></div>
            <div className="text-xs text-blue-800 space-y-1 pt-2 border-t border-blue-200">
              <div className="flex justify-between"><span>🌅 सुबह:</span><strong>{stats.morningMilk} L</strong></div>
              <div className="flex justify-between"><span>🌇 शाम:</span><strong>{stats.eveningMilk} L</strong></div>
            </div>
          </div>

          {/* Sales Box */}
          <div className="p-5 rounded-3xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <span className="text-xs font-black text-indigo-900 uppercase">2. कुल बिक्री (Total Sales)</span>
            <div className="text-3xl font-black text-indigo-950">{stats.todayTotalSaleVolume} <span className="text-sm font-semibold">L</span></div>
            <div className="text-xs text-indigo-800 space-y-1 pt-2 border-t border-indigo-200">
              <div className="flex justify-between"><span>👥 ग्राहक बिक्री:</span><strong>{stats.todayCustomerSaleVolume} L</strong></div>
              <div className="flex justify-between"><span>🏭 प्लांट बिक्री:</span><strong>{stats.todayDairySaleVolume} L</strong></div>
            </div>
          </div>

          {/* Stock Left Box */}
          <div className={`p-5 rounded-3xl border space-y-3 ${
            stats.todayMilkBalance === 0
              ? 'bg-emerald-50 border-emerald-200'
              : stats.todayMilkBalance > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <span className="text-xs font-black text-slate-800 uppercase">3. अवशेष स्टॉक (Stock Left)</span>
            <div className={`text-3xl font-black ${
              stats.todayMilkBalance === 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {stats.todayMilkBalance} <span className="text-sm font-semibold">L</span>
            </div>
            <div className="text-xs text-slate-700 pt-2 border-t border-slate-200">
              {stats.todayMilkBalance === 0 ? (
                <span className="text-emerald-700 font-bold">✓ 100% Milk Distributed (परफेक्ट बैलेंस)</span>
              ) : (
                <span className="text-amber-800 font-bold">⚠️ {stats.todayMilkBalance}L milk in stock</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Dairy Plant / Center */}
      {isAddDairyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-300" />
                <span>नई डेयरी जोड़ें (Add Dairy Center)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddDairyModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewDairy} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  डेयरी / सेंटर का नाम (Dairy Name) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="उदा. HARIHAR DAIRY, अमूल संकलन केंद्र, आदि"
                  value={newDairyNameInput}
                  onChange={(e) => setNewDairyNameInput(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm font-bold rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* List of currently saved dairies with delete option */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  मौजूदा डेयरी लिस्ट ({dairyCenters?.length || 0} Dairies):
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                  {dairyCenters && dairyCenters.map(center => (
                    <div key={center.id || center.name} className="flex items-center justify-between py-1 text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        {center.name}
                      </span>
                      {dairyCenters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteDairyCenter(center.id || center.name)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="हटाएं (Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDairyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>सुरक्षित करें (Save & Select)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Form / Sheets Live Sync Modal */}
      {isGoogleSyncModalOpen && (
        <GoogleFormSyncModal
          isOpen={isGoogleSyncModalOpen}
          onClose={() => setIsGoogleSyncModalOpen(false)}
        />
      )}
    </div>
  );
};
