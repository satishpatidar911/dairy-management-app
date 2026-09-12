import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Languages, 
  Moon, 
  Sun,
  Smartphone,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export const LoginPage = () => {
  const { validateCredentials, requestOtp, verifyOtpAndLogin, farmProfile } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useApp();

  // Phase: 'credentials' (Step 1: ID & Password) | 'otp' (Step 2: Mobile OTP)
  const [phase, setPhase] = useState('credentials');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Phase States
  const [otp, setOtp] = useState('');
  const [activeOtpInfo, setActiveOtpInfo] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [smsDeliveryInfo, setSmsDeliveryInfo] = useState(null);

  // Feedback States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (phase === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, countdown]);

  // Phase 1: Submit Login ID & Password -> Send OTP to registered phone
  const handleCredentialsSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!loginId.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया लॉगिन आईडी दर्ज करें।' : 'Please enter Login ID.');
      return;
    }
    if (!password) {
      setErrorMsg(lang === 'hi' ? 'कृपया पासवर्ड दर्ज करें।' : 'Please enter Password.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await validateCredentials(loginId, password);
      if (!res.success) {
        setErrorMsg(res.error || (lang === 'hi' ? 'गलत लॉगिन आईडी या पासवर्ड!' : 'Invalid Login ID or Password!'));
        setIsSubmitting(false);
        return;
      }

      const user = res.user;
      setPendingUser(user);

      // Generate and Send OTP to user's registered mobile
      const targetMobile = user.mobile || user.phone || '8770234735';
      const otpRes = await requestOtp(targetMobile);

      if (otpRes.success) {
        setActiveOtpInfo(otpRes);
        setSmsDeliveryInfo(otpRes.smsDelivery || null);
        setPhase('otp');
        setCountdown(60);
        setOtp('');
        if (otpRes.smsDelivery?.sent) {
          setSuccessMsg(lang === 'hi' ? `✓ लाइव SMS आपके मोबाइल ${otpRes.maskedMobile} पर भेज दिया गया है!` : `Live SMS sent to ${otpRes.maskedMobile}!`);
        } else {
          setSuccessMsg(lang === 'hi' ? `OTP मोबाइल नंबर ${otpRes.maskedMobile} पर भेजा गया!` : `OTP sent to ${otpRes.maskedMobile}!`);
        }
      } else {
        setErrorMsg(otpRes.error || (lang === 'hi' ? 'OTP भेजने में विफल!' : 'Failed to send OTP!'));
      }
    } catch (err) {
      setErrorMsg(err.message || 'त्रुटि हुई, कृपया पुनः प्रयास करें');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 2: Verify Mobile OTP -> Enter Dashboard
  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 4) {
      setErrorMsg(lang === 'hi' ? 'कृपया 6-अंकों का सही OTP दर्ज करें।' : 'Please enter valid 6-digit OTP.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const targetMobile = activeOtpInfo?.mobile || pendingUser?.mobile || '8770234735';
      const res = await verifyOtpAndLogin(targetMobile, otp, pendingUser);

      if (res.success) {
        setIsVerifiedSuccess(true);
      } else {
        setErrorMsg(res.error || (lang === 'hi' ? 'गलत OTP! कृपया पुनः प्रयास करें।' : 'Incorrect OTP! Please try again.'));
      }
    } catch (err) {
      setErrorMsg(err.message || 'सत्यापन त्रुटि');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErrorMsg('');
    const targetMobile = activeOtpInfo?.mobile || pendingUser?.mobile || '8770234735';
    const otpRes = await requestOtp(targetMobile);

    if (otpRes.success) {
      setActiveOtpInfo(otpRes);
      setSmsDeliveryInfo(otpRes.smsDelivery || null);
      setCountdown(60);
      if (otpRes.smsDelivery?.sent) {
        setSuccessMsg(lang === 'hi' ? '✓ नया लाइव SMS आपके फोन पर भेजा गया!' : 'New live SMS sent!');
      } else {
        setSuccessMsg(lang === 'hi' ? 'नया OTP सफलतापूर्वक भेजा गया!' : 'New OTP sent successfully!');
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(otpRes.error || 'OTP भेजने में असमर्थ');
    }
  };

  // Numeric keypad helpers for OTP
  const handleNumClick = (digit) => {
    if (phase === 'otp') {
      if (otp.length < 6) {
        setOtp(prev => prev + digit);
        setErrorMsg('');
      }
    }
  };

  const handleBackspace = () => {
    if (phase === 'otp') {
      setOtp(prev => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    if (phase === 'otp') {
      setOtp('');
      setErrorMsg('');
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between p-3 sm:p-6 transition-colors duration-300 relative overflow-hidden ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Dynamic Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Controls (Strict Privacy: No user or gateway management exposed) */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 text-xl font-bold">
            🥛
          </div>
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400 block">
              DAIRY FARM PRO 2.0
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              {farmProfile?.farmName || 'SHIVAJI MILK CENTER'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm"
            title="भाषा बदलें / Change Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'hi' ? 'ENG' : 'हिंदी'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-all cursor-pointer"
            title="Theme Toggle"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-xl mx-auto my-auto py-6 z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/60 relative">
          
          {/* Farm Branding Header */}
          <div className="text-center space-y-1.5 pb-5 border-b border-slate-800/80">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
              {farmProfile?.farmName || 'SHIVAJI MILK CENTER'}
            </h1>
            
            <p className="text-xs font-bold text-emerald-400">
              {farmProfile?.ownerName || 'SATISH PATIDAR'} • {farmProfile?.address || 'CHAKROD KALAPIPAL'}
            </p>

            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {farmProfile?.tagline || 'शुद्ध एवं ताजा दूध, स्वस्थ परिवार (Pure & Fresh Milk)'}
            </p>
          </div>

          {/* PHASE 1: STRICT LOGIN ID & PASSWORD (No demo values, no role picker) */}
          {phase === 'credentials' && (
            <div className="space-y-4 pt-4">
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {/* Login ID Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{lang === 'hi' ? 'लॉगिन आईडी (Login ID / मोबाइल नंबर):' : 'Login ID / Mobile:'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={lang === 'hi' ? 'अपनी लॉगिन आईडी या 10-अंकों का मोबाइल नंबर दर्ज करें' : 'Enter Login ID or Mobile Number'}
                    className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono placeholder:text-slate-600"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'hi' ? 'पासवर्ड (Password):' : 'Password:'}</span>
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder={lang === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter Password'}
                      className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-sm font-mono tracking-wider text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button to Phase 2 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{lang === 'hi' ? 'सत्यापन हो रहा है...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      <span>{lang === 'hi' ? 'लॉगिन करें और मोबाइल OTP भेजें' : 'Login & Send Mobile OTP'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* PHASE 2: CONFIDENTIAL MOBILE OTP VERIFICATION */}
          {phase === 'otp' && (
            <div className="space-y-4 pt-4">
              {/* Back to Step 1 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('credentials');
                    setErrorMsg('');
                    setOtp('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'वापस जाएं (Back)' : 'Back to Login'}</span>
                </button>

                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'चरण 2: मोबाइल OTP' : 'Step 2: Mobile OTP'}</span>
                </span>
              </div>

              {/* User Masked Profile Card */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{pendingUser?.role === 'admin' ? '👑' : (pendingUser?.role === 'manager' ? '📋' : '📱')}</span>
                    <span>{pendingUser?.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    OTP भेजा गया: <span className="text-emerald-400 font-bold">{activeOtpInfo?.maskedMobile || `+91 ******${(pendingUser?.mobile || '4735').slice(-4)}`}</span>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {pendingUser?.role}
                </span>
              </div>

              {/* Real SMS Delivery Notification */}
              {smsDeliveryInfo?.sent ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/50 text-emerald-300 space-y-2 shadow-lg shadow-emerald-950/50 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <Smartphone className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>✓ लाइव SMS आपके मोबाइल पर भेज दिया गया है!</span>
                      </div>
                      <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                        कृपया फोन नंबर <span className="font-bold text-white underline">{activeOtpInfo?.maskedMobile || '+91 ******4735'}</span> का SMS इनबॉक्स देखें।
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-400/80 pt-1.5 border-t border-emerald-500/20">
                    <span>प्रदाता: {smsDeliveryInfo?.provider || 'Fast2SMS'}</span>
                    <a
                      href={`https://wa.me/91${activeOtpInfo?.mobile || '8770234735'}?text=${encodeURIComponent(`नमस्ते! आपका Dairy Farm Pro लॉगिन OTP है: ${activeOtpInfo?.otp}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-300 hover:text-white underline font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp पर भी प्राप्त करें</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/80 text-slate-300 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>रजिस्टर्ड मोबाइल पर OTP भेजा गया है</span>
                    </div>

                    <a
                      href={`https://wa.me/91${activeOtpInfo?.mobile || '8770234735'}?text=${encodeURIComponent(`नमस्ते! आपका Dairy Farm Pro लॉगिन OTP है: ${activeOtpInfo?.otp}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp OTP</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    कृपया अपने मोबाइल नंबर <span className="text-white font-bold">{activeOtpInfo?.maskedMobile || '+91 ******4735'}</span> पर प्राप्त 6-अंकों का OTP नीचे दर्ज करें।
                  </p>
                </div>
              )}

              {/* Success / Toast Banner */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block text-center">
                    {lang === 'hi' ? '6-अंकों का OTP दर्ज करें:' : 'Enter 6-Digit OTP:'}
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtp(val);
                      setErrorMsg('');
                    }}
                    placeholder="••••••"
                    autoFocus
                    className="w-full bg-slate-950/90 border border-emerald-500/80 focus:border-emerald-400 rounded-2xl px-4 py-3.5 text-center text-2xl sm:text-3xl font-mono tracking-[0.4em] text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                  />

                  {/* Numeric Keypad for fast touch input */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNumClick(String(num))}
                        className="py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 active:bg-emerald-600 text-white font-bold text-sm sm:text-base transition-colors border border-slate-700/50 cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleClear}
                      className="py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 font-bold text-xs transition-colors border border-slate-700/40 cursor-pointer"
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumClick('0')}
                      className="py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 active:bg-emerald-600 text-white font-bold text-sm sm:text-base transition-colors border border-slate-700/50 cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className="py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-300 font-bold text-sm transition-colors border border-slate-700/40 cursor-pointer"
                      title="Backspace"
                    >
                      ⌫
                    </button>
                  </div>
                </div>

                {/* Resend OTP Bar */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">
                    {countdown > 0 ? (
                      <span>⏱️ पुनः भेजें ({countdown}s)</span>
                    ) : (
                      <span>OTP नहीं मिला?</span>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0}
                    className={`text-xs font-bold transition-all cursor-pointer ${
                      countdown > 0
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-emerald-400 hover:text-emerald-300 hover:underline'
                    }`}
                  >
                    🔄 {lang === 'hi' ? 'OTP दोबारा भेजें (Resend)' : 'Resend OTP'}
                  </button>
                </div>

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isVerifiedSuccess}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isVerifiedSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 animate-bounce" />
                      <span>{lang === 'hi' ? 'सत्यापित! मुख्य ऐप खुल रहा है...' : 'Verified! Opening Main App...'}</span>
                    </>
                  ) : isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{lang === 'hi' ? 'OTP सत्यापित हो रहा है...' : 'Verifying OTP...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>{lang === 'hi' ? 'सत्यापित करें और मुख्य ऐप खोलें' : 'Verify OTP & Open Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl mx-auto text-center py-2 text-[11px] text-slate-500 font-semibold z-10 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-slate-800/50">
        <div>
          © {new Date().getFullYear()} {farmProfile?.farmName || 'SHIVAJI MILK CENTER'} • All Rights Reserved
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>📞 {farmProfile?.phone || '8770234735'}</span>
          <span>•</span>
          <span>📍 {farmProfile?.address || 'CHAKROD KALAPIPAL'}</span>
        </div>
      </footer>
    </div>
  );
};
