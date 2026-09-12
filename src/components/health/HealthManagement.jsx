import React, { useState } from 'react';
import {
  HeartPulse,
  Syringe,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  DollarSign,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import { SearchableSelect } from '../common/SearchableSelect';

export const HealthManagement = () => {
  const { t } = useLanguage();
  const { healthRecords, addHealthRecord, vaccinations, addVaccination, animals, addAnimal, updateAnimal } = useApp();
  const { currentUser } = useAuth();

  const cattleOptions = animals.map(a => ({
    value: a.tagNo,
    label: `${a.tagNo} - ${a.name}`,
    tag: a.tagNo,
    name: a.name,
    sublabel: `${a.type === 'cow' ? 'Cow (गाय)' : 'Buffalo (भैंस)'}${a.breed ? ` • ${a.breed}` : ''}`,
    icon: a.type === 'cow' ? '🐄' : '🐃'
  }));

  const [activeTab, setActiveTab] = useState('treatments'); // 'treatments' | 'vaccines'
  const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);
  const [isAddVaccineOpen, setIsAddVaccineOpen] = useState(false);

  // Mode: 'select' | 'manual'
  const [cattleMode, setCattleMode] = useState('select');
  const [manualCattle, setManualCattle] = useState({
    tagNo: '',
    name: '',
    type: 'cow',
    breed: 'Gir (गीर)'
  });

  // Treatment Form state
  const [treatmentForm, setTreatmentForm] = useState({
    animalId: animals[0]?.tagNo || '',
    disease: 'Mild fever & fatigue (हल्का बुखार)',
    doctor: 'डॉ. वीरेन्द्र शर्मा',
    medicine: 'Meloxicam Injection + Antibiotic',
    cost: '600',
    notes: 'Monitor milk for 2 days (2 दिन दूध की निगरानी करें)'
  });

  // Vaccine Form state
  const [vaccineForm, setVaccineForm] = useState({
    vaccineName: 'FMD (खुरपका-मुंहपका टीका)',
    target: 'All Cattle (सभी गाय व भैंस)',
    dateGiven: new Date().toISOString().split('T')[0],
    nextDueDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  });

  const handleTreatmentSubmit = (e) => {
    e.preventDefault();

    let tag = treatmentForm.animalId;
    let name = 'Unknown';

    if (cattleMode === 'manual') {
      if (!manualCattle.tagNo || !manualCattle.name) {
        alert('Please enter tag number and name (कृपया टैग नं. और नाम दर्ज करें)');
        return;
      }
      tag = manualCattle.tagNo;
      name = manualCattle.name;

      addAnimal({
        tagNo: tag,
        name: name,
        type: manualCattle.type,
        breed: manualCattle.breed,
        status: 'sick',
        dailyCapacity: 12.0,
        weight: 400
      });
    } else {
      const animal = animals.find(a => a.tagNo === treatmentForm.animalId);
      if (animal) {
        tag = animal.tagNo;
        name = animal.name;
        updateAnimal(animal.id, { status: 'sick' });
      }
    }

    addHealthRecord({
      ...treatmentForm,
      animalId: tag,
      animalName: name,
      cost: Number(treatmentForm.cost) || 0
    });

    setIsAddTreatmentOpen(false);
  };

  const handleVaccineSubmit = (e) => {
    e.preventDefault();
    addVaccination(vaccineForm);
    setIsAddVaccineOpen(false);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {t.health.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
              {healthRecords.length} Treatments • {vaccinations.length} Vaccines
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cattle Illness & Veterinary Treatments, Vaccination Calendar & Due Date Reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('treatments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'treatments' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🩺 Treatments & Illness (बीमारी व इलाज)
            </button>
            <button
              onClick={() => setActiveTab('vaccines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'vaccines' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💉 Vaccination Schedule (टीकाकरण)
            </button>
          </div>

          <button
            onClick={() => activeTab === 'treatments' ? setIsAddTreatmentOpen(true) : setIsAddVaccineOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'treatments' ? '+ Add Treatment (+ उपचार दर्ज करें)' : '+ Add Vaccine (+ टीका जोड़ें)'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TREATMENTS */}
      {activeTab === 'treatments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthRecords.map(rec => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                      {rec.animalId}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {rec.animalName}
                    </h3>
                  </div>

                  <span className="text-[11px] text-slate-400 font-semibold">{rec.date}</span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200/70 text-xs text-rose-900 font-semibold">
                  Disease (बीमारी): {rec.disease}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p><strong>Medicine (दवाई):</strong> {rec.medicine || '-'}</p>
                  <p><strong>Veterinarian (डॉक्टर):</strong> {rec.doctor || 'पशु डॉक्टर'}</p>
                  {rec.notes && <p className="text-slate-500 italic mt-1">"{rec.notes}"</p>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Treatment Cost (खर्च):</span>
                <span className="font-extrabold text-slate-800 text-sm">₹{rec.cost}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: VACCINATIONS */}
      {activeTab === 'vaccines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaccinations.map(vac => {
            const dueDate = new Date(vac.nextDueDate);
            const diffDays = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
            const isDueSoon = diffDays <= 7 && diffDays >= -2;

            return (
              <div
                key={vac.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDueSoon
                    ? 'bg-amber-50/60 border-amber-300 shadow-md ring-1 ring-amber-300'
                    : 'bg-white border-slate-200 shadow-card hover:shadow-card-hover'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isDueSoon ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Syringe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {vac.vaccineName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{vac.target}</p>
                    </div>
                  </div>

                  {isDueSoon ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold animate-pulse">
                      Due Soon (देय: {diffDays <= 0 ? 'आज' : `${diffDays} दिन`})
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      ✓ Completed (पूरा हुआ)
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Vaccinated On (टीका तारीख)</span>
                    <strong className="text-slate-800">{vac.dateGiven}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Next Due Date (अगली तारीख)</span>
                    <strong className="text-rose-700 font-bold">{vac.nextDueDate}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD TREATMENT */}
      {isAddTreatmentOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <span>Add Cattle Treatment (उपचार दर्ज करें)</span>
              </h3>
              <button onClick={() => setIsAddTreatmentOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTreatmentSubmit} className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {cattleMode === 'select' ? 'Select Cattle (पशु चुनें)' : 'Add New Animal Manually (मैन्युअल जोड़ें)'}
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCattleMode('select')}
                      className={`px-2 py-0.5 rounded-md transition-all ${cattleMode === 'select' ? 'bg-white shadow text-dairy-800' : 'text-slate-500'}`}
                    >
                      From List
                    </button>
                    <button
                      type="button"
                      onClick={() => setCattleMode('manual')}
                      className={`px-2 py-0.5 rounded-md transition-all ${cattleMode === 'manual' ? 'bg-rose-600 text-white shadow' : 'text-slate-500'}`}
                    >
                      + Manual
                    </button>
                  </div>
                </div>

                {cattleMode === 'select' ? (
                  <SearchableSelect
                    options={cattleOptions}
                    value={treatmentForm.animalId}
                    onChange={(val) => setTreatmentForm({ ...treatmentForm, animalId: val })}
                    placeholder="-- पशु चुनें (Select Animal) --"
                    searchPlaceholder="🔍 नाम या टैग से खोजें (Search by Name or Tag)..."
                    accentColor="rose"
                  />
                ) : (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Tag ID (टैग नं.) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. COW-109"
                          value={manualCattle.tagNo}
                          onChange={(e) => setManualCattle({ ...manualCattle, tagNo: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Animal Name (पशु नाम) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Kamdhenu"
                          value={manualCattle.name}
                          onChange={(e) => setManualCattle({ ...manualCattle, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Type (प्रकार)
                        </label>
                        <select
                          value={manualCattle.type}
                          onChange={(e) => setManualCattle({ ...manualCattle, type: e.target.value })}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          <option value="cow">🐄 Cow (गाय)</option>
                          <option value="buffalo">🐃 Buffalo (भैंस)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Breed (नस्ल)
                        </label>
                        <input
                          type="text"
                          placeholder="Gir / Murrah"
                          value={manualCattle.breed}
                          onChange={(e) => setManualCattle({ ...manualCattle, breed: e.target.value })}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disease / Symptoms (बीमारी / लक्षण) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mastitis, FMD, Fever, Indigestion"
                  value={treatmentForm.disease}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, disease: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medicine (दी गई दवाई)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Antibiotic, Antipyretic Bolus"
                    value={treatmentForm.medicine}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, medicine: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Treatment Cost / खर्च (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="600"
                    value={treatmentForm.cost}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, cost: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Veterinary Doctor (डॉक्टर का नाम)
                </label>
                <input
                  type="text"
                  value={treatmentForm.doctor}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, doctor: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTreatmentOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                >
                  Save Treatment (उपचार सुरक्षित करें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VACCINE */}
      {isAddVaccineOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Syringe className="w-4 h-4 text-blue-400" />
                <span>Add Vaccination Schedule (नया टीका शेड्यूल)</span>
              </h3>
              <button onClick={() => setIsAddVaccineOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVaccineSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vaccine Name (टीके का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FMD, HS, BQ, Anthrax, Deworming"
                  value={vaccineForm.vaccineName}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Herd (लक्षित पशु)
                </label>
                <input
                  type="text"
                  value={vaccineForm.target}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, target: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vaccination Date (टीका तारीख)
                  </label>
                  <input
                    type="date"
                    value={vaccineForm.dateGiven}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, dateGiven: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Next Due Date (अगली तारीख) *
                  </label>
                  <input
                    type="date"
                    required
                    value={vaccineForm.nextDueDate}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, nextDueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 font-bold text-amber-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVaccineOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Save Schedule (सुरक्षित करें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
