export const initialAnimals = [
  {
    id: "ANM-001",
    tagNo: "COW-101",
    name: "Lakshmi (लक्ष्मी)",
    type: "cow",
    breed: "Gir (गीर)",
    gender: "female",
    dob: "2021-03-15",
    purchaseDate: "2023-01-10",
    purchasePrice: 65000,
    weight: 420,
    dailyCapacity: 16.5,
    status: "milking",
    lactationNo: 2,
    lastCalvingDate: "2024-04-12",
    photo: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80",
    notes: "High yield, pure Gir breed. Very calm."
  },
  {
    id: "ANM-002",
    tagNo: "BUF-201",
    name: "Kaali (काली)",
    type: "buffalo",
    breed: "Murrah (मुर्राह)",
    gender: "female",
    dob: "2020-07-20",
    purchaseDate: "2022-11-05",
    purchasePrice: 95000,
    weight: 580,
    dailyCapacity: 18.0,
    status: "milking",
    lactationNo: 3,
    lastCalvingDate: "2024-03-01",
    photo: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80",
    notes: "Champion Murrah. Fat consistently > 7.5%."
  },
  {
    id: "ANM-003",
    tagNo: "COW-102",
    name: "Gauri (गौरी)",
    type: "cow",
    breed: "Sahiwal (साहीवाल)",
    gender: "female",
    dob: "2021-11-05",
    purchaseDate: "2023-06-20",
    purchasePrice: 58000,
    weight: 390,
    dailyCapacity: 14.0,
    status: "pregnant",
    lactationNo: 2,
    lastCalvingDate: "2023-08-15",
    photo: "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=600&q=80",
    notes: "Artificial Inseminated on 2024-01-10. Expected calving soon."
  },
  {
    id: "ANM-004",
    tagNo: "BUF-202",
    name: "Champa (चंपा)",
    type: "buffalo",
    breed: "Murrah (मुर्राह)",
    gender: "female",
    dob: "2019-09-12",
    purchaseDate: "2022-04-18",
    purchasePrice: 88000,
    weight: 540,
    dailyCapacity: 15.5,
    status: "milking",
    lactationNo: 3,
    lastCalvingDate: "2024-05-10",
    photo: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
    notes: "Consistent evening milk yield."
  },
  {
    id: "ANM-005",
    tagNo: "COW-103",
    name: "Ganga (गंगा)",
    type: "cow",
    breed: "HF Cross (होलस्टीन क्रॉस)",
    gender: "female",
    dob: "2022-02-14",
    purchaseDate: "2023-12-01",
    purchasePrice: 72000,
    weight: 460,
    dailyCapacity: 22.0,
    status: "milking",
    lactationNo: 1,
    lastCalvingDate: "2024-05-25",
    photo: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
    notes: "High volume producer, requires balanced mineral feed."
  },
  {
    id: "ANM-006",
    tagNo: "BUF-203",
    name: "Rani (रानी)",
    type: "buffalo",
    breed: "Nili Ravi (नीली रावी)",
    gender: "female",
    dob: "2020-01-25",
    purchaseDate: "2023-03-15",
    purchasePrice: 90000,
    weight: 560,
    dailyCapacity: 16.0,
    status: "dry",
    lactationNo: 2,
    lastCalvingDate: "2023-06-10",
    photo: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=600&q=80",
    notes: "Currently dry period. Special pre-calving diet."
  },
  {
    id: "ANM-007",
    tagNo: "COW-104",
    name: "Nandini (नंदिनी)",
    type: "cow",
    breed: "Tharparkar (थारपारकर)",
    gender: "female",
    dob: "2021-08-30",
    purchaseDate: "2023-09-12",
    purchasePrice: 52000,
    weight: 380,
    dailyCapacity: 13.0,
    status: "milking",
    lactationNo: 2,
    lastCalvingDate: "2024-02-18",
    photo: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80",
    notes: "Resistant to climate variations."
  },
  {
    id: "ANM-008",
    tagNo: "COW-105",
    name: "Kaveri (कावेरी)",
    type: "cow",
    breed: "Red Sindhi (रेड सिंधी)",
    gender: "female",
    dob: "2022-06-10",
    purchaseDate: "2024-01-15",
    purchasePrice: 48000,
    weight: 350,
    dailyCapacity: 11.5,
    status: "sick",
    lactationNo: 1,
    lastCalvingDate: "2024-03-20",
    photo: "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=600&q=80",
    notes: "Under treatment for mild fever. Vet prescribed antibiotics."
  }
];

