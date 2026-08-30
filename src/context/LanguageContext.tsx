import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'app.title': 'CivicConnect',
    'app.subtitle': 'Smart Municipal Resolution',
    'nav.publicFeed': 'Public Feed',
    'nav.liveMap': 'Live City Map',
    'nav.myComplaints': 'My Complaints',
    'nav.adminConsole': 'Admin Console',
    'nav.analytics': 'Analytics',
    'nav.reportProblem': 'Report a Problem',
    'nav.userLogin': 'User Login',
    'nav.ownerLogin': 'Owner Login',
    'nav.admin': 'Admin',
    'nav.signOut': 'Sign Out',
    'nav.citizenId': 'Citizen ID',

    // Hero Section
    'hero.badge': 'Next-Gen Civic AI Intelligence & Resolution Pipeline',
    'hero.title1': 'Report Civic Issues.',
    'hero.title2': 'Track Direct Resolution.',
    'hero.description': 'CivicConnect AI bridges citizens directly with city departments. Snap a photo of potholes, garbage piles, broken lights, or water leaks — our AI engine auto-classifies the issue, predicts priority, and dispatches work orders to municipal field crews.',
    'hero.reportCta': 'Report a Civic Problem',
    'hero.citizenIdCta': 'Get Official Citizen ID',
    'hero.totalReports': 'Total Reports',
    'hero.activePipeline': 'Active Pipeline',
    'hero.remediated': 'Remediated & Verified',
    'hero.aiClassification': 'AI Classification',

    // Categories
    'cat.pothole': 'Pothole / Road Damage',
    'cat.garbage': 'Garbage & Waste Pile',
    'cat.streetlight': 'Streetlight Outage / Dark Zone',
    'cat.water_leak': 'Water Leak / Pipeline Burst',
    'cat.damaged_facility': 'Damaged Public Facility',

    // Statuses
    'status.reported': 'Reported',
    'status.verified': 'Verified',
    'status.assigned': 'Assigned',
    'status.in_progress': 'In Progress',
    'status.resolved': 'Resolved',
    'status.all': 'All Statuses',
    'cat.all': 'All Categories',

    // Common UI
    'common.searchPlaceholder': 'Search reports by issue, street address, Citizen ID...',
    'common.upvote': 'Upvote',
    'common.upvotes': 'upvotes',
    'common.citizen': 'Citizen',
    'common.ward': 'Ward',
    'common.priority': 'Priority',
    'common.share': 'Share Certificate',
    'common.download': 'Download Certificate',
    'common.riskForecast': 'Risk Forecast',
    'common.trustedReporter': 'Trusted Reporter',
    'common.trustScore': 'Trust Score',
    'common.noComplaints': 'No complaints found',
    'common.adjustFilters': 'Try adjusting your filters or submit a new report.',

    // Analytics & Leaderboard
    'analytics.title': 'City Municipal Analytics & Resolution Transparency',
    'analytics.subtitle': 'Real-time public benchmarks across city infrastructure departments & wards',
    'analytics.wardReportCard': 'Ward Accountability Report Card',
    'analytics.wardSubtitle': 'Ranked municipal performance leaderboard across PCMC Administrative Wards',
    'analytics.rank': 'Rank',
    'analytics.wardName': 'Ward & Jurisdiction',
    'analytics.avgResolutionTime': 'Avg Resolution Time',
    'analytics.pending': 'Pending',
    'analytics.resolvedCount': 'Resolved',
    'analytics.resolutionRate': 'Resolution Rate',
    'analytics.statusBadge': 'Performance Status',
    'analytics.topPerforming': 'Top Performing',
    'analytics.needsAttention': 'Action Required',
    'analytics.moderate': 'Standard SLA',

    // Citizen Dashboard
    'dash.mySubmitted': 'My Submitted Complaints',
    'dash.liveTracking': 'Live municipal tracking with status timelines',
    'dash.filterAll': 'All',
    'dash.filterActive': 'Active',
    'dash.filterResolved': 'Resolved',
    'dash.trustLevel': 'Trust & Reputation Level',
    'dash.trustBadge': 'Trusted Citizen Reporter',
    'dash.trustDesc': 'Your reports are prioritized based on verified accuracy and civic contribution.',
    'dash.shareResolution': 'Get Resolution Certificate',
    'dash.confirmResolution': 'Confirm Resolution',
    'dash.flagUnresolved': 'Not Resolved',

    // Map & Hotspots
    'map.title': 'Public Civic Issue Map',
    'map.subtitle': 'Geospatial citywide visualization of reported problems and municipal resolution statuses',
    'map.riskHotspots': 'AI Risk Forecast Hotspots',
    'map.riskActive': 'Risk Forecast Active',
    'map.hotspotTitle': 'Predictive Hotspot Risk',
    'map.hotspotDesc': 'Areas with historical complaint clustering requiring preventive municipal maintenance',

    // Certificate
    'cert.title': 'Official Municipal Resolution Certificate',
    'cert.subtitle': 'Civic Issue Remediated & Citizen Verified',
    'cert.resolvedIn': 'Resolved In',
    'cert.verifiedBy': 'Verified Citizen ID',
    'cert.officialStamp': 'OFFICIALLY REMEDIATED',
    'cert.downloadBtn': 'Download PNG Certificate',
    'cert.shareBtn': 'Share Accomplishment'
  },
  mr: {
    // Brand & Header
    'app.title': 'सिव्हिक-कनेक्ट',
    'app.subtitle': 'स्मार्ट महानगरपालिका तक्रार निवारण',
    'nav.publicFeed': 'सार्वजनिक फीड',
    'nav.liveMap': 'थेट शहर नकाशा',
    'nav.myComplaints': 'माझ्या तक्रारी',
    'nav.adminConsole': 'प्रशासन कक्ष',
    'nav.analytics': 'विश्लेषिकी',
    'nav.reportProblem': 'समस्या नोंदवा',
    'nav.userLogin': 'नागरिक लॉगिन',
    'nav.ownerLogin': 'प्रशासक लॉगिन',
    'nav.admin': 'प्रशासक',
    'nav.signOut': 'बाहेर पडा',
    'nav.citizenId': 'नागरिक आयडी',

    // Hero Section
    'hero.badge': 'पुढील पिढीचे नागरी AI बुद्धिमत्ता व निवारण प्लॅटफॉर्म',
    'hero.title1': 'नागरी समस्या नोंदवा.',
    'hero.title2': 'थेट निवारण ट्रॅक करा.',
    'hero.description': 'सिव्हिक-कनेक्ट AI नागरिकांना थेट मनपा विभागांशी जोडते. खड्डे, कचऱ्याचे ढीग, बंद पथदिवे किंवा पाण्याची गळतीचा फोटो काढा — आमची AI प्रणाली समस्येचे स्वयंचलित वर्गीकरण करते, प्राधान्य ठरवते आणि संबंधित क्षेत्रीय पथकांकडे काम सोपवते.',
    'hero.reportCta': 'नागरी समस्या नोंदवा',
    'hero.citizenIdCta': 'अधिकृत नागरिक आयडी मिळवा',
    'hero.totalReports': 'एकूण नोंदी',
    'hero.activePipeline': 'प्रगतीपथावरील समस्या',
    'hero.remediated': 'निवारण व पडताळणी पूर्ण',
    'hero.aiClassification': 'AI अचूकता',

    // Categories
    'cat.pothole': 'खड्डे / रस्त्याचे नुकसान',
    'cat.garbage': 'कचरा आणि कचऱ्याचा ढीग',
    'cat.streetlight': 'पथदिवा बिघाड / अंधार क्षेत्र',
    'cat.water_leak': 'पाण्याची गळती / पाईपलाईन फुटणे',
    'cat.damaged_facility': 'खराब झालेली सार्वजनिक सुविधा',

    // Statuses
    'status.reported': 'नोंदवले',
    'status.verified': 'पडताळणी झाली',
    'status.assigned': 'नियुक्त केले',
    'status.in_progress': 'प्रगतीपथावर',
    'status.resolved': 'निराकरण झाले',
    'status.all': 'सर्व स्थिती',
    'cat.all': 'सर्व वर्गवारी',

    // Common UI
    'common.searchPlaceholder': 'समस्या, पत्ता, किंवा नागरिक आयडी द्वारे शोधा...',
    'common.upvote': 'समर्थन द्या',
    'common.upvotes': 'समर्थने',
    'common.citizen': 'नागरिक',
    'common.ward': 'प्रभाग (वॉर्ड)',
    'common.priority': 'प्राधान्य',
    'common.share': 'प्रमाणपत्र शेअर करा',
    'common.download': 'प्रमाणपत्र डाउनलोड करा',
    'common.riskForecast': 'जोखीम अंदाज',
    'common.trustedReporter': 'विश्वासू नागरिक वार्ताहर',
    'common.trustScore': 'विश्वास गुणसंख्या (Trust Score)',
    'common.noComplaints': 'कोणतीही तक्रार आढळली नाही',
    'common.adjustFilters': 'फिल्टर बदला किंवा नवीन तक्रार नोंदवा.',

    // Analytics & Leaderboard
    'analytics.title': 'महानगरपालिका विश्लेषिकी व निवारण पारदर्शकता',
    'analytics.subtitle': 'प्रभाग व पायाभूत सुविधा विभागांचे रिअल-टाइम सार्वजनिक कार्यप्रदर्शन',
    'analytics.wardReportCard': 'प्रभाग उत्तरदायित्व प्रगतीपुस्तक (Ward Report Card)',
    'analytics.wardSubtitle': 'PCMC प्रशासकीय प्रभागांची कार्यक्षमता मानांकन क्रमवारी',
    'analytics.rank': 'क्रमांक',
    'analytics.wardName': 'प्रभाग व कार्यक्षेत्र',
    'analytics.avgResolutionTime': 'सरासरी निवारण वेळ',
    'analytics.pending': 'प्रलंबित तक्रारी',
    'analytics.resolvedCount': 'निवारण झालेल्या',
    'analytics.resolutionRate': 'निवारण टक्केवारी',
    'analytics.statusBadge': 'कार्यप्रदर्शन दर्जा',
    'analytics.topPerforming': 'उत्कृष्ट कामगिरी',
    'analytics.needsAttention': 'तातडीची कारवाई आवश्यक',
    'analytics.moderate': 'मानक कामगिरी',

    // Citizen Dashboard
    'dash.mySubmitted': 'मी नोंदवलेल्या तक्रारी',
    'dash.liveTracking': 'थेट मनपा ट्रॅकिंग व प्रगती टप्पे',
    'dash.filterAll': 'सर्व',
    'dash.filterActive': 'सक्रिय',
    'dash.filterResolved': 'निवारण झालेल्या',
    'dash.trustLevel': 'विश्वासार्हता व प्रतिष्ठा पातळी',
    'dash.trustBadge': 'विश्वासू नागरिक वार्ताहर (Trusted Reporter)',
    'dash.trustDesc': 'आपल्या अचूक नोंदी आणि नागरी योगदानामुळे आपल्या तक्रारींना जलद प्राधान्य मिळते.',
    'dash.shareResolution': 'निवारण प्रमाणपत्र मिळवा',
    'dash.confirmResolution': 'निवारण निश्चित करा',
    'dash.flagUnresolved': 'अजूनही अपूर्ण आहे',

    // Map & Hotspots
    'map.title': 'सार्वजनिक नागरी समस्या नकाशा',
    'map.subtitle': 'शहरातील नोंदवलेल्या समस्यांचे व निवारण स्थितीचे भौगोलिक सादरीकरण',
    'map.riskHotspots': 'AI जोखीम हॉटस्पॉट अंदाज (Risk Forecast)',
    'map.riskActive': 'जोखीम अंदाज सक्रिय',
    'map.hotspotTitle': 'संभाव्य जोखीम क्षेत्र (Predictive Risk Hotspot)',
    'map.hotspotDesc': 'वारंवार तक्रारी येणारे संवेदनशील क्षेत्र जिथे प्रतिबंधात्मक दुरुस्ती आवश्यक आहे',

    // Certificate
    'cert.title': 'अधिकृत महानगरपालिका निवारण प्रमाणपत्र',
    'cert.subtitle': 'नागरी समस्येचे यशस्वी निवारण व नागरिक पडताळणी',
    'cert.resolvedIn': 'निवारण कालावधी',
    'cert.verifiedBy': 'पडताळणी नागरिक आयडी',
    'cert.officialStamp': 'अधिकृतपणे निवारण पूर्ण',
    'cert.downloadBtn': 'PNG प्रमाणपत्र डाउनलोड करा',
    'cert.shareBtn': 'यश शेअर करा'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('civicconnect_lang');
      return (saved === 'mr' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('civicconnect_lang', lang);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'mr' : 'en');
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
