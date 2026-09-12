import React, { useState } from 'react';
import { Milk, Check, AlertTriangle, Sparkles, Sun, Moon, CheckCircle2, ChevronRight, User, Plus, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const WorkerMobileView = () => {
  const { t } = useLanguage();
  const { animals, addAnimal, addMilkEntry, addHealthRecord } = useApp();
  const { currentUser } = useAuth();

  const [selectedAnimal, setSelectedAnimal] = useState(animals[0] || null);
  const [shift, setShift] = useState('morning');
  const [liters, setLiters] = useState('8.5');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [sicknessNote, setSicknessNote] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Manual Quick Add Animal state
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    tagNo: '',
    name: '',
    type: 'cow',
    breed: 'Gir (गीर)'
  });

  const quickNumbers = [6, 7, 8, 8.5, 9, 9.5, 10, 11, 12, 14];

  const handleSaveMilk = () => {
    if (!selectedAnimal || !liters) return;

    addMilkEntry({
      animalId: selectedAnimal.tagNo,
      animalName: selectedAnimal.name,
      animalType: selectedAnimal.type,
      shift,
      quantity: Number(liters),
      fat: selectedAnimal.type === 'cow' ? 4.5 : 7.2,
      snf: 8.8,
      rate: selectedAnimal.type === 'cow' ? 55 : 75,
      recordedBy: currentUser.name
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {}

    setSuccessNotice(`✓ Recorded ${liters}L for ${selectedAnimal.name}!`);
    setTimeout(() => setSuccessNotice(''), 2500);
  };

  const handleManualAddSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.tagNo || !manualForm.name) return;

    const newAnimal = {
      tagNo: manualForm.tagNo,
      name: manualForm.name,
      type: manualForm.type,
      breed: manualForm.breed,
      status: 'milking',
      dailyCapacity: Number(liters) * 2,
      weight: 400
    };

    addAnimal(newAnimal);
    setSelectedAnimal(newAnimal);
    setIsManualAddOpen(false);
    setManualForm({ tagNo: '', name: '', type: 'cow', breed: 'Gir (गीर)' });
    setSuccessNotice(`✓ Added new cattle ${newAnimal.name} (${newAnimal.tagNo})!`);
    setTimeout(() => setSuccessNotice(''), 2500);
  };

  const handleReportSick = () => {
    if (!selectedAnimal || !sicknessNote) return;

    addHealthRecord({
      animalId: selectedAnimal.tagNo,
      animalName: selectedAnimal.name,
      disease: sicknessNote,
      doctor: 'Veterinarian Called (पशु चिकित्सक)',
      medicine: 'Under Diagnosis (जांच लंबित)',
      cost: 0
    });

    setIsAlertOpen(false);
    setSicknessNote('');
    setSuccessNotice(`⚠️ Sickness alert for ${selectedAnimal.name} sent!`);
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-20">
      {/* Worker Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold">
            📱
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">
              {t.worker.title}
            </h2>
            <p className="text-xs text-emerald-200">
              {currentUser.name} • Fast Touch Entry
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
          <button
            onClick={() => setShift('morning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              shift === 'morning' ? 'bg-amber-400 text-amber-950 shadow' : 'text-white/70'
            }`}
          >
            🌅 Morning (सुबह)
          </button>
          <button
            onClick={() => setShift('evening')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              shift === 'evening' ? 'bg-indigo-400 text-indigo-950 shadow' : 'text-white/70'
            }`}
          >
            🌇 Evening (शाम)
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl font-bold text-center text-sm shadow-lg animate-bounce">
          {successNotice}
        </div>
      )}

      {/* STEP 1: SELECT ANIMAL */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            1. Select Cattle (पशु चुनें)
          </span>
          <button
            onClick={() => setIsManualAddOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-dairy-50 hover:bg-dairy-100 text-dairy-800 text-xs font-bold flex items-center gap-1 border border-dairy-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Cattle (नया पशु)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
          {/* Quick Add Tile */}
          <button
            onClick={() => setIsManualAddOpen(true)}
            className="p-2.5 rounded-xl border-2 border-dashed border-dairy-300 bg-dairy-50/50 hover:bg-dairy-100/70 text-dairy-800 flex flex-col items-center justify-center text-center transition-all group"
          >
            <Plus className="w-5 h-5 text-dairy-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold mt-1">Manual Add (मैन्युअल)</span>
          </button>

          {animals.map(animal => {
            const isSelected = selectedAnimal?.id === animal.id || selectedAnimal?.tagNo === animal.tagNo;
            return (
              <button
                key={animal.id || animal.tagNo}
                onClick={() => setSelectedAnimal(animal)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-dairy-600 text-white border-dairy-700 shadow-md ring-2 ring-dairy-400'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                    {animal.tagNo}
                  </span>
                  <span>{animal.type === 'cow' ? '🐄' : '🐃'}</span>
                </div>
                <h4 className="font-bold text-xs mt-1 truncate">
                  {animal.name}
                </h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: ENTER QUANTITY */}
      {selectedAnimal && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Milk Quantity / मात्रा ({selectedAnimal.name})
            </span>
            <span className="text-xs font-bold text-dairy-700 bg-dairy-50 px-2 py-0.5 rounded-md">
              {shift === 'morning' ? '🌅 Morning (सुबह)' : '🌇 Evening (शाम)'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setLiters(prev => Math.max(0.5, (parseFloat(prev) || 0) - 0.5).toFixed(1))}
              className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-2xl font-bold flex items-center justify-center active:scale-95 transition-transform"
            >
              -
            </button>

            <div className="text-center px-4">
              <input
                type="number"
                step="0.1"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                className="w-32 text-center text-4xl font-black text-dairy-800 border-b-2 border-dairy-500 focus:outline-none bg-transparent"
              />
              <span className="text-xs font-bold text-slate-400 block mt-1">LITERS (लीटर)</span>
            </div>

            <button
              onClick={() => setLiters(prev => ((parseFloat(prev) || 0) + 0.5).toFixed(1))}
              className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-2xl font-bold flex items-center justify-center active:scale-95 transition-transform"
            >
              +
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {quickNumbers.map(n => (
              <button
                key={n}
                onClick={() => setLiters(String(n))}
                className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                  parseFloat(liters) === n
                    ? 'bg-dairy-600 text-white shadow'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {n}L
              </button>
            ))}
          </div>

          {/* Large Save Button */}
          <button
            onClick={handleSaveMilk}
            className="w-full py-4 rounded-2xl bg-dairy-600 hover:bg-dairy-700 text-white text-base font-black shadow-lg shadow-dairy-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" />
            <span>Save Milk Record (दूध रिकॉर्ड सेव करें - {liters} L)</span>
          </button>
        </div>
      )}

      {/* Sickness Quick Alert Trigger */}
      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-rose-900 text-xs">
            Is any cattle sick or off-feed? (क्या कोई पशु बीमार है?)
          </h4>
          <p className="text-[11px] text-rose-700 mt-0.5">Send instant alert to owner & doctor</p>
        </div>

        <button
          onClick={() => setIsAlertOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
        >
          🚨 Alert (सूचना दें)
        </button>
      </div>

      {/* POPUP 1: Sickness Report */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Report Sickness (बीमारी सूचना - {selectedAnimal?.name})</span>
              </h3>
              <button onClick={() => setIsAlertOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Symptoms / लक्षण
              </label>
              <textarea
                rows="3"
                placeholder="e.g. High fever, off-feed, limping, swelling..."
                value={sicknessNote}
                onChange={(e) => setSicknessNote(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
              ></textarea>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAlertOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Cancel (रद्द करें)
              </button>
              <button
                onClick={handleReportSick}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Send (भेजें)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: Manual Add Animal */}
      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>🐄</span>
                <span>Add Cattle Manually (नया पशु जोड़ें)</span>
              </h3>
              <button onClick={() => setIsManualAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag ID / टैग नं. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COW-109"
                  value={manualForm.tagNo}
                  onChange={(e) => setManualForm({ ...manualForm, tagNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Animal Name / पशु का नाम *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radha, Kamdhenu"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type / प्रकार
                  </label>
                  <select
                    value={manualForm.type}
                    onChange={(e) => setManualForm({ ...manualForm, type: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="cow">🐄 Cow (गाय)</option>
                    <option value="buffalo">🐃 Buffalo (भैंस)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Breed / नस्ल
                  </label>
                  <input
                    type="text"
                    placeholder="Gir / Murrah"
                    value={manualForm.breed}
                    onChange={(e) => setManualForm({ ...manualForm, breed: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-dairy-600 hover:bg-dairy-700 text-white text-xs font-bold shadow"
                >
                  Add & Select (जोड़ें व चुनें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