export const initialCustomers = [
  {
    id: "CUST-001",
    name: "Ramesh Sharma (रमेश शर्मा)",
    mobile: "9876543210",
    address: "Ward No. 4, Main Market Road",
    milkType: "cow",
    morningQty: 2.0,
    eveningQty: 1.5,
    rate: 60,
    balance: 1450,
    advance: 0,
    status: "active",
    joinedDate: "2023-05-10"
  },
  {
    id: "CUST-002",
    name: "Suresh Verma (सुरेश वर्मा)",
    mobile: "9823456789",
    address: "Shanti Nagar, Street No. 2",
    milkType: "buffalo",
    morningQty: 3.0,
    eveningQty: 2.0,
    rate: 80,
    balance: 3200,
    advance: 0,
    status: "active",
    joinedDate: "2023-06-15"
  },
  {
    id: "CUST-003",
    name: "Radheshyam Dairy (राधेश्याम जी)",
    mobile: "9811223344",
    address: "Sweet Shop, Bus Stand",
    milkType: "mixed",
    morningQty: 15.0,
    eveningQty: 15.0,
    rate: 72,
    balance: 8640,
    advance: 5000,
    status: "active",
    joinedDate: "2023-01-01"
  },
  {
    id: "CUST-004",
    name: "Dr. Anil Gupta (डॉ. अनिल गुप्ता)",
    mobile: "9988776655",
    address: "Hospital Road, House No. 12",
    milkType: "cow",
    morningQty: 2.0,
    eveningQty: 0.0,
    rate: 65,
    balance: 650,
    advance: 0,
    status: "active",
    joinedDate: "2023-08-20"
  },
  {
    id: "CUST-005",
    name: "Kamal Singh (कमल सिंह)",
    mobile: "9765432109",
    address: "Farm House, East Dhani",
    milkType: "buffalo",
    morningQty: 1.5,
    eveningQty: 1.5,
    rate: 80,
    balance: 0,
    advance: 1200,
    status: "active",
    joinedDate: "2023-11-01"
  },
  {
    id: "CUST-006",
    name: "Amit Patel - Sweet Shop (अमित पटेल)",
    mobile: "9871122445",
    address: "Chowk Bazaar, Mithai Gali",
    milkType: "buffalo",
    morningQty: 20.0,
    eveningQty: 10.0,
    rate: 78,
    balance: 14040,
    advance: 0,
    status: "active",
    joinedDate: "2023-02-14"
  }
];

export const initialMilkEntries = [];

export const initialExpenses = [
  {
    id: "EXP-001",
    date: new Date().toISOString().split('T')[0],
    category: "fodder",
    title: "Green Napier Fodder (हरा चारा) 2 Trolley",
    amount: 3200,
    payee: "Farmer Rampal",
    paymentMethod: "cash",
    notes: "Fresh green fodder loaded from field"
  },
  {
    id: "EXP-002",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    category: "feed",
    title: "Mustard Oil Cake (सरसों खल) 10 Bags",
    amount: 18500,
    payee: "Kisan Oil Mill",
    paymentMethod: "upi",
    notes: "₹1850 per 50kg bag"
  },
  {
    id: "EXP-003",
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    category: "medicine",
    title: "Doctor Visit & Antibiotic Injection",
    amount: 850,
    payee: "Dr. Virendra Sharma (Veterinarian)",
    paymentMethod: "cash",
    notes: "Kaveri cow fever treatment"
  },
  {
    id: "EXP-004",
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    category: "labor",
    title: "Worker Raju - Weekly Advance",
    amount: 3000,
    payee: "Raju (Worker)",
    paymentMethod: "cash",
    notes: "Advance from monthly wage 12,000"
  },
  {
    id: "EXP-005",
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    category: "utility",
    title: "Dairy Tubewell Electricity Bill",
    amount: 1450,
    payee: "Electricity Board",
    paymentMethod: "upi",
    notes: "Monthly agricultural power bill"
  }
];

