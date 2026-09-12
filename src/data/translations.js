export const translations = {
  hi: {
    appName: "Dairy Farm Pro (डेयरी फार्म प्रो)",
    appSubtitle: "Smart Dairy & Cattle Management System (स्मार्ट दुग्ध एवं पशु प्रबंधन प्रणाली)",
    
    // Navigation
    nav: {
      dashboard: "Dashboard (डैशबोर्ड)",
      animals: "Cattle Management (पशु प्रबंधन)",
      milk: "Milk Production (दूध उत्पादन)",
      selling: "Milk Sales (दूध बिक्री)",
      customers: "Customers & Khata (ग्राहक व खाताबही)",
      customerAnalysis: "Customer Analysis (ग्राहक विश्लेषण)",
      expenses: "Expense Tracker (खर्च प्रबंधन)",
      feed: "Feed & Inventory (दाना एवं आहार)",
      health: "Health & Vaccine (स्वास्थ्य व टीका)",
      breeding: "Breeding & Calving (गर्भावस्था व ब्रीडिंग)",
      accounts: "Accounts & P&L (लेखा-जोखा व लाभ)",
      reports: "Reports Hub (रिपोर्ट्स)",
      workerMode: "Worker Fast Mode (ग्वाला / वर्कर मोड)",
      settings: "Settings (सेटिंग्स)"
    },

    // User Roles
    roles: {
      admin: "Admin (मालिक)",
      manager: "Manager (मुनीम)",
      worker: "Worker (ग्वाला)",
      switchRole: "Switch Role (भूमिका बदलें)",
      currentRole: "Current Role (वर्तमान भूमिका)",
      adminDesc: "Full Control, Accounts & Settings (पूर्ण नियंत्रण, वित्तीय खाते और सेटिंग्स)",
      managerDesc: "Milk Collection, Khata & Expenses (दूध संकलन, ग्राहक, भुगतान और खर्च)",
      workerDesc: "Daily Milk & Cattle Entry (दैनिक दूध व पशु एंट्री)"
    },

    // Common Actions
    actions: {
      add: "Add New (नया जोड़ें)",
      edit: "Edit (संपादित करें)",
      delete: "Delete (हटाएं)",
      save: "Save (सुरक्षित करें)",
      cancel: "Cancel (रद्द करें)",
      search: "Search (खोजें)...",
      filter: "Filter (फ़िल्टर)",
      export: "Export (एक्सपोर्ट)",
      print: "Print (प्रिंट करें)",
      viewDetails: "View Details (विवरण देखें)",
      confirm: "Confirm (पुष्टि करें)",
      close: "Close (बंद करें)",
      downloadPdf: "Download PDF (PDF डाउनलोड करें)",
      shareWhatsapp: "Share on WhatsApp (WhatsApp पर भेजें)",
      quickEntry: "Quick Entry (तुरंत एंट्री)"
    },

    // Dashboard
    dashboard: {
      title: "Farm Dashboard (डेयरी डैशबोर्ड)",
      todaySummary: "Today's Summary (आज का सारांश)",
      totalAnimals: "Total Cattle (कुल पशु)",
      milkingAnimals: "Milking Cattle (दुधारू पशु)",
      todayMilk: "Today's Total Milk (आज का कुल दूध)",
      morningMilk: "Morning Milk (सुबह का दूध)",
      eveningMilk: "Evening Milk (शाम का दूध)",
      todaySales: "Today's Sales (आज की बिक्री)",
      todayCollections: "Today's Collections (आज की वसूली)",
      pendingPayments: "Outstanding Balance (बकाया राशि)",
      todayExpenses: "Today's Expenses (आज के खर्च)",
      netProfitMonth: "This Month Net Profit (इस माह का शुद्ध लाभ)",
      milkProductionChart: "Milk Production Trends (दूध उत्पादन ट्रेंड)",
      salesVsExpenseChart: "Revenue vs Expenses (आमदनी बनाम खर्च)",
      recentActivity: "Recent Activities (हाल की गतिविधियां)",
      quickActions: "Quick Actions (त्वरित कार्य)",
      recordMorningMilk: "Record Morning Milk (सुबह का दूध दर्ज करें)",
      recordEveningMilk: "Record Evening Milk (शाम का दूध दर्ज करें)",
      recordExpense: "Record Expense (खर्च दर्ज करें)",
      addPayment: "Receive Payment (भुगतान प्राप्त करें)",
      alertsTitle: "Alerts & Reminders (महत्वपूर्ण अलर्ट और रिमाइंडर्स)",
      upcomingVaccines: "Upcoming Vaccinations (आगामी टीके)",
      calvingSoon: "Expected Calving Soon (प्रसव/ब्यांत तारीख नज़दीक)",
      lowFeedStock: "Low Stock Alert (कम स्टॉक चेतावनी)"
    },

    // Animals
    animals: {
      title: "Cattle Registry (पशु प्रबंधन)",
      tagNo: "Tag ID / टैग नं.",
      name: "Animal Name (पशु का नाम)",
      type: "Cattle Type (पशु का प्रकार)",
      cow: "Cow (गाय)",
      buffalo: "Buffalo (भैंस)",
      breed: "Breed (नस्ल)",
      gender: "Gender (लिंग)",
      female: "Female (मादा)",
      male: "Male (नर)",
      dob: "DOB / Age (जन्म तारीख / आयु)",
      purchaseDate: "Purchase Date (खरीद तारीख)",
      purchasePrice: "Purchase Price (खरीद कीमत ₹)",
      weight: "Weight (वजन - Kg)",
      dailyCapacity: "Milk Yield Capacity (दैनिक दूध क्षमता - L/day)",
      status: "Current Status (वर्तमान स्थिति)",
      milking: "Milking (दुधारू)",
      dry: "Dry (सूखी)",
      pregnant: "Pregnant (गाभिन)",
      sick: "Sick / Treatment (बीमार)",
      heifer: "Heifer (बछिया/पाडी)",
      lactationNumber: "Lactation No. (ब्यांत संख्या)",
      calvingDate: "Last Calving Date (अंतिम ब्यांत तारीख)",
      expectedCalving: "Expected Calving Date (संभावित प्रसव तारीख)",
      addAnimal: "+ Add Animal (+ नया पशु जोड़ें)",
      animalDetails: "Animal Profile (पशु का पूरा प्रोफाइल)",
      milkHistory: "Milk Yield History (दूध उत्पादन इतिहास)",
      healthHistory: "Health & Treatments (स्वास्थ्य एवं उपचार)",
      vaccinationHistory: "Vaccination Log (टीकाकरण इतिहास)",
      breedingHistory: "Breeding & AI Log (ब्रीडिंग व गर्भाधान)",
      photo: "Animal Photo (पशु की फोटो)",
      allTypes: "All Cattle (सभी पशु)",
      allStatuses: "All Statuses (सभी स्थितियां)"
    },

    // Milk Management
    milk: {
      title: "Milk Production & Collection (दूध उत्पादन एवं संकलन)",
      morningShift: "Morning (सुबह)",
      eveningShift: "Evening (शाम)",
      date: "Date (तारीख)",
      shift: "Shift (शिफ्ट)",
      animalId: "Tag ID (पशु टैग)",
      quantityLtr: "Quantity (मात्रा - Liters)",
      fat: "Fat % (फेट)",
      snf: "SNF % (एसएनएफ)",
      ratePerLtr: "Rate (दर ₹/Liter)",
      totalAmount: "Total Amount (कुल राशि ₹)",
      recordedBy: "Recorded By (दर्जकर्ता)",
      addEntry: "Add Milk Entry (दूध एंट्री जोड़ें)",
      bulkEntry: "Bulk / Center Entry (थोक / सेंटर एंट्री)",
      calculatorTitle: "Fat & SNF Rate Calculator (फेट & SNF रेट कैलकुलेटर)",
      baseRateCow: "Cow Milk Base Rate (गाय दूध बेस रेट)",
      baseRateBuf: "Buffalo Milk Base Rate (भैंस दूध बेस रेट)",
      calculatedRate: "Calculated Rate (गणना की गई दर)",
      totalProduction: "Total Production (कुल उत्पादन)",
      directSales: "Direct Retail Supply (ग्राहकों को सप्लाई)",
      dairySales: "Dairy Center Supply (डेयरी सेंटर पर बिक्री)",
      homeUse: "Calf / Home Consumption (घरेलू / बछड़ों के लिए)"
    },

    // Customers
    customers: {
      title: "Customers & Khata Ledger (ग्राहक एवं खाताबही)",
      name: "Customer Name (ग्राहक का नाम)",
      mobile: "Mobile Number (मोबाइल नंबर)",
      address: "Address / Route (पता / मोहल्ला)",
      morningQty: "Morning Qty (सुबह का दूध - L)",
      eveningQty: "Evening Qty (शाम का दूध - L)",
      rate: "Milk Rate (दूध रेट ₹/L)",
      balance: "Pending Balance (बकाया राशि ₹)",
      advance: "Advance Payment (अग्रिम राशि ₹)",
      addCustomer: "+ Add Customer (+ नया ग्राहक जोड़ें)",
      dailyDelivery: "Daily Delivery Sheet (दैनिक डिलीवरी शीट)",
      ledger: "Khata Ledger (ग्राहक खाताबही)",
      paymentReceived: "Payment Received (भुगतान प्राप्त हुआ)",
      amount: "Amount (राशि ₹)",
      paymentMode: "Payment Mode (भुगतान माध्यम)",
      cash: "Cash (नकद)",
      upi: "UPI / PhonePe / GPay",
      bank: "Bank Transfer (बैंक ट्रांसफर)",
      sendBillWhatsapp: "Share Bill via WhatsApp (WhatsApp पर बिल भेजें)",
      markDelivered: "Record Supply (सप्लाई दर्ज करें)",
      markedPresent: "Delivered (दिया गया)",
      markedAbsent: "Skipped / Absent (बंद था)"
    },

    // Expenses
    expenses: {
      title: "Expense Management (खर्च प्रबंधन)",
      category: "Expense Category (खर्च श्रेणी)",
      categories: {
        fodder: "Green & Dry Fodder (चारा एवं भूसा)",
        feed: "Cattle Feed & Cakes (दाना, खल व चोकर)",
        medicine: "Veterinary & Medicine (दवाई व डॉक्टर फीस)",
        labor: "Labor & Wages (मजदूरी व वेतन)",
        utility: "Electricity & Water Bills (बिजली व पानी बिल)",
        animalPurchase: "Animal Purchase (पशु खरीद)",
        equipment: "Equipment & Maintenance (उपकरण व मरम्मत)",
        other: "Other Expenses (अन्य फुटकर खर्च)"
      },
      amount: "Amount (खर्च राशि ₹)",
      date: "Date (तारीख)",
      payee: "Paid To / Vendor (किसको भुगतान किया)",
      paymentMethod: "Payment Method (भुगतान प्रकार)",
      notes: "Description / Notes (विवरण / टिप्पणी)",
      addExpense: "+ Add Expense (+ नया खर्च दर्ज करें)",
      totalExpense: "Total Expenses (कुल खर्च)"
    },

    // Feed & Stock
    feed: {
      title: "Feed & Inventory Management (दाना एवं आहार प्रबंधन)",
      itemName: "Feed Item Name (आहार / दाने का नाम)",
      stockQuantity: "Available Stock (उपलब्ध स्टॉक)",
      unit: "Unit (इकाई)",
      dailyUsage: "Daily Consumption (दैनिक खपत - Kg)",
      costPerUnit: "Rate per Unit (दर प्रति इकाई ₹)",
      remainingDays: "Est. Days Remaining (अनुमानित शेष दिन)",
      addStock: "+ Add Stock (+ नया स्टॉक जोड़ें)",
      recordUsage: "Record Daily Usage (दैनिक उपयोग दर्ज करें)",
      lowStockWarning: "Low Stock Warning (कम स्टॉक चेतावनी!)",
      items: {
        greenFodder: "Green Fodder (हरा चारा)",
        dryFodder: "Dry Straw / Bhusa (सूखा भूसा / तूड़ी)",
        mustardCake: "Mustard / Cotton Cake (सरसों / बिनौला खल)",
        wheatBran: "Wheat Bran (गेहूं का चोकर)",
        cattleFeedCompound: "Compound Cattle Feed (संतुलित पशुआहार)",
        mineralMix: "Mineral Mixture & Salt (मिनरल मिक्सचर व नमक)",
        calcium: "Liquid Calcium (लिक्विड कैल्शियम)"
      }
    },

    // Health & Breeding
    health: {
      title: "Health, Vaccine & Breeding (पशु स्वास्थ्य, टीका व ब्रीडिंग)",
      treatmentLogs: "Treatments (बीमारी एवं उपचार)",
      vaccinationSchedule: "Vaccination Calendar (टीकाकरण कैलेंडर)",
      breedingLogs: "Breeding Tracker (गर्भाधान व ब्यांत ट्रैकर)",
      diseaseName: "Disease / Symptoms (बीमारी / लक्षण)",
      doctorName: "Veterinary Doctor (डॉक्टर / पशु चिकित्सक)",
      medicineUsed: "Medicine Administered (दी गई दवाई)",
      treatmentCost: "Treatment Cost (उपचार खर्च ₹)",
      nextVisit: "Next Doctor Visit (अगली डॉक्टर विजिट)",
      vaccineName: "Vaccine Name (टीके का नाम)",
      vaccinationDate: "Vaccination Date (टीका लगाने की तारीख)",
      nextDueDate: "Next Due Date (अगले टीके की तारीख)",
      aiDate: "AI / Insemination Date (कृत्रिम गर्भाधान तारीख)",
      bullTag: "Bull Tag / Semen Straw ID (सांड / सीमन स्ट्रॉ नंबर)",
      pregnancyStatus: "Pregnancy Status (गर्भावस्था स्थिति)",
      daysPregnant: "Days Pregnant (गर्भावस्था के दिन)",
      daysToCalving: "Days to Calving (प्रसव में शेष दिन)",
      addHealthRecord: "+ Add Treatment (+ उपचार दर्ज करें)",
      addVaccine: "+ Add Vaccine (+ टीका दर्ज करें)",
      addBreedingRecord: "+ Add Insemination (+ गर्भाधान दर्ज करें)"
    },

    // Accounts & Profit Loss
    accounts: {
      title: "Accounts & Profit / Loss (लेखा-जोखा एवं लाभ-हानि)",
      totalRevenue: "Total Revenue (कुल आमदनी - दूध + बिक्री)",
      milkRevenue: "Milk Sales Revenue (दूध बिक्री से आय)",
      otherRevenue: "Other Income (अन्य आमदनी)",
      totalExpenditure: "Total Expenses (कुल खर्च)",
      netProfit: "Net Profit / Loss (शुद्ध लाभ / हानि)",
      profitMargin: "Profit Margin % (लाभ प्रतिशत)",
      financialSummary: "Financial Summary (वित्तीय सारांश)",
      monthlyBreakdown: "Monthly Breakdown (मासिक लेखा-जोखा)",
      feedVsRevenue: "Feed Cost vs Milk Ratio (दाना खर्च बनाम आय)"
    },

    // Reports
    reports: {
      title: "Reports & Analytics (रिपोर्ट्स एवं एनालिटिक्स)",
      dailyMilkReport: "Daily Milk Report (दैनिक दूध रिपोर्ट)",
      monthlyMilkReport: "Monthly Milk Report (मासिक उत्पादन रिपोर्ट)",
      customerLedgerReport: "Customer Billing Ledger (ग्राहक बिलिंग खाताबही)",
      expenseReport: "Detailed Expense Report (विस्तृत खर्च रिपोर्ट)",
      profitLossStatement: "Profit & Loss Statement (लाभ-हानि स्टेटमेंट)",
      animalPerformanceReport: "Cattle Yield Performance (पशु-वार दूध प्रदर्शन)",
      feedStockReport: "Feed Stock & Usage Report (आहार स्टॉक व खपत)",
      healthVaccineReport: "Health & Vaccine Audit (स्वास्थ्य व टीकाकरण)",
      generateReport: "Generate Report (रिपोर्ट तैयार करें)",
      selectDateRange: "Select Date Range (तारीख सीमा चुनें)"
    },

    // Worker View
    worker: {
      title: "Worker Fast Mode (ग्वाला / सहायक क्विक मोड)",
      subtitle: "Quick Entry for Milk & Ration (दूध व दाना तुरंत दर्ज करें)",
      selectAnimal: "Select Cattle (पशु चुनें)",
      enterMilk: "Milk Quantity (दूध मात्रा - Liters)",
      morningQuick: "Save Morning Milk (सुबह का दूध दर्ज करें)",
      eveningQuick: "Save Evening Milk (शाम का दूध दर्ज करें)",
      reportSick: "Report Sickness (बीमारी की सूचना दें)",
      recordFeed: "Record Feed Given (दाना डाला)"
    }
  },

  en: {
    appName: "Dairy Farm Pro",
    appSubtitle: "Smart Dairy & Cattle Management System",
    
    // Navigation
    nav: {
      dashboard: "Dashboard",
      animals: "Animal Management",
      milk: "Milk Production",
      selling: "Milk Selling",
      customers: "Customer & Khata",
      customerAnalysis: "Customer Milk Analysis",
      expenses: "Expense Tracker",
      feed: "Feed & Inventory",
      health: "Health & Vaccine",
      breeding: "Breeding & Calving",
      accounts: "Accounts & P&L",
      reports: "Reports Hub",
      workerMode: "Worker Fast Mode",
      settings: "Settings"
    },

    // User Roles
    roles: {
      admin: "Dairy Owner / Admin",
      manager: "Farm Manager",
      worker: "Farm Worker",
      switchRole: "Switch Role",
      currentRole: "Current Role",
      adminDesc: "Full access, finances, settings and reports",
      managerDesc: "Milk entries, customer khata, payments & expenses",
      workerDesc: "Simplified daily milk & feeding entry"
    },

    // Common Actions
    actions: {
      add: "Add New",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      search: "Search...",
      filter: "Filter",
      export: "Export",
      print: "Print",
      viewDetails: "View Details",
      confirm: "Confirm",
      close: "Close",
      downloadPdf: "Download PDF",
      shareWhatsapp: "Share on WhatsApp",
      quickEntry: "Quick Entry"
    },

    // Dashboard
    dashboard: {
      title: "Farm Dashboard",
      todaySummary: "Today's Summary",
      totalAnimals: "Total Animals",
      milkingAnimals: "Milking Animals",
      todayMilk: "Today's Total Milk",
      morningMilk: "Morning Milk",
      eveningMilk: "Evening Milk",
      todaySales: "Today's Sales",
      todayCollections: "Today's Collections",
      pendingPayments: "Outstanding Dues",
      todayExpenses: "Today's Expenses",
      netProfitMonth: "This Month Net Profit",
      milkProductionChart: "Milk Production Trends (Last 7 Days)",
      salesVsExpenseChart: "Revenue vs Expense Breakdown",
      recentActivity: "Recent Activities",
      quickActions: "Quick Actions",
      recordMorningMilk: "Record Morning Milk",
      recordEveningMilk: "Record Evening Milk",
      recordExpense: "Record Expense",
      addPayment: "Record Payment",
      alertsTitle: "Important Alerts & Reminders",
      upcomingVaccines: "Upcoming Vaccinations",
      calvingSoon: "Expected Calving Soon",
      lowFeedStock: "Low Feed Stock Alert"
    },

    // Animals
    animals: {
      title: "Cattle & Herd Registry",
      tagNo: "Tag No / ID",
      name: "Animal Name",
      type: "Animal Type",
      cow: "Cow",
      buffalo: "Buffalo",
      breed: "Breed",
      gender: "Gender",
      female: "Female",
      male: "Male",
      dob: "DOB / Age",
      purchaseDate: "Purchase Date",
      purchasePrice: "Purchase Price",
      weight: "Weight (Kg)",
      dailyCapacity: "Milk Capacity (L/day)",
      status: "Current Status",
      milking: "Milking",
      dry: "Dry",
      pregnant: "Pregnant",
      sick: "Sick",
      heifer: "Heifer",
      lactationNumber: "Lactation Number",
      calvingDate: "Last Calving Date",
      expectedCalving: "Expected Calving Date",
      addAnimal: "+ Add New Animal",
      animalDetails: "Full Animal Profile",
      milkHistory: "Milk Yield History",
      healthHistory: "Health & Treatment History",
      vaccinationHistory: "Vaccination Log",
      breedingHistory: "Breeding & AI Log",
      photo: "Animal Photo",
      allTypes: "All Animals",
      allStatuses: "All Statuses"
    },

    // Milk Management
    milk: {
      title: "Milk Production & Sales",
      morningShift: "Morning Shift",
      eveningShift: "Evening Shift",
      date: "Date",
      shift: "Shift",
      animalId: "Animal Tag",
      quantityLtr: "Quantity (Liters)",
      fat: "Fat %",
      snf: "SNF %",
      ratePerLtr: "Rate (₹/Liter)",
      totalAmount: "Total Amount",
      recordedBy: "Recorded By",
      addEntry: "Add Milk Entry",
      bulkEntry: "Bulk / Dairy Society Entry",
      calculatorTitle: "Fat & SNF Rate Calculator",
      baseRateCow: "Cow Base Rate",
      baseRateBuf: "Buffalo Base Rate",
      calculatedRate: "Calculated Price",
      totalProduction: "Total Production",
      directSales: "Direct Retail Supply",
      dairySales: "Dairy Plant Supply",
      homeUse: "Calf / Home Consumption"
    },

    // Customers
    customers: {
      title: "Customer & Khata Ledger",
      name: "Customer Name",
      mobile: "Mobile Number",
      address: "Address / Route",
      morningQty: "Morning Qty (L)",
      eveningQty: "Evening Qty (L)",
      rate: "Rate (₹/L)",
      balance: "Pending Balance",
      advance: "Advance Payment",
      addCustomer: "+ Add New Customer",
      dailyDelivery: "Daily Delivery Sheet",
      ledger: "Customer Ledger (Khata)",
      paymentReceived: "Payment Received",
      amount: "Amount (₹)",
      paymentMode: "Payment Method",
      cash: "Cash",
      upi: "UPI / PhonePe / GPay",
      bank: "Bank Transfer",
      sendBillWhatsapp: "Share Bill via WhatsApp",
      markDelivered: "Record Delivery",
      markedPresent: "Delivered",
      markedAbsent: "Skipped / Absent"
    },

    // Expenses
    expenses: {
      title: "Expense Management",
      category: "Expense Category",
      categories: {
        fodder: "Green & Dry Fodder",
        feed: "Cattle Feed & Cakes",
        medicine: "Veterinary & Medicine",
        labor: "Labor & Worker Wages",
        utility: "Electricity & Water Bills",
        animalPurchase: "Animal Purchase",
        equipment: "Equipment & Maintenance",
        other: "Miscellaneous"
      },
      amount: "Amount (₹)",
      date: "Date",
      payee: "Paid To / Vendor",
      paymentMethod: "Payment Method",
      notes: "Notes / Description",
      addExpense: "+ Add Expense",
      totalExpense: "Total Expenses"
    },

    // Feed & Stock
    feed: {
      title: "Feed & Inventory Management",
      itemName: "Feed Item Name",
      stockQuantity: "Available Stock",
      unit: "Unit",
      dailyUsage: "Daily Consumption (Kg)",
      costPerUnit: "Cost per Unit (₹)",
      remainingDays: "Est. Days Remaining",
      addStock: "+ Add Stock Purchase",
      recordUsage: "Record Daily Ration",
      lowStockWarning: "Low Stock Warning!",
      items: {
        greenFodder: "Green Fodder (Barseem/Napier)",
        dryFodder: "Dry Straw / Bhusa (Wheat/Paddy)",
        mustardCake: "Mustard / Cottonseed Cake",
        wheatBran: "Wheat Bran",
        cattleFeedCompound: "Compound Cattle Feed Pellets",
        mineralMix: "Mineral Mixture & Salt",
        calcium: "Liquid Calcium"
      }
    },

    // Health & Breeding
    health: {
      title: "Health, Vaccination & Breeding",
      treatmentLogs: "Illness & Medical Treatments",
      vaccinationSchedule: "Vaccination Calendar",
      breedingLogs: "Insemination & Calving Tracker",
      diseaseName: "Disease / Symptoms",
      doctorName: "Veterinary Doctor",
      medicineUsed: "Medicine Administered",
      treatmentCost: "Treatment Cost (₹)",
      nextVisit: "Next Doctor Visit",
      vaccineName: "Vaccine Name",
      vaccinationDate: "Vaccinated On",
      nextDueDate: "Next Due Date",
      aiDate: "AI / Insemination Date",
      bullTag: "Bull / Semen Straw Tag",
      pregnancyStatus: "Pregnancy Status",
      daysPregnant: "Days Pregnant",
      daysToCalving: "Days to Calving",
      addHealthRecord: "+ Add Treatment",
      addVaccine: "+ Add Vaccination",
      addBreedingRecord: "+ Add Insemination"
    },

    // Accounts & Profit Loss
    accounts: {
      title: "Financials & Profit / Loss",
      totalRevenue: "Total Revenue (Milk + Animals)",
      milkRevenue: "Milk Sales Revenue",
      otherRevenue: "Other Income",
      totalExpenditure: "Total Expenditure",
      netProfit: "Net Profit / Loss",
      profitMargin: "Profit Margin %",
      financialSummary: "Financial Summary",
      monthlyBreakdown: "Monthly Breakdown",
      feedVsRevenue: "Feed Cost vs Milk Revenue Ratio"
    },

    // Reports
    reports: {
      title: "Reports & Business Intelligence",
      dailyMilkReport: "Daily Milk Collection Report",
      monthlyMilkReport: "Monthly Production Report",
      customerLedgerReport: "Customer Billing Ledger",
      expenseReport: "Detailed Expense Report",
      profitLossStatement: "Profit & Loss Statement",
      animalPerformanceReport: "Animal Yield Performance",
      feedStockReport: "Feed Stock & Consumption",
      healthVaccineReport: "Health & Vaccine Audit",
      generateReport: "Generate Report",
      selectDateRange: "Select Date Range"
    },

    // Worker View
    worker: {
      title: "Worker Fast Touch Mode",
      subtitle: "High-contrast, simple screen for fast milk and feeding entry",
      selectAnimal: "Select Animal",
      enterMilk: "Milk Quantity (Liters)",
      morningQuick: "Save Morning Milk",
      eveningQuick: "Save Evening Milk",
      reportSick: "Report Sickness / Alert",
      recordFeed: "Record Feed Given"
    }
  }
};
