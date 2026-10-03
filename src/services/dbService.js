import { db } from '../utils/firebase.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';

// Helper to fetch collection docs as array with timeout
async function fetchCollectionDocs(collectionName, maxLimit = 250, orderField = null, orderDir = 'desc') {
  try {
    let q;
    const colRef = collection(db, collectionName);
    if (orderField) {
      q = query(colRef, orderBy(orderField, orderDir), limit(maxLimit));
    } else {
      q = query(colRef, limit(maxLimit));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn(`Firestore query warning [${collectionName}]:`, err?.message || err);
    return [];
  }
}

// Helper to get a single document
async function fetchSingleDoc(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn(`Firestore single doc warning [${collectionName}/${docId}]:`, err?.message || err);
  }
  return null;
}

export const dbService = {
  // 1. Fetch All Data from Firebase Cloud Firestore
  async loadAll() {
    let cloudData = null;
    try {
      const [
        farmProfileData,
        rateMasterData,
        animalsDocs,
        customersDocs,
        salesDocs,
        txnsDocs,
        paymentsDocs,
        dairySalesDocs,
        milkEntriesDocs,
        expensesDocs,
        feedDocs,
        healthDocs,
        vacDocs,
        brdDocs
      ] = await Promise.all([
        fetchSingleDoc('farm_profile', 'default'),
        fetchSingleDoc('rate_master_config', 'default'),
        fetchCollectionDocs('animals', 100),
        fetchCollectionDocs('customers', 250, 'name', 'asc'),
        fetchCollectionDocs('customer_sales', 250, 'date', 'desc'),
        fetchCollectionDocs('customer_transactions', 200, 'date', 'desc'),
        fetchCollectionDocs('payments', 200, 'payment_date', 'desc'),
        fetchCollectionDocs('dairy_sales', 100, 'date', 'desc'),
        fetchCollectionDocs('milk_entries', 100, 'date', 'desc'),
        fetchCollectionDocs('expenses', 100, 'date', 'desc'),
        fetchCollectionDocs('feed_stock', 50),
        fetchCollectionDocs('health_records', 50),
        fetchCollectionDocs('vaccinations', 50),
        fetchCollectionDocs('breeding_records', 50)
      ]);

      let animals = animalsDocs;
      let customers = customersDocs;
      let customerSales = salesDocs;
      let customerTransactions = txnsDocs;
      let dairySales = dairySalesDocs;
      let milkEntries = milkEntriesDocs;
      let expenses = expensesDocs;
      let feedStock = feedDocs;
      let healthRecords = healthDocs;
      let vaccinations = vacDocs;
      let breedingRecords = brdDocs;
      let farmProfile = farmProfileData;
      let rateMasterConfig = rateMasterData;

      // Fallback to initial_db.json if Firestore is newly created & still empty
      if ((!customers || customers.length === 0) && (!animals || animals.length === 0)) {
        try {
          const res = await fetch('/initial_db.json');
          if (res.ok) {
            const initial = await res.json();
            if (initial) {
              if (Array.isArray(initial.customers) && initial.customers.length > 0) customers = initial.customers;
              if (Array.isArray(initial.animals) && initial.animals.length > 0) animals = initial.animals;
              if (Array.isArray(initial.customerSales) && initial.customerSales.length > 0) customerSales = initial.customerSales.slice(0, 200);
              if (Array.isArray(initial.customerTransactions) && initial.customerTransactions.length > 0) customerTransactions = initial.customerTransactions.slice(0, 200);
              if (Array.isArray(initial.dairySales) && initial.dairySales.length > 0) dairySales = initial.dairySales.slice(0, 100);
              if (initial.farmProfile) farmProfile = initial.farmProfile;
              if (initial.rateMasterConfig) rateMasterConfig = initial.rateMasterConfig;
            }
          }
        } catch (fbErr) {
          console.warn('Initial json fallback skipped:', fbErr);
        }
      }

      cloudData = {
        farmProfile: farmProfile || {
          farmName: 'SHIVAJI MILK CENTER',
          ownerName: 'SATISH PATIDAR',
          phone: '8770234735',
          address: '',
          tagline: 'शुद्धता और विश्वास का प्रतीक'
        },
        animals: animals || [],
        customers: customers || [],
        customerSales: customerSales || [],
        customerTransactions: customerTransactions || [],
        dairySales: dairySales || [],
        milkEntries: milkEntries || [],
        rateMasterConfig: rateMasterConfig || {
          pricingMode: 'fat_only',
          buffaloFatRate: 9.33,
          cowFatRate: 8.5
        },
        expenses: expenses || [],
        feedStock: feedStock || [],
        healthRecords: healthRecords || [],
        vaccinations: vaccinations || [],
        breedingRecords: breedingRecords || []
      };

      console.log(`✓ Loaded from Cloud Firestore: ${customers.length} customers, ${animals.length} animals, ${customerSales.length} sales`);
      return cloudData;
    } catch (err) {
      console.warn('Firestore loadAll warning:', err);
      return cloudData;
    }
  },

  // 2. Customer Save & Delete in Firestore
  async saveCustomer(customer) {
    try {
      const id = String(customer.id || `CUST-${Date.now()}`);
      await setDoc(doc(db, 'customers', id), { ...customer, id }, { merge: true });
      console.log('✓ Customer saved to Firestore:', customer.name);
    } catch (e) {
      console.warn('saveCustomer to Firestore error:', e);
    }
  },

  async deleteCustomer(id) {
    try {
      await deleteDoc(doc(db, 'customers', String(id)));
    } catch (e) {}
  },

  // 3. Customer Sale / Delivery Save in Firestore
  async saveCustomerSale(sale) {
    try {
      const id = String(sale.id || `CSALE-${Date.now()}`);
      await setDoc(doc(db, 'customer_sales', id), { ...sale, id }, { merge: true });
      console.log('✓ Sale saved to Firestore');
      return { ...sale, id };
    } catch (e) {
      console.warn('saveCustomerSale to Firestore error:', e);
    }
  },

  async deleteCustomerSale(id) {
    try {
      await deleteDoc(doc(db, 'customer_sales', String(id)));
    } catch (e) {}
  },

  // 4. Payment Save in Firestore
  async savePayment(payment) {
    try {
      const id = String(payment.id || `PMT-${Date.now()}`);
      await setDoc(doc(db, 'payments', id), { ...payment, id }, { merge: true });
      console.log('✓ Payment saved to Firestore');
    } catch (e) {
      console.warn('savePayment to Firestore error:', e);
    }
  },

  // 5. Farm Profile in Firestore
  async saveFarmProfile(profile) {
    try {
      await setDoc(doc(db, 'farm_profile', 'default'), profile, { merge: true });
      console.log('✓ Farm Profile saved to Firestore');
    } catch (e) {}
  },

  // 6. Animals in Firestore
  async saveAnimal(animal) {
    try {
      const id = String(animal.id || `ANM-${Date.now()}`);
      await setDoc(doc(db, 'animals', id), { ...animal, id }, { merge: true });
      console.log('✓ Animal saved to Firestore:', animal.name || animal.tagNo);
    } catch (e) {
      console.warn('saveAnimal to Firestore error:', e);
    }
  },

  async deleteAnimal(id) {
    try {
      await deleteDoc(doc(db, 'animals', String(id)));
    } catch (e) {}
  },

  // 7. Milk Entries in Firestore
  async saveMilkEntry(entry) {
    try {
      const id = String(entry.id || `MILK-${Date.now()}`);
      await setDoc(doc(db, 'milk_entries', id), { ...entry, id }, { merge: true });
    } catch (e) {
      console.warn('saveMilkEntry to Firestore error:', e);
    }
  },

  async deleteMilkEntry(id) {
    try {
      await deleteDoc(doc(db, 'milk_entries', String(id)));
    } catch (e) {}
  },

  // 8. Dairy Wholesale Sales in Firestore
  async saveDairySale(sale) {
    try {
      const id = String(sale.id || `DSALE-${Date.now()}`);
      await setDoc(doc(db, 'dairy_sales', id), { ...sale, id }, { merge: true });
    } catch (e) {
      console.warn('saveDairySale to Firestore error:', e);
    }
  },

  async deleteDairySale(id) {
    try {
      await deleteDoc(doc(db, 'dairy_sales', String(id)));
    } catch (e) {}
  },

  // 9. Rate Master Config in Firestore
  async saveRateMaster(config) {
    try {
      await setDoc(doc(db, 'rate_master_config', 'default'), config, { merge: true });
    } catch (e) {}
  },

  // 10. Expenses in Firestore
  async saveExpense(expense) {
    try {
      const id = String(expense.id || `EXP-${Date.now()}`);
      await setDoc(doc(db, 'expenses', id), { ...expense, id }, { merge: true });
    } catch (e) {
      console.warn('saveExpense to Firestore error:', e);
    }
  },

  async deleteExpense(id) {
    try {
      await deleteDoc(doc(db, 'expenses', String(id)));
    } catch (e) {}
  },

  // 11. Feed Stock in Firestore
  async saveFeedStockItem(item) {
    try {
      const id = String(item.id || `FEED-${Date.now()}`);
      await setDoc(doc(db, 'feed_stock', id), { ...item, id }, { merge: true });
    } catch (e) {}
  },

  // 12. Health Records in Firestore
  async saveHealthRecord(record) {
    try {
      const id = String(record.id || `HLT-${Date.now()}`);
      await setDoc(doc(db, 'health_records', id), { ...record, id }, { merge: true });
    } catch (e) {}
  },

  // 13. Vaccinations in Firestore
  async saveVaccination(vac) {
    try {
      const id = String(vac.id || `VAC-${Date.now()}`);
      await setDoc(doc(db, 'vaccinations', id), { ...vac, id }, { merge: true });
    } catch (e) {}
  },

  // 14. Breeding Records in Firestore
  async saveBreedingRecord(brd) {
    try {
      const id = String(brd.id || `BRD-${Date.now()}`);
      await setDoc(doc(db, 'breeding_records', id), { ...brd, id }, { merge: true });
    } catch (e) {}
  },

  async deleteBreedingRecord(id) {
    try {
      await deleteDoc(doc(db, 'breeding_records', String(id)));
    } catch (e) {}
  },

  // 15. Ledger Transactions in Firestore
  async saveTransaction(txn) {
    try {
      const id = String(txn.id || `TXN-${Date.now()}`);
      await setDoc(doc(db, 'customer_transactions', id), { ...txn, id }, { merge: true });
    } catch (e) {}
  },

  // 16. Cattle Sales in Firestore
  async saveCattleSale(sale) {
    try {
      const id = String(sale.id || `CS-${Date.now()}`);
      await setDoc(doc(db, 'cattle_sales', id), { ...sale, id }, { merge: true });
    } catch (e) {}
  },

  async deleteCattleSale(id) {
    try {
      await deleteDoc(doc(db, 'cattle_sales', String(id)));
    } catch (e) {}
  },

  // 17. Authentication & User Management with Firestore
  async authenticateUser(loginId, password) {
    const cleanId = String(loginId || '').trim();
    const cleanPass = String(password || '').trim();
    if (!cleanId || !cleanPass) return { success: false, error: 'कृपया लॉगिन आईडी और पासवर्ड दर्ज करें' };

    try {
      // 1. Check Firestore 'app_users' collection
      const usersCol = collection(db, 'app_users');
      const snap = await getDocs(usersCol);
      const userDoc = snap.docs.find(d => {
        const u = d.data();
        const matchesId = String(u.login_id || u.loginId || u.mobile || '').toLowerCase() === cleanId.toLowerCase();
        const matchesPass = String(u.password || '') === cleanPass;
        return matchesId && matchesPass && u.is_active !== false && u.isActive !== false;
      });

      if (userDoc) {
        const data = userDoc.data();
        return {
          success: true,
          user: {
            id: userDoc.id,
            loginId: data.login_id || data.loginId || cleanId,
            name: data.full_name || data.fullName || 'User',
            phone: data.mobile || cleanId,
            mobile: data.mobile || cleanId,
            role: data.role || 'admin',
            title: data.role === 'admin' ? 'मालिक (Owner)' : (data.role === 'manager' ? 'मुनीम (Manager)' : 'ग्वाला (Worker)')
          }
        };
      }
    } catch (e) {
      console.warn('authenticateUser Firestore warning:', e);
    }

    // 2. Default Owner Fallback
    if ((cleanId === '8770234735' || cleanId === 'admin') && (cleanPass === '8770234735' || cleanPass === 'admin' || cleanPass === '123456')) {
      return {
        success: true,
        user: {
          id: 'USR-ADMIN',
          loginId: '8770234735',
          name: 'Satish Patidar',
          phone: '8770234735',
          mobile: '8770234735',
          role: 'admin',
          title: 'मालिक (Owner)'
        }
      };
    }

    return null;
  },

  async getUsers() {
    try {
      const snap = await getDocs(collection(db, 'app_users'));
      if (!snap.empty) {
        return snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
      }
    } catch (e) {}

    return [
      {
        id: 'USR-ADMIN',
        loginId: '8770234735',
        fullName: 'Satish Patidar',
        mobile: '8770234735',
        role: 'admin',
        isActive: true
      }
    ];
  },

  async saveUser(user) {
    try {
      const id = String(user.id || `USR-${Date.now()}`);
      await setDoc(doc(db, 'app_users', id), { ...user, id }, { merge: true });
      return { ...user, id };
    } catch (e) {
      return user;
    }
  },

  async deleteUser(userId) {
    try {
      await deleteDoc(doc(db, 'app_users', String(userId)));
      return true;
    } catch (e) {
      return false;
    }
  },

  async createOtp(mobile) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    try {
      await setDoc(doc(db, 'user_otps', String(mobile)), {
        mobile,
        otp,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });
    } catch (e) {}
    return { otp, expiresAt };
  },

  async verifyOtp(mobile, enteredOtp) {
    try {
      const snap = await getDoc(doc(db, 'user_otps', String(mobile)));
      if (snap.exists()) {
        const data = snap.data();
        if (data.otp === enteredOtp && Date.now() <= data.expires_at) {
          await deleteDoc(doc(db, 'user_otps', String(mobile)));
          return { success: true };
        }
      }
    } catch (e) {}
    return { success: false, error: 'OTP अमान्य या समाप्त हो गया है' };
  }
};
