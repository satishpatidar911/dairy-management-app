import React, { useState } from 'react';
import {
  X,
  Milk,
  HeartPulse,
  Syringe,
  Calendar,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Activity,
  Camera,
  Upload
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const AnimalDetailModal = ({ animal, onClose, onSelectAnimal = null, onAddCalf = null }) => {
  const { t } = useLanguage();
  const { animals = [], milkEntries, healthRecords, vaccinations, breedingRecords, updateAnimal } = useApp();
  const [activeTab, setActiveTab] = useState('overview'); // overview, calves, milk, health, breeding

  const handlePhotoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        updateAnimal(animal.id, { photo: compressedDataUrl });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Find calves belonging to this animal (Offspring)
  const calves = animals.filter(a => {
    if (a.id === animal.id) return false;
    const aMotherTag = (a.motherTag || a.mother_tag || '').toLowerCase().trim();
    const aMotherId = (a.motherId || a.mother_id || '').toLowerCase().trim();
    const mTag = (animal.tagNo || '').toLowerCase().trim();
    const mName = (animal.name || '').toLowerCase().trim();
    const mId = (animal.id || '').toLowerCase().trim();

    if (!aMotherTag && !aMotherId) return false;
    return (
      (mTag && aMotherTag === mTag) ||
      (mId && aMotherId === mId) ||
      (mTag && aMotherTag.includes(mTag)) ||
      (mName && aMotherTag.includes(mName)) ||
      (mName && mName.length > 2 && aMotherTag === mName)
    );
  });

  // Find mother animal of this cattle if known
  const motherAnimal = animals.find(m => {
    if (m.id === animal.id) return false;
    const aMotherTag = (animal.motherTag || animal.mother_tag || '').toLowerCase().trim();
    const aMotherId = (animal.motherId || animal.mother_id || '').toLowerCase().trim();
    const mTag = (m.tagNo || '').toLowerCase().trim();
    const mName = (m.name || '').toLowerCase().trim();
    const mId = (m.id || '').toLowerCase().trim();

    if (!aMotherTag && !aMotherId) return false;
    return (
      (mTag && aMotherTag === mTag) ||
      (mId && aMotherId === mId) ||
      (mTag && aMotherTag.includes(mTag)) ||
      (mName && aMotherTag.includes(mName)) ||
      (mName && mName.length > 2 && aMotherTag === mName)
    );
  });

  // Filter logs for this animal
  const animalMilkLogs = milkEntries.filter(m => m.animalId === animal.tagNo || m.animalName === animal.name);
  const animalHealthLogs = healthRecords.filter(h => h.animalId === animal.tagNo || h.animalName?.includes(animal.name));
  const animalBreedingLogs = breedingRecords.filter(b => b.animalId === animal.tagNo || b.animalId === animal.tag_no || b.animalName === animal.name || b.animalName?.includes(animal.name));

  // Milk Chart data
  const chartData = animalMilkLogs.slice(0, 7).reverse().map((entry, idx) => ({
    name: entry.date,
    quantity: entry.quantity,
    fat: entry.fat
  }));

  const totalMilkGiven = animalMilkLogs.reduce((sum, m) => sum + Number(m.quantity || 0), 0);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'buffalo': return '🐃 Buffalo (भैंस)';
      case 'cow': return '🐄 Cow (गाय)';
      case 'keda': return '🐂 केड़ा (Keda)';
      case 'kedi': return '🐃 केडी (Kedi)';
      default: return type || 'पशु';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'milking': return '🥛 Milking (दुधारू)';
      case 'pregnant': return '🤰 Pregnant (गाभिन)';
      case 'dry': return '🌾 Dry (सूखी)';
      case 'sick': return '🩺 Sick (बीमार)';
      case 'keda': return '🐂 केड़ा (Keda - नर)';
      case 'kedi':
      case 'heifer': return '🐃 केडी (Kedi - मादा)';
      default: return status;
    }
  };

  const getAnimalPhoto = (a) => {
    if (a.photo && !a.photo.includes('photo-1570042225831-d98fa7577f1e') && !a.photo.includes('photo-1546445317')) {
      return a.photo;
    }
    if (a.type === 'keda' || a.type === 'kedi' || a.status === 'keda' || a.status === 'kedi') {
      return '/images/keda_kedi_calf.jpg';
    }
    if (a.type === 'cow') {
      return 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80';
    }
    return '/images/murrah_buffalo_1.jpg';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header Hero */}
        <div className="relative h-44 sm:h-48 bg-slate-900 overflow-hidden flex-shrink-0">
          <img
            src={getAnimalPhoto(animal)}
            alt={animal.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow active:scale-95">
              <Camera className="w-3.5 h-3.5 text-dairy-400" />
              <span>📸 फोटो खींचें / बदलें</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoFile(file);
                }}
              />
            </label>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-dairy-500 text-white text-xs font-bold font-mono">
                  {animal.tagNo}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                  {getTypeLabel(animal.type)} - {animal.breed}
                </span>
                {animal.origin === 'own' || animal.purchaseDate === 'Farm Born' || (animal.purchasePrice === 0 && !animal.purchaseDate) ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                    🏡 खुद की (Own Farm)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                    🛒 खरीदी हुई (Purchased)
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {animal.name}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-300 block">Daily Yield (दैनिक क्षमता)</span>
              <span className="text-lg font-black text-dairy-400">
                {animal.dailyCapacity} L/day
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto flex-shrink-0">
          {[
            { id: 'overview', label: 'Overview (सामान्य विवरण)', icon: Info },
            { id: 'calves', label: `🍼 Calves / बच्चे (${calves.length})`, icon: Sparkles },
            { id: 'milk', label: `Milk History / दूध इतिहास (${animalMilkLogs.length})`, icon: Milk },
            { id: 'health', label: `Health Logs / स्वास्थ्य (${animalHealthLogs.length})`, icon: HeartPulse },
            { id: 'breeding', label: 'Breeding & Calving (ब्रीडिंग व ब्यांत)', icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-dairy-600 text-dairy-800 bg-white rounded-t-lg shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Origin / स्रोत</span>
                  <p className="text-xs font-bold mt-1">
                    {animal.origin === 'own' || animal.purchaseDate === 'Farm Born' || (animal.purchasePrice === 0 && !animal.purchaseDate) ? (
                      <span className="text-emerald-700 font-bold">🏡 खुद के फार्म की पैदावार</span>
                    ) : (
                      <span className="text-amber-800 font-bold">🛒 बाहर से खरीदा हुआ</span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status (वर्तमान स्थिति)</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{getStatusLabel(animal.status)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">DOB / जन्म तारीख</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{animal.dob || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Purchase Date / खरीद दिनांक</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {animal.origin === 'own' || animal.purchaseDate === 'Farm Born' 
                      ? '🏡 खुद की पैदावार (Farm Born)' 
                      : (animal.purchaseDate || 'N/A')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Purchase Price / मूल्य</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {animal.purchasePrice && animal.purchasePrice > 0 
                      ? `₹${animal.purchasePrice?.toLocaleString('en-IN')}` 
                      : '₹0 (खुद की पैदावार)'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Weight / वजन</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{animal.weight} Kg</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Lactation No (ब्यांत संख्या)</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{animal.lactationNo || 1}st Lactation</p>
                </div>
                {animal.motherTag && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1">
                        <span>🤱</span>
                        <span>Mother / मां का विवरण</span>
                      </span>
                      <p className="text-xs font-bold text-purple-950 mt-1">
                        {animal.motherName ? `${animal.motherName} (${animal.motherTag})` : animal.motherTag}
                      </p>
                      {motherAnimal && (
                        <span className="text-[11px] text-purple-700 block mt-0.5">
                          {getTypeLabel(motherAnimal.type)} • {motherAnimal.breed}
                        </span>
                      )}
                    </div>
                    {motherAnimal && onSelectAnimal && (
                      <button
                        type="button"
                        onClick={() => onSelectAnimal(motherAnimal)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        मां का प्रोफाइल देखें →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {calves.length > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🍼</span>
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase">Offspring / बच्चे</span>
                      <p className="text-xs font-bold text-purple-950">
                        इस पशु के <strong>{calves.length} बच्चे</strong> फार्म पर पंजीकृत हैं
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('calves')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    बच्चे देखें (View) →
                  </button>
                </div>
              )}

              {/* Quick Add Calf CTA for female animals */}
              {(animal.gender !== 'male' && animal.type !== 'keda' && animal.status !== 'keda') && onAddCalf && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">
                    क्या इस {animal.type === 'cow' ? 'गाय' : 'भैंस'} का नया बछड़ा/पाड़ा दर्ज करना है?
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddCalf(animal)}
                    className="px-3 py-1.5 rounded-lg bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                  >
                    <span>+ बच्चा जोड़ें (+ Add Calf)</span>
                  </button>
                </div>
              )}

              {animal.notes && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <strong className="block mb-0.5 font-bold">Special Notes (विशेष टिप्पणी व निर्देश):</strong>
                  <span>{animal.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB: CALVES / OFFSPRING */}
          {activeTab === 'calves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-purple-50 p-3.5 rounded-xl border border-purple-200">
                <div>
                  <h4 className="text-xs font-bold text-purple-950">
                    {animal.name} ({animal.tagNo}) के पंजीकृत बच्चे
                  </h4>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    कुल बच्चे: <strong>{calves.length}</strong>
                  </p>
                </div>
                {onAddCalf && (
                  <button
                    type="button"
                    onClick={() => onAddCalf(animal)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm flex items-center gap-1 transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ नया बच्चा जोड़ें (+ Add Calf)</span>
                  </button>
                )}
              </div>

              {calves.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <span className="text-3xl">🍼</span>
                  <p className="text-xs font-bold text-slate-700">अभी इस पशु से कोई बच्चा लिंक नहीं है</p>
                  <p className="text-[11px] text-slate-400">
                    (No calves linked to this cattle yet)
                  </p>
                  {onAddCalf && (
                    <button
                      type="button"
                      onClick={() => onAddCalf(animal)}
                      className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ इस पशु का बच्चा जोड़ें</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {calves.map(calf => (
                    <div
                      key={calf.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all bg-white flex flex-col justify-between space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {calf.gender === 'male' ? '🐂' : '🐃'}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">
                                {calf.name || 'Calf'}
                              </span>
                              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">
                                {calf.tagNo}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {getTypeLabel(calf.type)} • {calf.breed}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          {calf.gender === 'male' ? 'नर (Male)' : 'मादा (Female)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg text-slate-600">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">जन्म (DOB)</span>
                          <strong className="text-slate-800">{calf.dob || 'Farm Born'}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">स्थिति (Status)</span>
                          <strong className="text-slate-800">{getStatusLabel(calf.status)}</strong>
                        </div>
                      </div>

                      {onSelectAnimal && (
                        <button
                          type="button"
                          onClick={() => onSelectAnimal(calf)}
                          className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-bold transition-colors text-center"
                        >
                          बच्चे का प्रोफाइल देखें (View Profile) →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MILK HISTORY */}
          {activeTab === 'milk' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-dairy-50 p-3 rounded-xl border border-dairy-200">
                <div>
                  <span className="text-[10px] font-bold text-dairy-800">Total Milk (कुल दर्ज दूध)</span>
                  <p className="text-lg font-black text-dairy-900">{totalMilkGiven.toFixed(1)} L</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-dairy-800">Average Yield (औसत प्रति एंट्री)</span>
                  <p className="text-lg font-black text-dairy-900">
                    {animalMilkLogs.length > 0 ? (totalMilkGiven / animalMilkLogs.length).toFixed(1) : 0} L
                  </p>
                </div>
              </div>

              {chartData.length > 1 && (
                <div className="h-44 w-full bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                      <YAxis fontSize={10} stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="quantity" name="Liters" stroke="#16a34a" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Recent Milk Entries (हाल की दूध प्रविष्टियां)</h4>
                {animalMilkLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No milk records available (कोई दूध रिकॉर्ड उपलब्ध नहीं है).</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {animalMilkLogs.map((log, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-800">{log.date}</span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            ({log.shift === 'morning' ? '🌅 Morning (सुबह)' : '🌇 Evening (शाम)'})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-dairy-700">{log.quantity} L</span>
                          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">FAT: {log.fat}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH LOGS */}
          {activeTab === 'health' && (
            <div className="space-y-3">
              {animalHealthLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <HeartPulse className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <p>Cattle is completely healthy. No illness or treatment history (पशु पूरी तरह स्वस्थ है).</p>
                </div>
              ) : (
                animalHealthLogs.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700">{rec.disease}</span>
                      <span className="text-slate-400 text-[10px]">{rec.date}</span>
                    </div>
                    <p className="text-slate-600"><strong>Medicine (दवाई):</strong> {rec.medicine}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span>Doctor (डॉक्टर): {rec.doctor}</span>
                      <span className="font-bold text-slate-800">Cost (खर्च): ₹{rec.cost}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: BREEDING & CALVING */}
          {activeTab === 'breeding' && (
            <div className="space-y-3">
              {animalBreedingLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Calendar className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                  <p>No active AI or breeding record found (कोई सक्रिय AI या गर्भाधान रिकॉर्ड नहीं है).</p>
                </div>
              ) : (
                animalBreedingLogs.map((brd, idx) => (
                  <div key={idx} className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">
                        {brd.isPregnant ? '🤰 Confirmed Pregnant (गर्भावस्था पुष्ट)' : 'AI / Insemination (गर्भाधान)'}
                      </span>
                      <span className="text-purple-700 text-[11px] font-semibold">{brd.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div><strong>AI Date (AI तारीख):</strong> {brd.aiDate}</div>
                      <div><strong>Semen Straw Tag (सीमन स्ट्रॉ):</strong> {brd.bullStrawTag || brd.bullId || 'N/A'}</div>
                      <div className="col-span-2">
                        <strong>Expected Calving (संभावित प्रसव तारीख):</strong>{' '}
                        <span className="font-bold text-purple-800">{brd.expectedCalvingDate}</span>
                      </div>
                    </div>
                    {brd.notes && <p className="text-[11px] text-purple-800 italic">{brd.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition-colors"
          >
            Close (बंद करें)
          </button>
        </div>
      </div>
    </div>
  );
};
