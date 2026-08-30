import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Shield,
  PlusCircle,
  MapPin,
  ListFilter,
  BarChart3,
  Lock,
  User,
  LogOut,
  Building,
  Sparkles,
  Layers,
  ChevronDown,
  Globe
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'map' | 'citizen-dash' | 'admin-dash' | 'analytics';
  setActiveTab: (tab: 'feed' | 'map' | 'citizen-dash' | 'admin-dash' | 'analytics') => void;
  onOpenCitizenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenAdminAuth: () => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCitizenAuth,
  onOpenAdminAuth,
  onOpenReportModal
}) => {
  const { currentUser, userProfile, isAdmin, isCitizen, logout } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                    {t('app.title')}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {t('app.subtitle')}
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'feed'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers size={14} />
              <span>{t('nav.publicFeed')}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MapPin size={14} />
              <span>{t('nav.liveMap')}</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveTab('citizen-dash')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'citizen-dash'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <User size={14} />
                <span>{t('nav.myComplaints')}</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin-dash')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'admin-dash'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <Building size={14} />
                <span>{t('nav.adminConsole')}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 size={14} />
              <span>{t('nav.analytics')}</span>
            </button>
          </nav>

          {/* Right Action & Authentication Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Toggle Button: EN / मराठी */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  language === 'en'
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  language === 'mr'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* Report a Problem Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenCitizenAuth('signin');
                } else {
                  onOpenReportModal();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all"
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">{t('nav.reportProblem')}</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* If NOT logged in: Two distinct entry points */}
            {!currentUser ? (
              <div className="flex items-center gap-2">
                {/* 1. Citizen Login (Primary) */}
                <button
                  onClick={() => onOpenCitizenAuth('signin')}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  {t('nav.userLogin')}
                </button>

                {/* 2. Owner/Admin Login (Secondary / Outlined / Restricted) */}
                <button
                  onClick={onOpenAdminAuth}
                  title="Restricted access for municipal administrators"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-slate-800 hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-all"
                >
                  <Lock size={12} className="text-slate-500" />
                  <span className="hidden lg:inline">{t('nav.ownerLogin')}</span>
                  <span className="lg:hidden">{t('nav.admin')}</span>
                </button>
              </div>
            ) : (
              /* If Logged In: Profile & Role information */
              <div className="flex items-center gap-2">
                {userProfile?.citizenId && (
                  <div
                    onClick={() => setActiveTab('citizen-dash')}
                    className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-900"
                  >
                    <span className="text-[10px] uppercase font-bold text-blue-600">ID:</span>
                    <span className="font-mono text-xs font-bold tracking-wider text-blue-950">
                      {userProfile.citizenId}
                    </span>
                  </div>
                )}

                {isAdmin && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
                    <Shield size={12} />
                    <span>{t('nav.admin')}</span>
                  </span>
                )}

                {/* Account Actions / Logout */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-700 hidden md:block max-w-[120px] truncate">
                    {userProfile?.name || currentUser.displayName || 'Citizen'}
                  </span>
                  <button
                    onClick={logout}
                    title={t('nav.signOut')}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-2.5 py-1 rounded-md font-medium ${
              activeTab === 'feed' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            {t('nav.publicFeed')}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2.5 py-1 rounded-md font-medium ${
              activeTab === 'map' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            {t('nav.liveMap')}
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveTab('citizen-dash')}
              className={`px-2.5 py-1 rounded-md font-medium ${
                activeTab === 'citizen-dash' ? 'text-blue-600 font-bold' : 'text-slate-600'
              }`}
            >
              {t('nav.myComplaints')}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin-dash')}
              className={`px-2.5 py-1 rounded-md font-bold text-red-600 ${
                activeTab === 'admin-dash' ? 'bg-red-50' : ''
              }`}
            >
              {t('nav.adminConsole')}
            </button>
          )}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-2.5 py-1 rounded-md font-medium ${
              activeTab === 'analytics' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            {t('nav.analytics')}
          </button>
        </div>
      </div>
    </header>
  );
};
