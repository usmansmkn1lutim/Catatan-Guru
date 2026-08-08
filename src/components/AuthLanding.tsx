import React, { useState } from 'react';
import { AppUser } from '../types';
import { loadUsersList, saveUsersList, saveSessionUser } from '../lib/storage';
import { getStoredGasUrl, loginUserViaGas, registerUserViaGas } from '../lib/gasApi';
import {
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  School,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

interface AuthLandingProps {
  onLoginSuccess: (user: AppUser) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onLoginSuccess, showToast }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const gasUrl = getStoredGasUrl();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const emailClean = loginEmail.trim().toLowerCase();
    const passwordClean = loginPassword;

    if (!emailClean || !passwordClean) {
      setErrorMsg('Email dan Password wajib diisi.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Try online login via GAS if URL configured
      if (gasUrl) {
        try {
          const res = await loginUserViaGas(gasUrl, emailClean, passwordClean);
          if (res && res.status === 'success' && res.user) {
            const user: AppUser = res.user;
            saveSessionUser(user);
            setSuccessMsg(`Selamat datang kembali, ${user.name}!`);
            if (showToast) showToast(`Login berhasil sebagai ${user.role.toUpperCase()}`, 'success');
            setTimeout(() => onLoginSuccess(user), 500);
            return;
          } else if (res && res.message) {
            throw new Error(res.message);
          }
        } catch (gasErr: any) {
          console.warn('GAS Auth failed, falling back to LocalStorage Auth:', gasErr);
        }
      }

      // 2. Fallback to LocalStorage Auth
      const users = loadUsersList();
      const foundUser = users.find((u) => {
        const uEmail = u.email.trim().toLowerCase();
        if (uEmail !== emailClean) return false;
        
        // Exact match
        if (u.password === passwordClean || u.password_hash === passwordClean) return true;
        
        // Fallback for default admin
        if (uEmail === 'admin@sekolah.sch.id' && (passwordClean === 'admin123' || passwordClean === 'admin')) return true;
        
        // Fallback for default guru
        if (uEmail === 'bambang@sekolah.sch.id' && (passwordClean === 'guru123' || passwordClean === 'guru')) return true;

        return false;
      });

      if (foundUser) {
        saveSessionUser(foundUser);
        setSuccessMsg(`Selamat datang kembali, ${foundUser.name}!`);
        if (showToast) showToast(`Login berhasil sebagai ${foundUser.role.toUpperCase()}`, 'success');
        setTimeout(() => onLoginSuccess(foundUser), 500);
      } else {
        setErrorMsg('Email atau password salah! (Coba demo account di bawah)');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Semua kolom pendaftaran wajib diisi.');
      setIsLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password.');
      setIsLoading(false);
      return;
    }

    const emailClean = regEmail.trim().toLowerCase();

    try {
      // 1. Try online register via GAS if URL configured
      if (gasUrl) {
        try {
          const res = await registerUserViaGas(gasUrl, regName.trim(), emailClean, regPassword);
          if (res && res.status === 'success' && res.user) {
            const newUser: AppUser = res.user;
            // Also sync to local users list
            const localUsers = loadUsersList();
            if (!localUsers.some((u) => u.email.toLowerCase() === emailClean)) {
              saveUsersList([...localUsers, newUser]);
            }
            saveSessionUser(newUser);
            setSuccessMsg('Pendaftaran akun Guru berhasil!');
            if (showToast) showToast('Akun Guru berhasil dibuat!', 'success');
            setTimeout(() => onLoginSuccess(newUser), 600);
            return;
          } else if (res && res.message) {
            throw new Error(res.message);
          }
        } catch (gasErr: any) {
          console.warn('GAS Register failed, fallback to LocalStorage:', gasErr);
        }
      }

      // 2. Fallback to LocalStorage Register
      const users = loadUsersList();
      if (users.some((u) => u.email.toLowerCase() === emailClean)) {
        setErrorMsg('Email ini sudah terdaftar. Silakan gunakan email lain atau login.');
        setIsLoading(false);
        return;
      }

      const newUser: AppUser = {
        id: `usr-${Date.now()}`,
        name: regName.trim(),
        email: emailClean,
        role: 'guru', // Default role for sign up is Guru
        password: regPassword,
        createdAt: new Date().toISOString().split('T')[0],
      };

      saveUsersList([...users, newUser]);
      saveSessionUser(newUser);
      setSuccessMsg('Akun Guru berhasil dibuat!');
      if (showToast) showToast('Registrasi Akun Guru Berhasil', 'success');
      setTimeout(() => onLoginSuccess(newUser), 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftarkan akun.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: 'admin' | 'guru') => {
    if (role === 'admin') {
      setLoginEmail('admin@sekolah.sch.id');
      setLoginPassword('admin123');
    } else {
      setLoginEmail('bambang@sekolah.sch.id');
      setLoginPassword('guru123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden relative z-10 my-8">
        {/* Header Branding */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-800 to-slate-800/40 border-b border-slate-700/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-600/30 mb-4 ring-4 ring-violet-500/20">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Catatan Guru Veri 1.0</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Sistem Informasi & Administrasi Guru Terintegrasi
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-700/80 bg-slate-900/50 p-1.5 m-6 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'login'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk (Login)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'register'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Guru</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-8 pt-2">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-3 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email atau Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="nama@sekolah.sch.id"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password Sesi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Aplikasi</span>
                  </>
                )}
              </button>

              {/* Quick Demo Credentials */}
              <div className="pt-4 border-t border-slate-700/60 mt-6">
                <p className="text-[11px] font-semibold text-slate-400 mb-2.5 text-center flex items-center justify-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Atau Uji Coba Cepat (Demo Account):</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin')}
                    className="py-2 px-3 bg-slate-900/90 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-[11px] font-bold text-violet-400 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                    <span>Login Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('guru')}
                    className="py-2 px-3 bg-slate-900/90 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-[11px] font-bold text-emerald-400 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Login Guru</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nama Lengkap & Gelar
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dra. Siti Rahmawati, M.Pd"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Email Guru
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="guru@sekolah.sch.id"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Ulangi Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/50 border border-slate-700/60 rounded-xl text-[10px] text-slate-400">
                <span className="font-bold text-emerald-400">Catatan Role:</span> Pendaftaran publik ini otomatis mendapatkan akses sebagai <strong className="text-white">Role: Guru</strong>.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftarkan Akun Guru</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
