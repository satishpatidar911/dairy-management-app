import React, { useState } from 'react';
import {
  HeartPulse,
  Plus,
  Search,
  Filter,
  Milk,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Sparkles,
  LayoutGrid,
  List,
  Camera,
  Tag
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { AnimalDetailModal } from './AnimalDetailModal';
import { AnimalFormModal } from './AnimalFormModal';

export const AnimalList = ({ onNavigateSale }) => {
  const { t } = useLanguage();
  const { animals = [], deleteAnimal, updateAnimal, stats } = useApp();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, cow, buffalo
  const [originFilter, setOriginFilter] = useState('all'); // all, own, purchased
  const [statusFilter, setStatusFilter] = useState('all'); // all, milking, dry, pregnant, sick
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [preselectedMother, setPreselectedMother] = useState(null);

  const getCalvesCount = (a) => {
    const mTag = (a.tagNo || '').toLowerCase().trim();
    const mName = (a.name || '').toLowerCase().trim();
    const mId = (a.id || '').toLowerCase().trim();

    return animals.filter(c => {
      if (c.id === a.id) return false;
      const cMotherTag = (c.motherTag || c.mother_tag || '').toLowerCase().trim();
      const cMotherId = (c.motherId || c.mother_id || '').toLowerCase().trim();
      if (!cMotherTag && !cMotherId) return false;
      return (
        (mTag && cMotherTag === mTag) ||
        (mId && cMotherId === mId) ||
        (mTag && cMotherTag.includes(mTag)) ||
        (mName && cMotherTag.includes(mName)) ||
        (mName && mName.length > 2 && cMotherTag === mName)
      );
    }).length;
  };

  const handlePhotoUpload = (animalId, file) => {
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
        updateAnimal(animalId, { photo: compressedDataUrl });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const isAnimalOwn = (a) => a.origin === 'own' || a.purchaseDate === 'Farm Born' || (a.purchasePrice === 0 && !a.purchaseDate);
  const ownCattleCount = animals.filter(isAnimalOwn).length;
  const purchasedCattleCount = animals.length - ownCattleCount;
  const totalBuffaloCount = animals.filter(a => a.type === 'buffalo').length;
  const totalCowCount = animals.filter(a => a.type === 'cow').length;
  const totalKedaCount = animals.filter(a => a.type === 'keda' || a.status === 'keda').length;
  const totalKediCount = animals.filter(a => a.type === 'kedi' || a.status === 'kedi' || a.status === 'heifer').length;

  const getTypeLabel = (type) => {
    switch (type) {
      case 'buffalo': return '🐃 Buffalo (भैंस)';
      case 'cow': return '🐄 Cow (गाय)';
      case 'keda': return '🐂 केड़ा (Keda)';
      case 'kedi': return '🐃 केडी (Kedi)';
      default: return type || 'पशु';
    }
  };

  const getAnimalPhoto = (animal) => {
    if (animal.photo && !animal.photo.includes('photo-1570042225831-d98fa7577f1e') && !animal.photo.includes('photo-1546445317')) {
      return animal.photo;
    }
    if (animal.type === 'keda' || animal.type === 'kedi' || animal.status === 'keda' || animal.status === 'kedi') {
      return '/images/keda_kedi_calf.jpg';
    }
    if (animal.type === 'cow') {
      return 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80';
    }
    return '/images/murrah_buffalo_1.jpg';
  };

  // Filtering logic
  const filteredAnimals = animals.filter(animal => {
    const matchesSearch =
      (animal.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (animal.tagNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (animal.breed || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (animal.motherTag && (animal.motherTag || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      (animal.motherName && (animal.motherName || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || 
      animal.type === typeFilter || 
      (typeFilter === 'keda' && (animal.type === 'keda' || animal.status === 'keda')) ||
      (typeFilter === 'kedi' && (animal.type === 'kedi' || animal.status === 'kedi' || animal.status === 'heifer'));

    const matchesOrigin = originFilter === 'all' ||
      (originFilter === 'own' && isAnimalOwn(animal)) ||
      (originFilter === 'purchased' && !isAnimalOwn(animal));

    const matchesStatus = statusFilter === 'all' || 
      animal.status === statusFilter ||
      (statusFilter === 'kedi' && (animal.status === 'kedi' || animal.status === 'heifer' || animal.type === 'kedi')) ||
      (statusFilter === 'keda' && (animal.status === 'keda' || animal.type === 'keda'));

    return matchesSearch && matchesType && matchesOrigin && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'milking':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">🥛 Milking (दुधारू)</span>;
      case 'pregnant':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">🤰 Pregnant (गाभिन)</span>;
      case 'dry':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">🌾 Dry (सूखी)</span>;
      case 'sick':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">🩺 Sick (बीमार)</span>;
      case 'keda':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">🐂 केड़ा (Keda)</span>;
      case 'kedi':
      case 'heifer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">🐃 केडी (Kedi)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.animals.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {animals.length} Cattle (कुल पशु)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-bold">
              🐃 {totalBuffaloCount} भैंस
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold">
              🐄 {totalCowCount} गाय
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold">
              🐂 {totalKedaCount} केड़ा
            </span>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold">
              🐃 {totalKediCount} केडी
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            भैंस, गाय, केड़ा व केडी का संपूर्ण ब्यौरा, नस्ल, ब्यांत व स्वास्थ्य रिकॉर्ड
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role !== ROLES.WORKER && (
            <>
              {onNavigateSale && (
                <button
                  onClick={onNavigateSale}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>CATTLE SALES (पशु बिक्री)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setEditingAnimal(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t.animals.addAnimal}</span>
              </button>
            </>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Tag ID, Name, Breed (e.g. BUF-201, KED-301, Gouri)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-dairy-500"
            />
          </div>

          {/* Type & Origin Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {/* Type */}
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All / सभी ({animals.length})
            </button>
            <button
              onClick={() => setTypeFilter('buffalo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'buffalo' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              🐃 Buffalo / भैंस ({totalBuffaloCount})
            </button>
            <button
              onClick={() => setTypeFilter('cow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'cow' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              🐄 Cow / गाय ({totalCowCount})
            </button>
            <button
              onClick={() => setTypeFilter('keda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'keda' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              🐂 केड़ा ({totalKedaCount})
            </button>
            <button
              onClick={() => setTypeFilter('kedi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'kedi' ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              🐃 केडी ({totalKediCount})
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

            {/* Origin */}
            <button
              onClick={() => setOriginFilter(originFilter === 'own' ? 'all' : 'own')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                originFilter === 'own' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              🏡 खुद की ({ownCattleCount})
            </button>
            <button
              onClick={() => setOriginFilter(originFilter === 'purchased' ? 'all' : 'purchased')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                originFilter === 'purchased' ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              🛒 खरीदी हुई ({purchasedCattleCount})
            </button>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status (स्थिति):
          </span>
          {[
            { id: 'all', label: 'All (सभी स्थिति)' },
            { id: 'milking', label: 'Milking (दुधारू)' },
            { id: 'pregnant', label: 'Pregnant (गाभिन)' },
            { id: 'dry', label: 'Dry (सूखी)' },
            { id: 'sick', label: 'Sick (बीमार)' },
            { id: 'kedi', label: '🐃 केडी (Kedi)' },
            { id: 'keda', label: '🐂 केड़ा (Keda)' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st.id
                  ? 'bg-dairy-600 text-white font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* View 1: Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAnimals.map(animal => {
            const isOwn = isAnimalOwn(animal);
            const calvesCount = getCalvesCount(animal);
            return (
              <div
                key={animal.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* Photo & Top Badges */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  <img
                    src={getAnimalPhoto(animal)}
                    alt={animal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start max-w-[75%]">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold font-mono">
                      {animal.tagNo}
                    </span>
                    {isOwn ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
                        🏡 खुद की (Own)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold shadow-sm">
                        🛒 खरीदी (Purchased)
                      </span>
                    )}
                    {animal.motherTag && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-700/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm truncate max-w-full">
                        🤱 मां: {animal.motherName || animal.motherTag}
                      </span>
                    )}
                    {calvesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-700/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
                        🍼 बच्चे: {calvesCount}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    {getStatusBadge(animal.status)}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-semibold">
                      {getTypeLabel(animal.type)}
                    </span>
                  </div>
                  <label
                    className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/60 hover:bg-black/85 text-white backdrop-blur-md cursor-pointer transition-all shadow active:scale-95 flex items-center gap-1 border border-white/20"
                    title="📸 पशु की नई फोटो खींचें / अपलोड करें"
                  >
                    <Camera className="w-3.5 h-3.5 text-dairy-400" />
                    <span className="text-[10px] font-bold">फोटो खींचें</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(animal.id, file);
                      }}
                    />
                  </label>
                </div>

                {/* Info Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-1">
                      <h3 className="font-bold text-slate-800 text-sm truncate">
                        {animal.name}
                      </h3>
                      <span className="text-xs font-semibold text-dairy-700 bg-dairy-50 px-2 py-0.5 rounded border border-dairy-100 flex-shrink-0">
                        {animal.breed}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Milk Yield (दूध क्षमता)</span>
                        <strong className="text-slate-800 font-bold">{animal.dailyCapacity} L/day</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Lactation (ब्यांत)</span>
                        <strong className="text-slate-800 font-bold">{animal.lactationNo || 1}</strong>
                      </div>
                      {isOwn ? (
                        <>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Origin (स्रोत)</span>
                            <span className="text-emerald-700 font-bold text-[11px]">🏡 घर की पैदावार</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">DOB (जन्म दिनांक)</span>
                            <span className="text-slate-800 font-semibold">{animal.dob || 'Farm Born'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Purchase Date (खरीद)</span>
                            <span className="text-slate-800 font-semibold">{animal.purchaseDate || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Price (खरीद मूल्य)</span>
                            <span className="text-slate-800 font-bold">₹{animal.purchasePrice?.toLocaleString('en-IN') || 0}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => setSelectedAnimal(animal)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-dairy-50 hover:bg-dairy-100 text-dairy-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>

                    {(animal.gender !== 'male' && animal.type !== 'keda' && animal.status !== 'keda') && (
                      <button
                        onClick={() => {
                          setEditingAnimal(null);
                          setPreselectedMother(animal);
                          setIsFormOpen(true);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 text-xs font-bold flex items-center gap-1 transition-colors border border-purple-200"
                        title="इस पशु का बच्चा जोड़ें"
                      >
                        <Plus className="w-3 h-3" />
                        <span>बच्चा</span>
                      </button>
                    )}

                    {currentUser.role === ROLES.ADMIN && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingAnimal(animal);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Do you want to delete ${animal.name} (${animal.tagNo})?`)) {
                              deleteAnimal(animal.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View 2: Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Tag & Name (टैग व नाम)</th>
                  <th className="px-4 py-3">Origin / स्रोत</th>
                  <th className="px-4 py-3">Date (खरीद/जन्म दिनांक)</th>
                  <th className="px-4 py-3">Type & Breed (प्रकार व नस्ल)</th>
                  <th className="px-4 py-3">Status (स्थिति)</th>
                  <th className="px-4 py-3">Capacity (दूध क्षमता)</th>
                  <th className="px-4 py-3">Lactation (ब्यांत)</th>
                  <th className="px-4 py-3 text-right">Actions (कार्य)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAnimals.map(animal => {
                  const isOwn = isAnimalOwn(animal);
                  return (
                    <tr key={animal.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px]">
                            {animal.tagNo}
                          </span>
                          <span>{animal.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isOwn ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🏡 खुद की
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            🛒 खरीदी (₹{animal.purchasePrice || 0})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {isOwn ? (animal.dob || 'Farm Born') : (animal.purchaseDate || 'N/A')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {getTypeLabel(animal.type)} - {animal.breed}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(animal.status)}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {animal.dailyCapacity} L/day
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {animal.lactationNo || 1}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(animal.gender !== 'male' && animal.type !== 'keda' && animal.status !== 'keda') && (
                            <button
                              onClick={() => {
                                setEditingAnimal(null);
                                setPreselectedMother(animal);
                                setIsFormOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs flex items-center gap-1 border border-purple-200"
                              title="इस पशु का बच्चा जोड़ें"
                            >
                              <Plus className="w-3 h-3" />
                              <span>बच्चा</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedAnimal(animal)}
                            className="px-2.5 py-1 rounded bg-dairy-50 text-dairy-700 hover:bg-dairy-100 font-semibold text-xs"
                          >
                            Details (विवरण)
                          </button>
                          {currentUser.role === ROLES.ADMIN && (
                            <button
                              onClick={() => {
                                if (confirm(`Do you want to delete ${animal.name}?`)) {
                                  deleteAnimal(animal.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedAnimal && (
        <AnimalDetailModal
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
          onSelectAnimal={(a) => setSelectedAnimal(a)}
          onAddCalf={(mother) => {
            setEditingAnimal(null);
            setPreselectedMother(mother);
            setIsFormOpen(true);
          }}
        />
      )}

      {isFormOpen && (
        <AnimalFormModal
          animal={editingAnimal}
          preselectedMother={preselectedMother}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAnimal(null);
            setPreselectedMother(null);
          }}
        />
      )}
    </div>
  );
};
