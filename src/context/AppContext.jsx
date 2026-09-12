import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { dbService } from '../services/dbService';
import { supabase } from '../utils/supabase.js';

const AppContext = createContext();

// Safe localStorage helper that never crashes the app on QuotaExceededError
const safeSetItem = (key, val) => {
  try {
    localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
  } catch (e) {
    // Quota exceeded: gracefully ignore or clear old transient items
    try {
      localStorage.removeItem('dairy_synced_row_keys');
      localStorage.removeItem('dairy_customer_sales');
      localStorage.removeItem('dairy_transactions');
    } catch {}
  }
};

const safeGetItem = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const AppProvider = ({ children }) => {
  // Clear heavy keys from LocalStorage on mount to guarantee zero quota errors
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('dairy_synced_row_keys');
      localStorage.removeItem('dairy_customer_sales');
      localStorage.removeItem('dairy_transactions');
      localStorage.removeItem('dairy_plant_sales');
    } catch (e) {}
  }

  // Theme Mode: 'dark' (Default) | 'light'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dairy_app_theme');
      if (saved) return saved;
      return 'dark'; // Default to Dark Theme
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('dairy_app_theme', theme);
      } catch (e) {}
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Animals
  const [animals, setAnimals] = useState(() => safeGetItem('dairy_animals', []));

  // Customers
  const [customers, setCustomers] = useState(() => safeGetItem('dairy_customers', []));

  // Customer Transactions / Ledger
  const [customerTransactions, setCustomerTransactions] = useState(() => safeGetItem('dairy_transactions', []));

  // Milk Production Entries
  const [milkEntries, setMilkEntries] = useState(() => safeGetItem('dairy_milk_entries', []));

  // 🥛 1. Customer Sales (from Google Sheets / Direct)
  const [customerSales, setCustomerSales] = useState(() => safeGetItem('dairy_customer_sales', []));

  // 🏭 2. Dairy Sales (Wholesale / Plant Sales with FAT & SNF)
  const [dairySales, setDairySales] = useState(() => {
    const list = safeGetItem('dairy_plant_sales', []);
    return list.map(s => {
      const fat = Number(s.fat) || 0;
      const rate = Number(s.rate) || 0;
      const isBuf = s.milkType !== 'cow';
      const fatRate = isBuf ? 9.40 : 8.50;

      // Automatically fix any sales affected by the 10.52 distortion (67.35, 66.05, etc.)
      if (
        (s.pricingMode === 'fat_only' || !s.snf || s.snf === 9) &&
        (rate === 67.35 || rate === 66.05 || (fat > 0 && Math.abs((rate / fat) - 10.52) < 0.25))
      ) {
        const correctRate = Number((fat * fatRate).toFixed(2));
        const correctAmount = Math.round((Number(s.quantity) || 0) * correctRate);
        return {
          ...s,
          pricingMode: 'fat_only',
          snf: null,
          appliedFatRate: fatRate,
          rate: correctRate,
          totalAmount: correctAmount
        };
      }
      if ((s.pricingMode === 'fat_only' || (!s.pricingMode && s.fat && Math.abs(s.rate - s.fat * 9.4) < 0.1)) && s.snf === 9) {
        return { ...s, snf: null, pricingMode: 'fat_only' };
      }
      return s;
    });
  });

  // 🏢 2.1 Dairy Centers / Plants List (Saved Dairy Names)
  const [dairyCenters, setDairyCenters] = useState(() => {
    const saved = localStorage.getItem('dairy_centers_list');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'DC-001', name: 'HARIHAR DAIRY' },
      { id: 'DC-002', name: 'Amul Chilling Center (अमूल संकलन केंद्र)' },
      { id: 'DC-003', name: 'Saras Dairy Plant (सरस डेयरी)' },
      { id: 'DC-004', name: 'Mother Dairy (मदर डेयरी)' }
    ];
  });

  // ⭐ 3. Rate Master Config (Only FAT & FAT+SNF Pricing Matrix)
  const [rateMasterConfig, setRateMasterConfig] = useState(() => {
    const saved = localStorage.getItem('dairy_rate_master');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        return {
          pricingMode: parsed.pricingMode || 'fat_only',
          buffaloFatRate: parsed.buffaloFatRate || 9.33, // e.g. ₹9.33/fat (6.5 fat = ₹60.65)
          cowFatRate: parsed.cowFatRate || 8.50,         // e.g. ₹8.50/fat (4.0 fat = ₹34.00)
          cowBaseFat: parsed.cowBaseFat || 3.5,
          cowBaseSnf: parsed.cowBaseSnf || 8.5,
          cowBaseRate: parsed.cowBaseRate || 38.0,
          cowFatDiff: parsed.cowFatDiff || 0.40,
          cowSnfDiff: parsed.cowSnfDiff || 0.25,
          buffaloBaseFat: parsed.buffaloBaseFat || 6.5,
          buffaloBaseSnf: parsed.buffaloBaseSnf || 9.0,
          buffaloBaseRate: parsed.buffaloBaseRate || 68.0,
          buffaloFatDiff: parsed.buffaloFatDiff || 0.65,
          buffaloSnfDiff: parsed.buffaloSnfDiff || 0.35,
          ...parsed
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      pricingMode: 'fat_only',
      buffaloFatRate: 9.33,
      cowFatRate: 8.50,
      cowBaseFat: 3.5,
      cowBaseSnf: 8.5,
      cowBaseRate: 38.0,
      cowFatDiff: 0.40, // per 0.1 FAT
      cowSnfDiff: 0.25, // per 0.1 SNF
      buffaloBaseFat: 6.5,
      buffaloBaseSnf: 9.0,
      buffaloBaseRate: 68.0,
      buffaloFatDiff: 0.65, // per 0.1 FAT
      buffaloSnfDiff: 0.35  // per 0.1 SNF
    };
  });

  // Expenses
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('dairy_expenses');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // Feed Stock
  const [feedStock, setFeedStock] = useState(() => {
    const saved = localStorage.getItem('dairy_feed_stock');
    if (saved !== null) return JSON.parse(saved);
    return [
      { id: "FEED-001", name: "Green Fodder (हरा चारा)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 2.5, minThreshold: 100 },
      { id: "FEED-002", name: "Dry Straw / Toori (सूखा भूसा)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 9.0, minThreshold: 200 },
      { id: "FEED-003", name: "Mustard Oil Cake (सरसों खल)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 37.0, minThreshold: 50 },
      { id: "FEED-004", name: "Wheat Bran / Choker (गेहूं का चोकर)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 24.0, minThreshold: 50 },
      { id: "FEED-005", name: "Compound Balanced Feed (संतुलित पशुआहार)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 28.0, minThreshold: 50 },
      { id: "FEED-006", name: "Mineral Mixture (मिनरल मिक्सचर)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 120.0, minThreshold: 5 }
    ];
  });

  // Health Records
  const [healthRecords, setHealthRecords] = useState(() => {
    const saved = localStorage.getItem('dairy_health_records');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // Vaccinations
  const [vaccinations, setVaccinations] = useState(() => {
    const saved = localStorage.getItem('dairy_vaccinations');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // Breeding Records
  const [breedingRecords, setBreedingRecords] = useState(() => {
    const saved = localStorage.getItem('dairy_breeding_records');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // Cattle Sales (पशु बिक्री रिकॉर्ड्स)
  const [cattleSales, setCattleSales] = useState(() => {
    const saved = localStorage.getItem('dairy_cattle_sales');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // 🌐 4. Google Form & Google Sheets Auto-Sync Configuration
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState(() => {
    const saved = localStorage.getItem('dairy_google_sheets_config');
    if (saved !== null) return JSON.parse(saved);
    return {
      sheetUrl: '',
      autoSyncEnabled: true,
      syncInterval: 2, // in minutes
      lastSyncTime: null,
      lastSyncStatus: 'idle', // 'idle' | 'syncing' | 'success' | 'error'
      lastSyncMessage: '',
      lastSyncCount: 0
    };
  });

  // Fingerprint list of synced rows to prevent duplicate billing
  const [syncedRowKeys, setSyncedRowKeys] = useState(() => {
    const saved = localStorage.getItem('dairy_synced_row_keys');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // Initial Mount: Load data strictly from Database
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const isDirtyRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // Helper to check if running on local development machine
  const isLocalServer = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Helper for ultra-fast partial delta saves (sub-millisecond updates without transferring 5MB payload)
  const fastPartialSave = useCallback((key, items, action = 'prepend') => {
    if (!isLocalServer) return;
    try {
      fetch('/api/db/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, items: Array.isArray(items) ? items : [items], action })
      }).catch(() => {});
    } catch (e) {}
  }, [isLocalServer]);

  const loadDataFromDatabase = useCallback(async (forceCloud = false) => {
    try {
      let hasLocalRecords = false;

      // 1. Fetch local server disk database (/api/db) ONLY when on localhost
      if (isLocalServer) {
        try {
          const res = await fetch('/api/db');
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const db = await res.json();
            if (db && typeof db === 'object') {
              if (Array.isArray(db.animals) && db.animals.length > 0) {
                setAnimals(db.animals);
                safeSetItem('dairy_animals', db.animals);
              }
              if (Array.isArray(db.customers) && db.customers.length > 0) {
                setCustomers(db.customers);
                safeSetItem('dairy_customers', db.customers);
              }
              if (Array.isArray(db.customerTransactions)) {
                setCustomerTransactions(db.customerTransactions);
              }
              if (Array.isArray(db.milkEntries)) {
                setMilkEntries(db.milkEntries);
                safeSetItem('dairy_milk_entries', db.milkEntries);
              }
              if (Array.isArray(db.customerSales) && db.customerSales.length > 0) {
                setCustomerSales(db.customerSales);
                hasLocalRecords = true;
              }
              if (Array.isArray(db.dairySales)) {
                setDairySales(db.dairySales);
              }
              if (db.rateMasterConfig) setRateMasterConfig(db.rateMasterConfig);
              if (Array.isArray(db.expenses)) setExpenses(db.expenses);
              if (Array.isArray(db.feedStock) && db.feedStock.length > 0) setFeedStock(db.feedStock);
              if (Array.isArray(db.healthRecords)) setHealthRecords(db.healthRecords);
              if (Array.isArray(db.vaccinations)) setVaccinations(db.vaccinations);
              if (Array.isArray(db.breedingRecords)) setBreedingRecords(db.breedingRecords);
              if (db.googleSheetsConfig) setGoogleSheetsConfig(prev => ({ ...prev, ...db.googleSheetsConfig }));
              if (Array.isArray(db.syncedRowKeys)) setSyncedRowKeys(db.syncedRowKeys);
            }
          }
        } catch (localErr) {
          console.warn('Local /api/db fetch skipped:', localErr);
        }
      }

      // 2. Fetch Supabase Cloud Database if requested with forceCloud OR if local DB is empty OR if running online on Netlify
      if (!hasLocalRecords || forceCloud || !isLocalServer) {
        try {
          const cloudDb = await dbService.loadAll();
          if (cloudDb && typeof cloudDb === 'object') {
            if (Array.isArray(cloudDb.animals) && cloudDb.animals.length > 0) {
              setAnimals(cloudDb.animals);
              safeSetItem('dairy_animals', cloudDb.animals);
            }
            if (Array.isArray(cloudDb.customers) && cloudDb.customers.length > 0) {
              setCustomers(cloudDb.customers);
              safeSetItem('dairy_customers', cloudDb.customers);
            }
            if (Array.isArray(cloudDb.customerTransactions) && cloudDb.customerTransactions.length > 0) {
              setCustomerTransactions(cloudDb.customerTransactions);
            }
            if (Array.isArray(cloudDb.milkEntries) && cloudDb.milkEntries.length > 0) {
              setMilkEntries(cloudDb.milkEntries);
              safeSetItem('dairy_milk_entries', cloudDb.milkEntries);
            }
            if (Array.isArray(cloudDb.customerSales) && cloudDb.customerSales.length > 0) {
              setCustomerSales(cloudDb.customerSales);
            }
            if (Array.isArray(cloudDb.dairySales) && cloudDb.dairySales.length > 0) {
              setDairySales(cloudDb.dairySales);
            }
            if (cloudDb.rateMasterConfig) setRateMasterConfig(cloudDb.rateMasterConfig);
            if (Array.isArray(cloudDb.expenses) && cloudDb.expenses.length > 0) setExpenses(cloudDb.expenses);
            if (Array.isArray(cloudDb.feedStock) && cloudDb.feedStock.length > 0) setFeedStock(cloudDb.feedStock);
            if (Array.isArray(cloudDb.healthRecords) && cloudDb.healthRecords.length > 0) setHealthRecords(cloudDb.healthRecords);
            if (Array.isArray(cloudDb.vaccinations) && cloudDb.vaccinations.length > 0) setVaccinations(cloudDb.vaccinations);
            if (Array.isArray(cloudDb.breedingRecords) && cloudDb.breedingRecords.length > 0) setBreedingRecords(cloudDb.breedingRecords);

            // SAVE to local server disk ONLY on local server
            if (isLocalServer) {
              fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cloudDb)
              }).catch(() => {});
            }
          }
        } catch (cloudErr) {
          console.warn('Cloud background sync error:', cloudErr);
        }
      }

      setIsDbLoaded(true);
    } catch (err) {
      console.warn('Database fetch warning:', err);
      setIsDbLoaded(true);
    }
  }, [isLocalServer]);

  useEffect(() => {
    loadDataFromDatabase(true);
  }, [loadDataFromDatabase]);

  // ⚡ INSTANT REAL-TIME SYNC (Sub-second live updates via Supabase WebSockets)
  useEffect(() => {
    // 1. Subscribe to real-time database changes (pushes updates in milliseconds!)
    const channel = supabase
      .channel('realtime_milk_deliveries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milk_deliveries' },
        (payload) => {
          console.log('⚡ Realtime Delivery Event:', payload.eventType);
          loadDataFromDatabase(true);
        }
      )
      .subscribe();

    // 2. High-speed 10-second backup heartbeat to guarantee zero missed events
    const heartbeatInterval = setInterval(() => {
      loadDataFromDatabase(true);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeatInterval);
    };
  }, [loadDataFromDatabase]);

  // Save to Disk Database whenever state changes (debounced, dirty-checked, zero GET overhead)
  useEffect(() => {
    if (!isDbLoaded || !isLocalServer) return;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return; // Do not immediately re-save data just loaded from disk
    }

    isDirtyRef.current = true;

    const timeoutId = setTimeout(() => {
      if (!isDirtyRef.current) return;

      const fullDb = {
        animals,
        customers,
        customerTransactions,
        milkEntries,
        customerSales,
        dairySales,
        rateMasterConfig,
        expenses,
        feedStock,
        healthRecords,
        vaccinations,
        breedingRecords,
        googleSheetsConfig,
        syncedRowKeys
      };

      // Compact JSON without 2-space indentation (fastest serialization, minimal payload)
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullDb)
      })
        .then(() => {
          isDirtyRef.current = false;
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    isDbLoaded,
    isLocalServer,
    animals,
    customers,
    customerTransactions,
    milkEntries,
    customerSales,
    dairySales,
    rateMasterConfig,
    expenses,
    feedStock,
    healthRecords,
    vaccinations,
    breedingRecords,
    googleSheetsConfig,
    syncedRowKeys
  ]);

  // Persist light settings and master configs to LocalStorage safely
  useEffect(() => {
    safeSetItem('dairy_animals', animals);
  }, [animals]);

  useEffect(() => {
    safeSetItem('dairy_customers', customers);
  }, [customers]);

  useEffect(() => {
    safeSetItem('dairy_milk_entries', milkEntries);
  }, [milkEntries]);

  useEffect(() => {
    safeSetItem('dairy_centers_list', dairyCenters);
  }, [dairyCenters]);

  useEffect(() => {
    safeSetItem('dairy_rate_master', rateMasterConfig);
  }, [rateMasterConfig]);

  useEffect(() => {
    safeSetItem('dairy_expenses', expenses);
  }, [expenses]);

  useEffect(() => {
    safeSetItem('dairy_feed_stock', feedStock);
  }, [feedStock]);

  useEffect(() => {
    safeSetItem('dairy_health_records', healthRecords);
  }, [healthRecords]);

  useEffect(() => {
    safeSetItem('dairy_vaccinations', vaccinations);
  }, [vaccinations]);

  useEffect(() => {
    safeSetItem('dairy_breeding_records', breedingRecords);
  }, [breedingRecords]);

  useEffect(() => {
    safeSetItem('dairy_cattle_sales', cattleSales);
  }, [cattleSales]);

  useEffect(() => {
    safeSetItem('dairy_google_sheets_config', googleSheetsConfig);
  }, [googleSheetsConfig]);

  // Rate Master Calculation Function (Only FAT & FAT+SNF Pricing)
  const calculateRateFromMaster = (fat, snf = null, type = 'buffalo', pricingMode = null, customFatRate = null) => {
    const f = Number(fat) || 0;
    if (f <= 0) return 0;

    const isBuf = type === 'buffalo' || f >= 5.5;
    const mode = pricingMode || rateMasterConfig.pricingMode || 'fat_only';

    // 1. Only FAT Rate Mode: Rate = FAT * FatRate
    if (mode === 'fat_only' || snf === null || snf === undefined || snf === '') {
      const ratePerFat = customFatRate !== null && Number(customFatRate) > 0
        ? Number(customFatRate)
        : (isBuf ? (Number(rateMasterConfig.buffaloFatRate) || 9.33) : (Number(rateMasterConfig.cowFatRate) || 8.50));
      
      const rate = f * ratePerFat;
      return Number(rate.toFixed(2));
    }

    // 2. Dual FAT + SNF Formula Mode
    const s = Number(snf) || 0;
    if (isBuf) {
      const fatDiffUnits = (f - (rateMasterConfig.buffaloBaseFat || 6.5)) * 10;
      const snfDiffUnits = ((s || (rateMasterConfig.buffaloBaseSnf || 9.0)) - (rateMasterConfig.buffaloBaseSnf || 9.0)) * 10;
      const rate = (rateMasterConfig.buffaloBaseRate || 68.0) + (fatDiffUnits * (rateMasterConfig.buffaloFatDiff || 0.65)) + (snfDiffUnits * (rateMasterConfig.buffaloSnfDiff || 0.35));
      return Number(Math.max(25, rate).toFixed(2));
    } else {
      const fatDiffUnits = (f - (rateMasterConfig.cowBaseFat || 3.5)) * 10;
      const snfDiffUnits = ((s || (rateMasterConfig.cowBaseSnf || 8.5)) - (rateMasterConfig.cowBaseSnf || 8.5)) * 10;
      const rate = (rateMasterConfig.cowBaseRate || 38.0) + (fatDiffUnits * (rateMasterConfig.cowFatDiff || 0.40)) + (snfDiffUnits * (rateMasterConfig.cowSnfDiff || 0.25));
      return Number(Math.max(20, rate).toFixed(2));
    }
  };

  const updateRateMaster = (newConfig) => {
    setRateMasterConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Animal Actions
  const addAnimal = (animal) => {
    const newAnimal = {
      ...animal,
      id: `ANM-${Date.now().toString().slice(-4)}`,
    };
    setAnimals(prev => [newAnimal, ...prev]);
    dbService.saveAnimal(newAnimal);
  };

  const updateAnimal = (id, updatedFields) => {
    setAnimals(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updatedFields };
        dbService.saveAnimal(updated);
        return updated;
      }
      return a;
    }));
  };

  const deleteAnimal = (id) => {
    setAnimals(prev => prev.filter(a => a.id !== id));
    dbService.deleteAnimal(id);
  };

  // Animal Sale Actions (पशु बिक्री)
  const sellAnimal = async (saleData) => {
    const newSale = {
      id: saleData.id || `CS-${Date.now().toString().slice(-6)}`,
      animalId: saleData.animalId,
      tagNo: saleData.tagNo,
      animalName: saleData.animalName,
      animalType: saleData.animalType || 'cow',
      breed: saleData.breed || '',
      saleDate: saleData.saleDate || new Date().toISOString().split('T')[0],
      salePrice: Number(saleData.salePrice || 0),
      paidAmount: Number(saleData.paidAmount || 0),
      paymentMode: saleData.paymentMode || 'cash',
      buyerName: saleData.buyerName || '',
      buyerPhone: saleData.buyerPhone || '',
      buyerAddress: saleData.buyerAddress || '',
      reason: saleData.reason || '',
      notes: saleData.notes || '',
      createdAt: new Date().toISOString()
    };

    // 1. Add to sales list
    setCattleSales(prev => [newSale, ...prev]);

    // 2. Mark animal as sold
    setAnimals(prev => prev.map(a => {
      if (a.id === saleData.animalId || a.tagNo === saleData.tagNo) {
        return {
          ...a,
          status: 'sold',
          salePrice: newSale.salePrice,
          saleDate: newSale.saleDate,
          buyerName: newSale.buyerName
        };
      }
      return a;
    }));

    // 3. Persist to DB (non-blocking)
    fastPartialSave('cattleSales', [newSale], 'prepend');
    dbService.saveCattleSale(newSale).catch(() => {});
    if (saleData.animalId && !saleData.animalId.startsWith('MANUAL')) {
      const targetAnimal = animals.find(a => a.id === saleData.animalId || a.tagNo === saleData.tagNo);
      if (targetAnimal) {
        dbService.saveAnimal({ ...targetAnimal, status: 'sold' }).catch(() => {});
      }
    }

    return newSale;
  };

  const deleteCattleSale = (saleId) => {
    const targetSale = cattleSales.find(s => s.id === saleId);
    setCattleSales(prev => prev.filter(s => s.id !== saleId));
    if (targetSale && targetSale.animalId) {
      setAnimals(prev => prev.map(a => {
        if (a.id === targetSale.animalId || a.tagNo === targetSale.tagNo) {
          const restored = { ...a, status: 'milking' };
          dbService.saveAnimal(restored).catch(() => {});
          return restored;
        }
        return a;
      }));
    }
    dbService.deleteCattleSale(saleId).catch(() => {});
  };

  // Milk Production Entry Actions
  const addMilkEntry = (entry) => {
    const newEntry = {
      ...entry,
      id: `MILK-${Date.now().toString().slice(-4)}`,
      entryMode: entry.entryMode || 'animal_wise',
      date: entry.date || new Date().toISOString().split('T')[0]
    };
    setMilkEntries(prev => [newEntry, ...prev]);
    fastPartialSave('milkEntries', [newEntry], 'prepend');
    dbService.saveMilkEntry(newEntry);
  };

  const addBulkMilkEntry = (bulkData) => {
    const timestamp = Date.now().toString().slice(-4);
    const date = bulkData.date || new Date().toISOString().split('T')[0];
    const shift = bulkData.shift || 'morning';
    const newEntries = [];

    if (Number(bulkData.cowMilk) > 0) {
      const cowEntry = {
        id: `MILK-COW-${timestamp}`,
        entryMode: 'bulk_total',
        bulkType: 'cow',
        date,
        shift,
        animalId: 'COW-BULK',
        animalName: 'Cow Total Yield (गाय कुल)',
        animalType: 'cow',
        quantity: Number(bulkData.cowMilk),
        fat: Number(bulkData.cowFat || 4.2),
        snf: Number(bulkData.cowSnf || 8.5),
        rate: Number(bulkData.cowRate || 55),
        recordedBy: bulkData.recordedBy || 'Dairy Manager',
        notes: bulkData.notes || ''
      };
      newEntries.push(cowEntry);
      dbService.saveMilkEntry(cowEntry);
    }

    if (Number(bulkData.buffaloMilk) > 0) {
      const bufEntry = {
        id: `MILK-BUF-${timestamp}`,
        entryMode: 'bulk_total',
        bulkType: 'buffalo',
        date,
        shift,
        animalId: 'BUF-BULK',
        animalName: 'Buffalo Total Yield (भैंस कुल)',
        animalType: 'buffalo',
        quantity: Number(bulkData.buffaloMilk),
        fat: Number(bulkData.buffaloFat || 7.0),
        snf: Number(bulkData.buffaloSnf || 9.0),
        rate: Number(bulkData.buffaloRate || 75),
        recordedBy: bulkData.recordedBy || 'Dairy Manager',
        notes: bulkData.notes || ''
      };
      newEntries.push(bufEntry);
      dbService.saveMilkEntry(bufEntry);
    }

    if (newEntries.length > 0) {
      setMilkEntries(prev => [...newEntries, ...prev]);
    }
  };

  const deleteMilkEntry = (id) => {
    setMilkEntries(prev => prev.filter(m => m.id !== id));
    dbService.deleteMilkEntry(id);
  };

  // 🏭 Dairy Sale Actions (Sale to Dairy Plant / Chilling Center)
  const addDairySale = (saleData) => {
    const isFatOnly = saleData.pricingMode === 'fat_only' || (!saleData.snf && saleData.snf !== 0);
    const calculatedRate = saleData.rate || calculateRateFromMaster(
      saleData.fat, 
      isFatOnly ? null : saleData.snf, 
      saleData.milkType || 'buffalo', 
      saleData.pricingMode, 
      saleData.appliedFatRate || saleData.customFatRate
    );
    const qty = Number(saleData.quantity) || 0;
    const totalAmount = Math.round(qty * calculatedRate);

    const newSale = {
      ...saleData,
      id: `DSALE-${Date.now().toString().slice(-4)}`,
      date: saleData.date || new Date().toISOString().split('T')[0],
      quantity: qty,
      fat: Number(saleData.fat) || 0,
      snf: isFatOnly ? null : (Number(saleData.snf) || null),
      pricingMode: saleData.pricingMode || (isFatOnly ? 'fat_only' : 'fat_snf'),
      rate: Number(calculatedRate),
      totalAmount,
      slipNo: saleData.slipNo || `SLIP-${Date.now().toString().slice(-4)}`,
      dairyName: saleData.dairyName || 'Amul / Saras Chilling Plant',
      status: saleData.status || 'completed'
    };

    setDairySales(prev => [newSale, ...prev]);
    fastPartialSave('dairySales', [newSale], 'prepend');
    dbService.saveDairySale(newSale);

    // Auto-save dairy name to centers list if new
    if (newSale.dairyName) {
      addDairyCenter(newSale.dairyName);
    }
  };

  const deleteDairySale = (id) => {
    setDairySales(prev => prev.filter(s => s.id !== id));
    dbService.deleteDairySale(id);
  };

  const updateDairySale = (id, updatedFields) => {
    let updatedObj = null;
    setDairySales(prev => prev.map(s => {
      if (s.id === id) {
        const qty = updatedFields.quantity !== undefined ? Number(updatedFields.quantity) : Number(s.quantity || 0);
        const rate = updatedFields.rate !== undefined ? Number(updatedFields.rate) : Number(s.rate || 0);
        const totalAmount = updatedFields.totalAmount !== undefined 
          ? Number(updatedFields.totalAmount) 
          : Math.round(qty * rate * 100) / 100;
        
        updatedObj = {
          ...s,
          ...updatedFields,
          quantity: qty,
          rate,
          totalAmount
        };
        dbService.saveDairySale(updatedObj);
        return updatedObj;
      }
      return s;
    }));
    return updatedObj;
  };

  const recalculateDairySalesWithMasterRate = (customConfig = null, fromDate = null) => {
    const cfg = customConfig || rateMasterConfig;
    const bufRate = Number(cfg.buffaloFatRate) || 9.40;
    const cowRate = Number(cfg.cowFatRate) || 8.50;

    let count = 0;
    setDairySales(prev => {
      const updated = prev.map(s => {
        if (fromDate && s.date < fromDate) return s;
        const fatVal = Number(s.fat) || 0;
        if (fatVal > 0) {
          const ratePerFat = s.milkType === 'cow' ? cowRate : bufRate;
          const newRate = Number((fatVal * ratePerFat).toFixed(2));
          const newTotal = Math.round((Number(s.quantity) || 0) * newRate);
          count++;
          return {
            ...s,
            pricingMode: 'fat_only',
            snf: null,
            appliedFatRate: ratePerFat,
            rate: newRate,
            totalAmount: newTotal
          };
        }
        return s;
      });
      safeSetItem('dairy_plant_sales', updated);
      dbService.saveDatabase({ dairySales: updated });
      return updated;
    });
    return count;
  };

  const addDairyCenter = (name) => {
    const trimmed = typeof name === 'string' ? name.trim() : name?.name?.trim();
    if (!trimmed) return null;
    let found = null;
    setDairyCenters(prev => {
      const exists = prev.find(d => d.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        found = exists;
        return prev;
      }
      const newCenter = {
        id: `DC-${Date.now().toString().slice(-4)}`,
        name: trimmed
      };
      found = newCenter;
      return [...prev, newCenter];
    });
    return found;
  };

  const deleteDairyCenter = (idOrName) => {
    setDairyCenters(prev => prev.filter(d => d.id !== idOrName && d.name !== idOrName));
  };

  // Customer Actions
  const addCustomer = (customer) => {
    const newCust = {
      ...customer,
      id: customer.id || `CUST-${Date.now().toString().slice(-4)}`,
      balance: Number(customer.balance) || 0,
      advance: Number(customer.advance) || 0,
      status: 'active',
      joinedDate: customer.joinedDate || new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => {
      const updated = [newCust, ...prev];
      fastPartialSave('customers', [newCust], 'prepend');
      return updated;
    });
    dbService.saveCustomer(newCust);
    return newCust;
  };

  const updateCustomer = (id, updatedFields) => {
    setCustomers(prev => {
      const updatedList = prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...updatedFields };
          dbService.saveCustomer(updated);
          return updated;
        }
        return c;
      });
      fastPartialSave('customers', updatedList, 'replace');
      return updatedList;
    });
  };

  const deleteCustomer = (id) => {
    setCustomers(prev => {
      const filtered = prev.filter(c => c.id !== id);
      fastPartialSave('customers', filtered, 'replace');
      return filtered;
    });
    dbService.deleteCustomer(id);
  };

  // 👥 Customer Sales & Google Form / Sheet Sync Engine
  const syncGoogleSheetCustomerSales = useCallback((importedRows, sourceTag = 'Google Sheets') => {
    const dateToday = new Date().toISOString().split('T')[0];
    const newSales = [];
    const newTransactions = [];
    const newRowKeys = [];
    let updatedCustomerList = [...customers];

    importedRows.forEach((row, idx) => {
      const name = (row.customerName || row.name || '').trim();
      if (!name) return;

      const qty = parseFloat(row.quantity || row.liters || row.qty) || 0;
      const rate = parseFloat(row.rate || row.price) || 60;
      const amount = Number(row.amount || Math.round(qty * rate));
      const shift = ((row.shift || 'morning').toLowerCase().includes('ev') || (row.shift || '').includes('शाम')) ? 'evening' : 'morning';
      const date = row.date || dateToday;
      const mobile = (row.mobile || row.phone || '').toString().trim();
      const address = (row.address || '').trim();
      const milkType = (row.milkType || 'cow').toLowerCase().includes('buf') || (row.milkType || '').includes('भैंस') ? 'buffalo' : 'cow';
      const timestamp = row.timestamp || '';

      // Generate a distinct fingerprint for duplicate prevention
      const rowKey = `${name}_${date}_${shift}_${qty}_${timestamp || idx}`.toLowerCase();
      if (syncedRowKeys.includes(rowKey)) {
        return; // Already imported previously
      }

      const cashAmt = Number(row.cashPayment) || 0;

      if (qty > 0 || cashAmt > 0) {
        newRowKeys.push(rowKey);

        // Find or Auto-Create Customer Profile
        let existingCust = updatedCustomerList.find(c => c.name.toLowerCase() === name.toLowerCase() || (mobile && c.mobile === mobile));

        if (!existingCust) {
          existingCust = {
            id: `CUST-${Date.now().toString().slice(-4)}-${idx}`,
            name,
            mobile,
            address,
            milkType,
            morningQty: shift === 'morning' ? qty : 0,
            eveningQty: shift === 'evening' ? qty : 0,
            rate,
            balance: Math.max(0, amount - cashAmt),
            advance: Math.max(0, cashAmt - amount),
            status: 'active',
            joinedDate: date
          };
          updatedCustomerList = [existingCust, ...updatedCustomerList];
        } else {
          // Update customer balance & contact info
          const currentBal = Number(existingCust.balance) || 0;
          const currentAdv = Number(existingCust.advance) || 0;
          const netChange = amount - cashAmt;
          let newBal = currentBal;
          let newAdv = currentAdv;

          if (netChange >= 0) {
            if (newAdv >= netChange) {
              newAdv -= netChange;
            } else {
              newBal += (netChange - newAdv);
              newAdv = 0;
            }
          } else {
            const paymentSurplus = Math.abs(netChange);
            if (newBal >= paymentSurplus) {
              newBal -= paymentSurplus;
            } else {
              newAdv += (paymentSurplus - newBal);
              newBal = 0;
            }
          }

          updatedCustomerList = updatedCustomerList.map(c => {
            if (c.id === existingCust.id) {
              return {
                ...c,
                balance: newBal,
                advance: newAdv,
                mobile: mobile || c.mobile,
                address: address || c.address
              };
            }
            return c;
          });
        }

        // Add Customer Sale if quantity > 0
        if (qty > 0) {
          const saleItem = {
            id: `CSALE-${Date.now().toString().slice(-4)}-${idx}`,
            customerName: name,
            customerId: existingCust.id,
            date,
            shift,
            quantity: qty,
            rate,
            amount,
            source: sourceTag
          };
          newSales.push(saleItem);

          // Add Delivery Ledger Transaction
          newTransactions.push({
            id: `TXN-DELIV-${Date.now().toString().slice(-4)}-${idx}`,
            customerId: existingCust.id,
            customerName: name,
            date,
            type: 'milk_supply',
            shift,
            liters: qty,
            rate,
            amount,
            balanceAfter: (Number(existingCust.balance) || 0) + amount,
            note: `${sourceTag} Auto-Sync: ${shift === 'morning' ? 'Morning (सुबह)' : 'Evening (शाम)'} (${qty} L @ ₹${rate})`
          });
        }

        // Add Cash Payment Transaction if cashAmt > 0
        if (cashAmt > 0) {
          newTransactions.push({
            id: `TXN-PMT-${Date.now().toString().slice(-4)}-${idx}`,
            customerId: existingCust.id,
            customerName: name,
            date,
            type: 'payment_received',
            liters: 0,
            rate: 0,
            amount: cashAmt,
            paymentMode: 'cash',
            balanceAfter: 0,
            note: `${sourceTag} Cash Payment (${date})`
          });
        }
      }
    });

    if (newSales.length > 0 || newTransactions.length > 0) {
      setCustomers(updatedCustomerList);
      setCustomerSales(prev => [...newSales, ...prev]);
      setCustomerTransactions(prev => [...newTransactions, ...prev]);
      setSyncedRowKeys(prev => [...prev, ...newRowKeys]);
    }

    return newSales.length;
  }, [customers, syncedRowKeys]);

  // Direct Customer Sale Action (Single manual entry)
  const addCustomerSale = (saleData) => {
    const qty = Number(saleData.quantity) || 0;
    const rate = Number(saleData.rate) || 60;
    const amount = Number(saleData.amount) || Math.round(qty * rate);
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const date = saleData.date || localToday;
    const shift = saleData.shift || 'morning';
    const customerName = saleData.customerName || 'ग्राहक';

    const newSale = {
      id: `CSALE-${Date.now().toString().slice(-4)}`,
      customerId: saleData.customerId || '',
      customerName,
      date,
      shift,
      quantity: qty,
      rate,
      amount,
      source: saleData.source || 'Direct Entry'
    };

    setCustomerSales(prev => [newSale, ...prev]);
    fastPartialSave('customerSales', [newSale], 'prepend');
    dbService.saveCustomerSale(newSale);

    // If customer matches existing customer, update their ledger & balance
    const existingCust = customers.find(c => (saleData.customerId && c.id === saleData.customerId) || c.name.toLowerCase() === customerName.toLowerCase());
    if (existingCust) {
      const newBal = (Number(existingCust.balance) || 0) + amount;
      updateCustomer(existingCust.id, { balance: newBal });

      const newTxn = {
        id: `TXN-${Date.now().toString().slice(-4)}`,
        customerId: existingCust.id,
        customerName: existingCust.name,
        date,
        type: 'milk_supply',
        shift,
        liters: qty,
        rate,
        amount,
        balanceAfter: newBal,
        note: `दूध बिक्री (${shift === 'morning' ? 'सुबह' : 'शाम'}) - ${qty} L @ ₹${rate}`
      };
      setCustomerTransactions(prev => [newTxn, ...prev]);
      fastPartialSave('customerTransactions', [newTxn], 'prepend');
      dbService.saveTransaction(newTxn);
    }

    return newSale;
  };

  const deleteCustomerSale = (id) => {
    setCustomerSales(prev => {
      const filtered = prev.filter(s => s.id !== id);
      fastPartialSave('customerSales', filtered, 'replace');
      return filtered;
    });
    dbService.deleteCustomerSale(id);
  };

  const updateCustomerSale = (id, updatedFields) => {
    let updatedObj = null;
    setCustomerSales(prev => {
      const updatedList = prev.map(s => {
        if (s.id === id) {
          const qty = updatedFields.quantity !== undefined ? Number(updatedFields.quantity) : Number(s.quantity || 0);
          const rate = updatedFields.rate !== undefined ? Number(updatedFields.rate) : Number(s.rate || 0);
          const amount = updatedFields.amount !== undefined 
            ? Number(updatedFields.amount) 
            : Math.round(qty * rate * 100) / 100;

          updatedObj = {
            ...s,
            ...updatedFields,
            quantity: qty,
            rate,
            amount
          };
          dbService.saveCustomerSale(updatedObj);
          return updatedObj;
        }
        return s;
      });
      fastPartialSave('customerSales', updatedList, 'replace');
      return updatedList;
    });
    return updatedObj;
  };

  // 🔄 Smart CSV & Google Sheet Parser
  const parseGoogleSheetCSV = (csvText) => {
    if (!csvText || typeof csvText !== 'string') return [];

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Parse CSV line taking quotes into account
    const parseCSVLine = (text) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]+/g, ''));
    
    // Fuzzy column index search
    const getColIdx = (keywords) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())));
    };

    const nameIdx = getColIdx(['customer name', 'name', 'ग्राहक', 'नाम', 'fullname', 'client', 'customer']);
    const otherCustIdx = getColIdx(['other customer', 'other']);
    const qtyIdx = getColIdx(['quantity', 'liters', 'qty', 'मात्रा', 'दूध', 'milk', 'volume', 'लीटर']);
    const rateIdx = getColIdx(['rate', 'price', 'दर', 'मूल्य', 'cost', 'rupees', '₹']);
    const cashPmtIdx = getColIdx(['cash payment', 'cash', 'payment', 'जमा', 'भुगतान', 'नगद']);
    const shiftIdx = getColIdx(['shift', 'शिफ्ट', 'slot', 'time', 'समय', 'सुबह/शाम', 'morning/evening', 'delivery time']);
    const dateIdx = getColIdx(['date', 'दिनांक', 'तारीख', 'timestamp', 'समय']);
    const mobileIdx = getColIdx(['mobile', 'phone', 'contact', 'मोबाइल', 'फोन', 'नंबर', 'cell']);
    const addressIdx = getColIdx(['address', 'पता', 'location', 'स्थान', 'मोहल्ला', 'village', 'गांव']);
    const typeIdx = getColIdx(['type', 'breed', 'गाय/भैंस', 'प्रकार', 'नस्ल', 'cow/buffalo']);
    const timestampIdx = getColIdx(['timestamp', 'time']);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) continue;

      let name = nameIdx !== -1 ? cols[nameIdx] : cols[0];
      if (name === 'OTHER CUSTOMER' && otherCustIdx !== -1 && cols[otherCustIdx]) {
        name = cols[otherCustIdx];
      }
      name = (name || '').trim();
      if (!name || name.toLowerCase().includes('name') || name.toLowerCase().includes('नाम')) continue;

      let qty = 0;
      if (qtyIdx !== -1) {
        qty = parseFloat(cols[qtyIdx]?.replace(/[^0-9.]/g, '')) || 0;
      } else if (cols.length >= 2) {
        qty = parseFloat(cols[1]?.replace(/[^0-9.]/g, '')) || 0;
      }

      let rate = 60;
      if (rateIdx !== -1) {
        rate = parseFloat(cols[rateIdx]?.replace(/[^0-9.]/g, '')) || 60;
      } else if (cols.length >= 3) {
        rate = parseFloat(cols[2]?.replace(/[^0-9.]/g, '')) || 60;
      }

      let cashPayment = 0;
      if (cashPmtIdx !== -1 && cols[cashPmtIdx]) {
        cashPayment = parseFloat(cols[cashPmtIdx]?.replace(/[^0-9.]/g, '')) || 0;
      }

      let shift = 'morning';
      if (shiftIdx !== -1) {
        const s = (cols[shiftIdx] || '').toLowerCase();
        if (s.includes('ev') || s.includes('शाम') || s.includes('night') || s.includes('pm')) {
          shift = 'evening';
        }
      }

      let date = new Date().toISOString().split('T')[0];
      if (dateIdx !== -1 && cols[dateIdx]) {
        const rawDate = cols[dateIdx];
        // Handle common date formats e.g. YYYY-MM-DD or M/D/YYYY or DD/MM/YYYY
        if (rawDate.includes('/')) {
          const parts = rawDate.split(' ')[0].split('/');
          if (parts.length === 3) {
            const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
            const m = parts[0].padStart(2, '0');
            const d = parts[1].padStart(2, '0');
            date = `${y}-${m}-${d}`;
          }
        } else if (rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          date = rawDate.split(' ')[0];
        }
      }

      const mobile = mobileIdx !== -1 ? cols[mobileIdx]?.replace(/[^0-9]/g, '') : '';
      const address = addressIdx !== -1 ? cols[addressIdx] : '';
      const milkType = typeIdx !== -1 ? (cols[typeIdx].includes('भैंस') || cols[typeIdx].toLowerCase().includes('buf') ? 'buffalo' : 'cow') : 'cow';
      const timestamp = timestampIdx !== -1 ? cols[timestampIdx] : '';

      if (name && (qty > 0 || cashPayment > 0)) {
        rows.push({
          customerName: name,
          quantity: qty,
          rate,
          amount: Math.round(qty * rate),
          cashPayment,
          shift,
          date,
          mobile,
          address,
          milkType,
          timestamp
        });
      }
    }

    return rows;
  };

  // 🚀 Fetch and Live Sync Google Sheets
  const fetchAndSyncGoogleSheet = async (overrideUrl = null) => {
    const targetUrl = (overrideUrl || googleSheetsConfig.sheetUrl || '').trim();
    if (!targetUrl) {
      return { success: false, message: 'No Google Sheet URL configured.' };
    }

    setGoogleSheetsConfig(prev => ({ ...prev, lastSyncStatus: 'syncing', lastSyncMessage: 'Fetching Google Sheet...' }));

    try {
      let csvText = '';
      try {
        const response = await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl: targetUrl })
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.csvText) {
            csvText = resData.csvText;
          }
        }
      } catch (backendErr) {
        // Backend not available (e.g. static hosting on Vercel/Netlify)
      }

      // Fallback: Direct Google Visualization API fetch from browser
      if (!csvText) {
        const idMatch = targetUrl.match(/\/d\/([^\/\?#&]+)/);
        if (idMatch) {
          const sheetId = decodeURIComponent(idMatch[1]);
          const tabName = googleSheetsConfig.tabName || 'CUSTOMER INTRY';
          const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
          const gvizRes = await fetch(gvizUrl);
          if (gvizRes.ok) {
            csvText = await gvizRes.text();
          }
        }
      }

      if (!csvText) {
        throw new Error('Failed to fetch Google Sheet. Please check your sheet link.');
      }

      const parsedRows = parseGoogleSheetCSV(csvText);

      if (parsedRows.length === 0) {
        const msg = 'Sheet connected successfully, but no new valid rows found.';
        setGoogleSheetsConfig(prev => ({
          ...prev,
          lastSyncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          lastSyncStatus: 'success',
          lastSyncMessage: msg,
          lastSyncCount: 0
        }));
        return { success: true, count: 0, message: msg, rows: [] };
      }

      const newCount = syncGoogleSheetCustomerSales(parsedRows, 'Google Form / Sheets');

      const successMsg = `Synced ${newCount} new records (${parsedRows.length} total rows in Sheet)`;
      setGoogleSheetsConfig(prev => ({
        ...prev,
        lastSyncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        lastSyncStatus: 'success',
        lastSyncMessage: successMsg,
        lastSyncCount: newCount
      }));

      return {
        success: true,
        count: newCount,
        message: successMsg,
        rows: parsedRows
      };
    } catch (err) {
      const errMsg = err.message || 'Error connecting to Google Sheet.';
      setGoogleSheetsConfig(prev => ({
        ...prev,
        lastSyncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        lastSyncStatus: 'error',
        lastSyncMessage: errMsg
      }));
      return { success: false, error: errMsg };
    }
  };

  const updateGoogleSheetsConfig = (newConfig) => {
    setGoogleSheetsConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Background Automatic Polling Timer for Google Sheets Live Sync
  useEffect(() => {
    if (!googleSheetsConfig.autoSyncEnabled || !googleSheetsConfig.sheetUrl) return;

    // Run initial sync after mount
    const initialTimer = setTimeout(() => {
      fetchAndSyncGoogleSheet();
    }, 2000);

    // Set recurring timer
    const intervalMs = Math.max(1, googleSheetsConfig.syncInterval || 2) * 60 * 1000;
    const intervalTimer = setInterval(() => {
      fetchAndSyncGoogleSheet();
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [googleSheetsConfig.autoSyncEnabled, googleSheetsConfig.sheetUrl, googleSheetsConfig.syncInterval]);

  // Customer Delivery & Payments
  const recordCustomerDelivery = (customerId, arg2, arg3 = null, arg4 = null, arg5 = null) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    let shift = 'morning';
    let qty = 0;
    let customDate = null;
    let customRate = null;

    if (typeof arg2 === 'number' || (!isNaN(Number(arg2)) && (arg4 === 'morning' || arg4 === 'evening'))) {
      // Called as (customerId, qty, customDate, shift, customRate)
      qty = Number(arg2);
      customDate = arg3;
      shift = arg4 || 'morning';
      customRate = arg5 !== null ? Number(arg5) : null;
    } else {
      // Called as (customerId, shift, qty, customDate, customRate)
      shift = arg2 || 'morning';
      qty = arg3 !== null ? Number(arg3) : null;
      customDate = arg4;
      customRate = arg5 !== null ? Number(arg5) : null;
    }

    const rate = customRate !== null && !isNaN(customRate) ? customRate : (Number(customer.rate) || 60);
    const finalQty = qty !== null ? qty : (shift === 'morning' ? customer.morningQty : customer.eveningQty);
    if (finalQty <= 0) return;

    const totalCost = Math.round(finalQty * rate);
    const newBalance = (Number(customer.balance) || 0) + totalCost;
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const date = customDate || localToday;

    updateCustomer(customerId, { balance: newBalance });

    const newTxn = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId,
      customerName: customer.name,
      date,
      type: 'milk_supply',
      shift,
      liters: finalQty,
      rate,
      amount: totalCost,
      balanceAfter: newBalance,
      note: `${shift === 'morning' ? 'Morning (सुबह)' : 'Evening (शाम)'} Delivery (${finalQty} L @ ₹${rate})`
    };
    setCustomerTransactions(prev => [newTxn, ...prev]);
    fastPartialSave('customerTransactions', [newTxn], 'prepend');
    dbService.saveTransaction(newTxn);

    // Also record into customerSales
    const newSale = {
      id: `CSALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: customer.id,
      customerName: customer.name,
      date,
      shift,
      quantity: finalQty,
      rate,
      amount: totalCost,
      source: 'Direct Entry'
    };
    setCustomerSales(prev => [newSale, ...prev]);
    fastPartialSave('customerSales', [newSale], 'prepend');
    dbService.saveCustomerSale(newSale);
  };

  const recordCustomerPayment = (customerId, amount, paymentMode = 'cash', note = '', customDate = null) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return;

    const currentBal = Number(customer.balance) || 0;
    const currentAdv = Number(customer.advance) || 0;
    const newBalance = Math.max(0, currentBal - amt);
    const newAdvance = amt > currentBal ? currentAdv + (amt - currentBal) : currentAdv;
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const date = customDate || localToday;

    updateCustomer(customerId, {
      balance: newBalance,
      advance: newAdvance
    });

    const newTxn = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId,
      customerName: customer.name,
      date,
      type: 'payment_received',
      liters: 0,
      rate: 0,
      amount: amt,
      paymentMode,
      balanceAfter: newBalance,
      note: note || `Payment Received (${(paymentMode || 'cash').toUpperCase()})`
    };
    setCustomerTransactions(prev => [newTxn, ...prev]);
    fastPartialSave('customerTransactions', [newTxn], 'prepend');
    dbService.saveTransaction(newTxn);
  };

  // Expense Actions
  const addExpense = (expense) => {
    const newExp = {
      ...expense,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      amount: Number(expense.amount),
      date: expense.date || new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [newExp, ...prev]);
    fastPartialSave('expenses', [newExp], 'prepend');
    dbService.saveExpense(newExp);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    dbService.deleteExpense(id);
  };

  // Feed Stock Actions
  const updateFeedStockItem = (id, updatedFields) => {
    setFeedStock(prev => prev.map(f => {
      if (f.id === id) {
        const updated = { ...f, ...updatedFields };
        dbService.saveFeedStockItem(updated);
        return updated;
      }
      return f;
    }));
  };

  const recordDailyFeedUsage = (feedId, amountUsed) => {
    setFeedStock(prev => prev.map(f => {
      if (f.id === feedId) {
        const updated = {
          ...f,
          stockQuantity: Math.max(0, f.stockQuantity - Number(amountUsed))
        };
        dbService.saveFeedStockItem(updated);
        return updated;
      }
      return f;
    }));
  };

  const addFeedStock = (feedId, amountAdded, cost = 0) => {
    setFeedStock(prev => prev.map(f => {
      if (f.id === feedId) {
        const updated = {
          ...f,
          stockQuantity: f.stockQuantity + Number(amountAdded)
        };
        dbService.saveFeedStockItem(updated);
        return updated;
      }
      return f;
    }));

    if (cost > 0) {
      const feedItem = feedStock.find(f => f.id === feedId);
      addExpense({
        category: 'feed',
        title: `${feedItem ? feedItem.name : 'Feed'} Stock Purchase`,
        amount: cost,
        payee: 'Feed Supplier',
        paymentMethod: 'upi',
        notes: `Stock +${amountAdded} added`
      });
    }
  };

  // Health Actions
  const addHealthRecord = (record) => {
    const newRecord = {
      ...record,
      id: `HLT-${Date.now().toString().slice(-4)}`,
      cost: Number(record.cost) || 0,
      date: record.date || new Date().toISOString().split('T')[0]
    };
    setHealthRecords(prev => [newRecord, ...prev]);
    dbService.saveHealthRecord(newRecord);

    if (newRecord.cost > 0) {
      addExpense({
        category: 'medicine',
        title: `Medical Treatment: ${newRecord.disease} (${newRecord.animalName || newRecord.animalId})`,
        amount: newRecord.cost,
        payee: newRecord.doctor || 'Veterinarian',
        paymentMethod: 'cash',
        notes: newRecord.medicine || ''
      });
    }
  };

  // Vaccination Actions
  const addVaccination = (vac) => {
    const newVac = {
      ...vac,
      id: `VAC-${Date.now().toString().slice(-4)}`,
      status: 'scheduled'
    };
    setVaccinations(prev => [newVac, ...prev]);
    dbService.saveVaccination(newVac);
  };

  // Breeding Actions
  const addBreedingRecord = (brd) => {
    const newBrd = {
      ...brd,
      id: brd.id || `BRD-${Date.now().toString().slice(-4)}`,
      status: brd.status || 'inseminated'
    };
    setBreedingRecords(prev => [newBrd, ...prev]);
    dbService.saveBreedingRecord(newBrd);
  };

  const updateBreedingRecord = (id, updatedFields) => {
    setBreedingRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        const updated = { ...rec, ...updatedFields };
        dbService.saveBreedingRecord(updated);
        return updated;
      }
      return rec;
    }));
  };

  const deleteBreedingRecord = (id) => {
    setBreedingRecords(prev => prev.filter(rec => rec.id !== id));
    dbService.deleteBreedingRecord(id);
  };

  // CLEAR ALL DATA COMPLETELY
  const clearAllData = () => {
    const emptyFeed = [
      { id: "FEED-001", name: "Green Fodder (हरा चारा)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 2.5, minThreshold: 100 },
      { id: "FEED-002", name: "Dry Straw / Toori (सूखा भूसा)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 9.0, minThreshold: 200 },
      { id: "FEED-003", name: "Mustard Oil Cake (सरसों खल)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 37.0, minThreshold: 50 },
      { id: "FEED-004", name: "Wheat Bran / Choker (गेहूं का चोकर)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 24.0, minThreshold: 50 },
      { id: "FEED-005", name: "Compound Balanced Feed (संतुलित पशुआहार)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 28.0, minThreshold: 50 },
      { id: "FEED-006", name: "Mineral Mixture (मिनरल मिक्सचर)", stockQuantity: 0, unit: "kg", dailyUsage: 0, costPerUnit: 120.0, minThreshold: 5 }
    ];

    setAnimals([]);
    setCustomers([]);
    setCustomerTransactions([]);
    setMilkEntries([]);
    setCustomerSales([]);
    setDairySales([]);
    setExpenses([]);
    setFeedStock(emptyFeed);
    setHealthRecords([]);
    setVaccinations([]);
    setBreedingRecords([]);
    setSyncedRowKeys([]);

    localStorage.setItem('dairy_animals', JSON.stringify([]));
    localStorage.setItem('dairy_customers', JSON.stringify([]));
    localStorage.setItem('dairy_transactions', JSON.stringify([]));
    localStorage.setItem('dairy_milk_entries', JSON.stringify([]));
    localStorage.setItem('dairy_customer_sales', JSON.stringify([]));
    localStorage.setItem('dairy_plant_sales', JSON.stringify([]));
    localStorage.setItem('dairy_expenses', JSON.stringify([]));
    localStorage.setItem('dairy_feed_stock', JSON.stringify(emptyFeed));
    localStorage.setItem('dairy_health_records', JSON.stringify([]));
    localStorage.setItem('dairy_vaccinations', JSON.stringify([]));
    localStorage.setItem('dairy_breeding_records', JSON.stringify([]));
    localStorage.setItem('dairy_synced_row_keys', JSON.stringify([]));

    // Save empty state to disk database
    fetch('/api/db')
      .then(res => res.json())
      .then(existing => {
        const cleanDb = {
          ...(existing || {}),
          animals: [],
          customers: [],
          customerTransactions: [],
          milkEntries: [],
          customerSales: [],
          dairySales: [],
          expenses: [],
          feedStock: emptyFeed,
          healthRecords: [],
          vaccinations: [],
          breedingRecords: [],
          syncedRowKeys: []
        };
        return fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanDb, null, 2)
        });
      })
      .catch(() => {});
  };

  // Reload / Re-sync from Live Database
  const loadDemoData = () => {
    loadDataFromDatabase();
  };

  // Aggregations and Real-time KPI calculations
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();
  const utcTodayStr = new Date().toISOString().split('T')[0];

  const matchesToday = (dateVal) => {
    if (!dateVal) return false;
    const str = String(dateVal).trim();
    return str === todayStr || str === utcTodayStr || str.startsWith(todayStr) || str.startsWith(utcTodayStr);
  };

  const stats = useMemo(() => {
    // 1. PRODUCTION METRICS (Today)
    const todayMilkList = milkEntries.filter(m => matchesToday(m.date));
    const rawMorningMilk = todayMilkList.filter(m => m.shift === 'morning').reduce((acc, m) => acc + Number(m.quantity || 0), 0);
    const rawEveningMilk = todayMilkList.filter(m => m.shift === 'evening').reduce((acc, m) => acc + Number(m.quantity || 0), 0);
    const rawTodayMilkTotal = rawMorningMilk + rawEveningMilk;

    // 2. CUSTOMER SALES (Today)
    const todayCustomerList = customerSales.filter(s => matchesToday(s.date));
    const todayCustomerSaleVolume = todayCustomerList.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
    const todayCustomerSaleAmount = todayCustomerList.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const todayMorningCustomerSale = todayCustomerList.filter(s => s.shift === 'morning').reduce((acc, s) => acc + Number(s.quantity || 0), 0);
    const todayEveningCustomerSale = todayCustomerList.filter(s => s.shift === 'evening').reduce((acc, s) => acc + Number(s.quantity || 0), 0);

    // 3. DAIRY PLANT SALES (Today)
    const todayDairyList = dairySales.filter(s => matchesToday(s.date));
    const todayDairySaleVolume = todayDairyList.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
    const todayDairySaleAmount = todayDairyList.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
    const todayMorningDairySale = todayDairyList.filter(s => s.shift === 'morning').reduce((acc, s) => acc + Number(s.quantity || 0), 0);
    const todayEveningDairySale = todayDairyList.filter(s => s.shift === 'evening').reduce((acc, s) => acc + Number(s.quantity || 0), 0);

    // 4. TOTAL SALES & RECONCILIATION
    const todayTotalSaleVolume = todayCustomerSaleVolume + todayDairySaleVolume;
    const todayTotalSaleAmount = todayCustomerSaleAmount + todayDairySaleAmount;

    // Reconciled Total Milk Managed / Produced
    const todayMilkTotal = rawTodayMilkTotal > 0 ? rawTodayMilkTotal : todayTotalSaleVolume;
    const morningMilk = rawTodayMilkTotal > 0 ? rawMorningMilk : (todayMorningCustomerSale + todayMorningDairySale);
    const eveningMilk = rawTodayMilkTotal > 0 ? rawEveningMilk : (todayEveningCustomerSale + todayEveningDairySale);
    const todayMilkBalance = Number((todayMilkTotal - todayTotalSaleVolume).toFixed(1));

    // Cattle counts
    const totalCows = animals.filter(a => a.type === 'cow').length;
    const totalBuffaloes = animals.filter(a => a.type === 'buffalo').length;
    const milkingCount = animals.filter(a => a.status === 'milking').length;
    const pregnantCount = animals.filter(a => a.status === 'pregnant').length;
    const sickCount = animals.filter(a => a.status === 'sick').length;

    // Receivables
    const totalReceivable = customers.reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
    const totalAdvance = customers.reduce((acc, c) => acc + (Number(c.advance) || 0), 0);

    // Expenses
    const todayExpensesTotal = expenses
      .filter(e => e.date === todayStr)
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const curMonthPrefix = todayStr.substring(0, 7);
    const totalExpensesMonth = expenses
      .filter(e => e.date && e.date.startsWith(curMonthPrefix))
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    // Monthly Aggregates (Current Month)
    const monthCustomerSaleAmount = customerSales
      .filter(s => s.date && s.date.startsWith(curMonthPrefix))
      .reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const monthDairySaleAmount = dairySales
      .filter(s => s.date && s.date.startsWith(curMonthPrefix))
      .reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
    const monthTotalSaleAmount = monthCustomerSaleAmount + monthDairySaleAmount;
    const netProfitMonth = monthTotalSaleAmount - totalExpensesMonth;

    const totalMilkVolume = milkEntries.reduce((acc, m) => acc + Number(m.quantity || 0), 0);

    return {
      totalAnimals: animals.length,
      totalCows,
      totalBuffaloes,
      milkingCount,
      pregnantCount,
      sickCount,

      // Production
      todayMilkTotal: Number(todayMilkTotal.toFixed(1)),
      morningMilk: Number(morningMilk.toFixed(1)),
      eveningMilk: Number(eveningMilk.toFixed(1)),
      totalMilkVolume: Number(totalMilkVolume.toFixed(1)),

      // Sales Breakdown
      todayCustomerSaleVolume: Number(todayCustomerSaleVolume.toFixed(1)),
      todayCustomerSaleAmount: Math.round(todayCustomerSaleAmount),
      todayMorningCustomerSale: Number(todayMorningCustomerSale.toFixed(1)),
      todayEveningCustomerSale: Number(todayEveningCustomerSale.toFixed(1)),

      todayDairySaleVolume: Number(todayDairySaleVolume.toFixed(1)),
      todayDairySaleAmount: Math.round(todayDairySaleAmount),
      todayMorningDairySale: Number(todayMorningDairySale.toFixed(1)),
      todayEveningDairySale: Number(todayEveningDairySale.toFixed(1)),

      todayTotalSaleVolume: Number(todayTotalSaleVolume.toFixed(1)),
      todayTotalSaleAmount: Math.round(todayTotalSaleAmount),
      todayMilkBalance,

      // Financials & Stock
      totalReceivable,
      totalAdvance,
      todayExpensesTotal,
      totalExpensesMonth,
      netProfitMonth,
      totalMilkRevenue: monthTotalSaleAmount,
      lowFeedStockCount: feedStock.filter(f => f.stockQuantity <= f.minThreshold).length
    };
  }, [animals, customers, milkEntries, customerSales, dairySales, expenses, feedStock, todayStr]);

  // Dynamic Farm Alerts Generator
  const alerts = useMemo(() => {
    const list = [];

    // 1. Low feed stock alerts
    feedStock.forEach(item => {
      if (item.stockQuantity <= item.minThreshold) {
        list.push({
          id: `alert-feed-${item.id}`,
          type: 'feed',
          severity: 'high',
          title: `Low Stock Alert (स्टॉक कम): ${item.name}`,
          message: `Only ${item.stockQuantity} ${item.unit} remaining (Min threshold: ${item.minThreshold} ${item.unit}). Please order soon.`,
          module: 'feed',
          date: todayStr
        });
      }
    });

    // 2. Sick animals alerts
    animals.filter(a => a.status === 'sick').forEach(a => {
      list.push({
        id: `alert-sick-${a.id}`,
        type: 'health',
        severity: 'high',
        title: `Sick Cattle Alert (पशु बीमार): ${a.name} (${a.tagNo})`,
        message: `${a.name} is currently flagged as sick. Please follow up on vet treatment.`,
        module: 'health',
        date: todayStr
      });
    });

    // 3. Imminent Calving alerts (< 20 days)
    breedingRecords.filter(b => b.isPregnant && b.expectedCalvingDate).forEach(b => {
      const calvingDate = new Date(b.expectedCalvingDate);
      const diffDays = Math.ceil((calvingDate - new Date()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 20 && diffDays >= 0) {
        list.push({
          id: `alert-calving-${b.id}`,
          type: 'breeding',
          severity: 'medium',
          title: `Calving Due Soon (प्रसव निकट): ${b.animalName}`,
          message: `Expected calving in ${diffDays} days (${b.expectedCalvingDate}). Move to clean calving stall.`,
          module: 'breeding',
          date: todayStr
        });
      }
    });

    return list;
  }, [feedStock, animals, breedingRecords, todayStr]);

  return (
    <AppContext.Provider
      value={{
        // Data State
        animals,
        customers,
        customerTransactions,
        milkEntries,
        customerSales,
        dairySales,
        rateMasterConfig,
        expenses,
        feedStock,
        healthRecords,
        vaccinations,
        breedingRecords,
        stats,
        alerts,

        // Customer Sales & Sheets Live Sync State & Methods
        addCustomerSale,
        updateCustomerSale,
        googleSheetsConfig,
        updateGoogleSheetsConfig,
        fetchAndSyncGoogleSheet,
        parseGoogleSheetCSV,
        syncGoogleSheetCustomerSales,
        deleteCustomerSale,

        // Animal Methods & Sales
        addAnimal,
        updateAnimal,
        deleteAnimal,
        cattleSales,
        sellAnimal,
        deleteCattleSale,

        // Milk Methods
        addMilkEntry,
        addBulkMilkEntry,
        deleteMilkEntry,

        // Dairy Plant Sale Methods & Centers
        dairyCenters,
        addDairyCenter,
        deleteDairyCenter,
        addDairySale,
        updateDairySale,
        deleteDairySale,
        updateRateMaster,
        calculateRateFromMaster,
        recalculateDairySalesWithMasterRate,

        // Customer Methods
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerDelivery,
        recordCustomerPayment,

        // Expense Methods
        addExpense,
        deleteExpense,

        // Feed Stock Methods
        updateFeedStockItem,
        recordDailyFeedUsage,
        addFeedStock,

        // Health & Vet Methods
        addHealthRecord,
        addVaccination,
        addBreedingRecord,
        updateBreedingRecord,
        deleteBreedingRecord,

        // Theme System
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',

        // Database Load Status
        isDbLoaded,

        // Data Reset & Demo & Reload
        clearAllData,
        loadDemoData,
        reloadFromDatabase: loadDataFromDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
