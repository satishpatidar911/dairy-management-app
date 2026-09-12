import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Printer,
  Share2,
  Plus,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  CheckCircle2,
  Calendar,
  Layers,
  History,
  Clock,
  TrendingDown,
  Download
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const CustomerLedgerModal = ({ customer, onClose }) => {
  const { t } = useLanguage();
  const { customerSales, customerTransactions, recordCustomerPayment } = useApp();
  const { farmProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'monthly' | 'all_txns'
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  // Normalize customer identity
  const custIdStr = customer.id ? String(customer.id) : '';
  const rawIdStr = customer.rawId ? String(customer.rawId) : '';
  const custNameNorm = (customer.name || '').trim().toLowerCase();

  // Helper to check if a date falls within ledger date filter
  const isDateInLedgerRange = (dateStr) => {
    if (!dateStr) return false;
    if (ledgerStartDate && dateStr < ledgerStartDate) return false;
    if (ledgerEndDate && dateStr > ledgerEndDate) return false;
    return true;
  };

  // 1. Filter all transactions for this customer
  const txns = useMemo(() => {
    return customerTransactions.filter(tx => {
      const itemCustId = String(tx.customerId || '').trim();
      const matchId = (custIdStr && itemCustId === custIdStr) || (rawIdStr && (itemCustId === rawIdStr || itemCustId === `CUST-${rawIdStr}`));
      const matchName = tx.customerName && tx.customerName.trim().toLowerCase() === custNameNorm;
      return matchId || matchName;
    }).sort((a, b) => (b.date || '') > (a.date || '') ? 1 : ((b.date || '') < (a.date || '') ? -1 : 0));
  }, [customerTransactions, custIdStr, rawIdStr, custNameNorm]);

  // Filtered transactions by date range
  const filteredTxns = useMemo(() => {
    return txns.filter(t => isDateInLedgerRange(t.date));
  }, [txns, ledgerStartDate, ledgerEndDate]);

  // 2. Filter only payment deposits
  const paymentDeposits = useMemo(() => {
    return txns.filter(t => t.type === 'payment_received');
  }, [txns]);

  // Filtered payment deposits by date range
  const filteredPaymentDeposits = useMemo(() => {
    return paymentDeposits.filter(p => isDateInLedgerRange(p.date));
  }, [paymentDeposits, ledgerStartDate, ledgerEndDate]);

  // 3. Filter only milk deliveries
  const deliveries = useMemo(() => {
    return customerSales.filter(s => {
      const itemCustId = String(s.customerId || '').trim();
      const matchId = (custIdStr && itemCustId === custIdStr) || (rawIdStr && (itemCustId === rawIdStr || itemCustId === `CUST-${rawIdStr}`));
      const matchName = s.customerName && s.customerName.trim().toLowerCase() === custNameNorm;
      return matchId || matchName;
    }).sort((a, b) => (b.date || '') > (a.date || '') ? 1 : ((b.date || '') < (a.date || '') ? -1 : 0));
  }, [customerSales, custIdStr, rawIdStr, custNameNorm]);

  // Filtered milk deliveries by date range
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => isDateInLedgerRange(d.date));
  }, [deliveries, ledgerStartDate, ledgerEndDate]);

  // 4. Calculate Month-wise Dues & Bills
  const monthlySummary = useMemo(() => {
    const monthMap = {};

    // Group deliveries by month
    deliveries.forEach(d => {
      if (!d.date) return;
      const mKey = d.date.substring(0, 7);
      if (!monthMap[mKey]) {
        const dObj = new Date(mKey + '-01');
        const mLabel = dObj.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
        monthMap[mKey] = {
          monthKey: mKey,
          monthLabel: mLabel,
          daysSet: new Set(),
          morningLiters: 0,
          eveningLiters: 0,
          totalLiters: 0,
          billAmount: 0,
          paidAmount: 0
        };
      }
      const l = Number(d.quantity || d.liters || 0);
      const b = Number(d.amount || (l * (d.rate || 70)));
      monthMap[mKey].daysSet.add(d.date);
      monthMap[mKey].totalLiters += l;
      monthMap[mKey].billAmount += b;
      if (d.shift === 'evening' || d.shift === 'शाम') {
        monthMap[mKey].eveningLiters += l;
      } else {
        monthMap[mKey].morningLiters += l;
      }
    });

    // Group payments by month
    paymentDeposits.forEach(p => {
      if (!p.date) return;
      const mKey = p.date.substring(0, 7);
      if (!monthMap[mKey]) {
        const dObj = new Date(mKey + '-01');
        const mLabel = dObj.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
        monthMap[mKey] = {
          monthKey: mKey,
          monthLabel: mLabel,
          daysSet: new Set(),
          morningLiters: 0,
          eveningLiters: 0,
          totalLiters: 0,
          billAmount: 0,
          paidAmount: 0
        };
      }
      monthMap[mKey].paidAmount += Number(p.amount || 0);
    });

    return Object.values(monthMap).map(m => {
      const monthDue = Number((m.billAmount - m.paidAmount).toFixed(2));
      return {
        ...m,
        totalDays: m.daysSet.size,
        totalLiters: Number(m.totalLiters.toFixed(1)),
        morningLiters: Number(m.morningLiters.toFixed(1)),
        eveningLiters: Number(m.eveningLiters.toFixed(1)),
        billAmount: Math.round(m.billAmount),
        paidAmount: Math.round(m.paidAmount),
        monthDue: Math.round(monthDue)
      };
    }).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [deliveries, paymentDeposits]);

  // Grand totals
  const totalPaidSum = paymentDeposits.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalBillSum = deliveries.reduce((acc, d) => acc + Number(d.amount || ((d.quantity || 0) * (d.rate || 70))), 0);

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;

    recordCustomerPayment(customer.id, Number(paymentAmount), paymentMode, paymentNote);
    setPaymentAmount('');
    setPaymentNote('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  const generateWhatsAppMessage = () => {
    const farm = farmProfile?.farmName || 'SHIVAJI MILK CENTER';
    const upi = farmProfile?.upiId ? `\n💳 *UPI ID:* ${farmProfile.upiId}` : '';
    const phone = farmProfile?.phone ? `\n📞 *Phone:* ${farmProfile.phone}` : '';

    const text = `🥛 *${farm} (दूध बिल एवं हिसाब)*\n` +
      `👤 *ग्राहक:* ${customer.name}\n` +
      `📅 *तारीख:* ${new Date().toLocaleDateString('hi-IN')}\n` +
      `--------------------------------\n` +
      `🥛 *कुल दूध सप्लाई:* ${deliveries.reduce((a, b) => a + Number(b.quantity || 0), 0).toFixed(1)} L\n` +
      `💵 *कुल बिल राशि:* ₹${Math.round(totalBillSum).toLocaleString('en-IN')}\n` +
      `💳 *कुल जमा भुगतान:* ₹${Math.round(totalPaidSum).toLocaleString('en-IN')} (${paymentDeposits.length} रसीदें)\n` +
      `🔴 *वर्तमान कुल बकाया:* ₹${(customer.balance || 0).toLocaleString('en-IN')}\n` +
      (customer.advance > 0 ? `🟢 *अग्रिम जमा:* ₹${customer.advance}\n` : '') +
      `--------------------------------\n` +
      `कृपया बकाया राशि का भुगतान Cash या UPI द्वारा करें।${upi}${phone}\nधन्यवाद! 🙏`;

    const encoded = encodeURIComponent(text);
    const targetMobile = (customer.mobile || customer.phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/91${targetMobile}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-white print:overflow-visible">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-0 print:w-full print:max-w-none print:overflow-visible">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {customer.name} - लेजर व भुगतान विवरण
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-mono">
                {customer.mobile || customer.phone || 'No Mobile'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                दर: ₹{customer.rate || 70}/L
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{customer.address || 'Local Delivery Area'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer no-print print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance KPI & Quick Actions Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">वर्तमान कुल बकाया</span>
              <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                ₹{(customer.balance || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">कुल जमा भुगतान</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{Math.round(totalPaidSum).toLocaleString('en-IN')}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1.5">({paymentDeposits.length} बार जमा)</span>
              </p>
            </div>

            {customer.advance > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">अग्रिम जमा (Advance)</span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  ₹{Number(customer.advance).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 no-print print:hidden">
            <button
              onClick={generateWhatsAppMessage}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp पर हिसाब भेजें</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm cursor-pointer"
              title="Print Ledger"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Filter Bar (Hidden on Print) */}
        <div className="px-5 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3 flex-wrap text-xs no-print print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>अवधि फ़िल्टर (From - To Date):</span>
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">से:</span>
              <input
                type="date"
                value={ledgerStartDate}
                onChange={(e) => setLedgerStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">तक:</span>
              <input
                type="date"
                value={ledgerEndDate}
                onChange={(e) => setLedgerEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            {(ledgerStartDate || ledgerEndDate) && (
              <button
                onClick={() => {
                  setLedgerStartDate('');
                  setLedgerEndDate('');
                }}
                className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold cursor-pointer transition-all"
              >
                ✕ रीसेट
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            दिखाई गई प्रविष्टियां: <strong>{filteredTxns.length} / {txns.length}</strong>
          </div>
        </div>

        {/* 3 Main Navigation Tabs (Hidden on Print) */}
        <div className="px-5 pt-3 pb-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto flex-shrink-0 no-print print:hidden">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 1. जमा भुगतान तारीखें ({filteredPaymentDeposits.length} Receipts)</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>📅 2. माह-वार बिल व बकाया ({monthlySummary.length} Months)</span>
          </button>

          <button
            onClick={() => setActiveTab('all_txns')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'all_txns'
                ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📋 3. संपूर्ण पासबुक लेन-देन ({filteredTxns.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-900 print:p-0 print:bg-white print:overflow-visible">
          {/* Quick Payment Form (Hidden on Print) */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 no-print print:hidden">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Receive New Payment (ग्राहक से नया भुगतान प्राप्त करें)</span>
              </h4>
              {isSuccess && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" /> पेमेंट सफलतापूर्वक दर्ज हो गया!
                </span>
              )}
            </div>

            <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <input
                  type="number"
                  required
                  placeholder="राशि (₹) *"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="cash">Cash (नकद)</option>
                  <option value="upi">UPI / PhonePe / GPay</option>
                  <option value="bank">Bank Transfer (बैंक)</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="रसीद विवरण / नोट (वैकल्पिक)"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>जमा करें (Deposit)</span>
                </button>
              </div>
            </form>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: PAYMENT DEPOSITS TABLE (कब कब पेमेंट जमा किया है)  */}
          {/* ========================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>कब-कब भुगतान जमा हुआ (Payment Deposit History)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {customer.name} द्वारा अब तक कुल ₹{Math.round(totalPaidSum).toLocaleString('en-IN')} जमा किया गया है।
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                  कुल {paymentDeposits.length} रसीदें
                </span>
              </div>

              {paymentDeposits.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                  कोई जमा भुगतान रिकॉर्ड नहीं मिला।
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="px-3.5 py-3">क्र. (No.)</th>
                          <th className="px-3.5 py-3">तारीख (Payment Date)</th>
                          <th className="px-3.5 py-3">माध्यम (Mode)</th>
                          <th className="px-3.5 py-3 text-right">जमा राशि (Amount ₹)</th>
                          <th className="px-3.5 py-3">रसीद नोट / विवरण (Note)</th>
                          <th className="px-3.5 py-3 text-center">स्थिति (Status)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {paymentDeposits.map((p, idx) => (
                          <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <td className="px-3.5 py-3 font-mono text-slate-400 text-[11px]">
                              #{paymentDeposits.length - idx}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-slate-800 dark:text-slate-200">
                              {p.date}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {p.paymentMode || 'CASH'}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">
                              +₹{Number(p.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-3.5 py-3 text-slate-600 dark:text-slate-400 text-[11px]">
                              {p.note || 'CASH PAYMENT'}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                ✓ जमा प्राप्त
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: MONTH-WISE BILLS & DUES (माह-वार बिल व बकाया)     */}
          {/* ========================================================= */}
          {activeTab === 'monthly' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>माह-वार बिल व बकाया विवरण (Month-Wise Dues & Statement)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    प्रत्येक महीने का कुल दूध, कुल बिल, जमा की गई राशि और शेष बकाया।
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-black">
                  कुल {monthlySummary.length} महीने
                </span>
              </div>

              {monthlySummary.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                  कोई मासिक रिकॉर्ड उपलब्ध नहीं है।
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="px-3.5 py-3">महीना (Month)</th>
                          <th className="px-3.5 py-3 text-center">दिन (Days)</th>
                          <th className="px-3.5 py-3 text-right">दूध मात्रा (Liters)</th>
                          <th className="px-3.5 py-3 text-right text-slate-800 dark:text-slate-200">माह बिल (Bill ₹)</th>
                          <th className="px-3.5 py-3 text-right text-emerald-600 dark:text-emerald-400">जमा भुगतान (Paid ₹)</th>
                          <th className="px-3.5 py-3 text-right font-black">माह बकाया (Due ₹)</th>
                          <th className="px-3.5 py-3 text-center">हिसाब स्थिति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {monthlySummary.map(m => (
                          <tr key={m.monthKey} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <td className="px-3.5 py-3 font-bold text-slate-800 dark:text-slate-200">
                              {m.monthLabel} <span className="text-[10px] text-slate-400 font-mono">({m.monthKey})</span>
                            </td>
                            <td className="px-3.5 py-3 text-center text-slate-600 dark:text-slate-400">
                              {m.totalDays} दिन
                            </td>
                            <td className="px-3.5 py-3 text-right font-bold text-blue-700 dark:text-blue-400">
                              {m.totalLiters} L
                            </td>
                            <td className="px-3.5 py-3 text-right font-extrabold text-slate-900 dark:text-white">
                              ₹{m.billAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-3.5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{m.paidAmount.toLocaleString('en-IN')}
                            </td>
                            <td className={`px-3.5 py-3 text-right font-black ${
                              m.monthDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {m.monthDue > 0 ? `₹${m.monthDue.toLocaleString('en-IN')}` : '₹0 (चुकता)'}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              {m.monthDue <= 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  ✓ पूर्ण भुगतान
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                  🔴 बकाया
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FULL PASSBOOK STATEMENT (संपूर्ण पासबुक)           */}
          {/* ========================================================= */}
          {activeTab === 'all_txns' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>संपूर्ण खाता-बही पासबुक (Chronological Passbook)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    दूध सप्लाई और भुगतान रसीदों का संयुक्त विवरण।
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black">
                  कुल {txns.length} प्रविष्टियां
                </span>
              </div>

              {txns.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                  कोई लेन-देन रिकॉर्ड नहीं मिला।
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="px-3.5 py-3">तारीख (Date)</th>
                          <th className="px-3.5 py-3">प्रकार (Type)</th>
                          <th className="px-3.5 py-3">मात्रा व दर (Qty / Rate)</th>
                          <th className="px-3.5 py-3 text-right">राशि (Amount ₹)</th>
                          <th className="px-3.5 py-3 text-right">शेष बकाया (Balance ₹)</th>
                          <th className="px-3.5 py-3">विवरण / नोट</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {txns.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <td className="px-3.5 py-3 font-medium text-slate-800 dark:text-slate-200">
                              {tx.date}
                            </td>
                            <td className="px-3.5 py-3">
                              {tx.type === 'milk_supply' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1 w-fit">
                                  <ArrowDownLeft className="w-3 h-3" /> दूध सप्लाई
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 w-fit">
                                  <ArrowUpRight className="w-3 h-3" /> जमा भुगतान
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-slate-700 dark:text-slate-300">
                              {tx.liters > 0 ? `${tx.liters} L @ ₹${tx.rate || 70}` : '-'}
                            </td>
                            <td className={`px-3.5 py-3 text-right font-extrabold ${
                              tx.type === 'milk_supply' ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {tx.type === 'milk_supply' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                            </td>
                            <td className="px-3.5 py-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                              ₹{tx.balanceAfter !== undefined ? tx.balanceAfter : '-'}
                            </td>
                            <td className="px-3.5 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                              {tx.note || (tx.type === 'payment_received' ? 'CASH PAYMENT' : '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ग्राहक: <strong>{customer.name}</strong> | कुल जमा: <strong className="text-emerald-600 dark:text-emerald-400">₹{Math.round(totalPaidSum)}</strong> | बकाया: <strong className="text-rose-600 dark:text-rose-400">₹{customer.balance || 0}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