export const initialFeedStock = [
  {
    id: "FEED-001",
    name: "Green Fodder (हरा चारा)",
    stockQuantity: 1200,
    unit: "kg",
    dailyUsage: 140,
    costPerUnit: 2.5,
    minThreshold: 400
  },
  {
    id: "FEED-002",
    name: "Dry Straw / Toori (सूखा भूसा)",
    stockQuantity: 3500,
    unit: "kg",
    dailyUsage: 60,
    costPerUnit: 9.0,
    minThreshold: 1000
  },
  {
    id: "FEED-003",
    name: "Mustard Oil Cake (सरसों खल)",
    stockQuantity: 450,
    unit: "kg",
    dailyUsage: 25,
    costPerUnit: 37.0,
    minThreshold: 150
  },
  {
    id: "FEED-004",
    name: "Wheat Bran / Choker (गेहूं का चोकर)",
    stockQuantity: 80,
    unit: "kg",
    dailyUsage: 20,
    costPerUnit: 24.0,
    minThreshold: 100 // Warning triggered!
  },
  {
    id: "FEED-005",
    name: "Compound Balanced Feed (संतुलित पशुआहार)",
    stockQuantity: 600,
    unit: "kg",
    dailyUsage: 35,
    costPerUnit: 28.0,
    minThreshold: 200
  },
  {
    id: "FEED-006",
    name: "Mineral Mixture (मिनरल मिक्सचर)",
    stockQuantity: 35,
    unit: "kg",
    dailyUsage: 1.5,
    costPerUnit: 120.0,
    minThreshold: 10
  }
];

export const initialHealthRecords = [
  {
    id: "HLT-001",
    animalId: "COW-105",
    animalName: "Kaveri (कावेरी)",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    disease: "Mild Fever & Off-feed (हल्का बुखार)",
    doctor: "Dr. Virendra Sharma (डॉ. वीरेन्द्र शर्मा)",
    medicine: "Antipyretic & Vitamin B-Complex Bolus",
    cost: 850,
    status: "recovering",
    nextVisitDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    notes: "Check body temp before morning milking"
  },
  {
    id: "HLT-002",
    animalId: "BUF-201",
    animalName: "Kaali (काली)",
    date: new Date(Date.now() - 86400000 * 25).toISOString().split('T')[0],
    disease: "Mastitis Preventive Check (थनैला जांच)",
    doctor: "Dr. Anil Verma (डॉ. अनिल वर्मा)",
    medicine: "Teat Dip Solution & Mastitis kit",
    cost: 400,
    status: "recovered",
    nextVisitDate: "",
    notes: "Milk FAT% normal"
  }
];

export const initialVaccinations = [
  {
    id: "VAC-001",
    vaccineName: "FMD (खुरपका-मुंहपका टीका)",
    target: "All Cows & Buffaloes (सभी गाय व भैंस)",
    dateGiven: "2024-02-15",
    nextDueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
    status: "due_soon"
  },
  {
    id: "VAC-002",
    vaccineName: "HS (गलघोंटू टीका)",
    target: "All Milking Herd (सभी दुधारू पशु)",
    dateGiven: "2024-04-10",
    nextDueDate: "2024-10-10",
    status: "completed"
  },
  {
    id: "VAC-003",
    vaccineName: "Deworming Albendazole (पेट के कीड़ों की दवा)",
    target: "Entire Herd (सभी पशु)",
    dateGiven: "2024-05-01",
    nextDueDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
    status: "scheduled"
  },
  {
    id: "VAC-004",
    vaccineName: "BQ (लंगड़ा बुखार टीका)",
    target: "Young Stock & Calves (युवा पशु एवं बछड़े)",
    dateGiven: "2024-03-20",
    nextDueDate: "2024-09-20",
    status: "completed"
  }
];

