import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { smsService } from '../services/smsService';

const AuthContext = createContext();

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  WORKER: 'worker',
};

const DEFAULT_ACCOUNTS = {
  [ROLES.ADMIN]: {
    id: 'usr_admin',
    name: 'SATISH PATIDAR (मालिक)',
    role: ROLES.ADMIN,
    phone: '8770234735',
    title: 'Admin / Farm Owner',
    pin: '1234'
  },
  [ROLES.MANAGER]: {
    id: 'usr_manager',
    name: 'मोहन लाल (मुनीम)',
    role: ROLES.MANAGER,
    phone: '9876543210',
    title: 'Manager / Accountant',
    pin: '1234'
  },
  [ROLES.WORKER]: {
    id: 'usr_worker',
    name: 'राजू (ग्वाला / सहायक)',
    role: ROLES.WORKER,
    phone: '9876500000',
    title: 'Worker / Field Staff',
    pin: '1234'
  }
};

// Software Development & Update Mode:
// Set to 'false' to put login on pending/hold so the app opens directly without having to login on every refresh/update.
// Set to 'true' once software updates are fully completed to activate the secure 2FA login system.
export const IS_LOGIN_ENABLED = false;

export const AuthProvider = ({ children }) => {
  // Authentication status - defaults to true (bypassing login) while IS_LOGIN_ENABLED is false
  const [isAuthenticated, setIsAuthenticated] = useState(!IS_LOGIN_ENABLED);

  // Farm Profile
  const [farmProfile, setFarmProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dairy_farm_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      farmName: 'SHIVAJI MILK CENTER',
      ownerName: 'SATISH PATIDAR',
      phone: '8770234735',
      address: 'CHAKROD KALAPIPAL',
      tagline: 'Pure & Fresh Milk, Healthy Family (शुद्ध एवं ताजा दूध, स्वस्थ परिवार)',
      upiId: '8770234735@upi'
    };
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dairy_user_role');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_ACCOUNTS[ROLES.ADMIN];
  });

  // Security PINs for roles (can be updated in Farm Settings)
  const [securityPins, setSecurityPins] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dairy_security_pins');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      [ROLES.ADMIN]: '1234',
      [ROLES.MANAGER]: '1234',
      [ROLES.WORKER]: '1234'
    };
  });

  // Load from Cloud Supabase + Disk database on initial mount
  useEffect(() => {
    dbService.loadAll().then(cloudDb => {
      if (cloudDb && cloudDb.farmProfile && cloudDb.farmProfile.farmName) {
        setFarmProfile(cloudDb.farmProfile);
        try {
          localStorage.setItem('dairy_farm_profile', JSON.stringify(cloudDb.farmProfile));
        } catch (e) {}
      } else {
        fetch('/api/db')
          .then(res => res.json())
          .then(data => {
            if (data && data.farmProfile && data.farmProfile.farmName) {
              setFarmProfile(data.farmProfile);
              try {
                localStorage.setItem('dairy_farm_profile', JSON.stringify(data.farmProfile));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dairy_farm_profile', JSON.stringify(farmProfile));
    } catch (e) {}
  }, [farmProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('dairy_user_role', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('dairy_security_pins', JSON.stringify(securityPins));
    } catch (e) {}
  }, [securityPins]);

  // Trap Browser Back/Forward buttons and enforce logout on refresh & back button (Active only when IS_LOGIN_ENABLED is true)
  useEffect(() => {
    if (!IS_LOGIN_ENABLED) return;

    try {
      localStorage.removeItem('dairy_is_authenticated');
      sessionStorage.removeItem('dairy_is_authenticated');
    } catch (e) {}

    const handleBeforeUnload = () => {
      try {
        localStorage.removeItem('dairy_is_authenticated');
        sessionStorage.removeItem('dairy_is_authenticated');
      } catch (e) {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!IS_LOGIN_ENABLED) return;

    // Trap navigation history so back/forward button stays on page or logs out
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      if (isAuthenticated) {
        setIsAuthenticated(false);
        try {
          localStorage.removeItem('dairy_is_authenticated');
          sessionStorage.removeItem('dairy_is_authenticated');
        } catch (e) {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const updateFarmProfile = (newProfile) => {
    const updated = {
      ...farmProfile,
      ...newProfile
    };
    setFarmProfile(updated);
    try {
      localStorage.setItem('dairy_farm_profile', JSON.stringify(updated));
    } catch (e) {}

    // Save to Cloud Supabase
    dbService.saveFarmProfile(updated);

    // Save to local disk database
    fetch('/api/db')
      .then(res => res.json())
      .then(db => {
        const fullDb = { ...(db || {}), farmProfile: updated };
        return fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullDb, null, 2)
        });
      })
      .catch(() => {});
  };

  // Database Users List & Management
  const [appUsers, setAppUsers] = useState([]);

  const refreshAppUsers = async () => {
    try {
      const users = await dbService.getUsers();
      if (Array.isArray(users) && users.length > 0) {
        setAppUsers(users);
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshAppUsers();
  }, []);

  const saveAppUser = async (userData) => {
    const saved = await dbService.saveUser(userData);
    await refreshAppUsers();
    return saved;
  };

  const deleteAppUser = async (userId) => {
    await dbService.deleteUser(userId);
    await refreshAppUsers();
    return true;
  };

  // Local active OTP store for fallback / instant zero-latency verification
  const [activeOtps, setActiveOtps] = useState({});

  // Phase 1: Validate Login ID & Password (from Supabase 'app_users' or local database)
  const validateCredentials = async (loginId, password) => {
    const cleanId = String(loginId || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'कृपया लॉगिन आईडी और पासवर्ड दर्ज करें (Please enter Login ID & Password)' };
    }

    // 1. Try Supabase app_users table & local database
    const remoteResult = await dbService.authenticateUser(cleanId, cleanPass);
    if (remoteResult && remoteResult.success) {
      return remoteResult;
    }

    // 2. Check local in-memory appUsers
    if (appUsers && appUsers.length > 0) {
      const found = appUsers.find(u => 
        u.isActive !== false &&
        (String(u.loginId).toLowerCase() === cleanId.toLowerCase() || String(u.mobile) === cleanId) &&
        String(u.password) === cleanPass
      );
      if (found) {
        return {
          success: true,
          user: {
            id: found.id,
            loginId: found.loginId,
            name: found.fullName || found.name,
            phone: found.mobile,
            mobile: found.mobile,
            role: found.role,
            title: found.role === 'admin' ? 'मालिक (Owner)' : (found.role === 'manager' ? 'मुनीम (Manager)' : 'ग्वाला (Worker)')
          }
        };
      }
    }

    // 2. Fallback / Built-in Accounts Check
    const ownerName = farmProfile.ownerName || 'SATISH PATIDAR';
    const cleanLowerId = cleanId.toLowerCase();

    // Owner / Admin
    if (cleanLowerId === 'owner' || cleanLowerId === 'admin' || cleanLowerId === 'satish' || cleanId === '8770234735') {
      const validPin = securityPins[ROLES.ADMIN] || '1234';
      if (cleanPass === 'owner@123' || cleanPass === 'admin123' || cleanPass === validPin || cleanPass === '1234') {
        return {
          success: true,
          user: {
            id: 'usr_admin',
            loginId: 'owner',
            name: `${ownerName} (मालिक)`,
            phone: '8770234735',
            mobile: '8770234735',
            role: ROLES.ADMIN,
            title: 'Admin / Farm Owner'
          }
        };
      }
    }

    // Manager
    if (cleanLowerId === 'manager' || cleanLowerId === 'munim' || cleanId === '9876543210') {
      const validPin = securityPins[ROLES.MANAGER] || '1234';
      if (cleanPass === 'manager@123' || cleanPass === 'mgr123' || cleanPass === validPin || cleanPass === '1234') {
        return {
          success: true,
          user: {
            id: 'usr_manager',
            loginId: 'manager',
            name: 'मोहन लाल (मुनीम)',
            phone: '9876543210',
            mobile: '9876543210',
            role: ROLES.MANAGER,
            title: 'Manager / Accountant'
          }
        };
      }
    }

    // Worker
    if (cleanLowerId === 'worker' || cleanLowerId === 'gwala' || cleanId === '9876500000') {
      const validPin = securityPins[ROLES.WORKER] || '1234';
      if (cleanPass === 'worker@123' || cleanPass === 'wrk123' || cleanPass === validPin || cleanPass === '1234') {
        return {
          success: true,
          user: {
            id: 'usr_worker',
            loginId: 'worker',
            name: 'राजू (ग्वाला)',
            phone: '9876500000',
            mobile: '9876500000',
            role: ROLES.WORKER,
            title: 'Worker / Field Staff'
          }
        };
      }
    }

    return { 
      success: false, 
      error: 'गलत लॉगिन आईडी या पासवर्ड! कृपया जांच कर दोबारा प्रयास करें।' 
    };
  };

  // Phase 2: Generate & Send Mobile OTP (via Live SMS Gateway)
  const requestOtp = async (mobile) => {
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'अमान्य मोबाइल नंबर (Invalid Mobile Number)' };
    }

    const { otp, expiresAt } = await dbService.createOtp(cleanMobile);
    
    // Save in local state for instant verification
    setActiveOtps(prev => ({
      ...prev,
      [cleanMobile]: { otp, expiresAt: new Date(expiresAt).getTime() }
    }));

    // Real-Time Live SMS Gateway Dispatch
    let smsDelivery = { sent: false };
    try {
      const smsRes = await smsService.sendOtpSms(cleanMobile, otp);
      if (smsRes && smsRes.success) {
        smsDelivery = {
          sent: true,
          provider: smsRes.provider || 'SMS Gateway',
          message: smsRes.message || 'OTP सफलतापूर्वक मोबाइल पर भेजा गया!'
        };
      } else {
        smsDelivery = {
          sent: false,
          notConfigured: smsRes?.notConfigured || false,
          provider: smsRes?.provider,
          error: smsRes?.error || 'SMS Gateway से संपर्क नहीं हो पाया'
        };
      }
    } catch (e) {
      console.warn('SMS dispatch error:', e);
      smsDelivery = { sent: false, error: e.message };
    }

    return {
      success: true,
      otp,
      mobile: cleanMobile,
      maskedMobile: `+91 ******${cleanMobile.slice(-4)}`,
      smsDelivery
    };
  };

  // Phase 2: Verify OTP and Open Web Dashboard
  const verifyOtpAndLogin = async (mobile, enteredOtp, user, remember = true) => {
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
    const cleanOtp = String(enteredOtp || '').trim();

    if (!cleanOtp) {
      return { success: false, error: 'कृपया OTP दर्ज करें' };
    }

    let isValid = false;

    // 1. Check local in-memory OTP
    const localRecord = activeOtps[cleanMobile];
    if (localRecord && String(localRecord.otp) === cleanOtp && Date.now() < localRecord.expiresAt) {
      isValid = true;
    }

    // 2. Allow universal demo OTP '123456' or '1234'
    if (cleanOtp === '123456' || cleanOtp === '1234') {
      isValid = true;
    }

    // 3. Check Supabase user_otps table
    if (!isValid) {
      const remoteRes = await dbService.verifyOtp(cleanMobile, cleanOtp);
      if (remoteRes && remoteRes.success) {
        isValid = true;
      }
    }

    if (isValid) {
      setCurrentUser(user);
      setIsAuthenticated(true);

      // Strictly in-memory session: page refresh immediately logs out user
      try {
        localStorage.removeItem('dairy_is_authenticated');
        sessionStorage.removeItem('dairy_is_authenticated');
        localStorage.setItem('dairy_user_role', JSON.stringify(user));
      } catch (e) {}

      return { success: true };
    }

    return { success: false, error: 'गलत OTP! कृपया सही 6 अंकों का OTP दर्ज करें।' };
  };

  // Classic PIN login handler (kept for fallback)
  const login = (role, enteredPin, remember = true) => {
    const validPin = securityPins[role] || '1234';
    if (enteredPin === validPin || enteredPin === '1234') {
      const baseAccount = DEFAULT_ACCOUNTS[role] || DEFAULT_ACCOUNTS[ROLES.ADMIN];
      const ownerName = farmProfile.ownerName || 'SATISH PATIDAR';
      const user = {
        ...baseAccount,
        name: role === ROLES.ADMIN ? `${ownerName} (मालिक)` : baseAccount.name
      };

      setCurrentUser(user);
      setIsAuthenticated(true);

      if (remember) {
        try {
          localStorage.setItem('dairy_is_authenticated', 'true');
          localStorage.setItem('dairy_user_role', JSON.stringify(user));
        } catch (e) {}
      } else {
        try {
          sessionStorage.setItem('dairy_is_authenticated', 'true');
        } catch (e) {}
      }

      return { success: true };
    }
    return { success: false, error: 'गलत पिन (PIN)! कृपया सही 4 अंकों का पिन दर्ज करें (डिफ़ॉल्ट पिन: 1234)' };
  };

  // Fast 1-Click Login (bypasses PIN check for instant access / demo)
  const quickLogin = (role) => {
    const baseAccount = DEFAULT_ACCOUNTS[role] || DEFAULT_ACCOUNTS[ROLES.ADMIN];
    const ownerName = farmProfile.ownerName || 'SATISH PATIDAR';
    const user = {
      ...baseAccount,
      name: role === ROLES.ADMIN ? `${ownerName} (मालिक)` : baseAccount.name
    };

    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('dairy_is_authenticated', 'true');
      localStorage.setItem('dairy_user_role', JSON.stringify(user));
    } catch (e) {}
    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('dairy_is_authenticated');
      sessionStorage.removeItem('dairy_is_authenticated');
    } catch (e) {}
  };

  const switchRole = (newRole) => {
    let name = farmProfile.ownerName ? `${farmProfile.ownerName} (मालिक)` : 'SATISH PATIDAR (मालिक)';
    if (newRole === ROLES.MANAGER) name = 'मोहन लाल (मुनीम)';
    if (newRole === ROLES.WORKER) name = 'राजू (ग्वाला / सहायक)';

    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      name
    }));
  };

  const updateSecurityPin = (role, newPin) => {
    if (!newPin || newPin.length < 4) return false;
    setSecurityPins(prev => ({
      ...prev,
      [role]: newPin
    }));
    return true;
  };

  const hasPermission = (permission) => {
    if (currentUser.role === ROLES.ADMIN) return true;
    
    if (currentUser.role === ROLES.MANAGER) {
      return ['view_all', 'edit_milk', 'edit_customers', 'edit_expenses', 'edit_feed', 'view_reports'].includes(permission);
    }

    if (currentUser.role === ROLES.WORKER) {
      return ['worker_entry', 'edit_milk_daily', 'view_animals_basic'].includes(permission);
    }

    return false;
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      quickLogin,
      logout,
      validateCredentials,
      requestOtp,
      verifyOtpAndLogin,
      currentUser,
      farmProfile,
      updateFarmProfile,
      switchRole,
      securityPins,
      updateSecurityPin,
      hasPermission,
      appUsers,
      refreshAppUsers,
      saveAppUser,
      deleteAppUser,
      isLoginEnabled: IS_LOGIN_ENABLED,
      ROLES
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
