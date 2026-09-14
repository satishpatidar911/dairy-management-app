import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Heart, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search,
  Edit3,
  Trash2,
  Check,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { AnimalFormModal } from '../animals/AnimalFormModal';
import { SearchableSelect } from '../common/SearchableSelect';

export const BreedingTracker = () => {
  const { t } = useLanguage();
  const { 
    breedingRecords, 
    addBreedingRecord, 
    updateBreedingRecord, 
    deleteBreedingRecord, 
    animals, 
    updateAnimal 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [calfMother, setCalfMother] = useState(null);
  const [isCalfModalOpen, setIsCalfModalOpen] = useState(false);
  const [searchRecord, setSearchRecord] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const femaleAnimalOptions = animals
    .filter(a => a.gender === 'female' || (!a.gender && a.type !== 'keda'))
    .map(a => {
      const tag = a.tagNo || a.tag_no || a.id || '';
      return {
        value: tag,
        label: `${tag} - ${a.name || 'पशु'}`,
        tag: tag,
        name: a.name || 'पशु',
        sublabel: `${a.type === 'cow' ? 'Cow (गाय)' : 'Buffalo (भैंस)'}${a.breed ? ` • ${a.breed}` : ''}`,
        icon: a.type === 'cow' ? '🐄' : '🐃'
      };
    });

  const initialFormState = {
    animalId: femaleAnimalOptions[0]?.value || animals[0]?.tagNo || animals[0]?.tag_no || '',
    aiDate: new Date().toISOString().split('T')[0],
    bullStrawTag: 'SAH-SUPER-88',
    technicianName: 'डॉक्टर',
    status: 'pregnant',
    isPregnant: true,
    expectedCalvingDate: '',
    notes: ''
  };

  const [form, setForm] = useState(initialFormState);

  // Calculate standard calving date on AI date change (~283 days for cow, ~310 days for buffalo)
  const calculateCalvingDate = (aiDateStr, animalTag) => {
    const animal = animals.find(a => (a.tagNo && a.tagNo === animalTag) || (a.tag_no && a.tag_no === animalTag) || a.name === animalTag);
    const isBuf = animal?.type === 'buffalo' || animal?.type === 'buffalo_calf';
    const gestationDays = isBuf ? 310 : 283;

    const d = new Date(aiDateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + gestationDays);
    return d.toISOString().split('T')[0];
  };

  const handleAnimalOrDateChange = (newTag, newAiDate) => {
    const calculated = calculateCalvingDate(newAiDate, newTag);
    setForm(prev => ({
      ...prev,
      animalId: newTag,
      aiDate: newAiDate,
      expectedCalvingDate: calculated
    }));
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    const defaultTag = femaleAnimalOptions[0]?.value || animals[0]?.tagNo || animals[0]?.tag_no || '';
    const today = new Date().toISOString().split('T')[0];
    const initialCalving = calculateCalvingDate(today, defaultTag);
    setForm({
      ...initialFormState,
      animalId: defaultTag,
      aiDate: today,
      expectedCalvingDate: initialCalving
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setForm({
      animalId: rec.animalId || '',
      aiDate: rec.aiDate || new Date().toISOString().split('T')[0],
      bullStrawTag: rec.bullStrawTag || rec.bullId || '',
      technicianName: rec.technicianName || rec.technician || '',
      status: rec.status || (rec.isPregnant ? 'pregnant' : 'inseminated'),
      isPregnant: rec.isPregnant !== false,
      expectedCalvingDate: rec.expectedCalvingDate || calculateCalvingDate(rec.aiDate || new Date().toISOString().split('T')[0], rec.animalId),
      notes: rec.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id, animalName) => {
    if (confirm(`क्या आप ${animalName || 'इस'} ब्रीडिंग रिकॉर्ड को हटाना चाहते हैं?`)) {
      if (deleteBreedingRecord) {
        deleteBreedingRecord(id);
      }
      setSuccessToast('✓ ब्रीडिंग रिकॉर्ड हटा दिया गया!');
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const animal = animals.find(a => (a.tagNo && a.tagNo === form.animalId) || (a.tag_no && a.tag_no === form.animalId) || a.name === form.animalId);
    const animalName = animal ? animal.name : (editingRecord?.animalName || 'मादा पशु');
    const calculatedCalving = form.expectedCalvingDate || calculateCalvingDate(form.aiDate, form.animalId);

    const recordData = {
      ...form,
      animalName,
      expectedCalvingDate: calculatedCalving,
      isPregnant: form.status === 'pregnant' || form.status === 'inseminated'
    };

    if (editingRecord) {
      if (updateBreedingRecord) {
        updateBreedingRecord(editingRecord.id, recordData);
      }
      // Update cattle status if appropriate
      if (animal && updateAnimal) {
        if (form.status === 'failed' || form.status === 'calved') {
          updateAnimal(animal.id, { status: 'milking' });
        } else if (form.status === 'pregnant') {
          updateAnimal(animal.id, { status: 'pregnant' });
        }
      }
      setSuccessToast('✓ ब्रीडिंग रिकॉर्ड सफलतापूर्वक अपडेट हो गया (Updated)!');
    } else {
      if (addBreedingRecord) {
        addBreedingRecord(recordData);
      }
      if (animal && form.isPregnant && updateAnimal) {
        updateAnimal(animal.id, { status: 'pregnant' });
      }
      setSuccessToast('✓ नया गर्भाधान रिकॉर्ड सफलतापूर्वक दर्ज किया गया (Saved)!');
    }

    setTimeout(() => setSuccessToast(''), 3000);
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const filteredRecords = breedingRecords.filter(rec => {
    if (!searchRecord.trim()) return true;
    const q = searchRecord.toLowerCase().trim();
    return (
      (rec.animalId || '').toLowerCase().includes(q) ||
      (rec.animalName || '').toLowerCase().includes(q) ||
      (rec.bullStrawTag || rec.bullId || '').toLowerCase().includes(q) ||
      (rec.technicianName || rec.technician || '').toLowerCase().includes(q) ||
      (rec.notes || '').toLowerCase().includes(q) ||
      (rec.aiDate || '').toLowerCase().includes(q) ||
      (rec.expectedCalvingDate || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Breeding & Calving Tracker (गर्भावस्था व ब्रीडिंग)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
              {breedingRecords.length} Records (रिकॉर्ड्स)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Artificial Insemination (AI), Pregnancy Diagnosis & Expected Calving Date Calculator
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add AI / Insemination (+ नया गर्भाधान / AI दर्ज करें)</span>
        </button>
      </div>

      {/* Search & Filter Bar for Breeding Records */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchRecord}
            onChange={(e) => setSearchRecord(e.target.value)}
            placeholder="ब्रीडिंग रिकॉर्ड्स खोजें (टैग, नाम, सीमन)..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
          />
          {searchRecord && (
            <button
              type="button"
              onClick={() => setSearchRecord('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 font-bold px-1">
          {filteredRecords.length} of {breedingRecords.length} Records (रिकॉर्ड्स)
        </div>
      </div>

      {/* Breeding Cards Grid */}
      {filteredRecords.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          🔍 कोई ब्रीडिंग रिकॉर्ड नहीं मिला (No breeding records matching "{searchRecord}")
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map(rec => {
            const calvDate = new Date(rec.expectedCalvingDate);
            const diffDays = Math.ceil((calvDate - new Date()) / (1000 * 60 * 60 * 24));
            const isDueSoon = diffDays <= 30 && diffDays >= 0;

            const getStatusBadge = () => {
              switch (rec.status) {
                case 'calved':
                  return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">✓ प्रसव संपन्न (Calved)</span>;
                case 'failed':
                  return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">✕ असफल / खाली (Failed)</span>;
                case 'inseminated':
                  return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">💉 गर्भाधान (Pending Check)</span>;
                default:
                  return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">🤰 गर्भित (Pregnant)</span>;
              }
            };

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-2xl border transition-all relative ${
                  isDueSoon
                    ? 'bg-purple-50/60 border-purple-300 shadow-md ring-1 ring-purple-300'
                    : 'bg-white border-slate-200 shadow-card hover:shadow-card-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                        {rec.animalId}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {rec.animalName}
                      </h3>
                      {getStatusBadge()}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Semen Straw (सीमन स्ट्रॉ): <strong className="text-purple-700">{rec.bullStrawTag || rec.bullId || 'N/A'}</strong>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {isDueSoon ? (
                      <span className="px-2.5 py-1 rounded-full bg-purple-200 text-purple-900 text-xs font-bold animate-pulse">
                        🤰 Calving Soon (प्रसव नज़दीक: {diffDays} दिन)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        Gestation ~{300 - Math.max(0, diffDays)} Days (दिन)
                      </span>
                    )}
                  </div>
                </div>

                {/* Insemination and Calving Dates */}
                <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">AI Date (AI तारीख)</span>
                    <strong className="text-slate-800">{rec.aiDate}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Expected Calving (संभावित प्रसव)</span>
                    <strong className="text-purple-800 font-bold text-sm">{rec.expectedCalvingDate}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Doctor / AI Worker (डॉक्टर)</span>
                    <span className="text-slate-700">{rec.technicianName || rec.technician || 'डॉक्टर'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Days Remaining (शेष दिन)</span>
                    <span className="font-bold text-purple-700">{diffDays > 0 ? `${diffDays} days left` : (diffDays === 0 ? 'Due Today' : 'Overdue')}</span>
                  </div>
                </div>

                {rec.notes && (
                  <div className="mt-3 text-xs text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-100 italic">
                    "{rec.notes}"
                  </div>
                )}

                {/* Action Toolbar: Edit, Delete, Add Calf */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* EDIT & UPDATE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rec)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title="ब्रीडिंग रिकॉर्ड एडिट व अपडेट करें"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>एडिट / अपडेट (Edit)</span>
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id, rec.animalName)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                      title="रिकॉर्ड हटाएं (Delete)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ADD CALF BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      const motherAnimal = animals.find(a => a.tagNo === rec.animalId || a.name === rec.animalName);
                      if (motherAnimal) {
                        setCalfMother(motherAnimal);
                      } else {
                        setCalfMother({ tagNo: rec.animalId, name: rec.animalName, type: 'buffalo' });
                      }
                      setIsCalfModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="प्रसव होने पर नया बछड़ा/पड़िया जोड़ें"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🍼 बच्चा जोड़ें (+ Add Calf)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Breeding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>{editingRecord ? '✏️' : '🤰'}</span>
                <span>
                  {editingRecord 
                    ? `ब्रीडिंग रिकॉर्ड अपडेट करें (${editingRecord.animalName || editingRecord.animalId})` 
                    : t.health.addBreedingRecord}
                </span>
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRecord(null);
                }} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Cattle Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Female Cattle (मादा पशु चुनें) *</span>
                  <span className="text-[10px] text-purple-600 font-bold">🔍 खोज उपलब्ध (Searchable)</span>
                </label>
                <SearchableSelect
                  options={femaleAnimalOptions}
                  value={form.animalId}
                  onChange={(newTag) => handleAnimalOrDateChange(newTag, form.aiDate)}
                  placeholder="-- मादा पशु चुनें (Select Female Cattle) --"
                  searchPlaceholder="🔍 नाम या टैग से खोजें (उदा. POONAM, BHB, 028)..."
                  accentColor="purple"
                />
              </div>

              {/* AI Date & Semen Straw */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AI Date (AI तारीख) *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.aiDate}
                    onChange={(e) => handleAnimalOrDateChange(form.animalId, e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semen Straw Tag (सीमन स्ट्रॉ)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. GIR-CHAMP-01"
                    value={form.bullStrawTag}
                    onChange={(e) => setForm({ ...form, bullStrawTag: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Expected Calving Date & Doctor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Calving (संभावित प्रसव तारीख)
                  </label>
                  <input
                    type="date"
                    value={form.expectedCalvingDate}
                    onChange={(e) => setForm({ ...form, expectedCalvingDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 bg-purple-50 font-bold text-purple-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor / Inseminator (डॉक्टर / AI वर्कर)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. डॉ. शर्मा"
                    value={form.technicianName}
                    onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pregnancy Status (गर्भावस्था स्थिति)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'pregnant', label: '🤰 गर्भित (Pregnant)' },
                    { id: 'inseminated', label: '💉 गर्भाधान (Pending)' },
                    { id: 'calved', label: '🍼 प्रसव संपन्न (Calved)' },
                    { id: 'failed', label: '✕ असफल (Failed)' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setForm(prev => ({ 
                        ...prev, 
                        status: st.id,
                        isPregnant: st.id === 'pregnant' || st.id === 'inseminated'
                      }))}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        form.status === st.id
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Remark (अतिरिक्त विवरण / टिप्पणी)
                </label>
                <textarea
                  rows="2"
                  placeholder="सीमन कंपनी, ब्रीडिंग हिस्ट्री, चेकअप विवरण..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRecord ? 'अपडेट करें (Update Record)' : 'Save (सुरक्षित करें)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Calf Modal from Calving */}
      {isCalfModalOpen && (
        <AnimalFormModal
          preselectedMother={calfMother}
          isOpen={isCalfModalOpen}
          onClose={() => {
            setIsCalfModalOpen(false);
            setCalfMother(null);
          }}
        />
      )}
    </div>
  );
};
