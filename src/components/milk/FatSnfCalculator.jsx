import React, { useState } from 'react';
import { Calculator, Sparkles, HelpCircle, Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FatSnfCalculator = () => {
  const { t } = useLanguage();

  const [calcMode, setCalcMode] = useState('fat_only'); // 'fat_only' | 'fat_snf'
  const [cattleType, setCattleType] = useState('buffalo'); // 'cow' | 'buffalo'
  const [fat, setFat] = useState(6.5);
  const [snf, setSnf] = useState(9.0);
  const [fatRate, setFatRate] = useState(9.33); // ₹ per 1.0 FAT
  const [basePrice, setBasePrice] = useState(40.0); // Standard base price for 4.0 Fat / 8.5 SNF
  const [quantity, setQuantity] = useState(15);

  // Rate calculation supporting Only FAT and FAT+SNF
  const calculateRate = () => {
    if (calcMode === 'fat_only') {
      const rate = fat * fatRate;
      return Number(rate.toFixed(2));
    }

    // Dual FAT + SNF formula
    if (cattleType === 'cow') {
      const standardFat = 4.0;
      const standardSnf = 8.5;
      const fatDiff = (fat - standardFat) * 10;
      const snfDiff = (snf - standardSnf) * 10;
      const rate = basePrice + (fatDiff * 0.70) + (snfDiff * 0.45);
      return Math.max(25, Number(rate.toFixed(2)));
    } else {
      const standardFat = 6.5;
      const standardSnf = 9.0;
      const baseBufPrice = basePrice * 1.45;
      const fatDiff = (fat - standardFat) * 10;
      const snfDiff = (snf - standardSnf) * 10;
      const rate = baseBufPrice + (fatDiff * 0.95) + (snfDiff * 0.50);
      return Math.max(35, Number(rate.toFixed(2)));
    }
  };

  const calculatedRate = calculateRate();
  const totalAmount = Number((calculatedRate * quantity).toFixed(2));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              {t.milk.calculatorTitle}
            </h3>
            <p className="text-xs text-slate-500">
              Standard Indian Dairy FAT% and SNF% Price Calculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Rate Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCalcMode('fat_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                calcMode === 'fat_only' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🧈 Only FAT (केवल फैट)
            </button>
            <button
              onClick={() => setCalcMode('fat_snf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                calcMode === 'fat_snf' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="यदि SNF भी लेना हो तो यहाँ से चुनें"
            >
              🥛 FAT + SNF
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCattleType('cow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cattleType === 'cow' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🐄 Cow (गाय)
            </button>
            <button
              onClick={() => setCattleType('buffalo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cattleType === 'buffalo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🐃 Buffalo (भैंस)
            </button>
          </div>
        </div>
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Sliders & Inputs */}
        <div className="md:col-span-2 space-y-4">
          {/* FAT Slider */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Milk FAT % (फेट)</span>
              <span className="text-base font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                {fat}%
              </span>
            </div>
            <input
              type="range"
              min={cattleType === 'cow' ? 3.0 : 5.0}
              max={cattleType === 'cow' ? 6.5 : 10.5}
              step="0.1"
              value={fat}
              onChange={(e) => setFat(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>{cattleType === 'cow' ? '3.0%' : '5.0%'}</span>
              <span>Standard: {cattleType === 'cow' ? '4.0%' : '6.5%'}</span>
              <span>{cattleType === 'cow' ? '6.5%' : '10.5%'}</span>
            </div>
          </div>

          {/* Conditional: FAT Rate (in Only FAT Mode) vs SNF Slider (in FAT+SNF Mode) */}
          {calcMode === 'fat_only' ? (
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900">FAT भाव (Rate per 1.0 FAT ₹)</span>
                <span className="text-base font-extrabold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                  ₹{fatRate} / FAT
                </span>
              </div>
              <input
                type="range"
                min="7.0"
                max="12.0"
                step="0.05"
                value={fatRate}
                onChange={(e) => setFatRate(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-blue-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-blue-500 font-bold mt-1">
                <span>₹7.00</span>
                <span>Default: ₹9.33</span>
                <span>₹12.00</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Milk SNF % (एसएनएफ)</span>
                <span className="text-base font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {snf}%
                </span>
              </div>
              <input
                type="range"
                min="7.5"
                max="10.0"
                step="0.1"
                value={snf}
                onChange={(e) => setSnf(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>7.5%</span>
                <span>Standard: 8.5%</span>
                <span>10.0%</span>
              </div>
            </div>
          )}

          {/* Quantity & Base Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Milk Quantity / मात्रा (Liters)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Rate / बेस रेट (₹/Liter)
              </label>
              <input
                type="number"
                min="20"
                step="1"
                value={basePrice}
                onChange={(e) => setBasePrice(Math.max(10, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Calculated Result Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between h-full space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Calculated Milk Rate (गणना की गई दर)
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-dairy-400">
                ₹{calculatedRate}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ Liter</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {cattleType === 'cow' ? 'Cow Milk (गाय दूध)' : 'Buffalo Milk (भैंस दूध)'} ({fat}% FAT, {snf}% SNF)
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm space-y-1.5 border border-white/10">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Quantity (मात्रा):</span>
              <strong className="text-white">{quantity} Liters</strong>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Rate (दर):</span>
              <strong className="text-white">₹{calculatedRate}/L</strong>
            </div>
            <div className="flex justify-between text-sm font-bold text-dairy-300 pt-1.5 border-t border-white/10">
              <span>Total Payout (कुल राशि):</span>
              <span className="text-base text-dairy-300">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
