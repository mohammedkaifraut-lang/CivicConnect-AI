import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { PublicFeed } from './components/PublicFeed';
import { PublicMap } from './components/PublicMap';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CitizenIdModal } from './components/CitizenIdModal';
import { ReportProblemModal } from './components/ReportProblemModal';
import {
  subscribeAllComplaints,
  subscribeCitizenComplaints
} from './lib/firebase';
import { seedInitialDataIfEmpty, getInitialSampleComplaints } from './lib/seedData';
import type { Complaint } from './types';
import { Shield, Sparkles, Building2, HeartHandshake } from 'lucide-react';

function MainApp() {
  const {
    currentUser,
    userProfile,
    isAdmin,
    newCitizenIdCelebration,
    dismissCitizenIdCelebration
  } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'citizen-dash' | 'admin-dash' | 'analytics'>('feed');
  const [allComplaints, setAllComplaints] = useState<Complaint[]>(getInitialSampleComplaints());
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  
  // Modals state
  const [isCitizenAuthOpen, setIsCitizenAuthOpen] = useState(false);
  const [citizenAuthMode, setCitizenAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Subscribe to all complaints in Firestore
  useEffect(() => {
    const unsubscribe = subscribeAllComplaints((list) => {
      if (list.length > 0) {
        setAllComplaints(list);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // When user is authenticated, attempt seed if collection is empty
  useEffect(() => {
    if (currentUser) {
      seedInitialDataIfEmpty();
    }
  }, [currentUser]);

  // Subscribe to citizen's own complaints
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeCitizenComplaints(currentUser.uid, (list) => {
        setMyComplaints(list);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      setMyComplaints([]);
    }
  }, [currentUser]);

  // Handle opening citizen auth
  const handleOpenCitizenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setCitizenAuthMode(mode);
    setIsCitizenAuthOpen(true);
  };

  // Handle opening admin auth
  const handleOpenAdminAuth = () => {
    setIsAdminAuthOpen(true);
  };

  // Handle report submitted callback
  const handleReportSubmitted = (_newComplaint: Complaint) => {
    // Navigate to citizen dashboard to track the live progress timeline
    setActiveTab('citizen-dash');
  };

  // If a normal user tries to access the Owner Dashboard: deny access & redirect to Owner Login
  useEffect(() => {
    if (activeTab === 'admin-dash' && !isAdmin) {
      setIsAdminAuthOpen(true);
    }
  }, [activeTab, isAdmin]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-[Inter,sans-serif] text-slate-900">
      
      {/* Global Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCitizenAuth={handleOpenCitizenAuth}
        onOpenAdminAuth={handleOpenAdminAuth}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTab === 'feed' && (
          <PublicFeed
            complaints={allComplaints}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onOpenCitizenAuth={handleOpenCitizenAuth}
          />
        )}

        {activeTab === 'map' && (
          <PublicMap
            complaints={allComplaints}
          />
        )}

        {activeTab === 'citizen-dash' && (
          currentUser ? (
            <CitizenDashboard
              myComplaints={myComplaints}
              allComplaints={allComplaints}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Shield size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{t('dash.signInRequired')}</h2>
              <p className="text-xs text-slate-500">
                {t('dash.signInDesc')}
              </p>
              <button
                onClick={() => handleOpenCitizenAuth('signin')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {t('dash.signInBtn')}
              </button>
            </div>
          )
        )}

        {activeTab === 'admin-dash' && (
          isAdmin ? (
            <AdminDashboard
              complaints={allComplaints}
            />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 text-white rounded-2xl border border-slate-800 text-center shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                <Building2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">{t('auth.restrictedTitle')}</h2>
              <p className="text-xs text-slate-400">
                {t('auth.restrictedDesc')}
              </p>
              <button
                onClick={handleOpenAdminAuth}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {t('auth.openOwnerLogin')}
              </button>
            </div>
          )
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView complaints={allComplaints} />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={isCitizenAuthOpen}
        initialMode={citizenAuthMode}
        onClose={() => setIsCitizenAuthOpen(false)}
      />

      <AdminLoginModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => setActiveTab('admin-dash')}
      />

      {/* Unique Citizen ID Celebration Modal */}
      {newCitizenIdCelebration && (
        <CitizenIdModal
          citizenId={newCitizenIdCelebration}
          userName={userProfile?.name || 'Verified Citizen'}
          onClose={dismissCitizenIdCelebration}
        />
      )}

      {/* Report Problem Flow Modal */}
      <ReportProblemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        allComplaints={allComplaints}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Civic Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
              CC
            </div>
            <span className="font-bold text-slate-800">CivicConnect AI</span>
            <span>• Smart Municipal Problem Reporting & Resolution Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini 3.8 & Firestore</span>
            <span>•</span>
            <button
              onClick={handleOpenAdminAuth}
              className="text-slate-500 hover:text-slate-800 font-medium"
            >
              Restricted Admin Entry
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
