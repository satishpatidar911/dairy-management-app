import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  KeyRound, 
  Phone, 
  Shield, 
  Check, 
  Copy, 
  Trash2, 
  Edit3, 
  Database, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';

export const UserManagementModal = ({ isOpen, onClose }) => {
  const { appUsers, saveAppUser, deleteAppUser } = useAuth();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'sql'
  const [copiedSql, setCopiedSql] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form state for new / edited user
  const [formUser, setFormUser] = useState({
    id: '',
    role: ROLES.WORKER,
    fullName: '',
    loginId: '',
    password: '',
    mobile: '',
    isActive: true
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setFormUser({
      id: '',
      role: ROLES.WORKER,
      fullName: '',
      loginId: '',
      password: '',
      mobile: '',
      isActive: true
    });
    setErrorMsg('');
  };

  const handleEdit = (user) => {
    setFormUser({
      id: user.id || '',
      role: user.role || ROLES.WORKER,
      fullName: user.fullName || user.name || '',
      loginId: user.loginId || '',
      password: user.password || '',
      mobile: user.mobile || user.phone || '',
      isActive: user.isActive !== false
    });
    setActiveTab('add');
    setErrorMsg('');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formUser.loginId.trim() || !formUser.password.trim() || !formUser.mobile.trim()) {
      setErrorMsg('????? ????? ????, ??????? ?? ?????? ???? ??? ?????');
      return;
    }

    const cleanMobile = formUser.mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setErrorMsg('????? 10-????? ?? ??? ?????? ???? ???? ?????');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await saveAppUser({
        ...formUser,
        id: formUser.id || `usr_${Date.now()}`,
        mobile: cleanMobile,
        loginId: formUser.loginId.trim().toLowerCase()
      });

      setSuccessMsg('? ????? ???? ? ??????? ??????? ??? ??????????? ???????? ?? ??!');
      resetForm();
      setActiveTab('list');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || '??????? ??? ??? ???? ??? ?????? ??');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId, loginId) => {
    if (loginId === 'owner' || loginId === 'admin') {
      alert('????? ????? (Owner) ???? ?? ????? ???? ?? ????!');
      return;
    }

    if (window.confirm(`???? ?? ???? "${loginId}" ?? ??????? ?? ????? ????? ????`)) {
      try {
        await deleteAppUser(userId);
        setSuccessMsg('? ???? ??????? ?? ??? ???? ???!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setErrorMsg('????? ???? ??? ??????: ' + err.message);
      }
    }
  };

  const sqlCode = `-- 1. Supabase ??? 'app_users' ???? ?????
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'worker')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. OTP ???? ?????
CREATE TABLE IF NOT EXISTS public.user_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ?????? ?????? (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read app_users" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Allow public update app_users" ON public.app_users FOR UPDATE USING (true);
CREATE POLICY "Allow public insert app_users" ON public.app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public all user_otps" ON public.user_otps FOR ALL USING (true);

-- 4. ????? ????????????? ???? ???? (?? ???? ??? ???? ?? ???? ???? ???)
INSERT INTO public.app_users (login_id, password, full_name, mobile, role)
VALUES
  ('owner', 'owner@123', '???? ????? (?????)', '8770234735', 'admin'),
  ('manager', 'manager@123', '???????? ?? (?????)', '9876543210', 'manager'),
  ('worker', 'worker@123', '?????? ??????', '9876500000', 'worker')
ON CONFLICT (login_id) 
DO UPDATE SET 
  password = EXCLUDED.password,
  mobile = EXCLUDED.mobile,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                ??????? ???? ??? ??????? ??????? (Database Logins)
              </h3>
              <p className="text-xs text-slate-400">
                ?????, ????? ?? ?????? ?? ????? ????, ??????? ? OTP ?????? ????
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-950/70 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setActiveTab('list'); resetForm(); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>??????? ??????? ({appUsers?.length || 3})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('add'); resetForm(); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'add'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ ??? ???? ?????</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase SQL</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: LIST OF DATABASE USERS */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>??????? ??? ???????? ?????? ????? ????:</span>
              <span className="text-[11px] text-emerald-400 font-semibold">? ???-?????? (Auto-Synced)</span>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {(appUsers && appUsers.length > 0 ? appUsers : [
                { id: '1', loginId: 'owner', password: 'owner@123', fullName: '???? ????? (?????)', mobile: '8770234735', role: 'admin' },
                { id: '2', loginId: 'manager', password: 'manager@123', fullName: '???????? ?? (?????)', mobile: '9876543210', role: 'manager' },
                { id: '3', loginId: 'worker', password: 'worker@123', fullName: '?????? ??????', mobile: '9876500000', role: 'worker' }
              ]).map((u) => (
                <div 
                  key={u.id || u.loginId}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                      u.role === 'admin' 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : (u.role === 'manager' 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                    }`}>
                      {u.role === 'admin' ? '??' : (u.role === 'manager' ? '??' : '??')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{u.fullName || u.name}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {u.role === 'admin' ? '?????' : (u.role === 'manager' ? '?????' : '??????')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                        <span className="text-slate-400">
                          ID: <strong className="text-emerald-400 font-mono">{u.loginId}</strong>
                        </span>
                        <span className="text-slate-400">
                          ???????: <strong className="text-amber-300 font-mono">{u.password}</strong>
                        </span>
                        <span className="text-slate-400">
                          OTP ??????: <strong className="text-white font-mono">+91 {u.mobile || u.phone}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(u)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="??????? ???? / ??????? ?????"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {u.loginId !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id, u.loginId)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="?????"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE / EDIT USER FORM */}
        {activeTab === 'add' && (
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                {formUser.id ? '?? ???? ? ??????? ??????? ????:' : '? ??? ???? ? ????? ???? ?????:'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">?? (Role):</label>
                  <select
                    value={formUser.role}
                    onChange={(e) => setFormUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value={ROLES.ADMIN}>?? ????? (Owner / Admin)</option>
                    <option value={ROLES.MANAGER}>?? ????? (Manager / Accountant)</option>
                    <option value={ROLES.WORKER}>?? ?????? (Worker / Delivery)</option>
                  </select>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">???? ??? (Full Name):</label>
                  <input
                    type="text"
                    required
                    value={formUser.fullName}
                    onChange={(e) => setFormUser(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="???: ???? ?????"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Login ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">????? ???? (Login ID):</label>
                  <input
                    type="text"
                    required
                    value={formUser.loginId}
                    onChange={(e) => setFormUser(prev => ({ ...prev, loginId: e.target.value }))}
                    placeholder="???: satish"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">??????? (Password):</label>
                  <input
                    type="text"
                    required
                    value={formUser.password}
                    onChange={(e) => setFormUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="???: pass123"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                {/* Mobile Number for OTP */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    OTP ?????? ???? (Registered Mobile for OTP):
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={formUser.mobile}
                    onChange={(e) => setFormUser(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))}
                    placeholder="10 ????? ?? ?????? ???? (???: 8770234735)"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    * ????? ???? ??? ????? ??? ?? OTP ??? ?????? ???? ?? ???? ??????
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setActiveTab('list'); resetForm(); }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ???? ????
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                {isSaving ? (
                  <span>??? ?? ??? ??...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>??????? ??? ??? ????</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SUPABASE SQL QUERY */}
        {activeTab === 'sql' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  ? Supabase SQL Editor ??? ???? ?? ???? ?? ??? ???:
                </span>
                <a
                  href="https://supabase.com/dashboard/project/bxdbzttbfslaouuhkagp/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:underline font-extrabold flex items-center gap-1"
                >
                  <span>Supabase SQL Editor ?????</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="relative">
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-emerald-300 font-mono max-h-52 overflow-y-auto leading-relaxed select-all">
                  {sqlCode}
                </pre>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md cursor-pointer transition-all"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '???? ?? ???!' : 'SQL ???? ????'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs space-y-1">
                <span className="font-bold">?? Supabase ??? ?? ???? ?? 3 ??? ???:</span>
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-0.5">
                  <li>??? <strong>"SQL ???? ????"</strong> ??? ?? ????? ?????</li>
                  <li><strong>"Supabase SQL Editor ?????"</strong> ???? ?? ????? ?????</li>
                  <li>??? ????? ???? ??? <strong>"RUN"</strong> ??? ??? ???!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
