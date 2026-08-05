import React from 'react';
import { DataSekolah, ProfilGuru, ActiveTab } from '../types';
import { Moon, Sun, User, RefreshCw, School } from 'lucide-react';

interface HeaderProps {
  sekolah?: DataSekolah;
  dataSekolah?: DataSekolah;
  guru?: ProfilGuru;
  profilGuru?: ProfilGuru;
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  isDarkMode?: boolean;
  darkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
  onToggleDarkMode?: () => void;
  onSyncData?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  sekolah,
  dataSekolah,
  guru,
  profilGuru,
  setActiveTab,
  isDarkMode,
  darkMode,
  setIsDarkMode,
  onToggleDarkMode,
  onSyncData,
  isSyncing,
}) => {
  const currentSekolah = sekolah || dataSekolah;
  const currentGuru = guru || profilGuru;
  const activeDark = isDarkMode ?? darkMode ?? false;

  const handleToggleDark = () => {
    if (onToggleDarkMode) onToggleDarkMode();
    if (setIsDarkMode) setIsDarkMode(!activeDark);
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* School Branding */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
          {currentSekolah?.logoSekolahUrl ? (
            <img
              src={currentSekolah.logoSekolahUrl}
              alt={currentSekolah.namaSekolah || 'Logo'}
              className="w-full h-full object-contain p-0.5"
            />
          ) : (
            <School className="w-5 h-5 text-slate-500" />
          )}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
            {currentSekolah?.namaSekolah || 'SMA Negeri 1 Permata Bangsa'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-sm sm:max-w-md">
            {currentSekolah?.alamatLengkap || 'Jl. Merdeka No. 123, Kota Pendidikan'}
          </p>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-4 sm:gap-6">
        {onSyncData && (
          <button
            onClick={onSyncData}
            disabled={isSyncing}
            title="Sinkronisasi ke Google Spreadsheet"
            className="p-2 text-slate-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-violet-600' : ''}`} />
          </button>
        )}

        <button
          onClick={handleToggleDark}
          title={activeDark ? 'Mode Terang' : 'Mode Gelap'}
          className="p-2 text-slate-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {activeDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        <button
          onClick={() => setActiveTab && setActiveTab('profil')}
          className="flex items-center gap-3 text-right hover:opacity-90 transition-opacity"
        >
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {currentGuru?.namaGuru || 'Drs. Bambang Haryanto'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
              {currentGuru?.nip ? `NIP. ${currentGuru.nip}` : 'Guru Mata Pelajaran'}
            </p>
          </div>
          <div className="w-10 h-10 bg-violet-100 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
            {currentGuru?.fotoProfilUrl ? (
              <img
                src={currentGuru.fotoProfilUrl}
                alt={currentGuru.namaGuru}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-violet-600" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

