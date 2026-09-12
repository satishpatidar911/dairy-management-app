import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, ShoppingBag, Home, Calendar, Tag, Info, Camera, Upload } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const AnimalFormModal = ({ isOpen, onClose, animal = null, preselectedMother = null, initialType = null }) => {
  const { t } = useLanguage();
  const { addAnimal, updateAnimal, animals = [] } = useApp();

  const isEdit = !!animal;

  const cowBreeds = [
    'Gir (गीर)',
    'Sahiwal (साहीवाल)',
    'Red Sindhi (रेड सिंधी)',
    'Tharparkar (थारपारकर)',
    'Rathi (राठी)',
    'Kankrej (कांकरेज)',
    'HF Cross (होलस्टीन क्रॉस)',
    'Jersey Cross (जर्सी क्रॉस)',
    'Desi / Mixed (देसी / मिश्रित)'
  ];

  const buffaloBreeds = [
    'Murrah (मुर्राह)',
    'Nili Ravi (नीली रावी)',
    'Jaffarabadi (जाफराबादी)',
    'Surti (सुरती)',
    'Mehsana (मेहसाणा)',
    'Bhadawari (भदावरी)',
    'Desi Buffalo (देसी भैंस)'
  ];

  const kedaBreeds = [
    'Murrah Keda (मुर्राह केड़ा/पाड़ा)',
    'Desi Keda (देसी केड़ा)',
    'Cow Keda / बछड़ा (गाय का बछड़ा)',
    'Nili Ravi Keda (नीली रावी केड़ा)',
    'Gir Keda (गीर बछड़ा)',
    'Sahiwal Keda (साहीवाल बछड़ा)'
  ];

  const kediBreeds = [
    'Murrah Kedi (मुर्राह केडी/पाडी)',
    'Desi Kedi (देसी केडी)',
    'Cow Kedi / बछिया (गाय की बछिया)',
    'Nili Ravi Kedi (नीली रावी केडी)',
    'Gir Kedi (गीर बछिया)',
    'Sahiwal Kedi (साहीवाल बछिया)'
  ];

  const getBreedList = (type, motherBreed = null) => {
    let list = [];
    if (type === 'cow') list = [...cowBreeds];
    else if (type === 'keda') list = [...kedaBreeds, ...cowBreeds, ...buffaloBreeds];
    else if (type === 'kedi') list = [...kediBreeds, ...cowBreeds, ...buffaloBreeds];
    else list = [...buffaloBreeds];

    if (motherBreed && !list.includes(motherBreed)) {
      list = [motherBreed, ...list];
    }
    return Array.from(new Set(list));
  };

  const getAnimalLabel = (type) => {
    switch (type) {
      case 'buffalo': return 'भैंस (Buffalo)';
      case 'cow': return 'गाय (Cow)';
      case 'keda': return 'केड़ा / पाड़ा / बछड़ा (Male Calf)';
      case 'kedi': return 'केडी / पाडी / बछिया (Female Calf)';
      default: return 'पशु (Animal)';
    }
  };

  const getAnimalEmoji = (type) => {
    switch (type) {
      case 'buffalo': return '🐃';
      case 'cow': return '🐄';
      case 'keda': return '🐂';
      case 'kedi': return '🐃';
      default: return '🐄';
    }
  };

  // Potential mothers are female cattle or cows/buffaloes
  const potentialMothers = animals.filter(a => {
    if (animal && a.id === animal.id) return false;
    return a.gender !== 'male' && a.type !== 'keda' && a.status !== 'keda';
  });

  const initialOrigin = animal?.origin || 
    (animal?.purchaseDate === 'Farm Born' || (animal?.purchasePrice === 0 && !animal?.purchaseDate) ? 'own' : 'purchased');

  const getInitialPhoto = (type, currentPhoto) => {
    if (currentPhoto && !currentPhoto.includes('photo-1570042225831-d98fa7577f1e') && !currentPhoto.includes('photo-1546445317')) {
      return currentPhoto;
    }
    if (type === 'keda' || type === 'kedi') {
      return '/images/keda_kedi_calf.jpg';
    }
    return type === 'cow' 
      ? 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80'
      : '/images/murrah_buffalo_1.jpg';
  };

  const [formData, setFormData] = useState({
    tagNo: animal?.tagNo || `BUF-${200 + (animals?.length || 0) + 1}`,
    name: animal?.name || '',
    type: animal?.type || 'buffalo',
    breed: animal?.breed || 'Murrah (मुर्राह)',
    gender: animal?.gender || 'female',
    origin: initialOrigin, // 'purchased' | 'own'
    dob: animal?.dob || '2022-01-01',
    purchaseDate: animal?.purchaseDate && animal.purchaseDate !== 'Farm Born' 
      ? animal.purchaseDate 
      : new Date().toISOString().split('T')[0],
    purchasePrice: animal?.purchasePrice !== undefined ? animal.purchasePrice : 85000,
    motherTag: animal?.motherTag || (preselectedMother ? preselectedMother.tagNo : ''),
    motherName: animal?.motherName || (preselectedMother ? preselectedMother.name : ''),
    motherId: animal?.motherId || (preselectedMother ? preselectedMother.id : ''),
    weight: animal?.weight || 450,
    dailyCapacity: animal?.dailyCapacity !== undefined ? animal.dailyCapacity : 14.0,
    status: animal?.status || 'milking',
    lactationNo: animal?.lactationNo !== undefined ? animal.lactationNo : 1,
    photo: getInitialPhoto(animal?.type || 'buffalo', animal?.photo),
    notes: animal?.notes || ''
  });

  // Re-sync form state when animal or preselectedMother prop changes
  useEffect(() => {
    if (animal) {
      const originVal = animal.origin || 
        (animal.purchaseDate === 'Farm Born' || (animal.purchasePrice === 0 && !animal.purchaseDate) ? 'own' : 'purchased');
      
      setFormData({
        tagNo: animal.tagNo || '',
        name: animal.name || '',
        type: animal.type || 'buffalo',
        breed: animal.breed || getBreedList(animal.type || 'buffalo')[0],
        gender: animal.gender || (animal.type === 'keda' ? 'male' : 'female'),
        origin: originVal,
        dob: animal.dob || '2022-01-01',
        purchaseDate: animal.purchaseDate && animal.purchaseDate !== 'Farm Born' 
          ? animal.purchaseDate 
          : new Date().toISOString().split('T')[0],
        purchasePrice: animal.purchasePrice !== undefined ? animal.purchasePrice : (originVal === 'own' ? 0 : 85000),
        motherTag: animal.motherTag || '',
        motherName: animal.motherName || '',
        motherId: animal.motherId || '',
        weight: animal.weight || 450,
        dailyCapacity: animal.dailyCapacity !== undefined ? animal.dailyCapacity : 14.0,
        status: animal.status || 'milking',
        lactationNo: animal.lactationNo !== undefined ? animal.lactationNo : 1,
        photo: getInitialPhoto(animal.type || 'buffalo', animal.photo),
        notes: animal.notes || ''
      });
    } else if (preselectedMother) {
      const isCow = preselectedMother.type === 'cow';
      const defaultCalfType = initialType || 'kedi';
      const defaultGender = defaultCalfType === 'keda' ? 'male' : 'female';
      const defaultTag = defaultCalfType === 'keda' 
        ? `KED-${300 + (animals?.length || 0) + 1}`
        : `KDI-${400 + (animals?.length || 0) + 1}`;

      setFormData({
        tagNo: defaultTag,
        name: '',
        type: defaultCalfType,
        breed: preselectedMother.breed || (isCow ? 'Gir (गीर)' : 'Murrah (मुर्राह)'),
        gender: defaultGender,
        origin: 'own',
        dob: new Date().toISOString().split('T')[0],
        purchaseDate: 'Farm Born',
        purchasePrice: 0,
        motherTag: preselectedMother.tagNo,
        motherName: preselectedMother.name,
        motherId: preselectedMother.id,
        weight: 60,
        dailyCapacity: 0,
        status: defaultCalfType,
        lactationNo: 0,
        photo: '/images/keda_kedi_calf.jpg',
        notes: `Mother: ${preselectedMother.name} (${preselectedMother.tagNo})`
      });
    } else {
      setFormData({
        tagNo: `BUF-${200 + (animals?.length || 0) + 1}`,
        name: '',
        type: 'buffalo',
        breed: 'Murrah (मुर्राह)',
        gender: 'female',
        origin: 'purchased',
        dob: '2022-01-01',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 85000,
        motherTag: '',
        motherName: '',
        motherId: '',
        weight: 450,
        dailyCapacity: 14.0,
        status: 'milking',
        lactationNo: 1,
        photo: '/images/murrah_buffalo_1.jpg',
        notes: ''
      });
    }
  }, [animal, preselectedMother, initialType, animals?.length, isOpen]);

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
        setFormData(prev => ({ ...prev, photo: compressedDataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tagNo || !formData.name) return;

    const finalPurchaseDate = formData.origin === 'own' 
      ? 'Farm Born' 
      : (formData.purchaseDate || new Date().toISOString().split('T')[0]);

    const finalPurchasePrice = formData.origin === 'own' && (!formData.purchasePrice || formData.purchasePrice === '') 
      ? 0 
      : Number(formData.purchasePrice || 0);

    const payload = {
      ...formData,
      origin: formData.origin,
      purchaseDate: finalPurchaseDate,
      purchasePrice: finalPurchasePrice,
      weight: Number(formData.weight || 0),
      dailyCapacity: Number(formData.dailyCapacity || 0),
      lactationNo: Number(formData.lactationNo || 1),
      photo: formData.photo || getInitialPhoto(formData.type, '')
    };

    if (isEdit) {
      updateAnimal(animal.id, payload);
    } else {
      addAnimal(payload);
    }

    onClose();
  };

  const animalLabel = getAnimalLabel(formData.type);
  const animalEmoji = getAnimalEmoji(formData.type);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{animalEmoji}</span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isEdit ? 'Edit Animal Details (पशु विवरण संपादित करें)' : `+ Add Animal (+ नया पशु / ${animalLabel} जोड़ें)`}
              </h3>
              <p className="text-[11px] text-slate-400">
                टैग नं, खरीदी की दिनांक, खुद की {animalLabel} व विवरण
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Row 1: Tag & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tag ID / टैग नं. *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BUF-205, KED-301, KDI-401"
                value={formData.tagNo}
                onChange={(e) => setFormData({ ...formData, tagNo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Animal Name / नाम *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gouri, Kaali, Chhote, Golu (गौरी, काली, गोलू)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500 font-bold"
              />
            </div>
          </div>

          {/* Row 2: Type & Breed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type / पशु का प्रकार *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const breedList = getBreedList(newType);
                  const newBreed = breedList[0];
                  let newPhoto = getInitialPhoto(newType, '');
                  let newGender = 'female';
                  let newStatus = 'milking';
                  let newCapacity = formData.dailyCapacity;
                  let newTag = formData.tagNo;
                  let newOrigin = formData.origin;
                  let newPrice = formData.purchasePrice;

                  if (newType === 'cow') {
                    if (!isEdit) newTag = `COW-${100 + (animals?.length || 0) + 1}`;
                    newCapacity = newCapacity > 0 ? newCapacity : 12;
                  } else if (newType === 'keda') {
                    newGender = 'male';
                    newStatus = 'keda';
                    newCapacity = 0;
                    newOrigin = 'own';
                    newPrice = 0;
                    if (!isEdit) newTag = `KED-${300 + (animals?.length || 0) + 1}`;
                  } else if (newType === 'kedi') {
                    newGender = 'female';
                    newStatus = 'kedi';
                    newCapacity = 0;
                    newOrigin = 'own';
                    newPrice = 0;
                    if (!isEdit) newTag = `KDI-${400 + (animals?.length || 0) + 1}`;
                  } else {
                    if (!isEdit) newTag = `BUF-${200 + (animals?.length || 0) + 1}`;
                    newCapacity = newCapacity > 0 ? newCapacity : 14;
                  }

                  setFormData({
                    ...formData,
                    type: newType,
                    breed: newBreed,
                    photo: newPhoto,
                    gender: newGender,
                    status: newStatus,
                    dailyCapacity: newCapacity,
                    origin: newOrigin,
                    purchasePrice: newPrice,
                    tagNo: newTag
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-white font-semibold"
              >
                <option value="buffalo">🐃 Buffalo (भैंस)</option>
                <option value="cow">🐄 Cow (गाय)</option>
                <option value="keda">🐂 केड़ा / नर पाड़ा / बछड़ा (Male Calf)</option>
                <option value="kedi">🐃 केडी / मादा पाडी / बछिया (Female Calf)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Breed / नस्ल *
              </label>
              <select
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-white font-medium"
              >
                {getBreedList(formData.type, formData.breed).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 🤱 KEY SECTION: MOTHER LINKAGE (मां से लिंक करें) */}
          <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <span className="text-base">🤱</span>
                <span>मां का चयन व लिंक (Mother Linkage)</span>
              </label>
              {formData.motherTag ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 flex items-center gap-1">
                  ✓ मां लिंक है
                </span>
              ) : (
                <span className="text-[10px] font-medium text-purple-700">
                  {formData.type === 'keda' || formData.type === 'kedi' ? '⭐ बच्चे के लिए मां का चयन करें' : 'ऐच्छिक (Optional)'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                  फार्म की गाय / भैंस चुनें (Select Mother):
                </label>
                <select
                  value={
                    potentialMothers.find(m => 
                      m.tagNo === formData.motherTag || 
                      (formData.motherId && m.id === formData.motherId) ||
                      (formData.motherTag && m.name.toLowerCase() === formData.motherTag.toLowerCase())
                    )?.tagNo || (formData.motherTag ? '__custom__' : '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setFormData(prev => ({ ...prev, motherTag: '', motherName: '', motherId: '' }));
                      return;
                    }
                    if (val === '__custom__') {
                      return;
                    }
                    const m = potentialMothers.find(x => x.tagNo === val);
                    if (m) {
                      const isMotherCow = m.type === 'cow';
                      const isCalf = formData.type === 'keda' || formData.type === 'kedi';
                      let newBreed = formData.breed;
                      if (m.breed) {
                        newBreed = m.breed;
                      }
                      setFormData(prev => ({
                        ...prev,
                        motherTag: m.tagNo,
                        motherName: m.name,
                        motherId: m.id,
                        origin: 'own',
                        purchasePrice: isCalf ? 0 : prev.purchasePrice,
                        dailyCapacity: isCalf ? 0 : prev.dailyCapacity,
                        breed: newBreed,
                        notes: prev.notes || `Mother: ${m.name} (${m.tagNo})`
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- कोई मां लिंक नहीं है (None) --</option>
                  {potentialMothers.map(m => (
                    <option key={m.id} value={m.tagNo}>
                      {m.tagNo} - {m.name} ({m.type === 'cow' ? '🐄 गाय' : '🐃 भैंस'} - {m.breed})
                    </option>
                  ))}
                  <option value="__custom__">✍️ अन्य / सूची में नहीं है (Manual Enter)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                  मां का टैग / नाम (Mother Tag / Info):
                </label>
                <input
                  type="text"
                  placeholder="e.g. SJKF_2024_BHB_003_AAMBA या AAMBA"
                  value={formData.motherTag}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = potentialMothers.find(m => m.tagNo === val || m.name.toLowerCase() === val.toLowerCase());
                    setFormData({
                      ...formData,
                      motherTag: val,
                      motherName: matched ? matched.name : (formData.motherName || val),
                      motherId: matched ? matched.id : formData.motherId
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
                />
              </div>
            </div>

            {formData.motherTag && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 border border-purple-200 text-xs text-purple-950">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤱</span>
                  <div>
                    <span className="font-bold">
                      {formData.motherName || formData.motherTag}
                    </span>
                    <span className="text-[11px] text-purple-700 ml-1.5 font-mono">
                      (टैग: {formData.motherTag})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, motherTag: '', motherName: '', motherId: '' }))}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  हटाएं (Unlink)
                </button>
              </div>
            )}
          </div>

          {/* 🌟 KEY SECTION: ANIMAL ORIGIN (खरीदा हुआ vs खुद की भैंस/गाय) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>पशु का स्रोत / प्राप्ति प्रकार (Animal Origin) *</span>
              <span className="text-[11px] font-normal text-slate-500">
                {formData.origin === 'own' ? '🏡 खुद के फार्म की पैदावार' : '🛒 बाहर से खरीदा हुआ पशु'}
              </span>
            </label>

            {/* Segmented Origin Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    origin: 'purchased',
                    purchasePrice: formData.purchasePrice || 85000
                  });
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  formData.origin === 'purchased'
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 text-amber-950 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                <div className={`p-2 rounded-lg ${formData.origin === 'purchased' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    🛒 खरीदी हुई {animalLabel} (Purchased)
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    बाजार, हाट या अन्य डेयरी से खरीदी गई
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    origin: 'own',
                    purchasePrice: 0
                  });
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  formData.origin === 'own'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30 text-emerald-950 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                <div className={`p-2 rounded-lg ${formData.origin === 'own' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    🏡 खुद की {animalLabel} (Born on Farm)
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    घर की पैदावार / बछिया या पाडी से तैयार
                  </span>
                </div>
              </button>
            </div>

            {/* Conditional Fields based on Origin */}
            {formData.origin === 'purchased' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 animate-in fade-in">
                {/* 📅 खरीदी की दिनांक */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>खरीदी की दिनांक (Purchase Date) *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium shadow-sm"
                  />
                </div>

                {/* 💰 खरीद मूल्य */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    खरीद मूल्य / कीमत (Purchase Price ₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 85000"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 animate-in fade-in">
                {/* 🎂 जन्म दिनांक */}
                <div className="col-span-full sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>जन्म दिनांक (Date of Birth / DOB)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Status & Daily Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status / वर्तमान स्थिति *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-white font-medium"
              >
                <option value="milking">🥛 Milking (दुधारू)</option>
                <option value="pregnant">🤰 Pregnant (गाभिन)</option>
                <option value="dry">🌾 Dry (सूखी)</option>
                <option value="sick">🩺 Sick / Treatment (बीमार)</option>
                <option value="kedi">🐃 केडी / पाडी / बछिया (Kedi - मादा)</option>
                <option value="keda">🐂 केड़ा / पाड़ा / बछड़ा (Keda - नर)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Milk Capacity (दैनिक दूध क्षमता - Liters/day) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder={formData.type === 'keda' || formData.type === 'kedi' ? '0' : '14.0'}
                value={formData.dailyCapacity}
                onChange={(e) => setFormData({ ...formData, dailyCapacity: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500 font-bold"
              />
            </div>
          </div>

          {/* Row 4: Weight & Lactation No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight / वजन (Kg)
              </label>
              <input
                type="number"
                placeholder={formData.type === 'keda' || formData.type === 'kedi' ? '80' : '450'}
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lactation No / ब्यांत संख्या
              </label>
              <input
                type="number"
                min="0"
                max="10"
                placeholder={formData.type === 'keda' || formData.type === 'kedi' ? '0' : '2'}
                value={formData.lactationNo}
                onChange={(e) => setFormData({ ...formData, lactationNo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500"
              />
            </div>
          </div>

          {/* Row 5: Photo Capture & Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-dairy-600" />
                <span>Animal Photo (पशु की फोटो खींचें / अपलोड करें) *</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {formData.photo?.startsWith('data:') ? '📸 लाइव खींची गई फोटो' : '🖼️ सैंपल फोटो'}
              </span>
            </div>

            {/* Live Photo Preview & Direct Camera Trigger */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Current Photo Box */}
              <div className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden border-2 border-dairy-500/40 bg-slate-900 shadow-md group flex-shrink-0">
                <img
                  src={formData.photo || getInitialPhoto(formData.type, '')}
                  alt="Animal Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">वर्तमान फोटो</span>
                </div>
                {formData.photo?.startsWith('data:') && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold shadow">
                    ✓ Real Photo
                  </span>
                )}
              </div>

              {/* Buttons: Camera Capture & File Upload */}
              <div className="flex-1 w-full flex flex-col gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 📸 Direct Camera Capture Button */}
                  <label className="cursor-pointer p-2.5 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-center">
                    <Camera className="w-4 h-4" />
                    <span>📸 कैमरा से फोटो खींचें</span>
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

                  {/* 📁 Upload from Gallery / PC */}
                  <label className="cursor-pointer p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-center">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>📁 गैलरी से चुनें</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoFile(file);
                      }}
                    />
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  💡 <strong>टिप:</strong> मोबाइल या लैपटॉप के कैमरा से मवेशी की वास्तविक फोटो खींचें ताकि डेयरी में पहचानना आसान हो।
                </p>
              </div>
            </div>

            {/* Or Pick from Preset Samples */}
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                या नीचे से सैंपल फोटो चुनें (Or Choose Sample Photo):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: '🐃 मुर्राह भैंस (1)', url: '/images/murrah_buffalo_1.jpg' },
                  { label: '🐃 मुर्राह भैंस (2)', url: '/images/murrah_buffalo_2.jpg' },
                  { label: '🐂/🐃 केड़ा/केडी', url: '/images/keda_kedi_calf.jpg' },
                  { label: '🐄 गीर गाय', url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80' },
                  { label: '🐄 साहीवाल गाय', url: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=600&q=80' }
                ].map((opt, idx) => {
                  const isSelected = formData.photo === opt.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, photo: opt.url })}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all group h-16 ${
                        isSelected ? 'border-dairy-600 ring-2 ring-dairy-500/30 scale-[1.02]' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={opt.url} alt={opt.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1">
                        <span className="text-[9px] font-bold text-white leading-tight truncate">
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-dairy-600 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Notes / विशेष टिप्पणी व स्वास्थ्य विवरण
            </label>
            <textarea
              rows="2"
              placeholder="पशु की आदतें, आहार, विशेष पहचान निशान, सींग का आकार आदि..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-dairy-500"
            ></textarea>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel (रद्द करें)
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save (सुरक्षित करें)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
