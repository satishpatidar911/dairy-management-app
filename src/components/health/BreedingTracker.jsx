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
  CheckCircle,
  Layers,
  Activity,
  Baby,
  RotateCcw,
  CheckCheck,
  BellRing,
  Filter
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
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'inseminated' | 'pregnant' | 'failed' | 'calved'
  const [viewMode, setViewMode] = useState('sections'); // 'sections' (अलग-अलग सूचियाँ) | 'grid' (एकल ग्रिड)

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

  // Quick 1-Click Status Toggles (Confirm Pregnant, Mark Failed, Inseminated)
  const handleQuickStatusChange = (recordId, newStatus) => {
    const rec = breedingRecords.find(r => r.id === recordId);
    if (!rec) return;

    const animal = animals.find(a => (a.tagNo && a.tagNo === rec.animalId) || (a.tag_no && a.tag_no === rec.animalId) || a.name === rec.animalName);

    const updated = {
      ...rec,
      status: newStatus,
      isPregnant: newStatus === 'pregnant' || newStatus === 'inseminated'
    };

    if (updateBreedingRecord) {
      updateBreedingRecord(recordId, updated);
    }

    if (animal && updateAnimal) {
      if (newStatus === 'pregnant') {
        updateAnimal(animal.id, { status: 'pregnant' });
      } else if (newStatus === 'failed' || newStatus === 'calved') {
        updateAnimal(animal.id, { status: 'milking' });
      }
    }

    if (newStatus === 'pregnant') {
      setSuccessToast(`✓ ${rec.animalName || rec.animalId} का गर्भ पुष्ट (Pregnant) हो गया! प्रसव उल्टी गिनती चालू।`);
    } else if (newStatus === 'failed') {
      setSuccessToast(`✓ ${rec.animalName || rec.animalId} को खाली (Failed) मार्क किया गया।`);
    } else if (newStatus === 'inseminated') {
      setSuccessToast(`✓ ${rec.animalName || rec.animalId} का स्टेटस जाँच लंबित (Pending) पर सेट किया गया।`);
    } else {
      setSuccessToast(`✓ स्टेटस सफलतापूर्वक अपडेट हो गया!`);
    }
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Pre-fill animal for Repeat AI when previous attempt failed
  const handleRepeatAI = (rec) => {
    setEditingRecord(null);
    const today = new Date().toISOString().split('T')[0];
    const initialCalving = calculateCalvingDate(today, rec.animalId);
    setForm({
      animalId: rec.animalId,
      aiDate: today,
      bullStrawTag: '',
      technicianName: rec.technicianName || rec.technician || 'डॉक्टर',
      status: 'inseminated',
      isPregnant: true,
      expectedCalvingDate: initialCalving,
      notes: `दोबारा AI (Repeat AI) - पिछली AI तारीख: ${rec.aiDate}`
    });
    setIsModalOpen(true);
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

  // Calculate Category Counts
  const counts = {
    all: breedingRecords.length,
    inseminated: breedingRecords.filter(r => r.status === 'inseminated').length,
    pregnant: breedingRecords.filter(r => r.status === 'pregnant' || (!r.status && r.isPregnant)).length,
    failed: breedingRecords.filter(r => r.status === 'failed').length,
    calved: breedingRecords.filter(r => r.status === 'calved').length,
  };

  // Category Metadata Definitions
  const categoryDefs = [
    {
      id: 'inseminated',
      title: '💉 गर्भाधान - जाँच लंबित (Pending Pregnancy Check)',
      shortTitle: 'जाँच लंबित',
      desc: 'AI हो चुका है — 60 से 90 दिन में डॉक्टर से गर्भ जाँच (PD) करवाएं',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      tabActive: 'bg-blue-600 text-white border-blue-600 shadow-sm',
      bannerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900',
      emptyText: 'वर्तमान में कोई जाँच लंबित AI रिकॉर्ड नहीं है।'
    },
    {
      id: 'pregnant',
      title: '🤰 गर्भित पुष्ट (Confirmed Pregnant)',
      shortTitle: 'गर्भित पुष्ट',
      desc: 'गर्भ ठहर चुका है — संभावित प्रसव तारीख व दिन की उल्टी गिनती जारी है',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      tabActive: 'bg-purple-600 text-white border-purple-600 shadow-sm',
      bannerBg: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-900',
      emptyText: 'वर्तमान में कोई गर्भित रिकॉर्ड दर्ज नहीं है।'
    },
    {
      id: 'failed',
      title: '✕ खाली / असफल (Failed - Repeat AI Needed)',
      shortTitle: 'खाली / असफल',
      desc: 'गर्भ नहीं ठहरा — पशु पुनः हीट पर आने पर नया टीका (Repeat AI) लगवाएं',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      tabActive: 'bg-rose-600 text-white border-rose-600 shadow-sm',
      bannerBg: 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200 text-rose-900',
      emptyText: 'कोई असफल रिकॉर्ड नहीं है।'
    },
    {
      id: 'calved',
      title: '🍼 प्रसव संपन्न (Calved / Successful Delivery)',
      shortTitle: 'प्रसव संपन्न',
      desc: 'सफल प्रसव हो चुका है और बछड़ा/बछड़ी फार्म में दर्ज है',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      tabActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
      bannerBg: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900',
      emptyText: 'कोई प्रसव संपन्न रिकॉर्ड नहीं है।'
    }
  ];

  // Reusable Single Breeding Card Renderer
  const renderBreedingCard = (rec) => {
    const calvDate = new Date(rec.expectedCalvingDate);
    const diffDays = Math.ceil((calvDate - new Date()) / (1000 * 60 * 60 * 24));
    const isDueSoon = diffDays <= 30 && diffDays >= 0;

    // Calculate days elapsed since AI was performed
    const aiDateObj = new Date(rec.aiDate);
    const daysSinceAI = Math.max(0, Math.floor((new Date() - aiDateObj) / (1000 * 60 * 60 * 24)));
    const isPDDue = rec.status === 'inseminated' && daysSinceAI >= 60;

    const getStatusBadge = () => {
      switch (rec.status) {
        case 'calved':
          return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">✓ प्रसव संपन्न (Calved)</span>;
        case 'failed':
          return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200">✕ असफल / खाली (Failed)</span>;
        case 'inseminated':
          return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold border border-blue-200">💉 गर्भाधान (Pending Check)</span>;
        default:
          return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold border border-purple-200">🤰 गर्भित (Pregnant)</span>;
      }
    };

    return (
      <div
        key={rec.id}
        className={`p-4 sm:p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
          isDueSoon
            ? 'bg-purple-50/70 border-purple-300 shadow-md ring-1 ring-purple-300'
            : isPDDue
            ? 'bg-amber-50/50 border-amber-300 shadow-sm ring-1 ring-amber-300'
            : rec.status === 'failed'
            ? 'bg-slate-50/60 border-slate-200 opacity-90'
            : 'bg-white border-slate-200 shadow-card hover:shadow-card-hover'
        }`}
      >
        <div>
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold shadow-xs">
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

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {rec.status === 'inseminated' ? (
                isPDDue ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold animate-pulse flex items-center gap-1 border border-amber-300">
                    <BellRing className="w-3.5 h-3.5 text-amber-800" />
                    <span>🔔 गर्भ जाँच समय (60+ दिन)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200">
                    AI हुए: {daysSinceAI} दिन
                  </span>
                )
              ) : rec.status === 'pregnant' ? (
                isDueSoon ? (
                  <span className="px-2.5 py-1 rounded-full bg-purple-200 text-purple-900 text-xs font-bold animate-pulse border border-purple-300">
                    🤰 Calving Soon ({diffDays} दिन)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    Gestation ~{300 - Math.max(0, diffDays)} Days
                  </span>
                )
              ) : rec.status === 'failed' ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
                  ✕ खाली (Repeat AI)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  ✓ प्रसव संपन्न
                </span>
              )}
            </div>
          </div>

          {/* Insemination & Calving Dates Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">AI Date (AI तारीख)</span>
              <strong className="text-slate-800">{rec.aiDate}</strong>
              <span className="text-[10px] text-slate-500 block">({daysSinceAI} दिन पहले)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Expected Calving (संभावित प्रसव)</span>
              <strong className="text-purple-800 font-bold text-xs">{rec.expectedCalvingDate}</strong>
              {rec.status === 'pregnant' && (
                <span className="text-[10px] text-purple-600 font-semibold block">({diffDays > 0 ? `${diffDays} दिन शेष` : 'समय पूरा'})</span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Doctor / AI Worker (डॉक्टर)</span>
              <span className="text-slate-700 font-medium">{rec.technicianName || rec.technician || 'डॉक्टर'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">वर्तमान स्थिति (Status)</span>
              <span className="font-bold text-slate-800 capitalize">{rec.status}</span>
            </div>
          </div>

          {rec.notes && (
            <div className="mt-2.5 text-xs text-purple-900 bg-purple-50/80 p-2 rounded-lg border border-purple-100 italic">
              "{rec.notes}"
            </div>
          )}
        </div>

        {/* Action Toolbar & Quick Status Controls */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-2">
          {/* Direct 1-Click Status Toggles */}
          {rec.status === 'inseminated' && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-600 px-1.5 whitespace-nowrap">गर्भ जाँच:</span>
              <button
                type="button"
                onClick={() => handleQuickStatusChange(rec.id, 'pregnant')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                title="गर्भ ठहर गया है (Confirm Pregnant)"
              >
                <Check className="w-3.5 h-3.5" />
                <span>✓ गर्भ ठहर गया (Pregnant)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`क्या ${rec.animalName || rec.animalId} खाली रह गई है (गर्भ नहीं ठहरा)?`)) {
                    handleQuickStatusChange(rec.id, 'failed');
                  }
                }}
                className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                title="खाली रह गई / असफल (Mark Failed)"
              >
                <X className="w-3.5 h-3.5" />
                <span>✕ खाली (Failed)</span>
              </button>
            </div>
          )}

          {rec.status === 'failed' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRepeatAI(rec)}
                className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title="इस पशु के लिए नया टीका / दोबारा AI दर्ज करें"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>+ दोबारा AI दर्ज करें (+ Repeat AI)</span>
              </button>
            </div>
          )}

          {/* Standard Actions: Edit, Delete, Add Calf */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {/* EDIT & UPDATE BUTTON */}
              <button
                type="button"
                onClick={() => handleOpenEdit(rec)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                title="ब्रीडिंग रिकॉर्ड एडिट व अपडेट करें"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>एडिट (Edit)</span>
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

            {/* ADD CALF BUTTON (For Pregnant or Calved) */}
            {(rec.status === 'pregnant' || rec.status === 'calved') && (
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
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                title="प्रसव होने पर नया बछड़ा/पड़िया जोड़ें"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🍼 बच्चा जोड़ें (+ Add Calf)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

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
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Breeding & Calving Tracker (गर्भावस्था व ब्रीडिंग)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
              कुल {breedingRecords.length} रिकॉर्ड्स
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI गर्भाधान, गर्भ जाँच (PD) की स्थिति, और संभावित प्रसव व बछड़ा प्रबंधन
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ नया गर्भाधान दर्ज करें (+ Add AI)</span>
        </button>
      </div>

      {/* CATEGORY TABS & VIEW CONTROLS */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Top: Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
              selectedTab === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🌟 सभी रिकॉर्ड्स (All)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              selectedTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {counts.all}
            </span>
          </button>

          {categoryDefs.map(cat => {
            const isActive = selectedTab === cat.id;
            const count = counts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedTab(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                  isActive
                    ? cat.tabActive
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat.shortTitle}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom: Search bar + View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
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

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <div className="text-slate-500 font-bold px-1 text-[11px]">
              {filteredRecords.length} / {breedingRecords.length} रिकॉर्ड्स
            </div>

            {/* View Mode Toggle: Sections vs Flat Grid */}
            {selectedTab === 'all' && (
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('sections')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'sections'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="सभी श्रेणियों को अलग-अलग सेक्शन में देखें"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>अलग-अलग सूचियाँ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'grid'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="सभी कार्ड्स एक ग्रिड में देखें"
                >
                  <span>एकल ग्रिड</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER LISTS ACCORDING TO VIEW MODE */}
      {filteredRecords.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          🔍 कोई ब्रीडिंग रिकॉर्ड नहीं मिला (No breeding records matching "{searchRecord}")
        </div>
      ) : selectedTab === 'all' && viewMode === 'sections' ? (
        /* SEPARATED CATEGORY SECTIONS (अलहदा-अलहदा सूचियाँ) */
        <div className="space-y-6">
          {categoryDefs.map(cat => {
            const catRecords = filteredRecords.filter(r => {
              if (cat.id === 'pregnant') return r.status === 'pregnant' || (!r.status && r.isPregnant);
              return r.status === cat.id;
            });

            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Category Header Banner */}
                <div className={`px-4 sm:px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${cat.bannerBg}`}>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                      <span>{cat.title}</span>
                    </h3>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {cat.desc}
                    </p>
                  </div>
                  <span className={`self-start sm:self-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${cat.badge}`}>
                    {catRecords.length} पशु (Animals)
                  </span>
                </div>

                {/* Cards for this category */}
                <div className="p-4 sm:p-5">
                  {catRecords.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      {cat.emptyText}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {catRecords.map(rec => renderBreedingCard(rec))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SINGLE TAB VIEW / FLAT GRID VIEW */
        <div className="space-y-4">
          {selectedTab !== 'all' && (
            (() => {
              const currentCat = categoryDefs.find(c => c.id === selectedTab);
              if (!currentCat) return null;
              return (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${currentCat.bannerBg}`}>
                  <div>
                    <h3 className="font-bold text-sm">{currentCat.title}</h3>
                    <p className="text-[11px] opacity-85 mt-0.5">{currentCat.desc}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${currentCat.badge}`}>
                    {filteredRecords.filter(r => selectedTab === 'pregnant' ? (r.status === 'pregnant' || (!r.status && r.isPregnant)) : r.status === selectedTab).length} पशु
                  </span>
                </div>
              );
            })()
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords
              .filter(rec => {
                if (selectedTab === 'all') return true;
                if (selectedTab === 'pregnant') return rec.status === 'pregnant' || (!rec.status && rec.isPregnant);
                return rec.status === selectedTab;
              })
              .map(rec => renderBreedingCard(rec))}
          </div>
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