export const initialBreedingRecords = [
  {
    id: "BRD-001",
    animalId: "COW-102",
    animalName: "Gauri (गौरी - Sahiwal)",
    aiDate: "2024-01-10",
    bullStrawTag: "SAH-CHAMP-990",
    technicianName: "Dr. Virendra Sharma (डॉ. वीरेन्द्र शर्मा)",
    pregnancyCheckDate: "2024-03-15",
    isPregnant: true,
    expectedCalvingDate: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0], // 18 days left!
    status: "late_pregnancy",
    notes: "9th month active. Keep in isolated calving pen."
  },
  {
    id: "BRD-002",
    animalId: "BUF-203",
    animalName: "Rani (रानी - Nili Ravi)",
    aiDate: "2024-03-20",
    bullStrawTag: "MUR-BULL-55",
    technicianName: "Dr. Anil Verma (डॉ. अनिल वर्मा)",
    pregnancyCheckDate: "2024-05-25",
    isPregnant: true,
    expectedCalvingDate: new Date(Date.now() + 86400000 * 185).toISOString().split('T')[0],
    status: "mid_pregnancy",
    notes: "Pregnancy confirmed."
  }
];

export const initialCustomerTransactions = [
  {
    id: "TXN-001",
    customerId: "CUST-001",
    customerName: "Ramesh Sharma (रमेश शर्मा)",
    date: new Date().toISOString().split('T')[0],
    type: "milk_supply",
    liters: 3.5,
    rate: 60,
    amount: 210,
    balanceAfter: 1450,
    note: "Morning 2.0L + Evening 1.5L"
  },
  {
    id: "TXN-002",
    customerId: "CUST-001",
    customerName: "Ramesh Sharma (रमेश शर्मा)",
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    type: "payment_received",
    liters: 0,
    rate: 0,
    amount: 1500,
    paymentMode: "upi",
    balanceAfter: 1240,
    note: "PhonePe payment received"
  },
  {
    id: "TXN-003",
    customerId: "CUST-002",
    customerName: "Suresh Verma (सुरेश वर्मा)",
    date: new Date().toISOString().split('T')[0],
    type: "milk_supply",
    liters: 5.0,
    rate: 80,
    amount: 400,
    balanceAfter: 3200,
    note: "Morning 3.0L + Evening 2.0L"
  },
  {
    id: "TXN-004",
    customerId: "CUST-003",
    customerName: "Radheshyam Dairy (राधेश्याम जी)",
    date: new Date().toISOString().split('T')[0],
    type: "milk_supply",
    liters: 30.0,
    rate: 72,
    amount: 2160,
    balanceAfter: 8640,
    note: "Bulk supply 30 Liters"
  }
];

export const initialCustomerSales = [
  {
    id: "CSALE-001",
    customerId: "CUST-001",
    customerName: "Ramesh Sharma (रमेश शर्मा)",
    date: new Date().toISOString().split('T')[0],
    shift: "morning",
    quantity: 3.5,
    rate: 60,
    amount: 210,
    source: "Direct Entry"
  },
  {
    id: "CSALE-002",
    customerId: "CUST-002",
    customerName: "Suresh Verma (सुरेश वर्मा)",
    date: new Date().toISOString().split('T')[0],
    shift: "morning",
    quantity: 5.0,
    rate: 80,
    amount: 400,
    source: "Direct Entry"
  },
  {
    id: "CSALE-003",
    customerId: "CUST-004",
    customerName: "Hotel Royal Palace (होटल रॉयल पैलेस)",
    date: new Date().toISOString().split('T')[0],
    shift: "morning",
    quantity: 25.0,
    rate: 58,
    amount: 1450,
    source: "Google Sheets"
  },
  {
    id: "CSALE-004",
    customerId: "CUST-003",
    customerName: "Rajesh Choudhary (राजेश जी)",
    date: new Date().toISOString().split('T')[0],
    shift: "morning",
    quantity: 6.5,
    rate: 60,
    amount: 390,
    source: "Direct Entry"
  }
];

export const initialDairySales = [
  {
    id: "DSALE-001",
    dairyName: "Amul / Saras Chilling Plant (अमूल संकलन केंद्र)",
    date: new Date().toISOString().split('T')[0],
    shift: "morning",
    milkType: "buffalo",
    quantity: 110.0,
    fat: 6.8,
    snf: 9.0,
    rate: 72,
    totalAmount: 7920,
    slipNo: "SLIP-8921"
  }
];
