import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'mr';

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
    'nav.ownerDashboard': 'Owner Dashboard',
    'nav.analytics': 'Analytics',
    'nav.reportProblem': 'Report a Problem',
    'nav.userLogin': 'User Login',
    'nav.ownerLogin': 'Owner Login',
    'nav.admin': 'Owner / Admin',
    'nav.signOut': 'Sign Out',
    'nav.citizenId': 'Citizen ID',

    // Hero Section
    'hero.badge': 'Next-Gen Civic AI Intelligence & Resolution Pipeline',
    'hero.title1': 'Report Civic Issues.',
    'hero.title2': 'Track Direct Resolution.',
    'hero.description': 'CivicConnect AI bridges citizens directly with city departments. Snap a photo of potholes, garbage piles, broken lights, or water leaks — our AI engine auto-classifies the issue, predicts priority, and dispatches work orders to municipal field crews.',
    'hero.reportCta': 'Report a Civic Problem',
    'hero.reportBtn': 'Report a Civic Problem',
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
    'dash.submitted': 'Submitted',
    'dash.inProgress': 'In Progress',
    'dash.resolved': 'Resolved',
    'dash.signInRequired': 'Citizen Sign In Required',
    'dash.signInDesc': 'Sign in or register to view your submitted complaints, track progress milestones, and confirm municipal remediation.',
    'dash.signInBtn': 'Sign In to Citizen Dashboard',

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
    'cert.shareBtn': 'Share Accomplishment',

    // Report Problem
    'report.title': 'Report a Civic Problem',
    'report.subtitle': 'AI auto-detects potholes, waste, dark streetlights, and leaks with instant routing.',
    'report.photoLabel': 'Complaint Photo Proof',
    'report.dragDrop': 'Click or drag photo here to upload',
    'report.takePhoto': 'Take Photo with Camera',
    'report.orChooseSample': 'Or select verified scenario sample photo',
    'report.aiPotholeAlert': 'Advance AI Pothole & Road Damage Analysis',
    'report.potholeDetected': 'Pothole & Surface Crater Detected',
    'report.depthEstimated': 'Estimated Depth',
    'report.rimHazard': 'Tire / Rim Hazard',
    'report.multiPersonTitle': 'Multi-Citizen Complaint Correlation',
    'report.multiPersonNotice': 'Other citizens have already flagged this issue in the vicinity. Supporting it increases municipal priority.',
    'report.upvoteInstead': 'Support Existing Citizen Report',
    'report.descriptionLabel': 'Civic Problem Description',
    'report.descriptionPlaceholder': 'Describe the civic issue, road crater depth, traffic hazard, or landmark details...',
    'report.wardLabel': 'Municipal Ward / Jurisdiction',
    'report.addressLabel': 'Geotagged Location Address',
    'report.addressPlaceholder': 'Street or landmark address...',
    'report.submitting': 'Analyzing & Dispatching...',
    'report.submitBtn': 'Submit Official Civic Complaint',
    'report.successMsg': 'Complaint successfully registered with Municipal Authority!',

    // Auth & Owner Login
    'auth.citizenLogin': 'Citizen Sign In',
    'auth.citizenSignup': 'Join CivicConnect',
    'auth.citizenLoginSubtitle': 'Access your civic reports, upvotes, and resolution statuses',
    'auth.citizenSignupSubtitle': 'Register to report issues and generate your verified Citizen ID',
    'auth.ownerLogin': 'Owner Login',
    'auth.ownerSubtitle': 'Authorized Municipal Authority & System Owner Portal',
    'auth.ownerBadge': 'Restricted Access Portal',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.signInBtn': 'Sign In',
    'auth.signUpBtn': 'Register & Generate ID',
    'auth.ownerSignInBtn': 'Authenticate as Owner / Admin',
    'auth.googleBtn': 'Continue with Google',
    'auth.noAccount': "Don't have an account? Register",
    'auth.hasAccount': 'Already have an account? Sign In',
    'auth.accessDenied': 'Access Denied: You do not have owner/administrator privileges.',
    'auth.invalidCreds': 'Invalid credentials. Please verify your email and password.',
    'auth.restrictedTitle': 'Restricted Owner & Administrator Area',
    'auth.restrictedDesc': 'This console is reserved for municipal authority officers and system owners with verified credentials.',
    'auth.openOwnerLogin': 'Open Owner Login',

    // Messages
    'msg.upvoteSuccess': 'Upvote recorded! Priority score elevated.',
    'msg.feedbackSuccess': 'Citizen resolution feedback recorded.',
    'msg.loginSuccess': 'Signed in successfully.'
  },
  hi: {
    // Brand & Header
    'app.title': 'सिविक-कनेक्ट',
    'app.subtitle': 'स्मार्ट नगर निगम समाधान प्रणाली',
    'nav.publicFeed': 'सार्वजनिक फ़ीड',
    'nav.liveMap': 'लाइव शहर मानचित्र',
    'nav.myComplaints': 'मेरी शिकायतें',
    'nav.adminConsole': 'प्रशासन कंसोल',
    'nav.ownerDashboard': 'ऑनर डैशबोर्ड',
    'nav.analytics': 'एनालिटिक्स',
    'nav.reportProblem': 'समस्या दर्ज करें',
    'nav.userLogin': 'नागरिक लॉगिन',
    'nav.ownerLogin': 'ऑनर लॉगिन',
    'nav.admin': 'ऑनर / व्यवस्थापक',
    'nav.signOut': 'साइन आउट',
    'nav.citizenId': 'नागरिक आईडी',

    // Hero Section
    'hero.badge': 'नेक्स्ट-जेन नागरिक AI बुद्धिमत्ता और समाधान प्लेटफॉर्म',
    'hero.title1': 'नागरिक समस्याएं दर्ज करें।',
    'hero.title2': 'सीधे समाधान को ट्रैक करें।',
    'hero.description': 'सिविक-कनेक्ट AI नागरिकों को सीधे नगर निगम विभागों से जोड़ता है। गड्ढे, कचरे के ढेर, खराब स्ट्रीटलाइट या पानी के रिसाव की फोटो लें — हमारा AI इंजन समस्या का स्वतः वर्गीकरण करता है, प्राथमिकता तय करता है और संबंधित क्षेत्रीय टीमों को कार्य आदेश भेजता है।',
    'hero.reportCta': 'नागरिक समस्या दर्ज करें',
    'hero.reportBtn': 'नागरिक समस्या दर्ज करें',
    'hero.citizenIdCta': 'आधिकारिक नागरिक आईडी प्राप्त करें',
    'hero.totalReports': 'कुल रिपोर्ट',
    'hero.activePipeline': 'सक्रिय कार्य',
    'hero.remediated': 'समाधान व सत्यापित',
    'hero.aiClassification': 'AI वर्गीकरण',

    // Categories
    'cat.pothole': 'सड़क पर गड्ढा / क्षति',
    'cat.garbage': 'कचरा और अपशिष्ट ढेर',
    'cat.streetlight': 'स्ट्रीटलाइट खराबी / अंधेरा क्षेत्र',
    'cat.water_leak': 'पानी का रिसाव / पाइपलाइन फूटना',
    'cat.damaged_facility': 'क्षतिग्रस्त सार्वजनिक सुविधा',

    // Statuses
    'status.reported': 'दर्ज की गई',
    'status.verified': 'सत्यापित',
    'status.assigned': 'आवंटित',
    'status.in_progress': 'प्रगति पर',
    'status.resolved': 'समाधान हो गया',
    'status.all': 'सभी स्थितियां',
    'cat.all': 'सभी श्रेणियां',

    // Common UI
    'common.searchPlaceholder': 'समस्या, सड़क का पता, या नागरिक आईडी से खोजें...',
    'common.upvote': 'समर्थन दें',
    'common.upvotes': 'समर्थन',
    'common.citizen': 'नागरिक',
    'common.ward': 'वार्ड (प्रभाग)',
    'common.priority': 'प्राथमिकता',
    'common.share': 'प्रमाणपत्र साझा करें',
    'common.download': 'प्रमाणपत्र डाउनलोड करें',
    'common.riskForecast': 'जोखिम पूर्वानुमान',
    'common.trustedReporter': 'विश्वसनीय नागरिक रिपोर्टर',
    'common.trustScore': 'विश्वास स्कोर (Trust Score)',
    'common.noComplaints': 'कोई शिकायत नहीं मिली',
    'common.adjustFilters': 'फ़िल्टर बदलें या नई शिकायत दर्ज करें।',

    // Analytics & Leaderboard
    'analytics.title': 'नगर निगम एनालिटिक्स और समाधान पारदर्शिता',
    'analytics.subtitle': 'शहर के बुनियादी ढांचे के विभागों और वार्डों का वास्तविक समय सार्वजनिक प्रदर्शन',
    'analytics.wardReportCard': 'वार्ड जवाबदेही रिपोर्ट कार्ड',
    'analytics.wardSubtitle': 'प्रशासनिक वार्डों की कार्यक्षमता रैंकिंग व प्रदर्शन तालिका',
    'analytics.rank': 'रैंक',
    'analytics.wardName': 'वार्ड और कार्यक्षेत्र',
    'analytics.avgResolutionTime': 'औसत समाधान समय',
    'analytics.pending': 'लंबित शिकायतें',
    'analytics.resolvedCount': 'समाधान संख्या',
    'analytics.resolutionRate': 'समाधान दर',
    'analytics.statusBadge': 'प्रदर्शन स्थिति',
    'analytics.topPerforming': 'शीर्ष प्रदर्शन',
    'analytics.needsAttention': 'कार्रवाई आवश्यक',
    'analytics.moderate': 'मानक स्तर',

    // Citizen Dashboard
    'dash.mySubmitted': 'मेरी दर्ज शिकायतें',
    'dash.liveTracking': 'लाइव नगरपालिका ट्रैकिंग और स्थिति समयरेखा',
    'dash.filterAll': 'सभी',
    'dash.filterActive': 'सक्रिय',
    'dash.filterResolved': 'समाधान',
    'dash.trustLevel': 'विश्वास और प्रतिष्ठा स्तर',
    'dash.trustBadge': 'विश्वसनीय नागरिक रिपोर्टर',
    'dash.trustDesc': 'आपकी रिपोर्ट सत्यापित सटीकता और नागरिक योगदान के आधार पर प्राथमिकता दी जाती हैं।',
    'dash.shareResolution': 'समाधान प्रमाणपत्र प्राप्त करें',
    'dash.confirmResolution': 'समाधान की पुष्टि करें',
    'dash.flagUnresolved': 'अभी हल नहीं हुआ',
    'dash.submitted': 'दर्ज की गई',
    'dash.inProgress': 'प्रगति पर',
    'dash.resolved': 'समाधान',
    'dash.signInRequired': 'नागरिक साइन इन आवश्यक है',
    'dash.signInDesc': 'अपनी दर्ज शिकायतें देखने, प्रगति ट्रैक करने और समाधान की पुष्टि करने के लिए लॉगिन करें।',
    'dash.signInBtn': 'नागरिक डैशबोर्ड में लॉगिन करें',

    // Map & Hotspots
    'map.title': 'सार्वजनिक नागरिक समस्या मानचित्र',
    'map.subtitle': 'दर्ज समस्याओं और समाधान स्थिति का शहरव्यापी भौगोलिक विज़ुअलाइज़ेशन',
    'map.riskHotspots': 'AI जोखिम पूर्वानुमान हॉटस्पॉट',
    'map.riskActive': 'जोखिम पूर्वानुमान सक्रिय',
    'map.hotspotTitle': 'पूर्वानुमानित हॉटस्पॉट जोखिम',
    'map.hotspotDesc': 'बार-बार शिकायतों वाले संवेदनशील क्षेत्र जहां निवारक रखरखाव की आवश्यकता है',

    // Certificate
    'cert.title': 'आधिकारिक नगर निगम समाधान प्रमाणपत्र',
    'cert.subtitle': 'नागरिक समस्या का निवारण और सत्यापन पूर्ण',
    'cert.resolvedIn': 'समाधान समय',
    'cert.verifiedBy': 'सत्यापित नागरिक आईडी',
    'cert.officialStamp': 'आधिकारिक तौर पर ठीक किया गया',
    'cert.downloadBtn': 'PNG प्रमाणपत्र डाउनलोड करें',
    'cert.shareBtn': 'सफलता साझा करें',

    // Report Problem
    'report.title': 'नागरिक समस्या दर्ज करें',
    'report.subtitle': 'AI सड़क के गड्ढे, कचरा, अंधेरी स्ट्रीटलाइट और पानी के रिसाव को तुरंत पहचानता है।',
    'report.photoLabel': 'समस्या का फोटो प्रमाण',
    'report.dragDrop': 'फोटो खींचें या अपलोड करने के लिए क्लिक करें',
    'report.takePhoto': 'कैमरा से फोटो लें',
    'report.orChooseSample': 'या प्रमाणित नमूना फोटो चुनें',
    'report.aiPotholeAlert': 'एडवांस AI गड्ढा व सड़क क्षति विश्लेषण',
    'report.potholeDetected': 'सड़क पर गड्ढा / क्रेटर पहचाना गया',
    'report.depthEstimated': 'अनुमानित गहराई',
    'report.rimHazard': 'वाहन / टायर जोखिम',
    'report.multiPersonTitle': 'विभिन्न नागरिकों की शिकायतों का मिलान',
    'report.multiPersonNotice': 'आस-पास के क्षेत्र में अन्य नागरिकों ने भी इस समस्या की रिपोर्ट की है। समर्थन देकर प्राथमिकता बढ़ाएं।',
    'report.upvoteInstead': 'मौजूदा नागरिक शिकायत का समर्थन करें',
    'report.descriptionLabel': 'समस्या का विस्तृत विवरण',
    'report.descriptionPlaceholder': 'सड़क पर गड्ढे की गहराई, सटीक स्थान, यातायात जोखिम या लैंडमार्क लिखें...',
    'report.wardLabel': 'नगर निगम वार्ड / क्षेत्र',
    'report.addressLabel': 'जियोटैग पता',
    'report.addressPlaceholder': 'सटीक सड़क या लैंडमार्क का पता लिखें...',
    'report.submitting': 'विश्लेषण और भेजा जा रहा है...',
    'report.submitBtn': 'आधिकारिक शिकायत दर्ज करें',
    'report.successMsg': 'शिकायत नगर निगम में सफलतापूर्वक दर्ज कर दी गई है!',

    // Auth & Owner Login
    'auth.citizenLogin': 'नागरिक लॉगिन',
    'auth.citizenSignup': 'सिविक-कनेक्ट से जुड़ें',
    'auth.citizenLoginSubtitle': 'अपनी शिकायतों, समर्थन और समाधान स्थिति तक पहुंचें',
    'auth.citizenSignupSubtitle': 'समस्या दर्ज करने और सत्यापित नागरिक आईडी पाने के लिए पंजीकरण करें',
    'auth.ownerLogin': 'ऑनर लॉगिन',
    'auth.ownerSubtitle': 'अधिकृत नगर निगम व्यवस्थापक और सिस्टम ऑनर पोर्टल',
    'auth.ownerBadge': 'प्रतिबंधित प्रवेश पोर्टल',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.fullName': 'पूरा नाम',
    'auth.signInBtn': 'लॉगिन करें',
    'auth.signUpBtn': 'पंजीकरण करें और आईडी पाएं',
    'auth.ownerSignInBtn': 'ऑनर / व्यवस्थापक के रूप में सत्यापित करें',
    'auth.googleBtn': 'Google से जारी रखें',
    'auth.noAccount': 'खाता नहीं है? पंजीकरण करें',
    'auth.hasAccount': 'पहले से खाता है? लॉगिन करें',
    'auth.accessDenied': 'पहुंच अस्वीकृत: आपके पास ऑनर/प्रशासक विशेषाधिकार नहीं हैं।',
    'auth.invalidCreds': 'अमान्य क्रेडेंशियल। कृपया ईमेल और पासवर्ड की जांच करें।',
    'auth.restrictedTitle': 'प्रतिबंधित ऑनर व व्यवस्थापक क्षेत्र',
    'auth.restrictedDesc': 'यह कंसोल केवल अधिकृत नगर निगम अधिकारियों और सिस्टम ऑनर के लिए आरक्षित है।',
    'auth.openOwnerLogin': 'ऑनर लॉगिन खोलें',

    // Messages
    'msg.upvoteSuccess': 'समर्थन दर्ज किया गया! प्राथमिकता बढ़ाई गई।',
    'msg.feedbackSuccess': 'नागरिक समाधान फीडबैक दर्ज किया गया।',
    'msg.loginSuccess': 'सफलतापूर्वक लॉगिन किया गया।'
  },
  mr: {
    // Brand & Header
    'app.title': 'सिव्हिक-कनेक्ट',
    'app.subtitle': 'स्मार्ट महानगरपालिका तक्रार निवारण',
    'nav.publicFeed': 'सार्वजनिक फीड',
    'nav.liveMap': 'थेट शहर नकाशा',
    'nav.myComplaints': 'माझ्या तक्रारी',
    'nav.adminConsole': 'प्रशासन कक्ष',
    'nav.ownerDashboard': 'प्रशासक डॅशबोर्ड',
    'nav.analytics': 'विश्लेषिकी',
    'nav.reportProblem': 'समस्या नोंदवा',
    'nav.userLogin': 'नागरिक लॉगिन',
    'nav.ownerLogin': 'ऑनर लॉगिन',
    'nav.admin': 'ऑनर / प्रशासक',
    'nav.signOut': 'बाहेर पडा',
    'nav.citizenId': 'नागरिक आयडी',

    // Hero Section
    'hero.badge': 'पुढील पिढीचे नागरी AI बुद्धिमत्ता व निवारण प्लॅटफॉर्म',
    'hero.title1': 'नागरी समस्या नोंदवा.',
    'hero.title2': 'थेट निवारण ट्रॅक करा.',
    'hero.description': 'सिव्हिक-कनेक्ट AI नागरिकांना थेट मनपा विभागांशी जोडते. खड्डे, कचऱ्याचे ढीग, बंद पथदिवे किंवा पाण्याची गळतीचा फोटो काढा — आमची AI प्रणाली स्वयंचलित वर्गीकरण करते आणि संबंधित क्षेत्रीय पथकांकडे काम सोपवते.',
    'hero.reportCta': 'नागरी समस्या नोंदवा',
    'hero.reportBtn': 'नागरी समस्या नोंदवा',
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
    'dash.trustBadge': 'विश्वासू नागरिक वार्ताहर',
    'dash.trustDesc': 'आपल्या अचूक नोंदी आणि नागरी योगदानामुळे आपल्या तक्रारींना जलद प्राधान्य मिळते.',
    'dash.shareResolution': 'निवारण प्रमाणपत्र मिळवा',
    'dash.confirmResolution': 'निवारण निश्चित करा',
    'dash.flagUnresolved': 'अजूनही अपूर्ण आहे',
    'dash.submitted': 'नोंदवलेले',
    'dash.inProgress': 'प्रगतीपथावर',
    'dash.resolved': 'निवारण',
    'dash.signInRequired': 'नागरिक लॉगिन आवश्यक',
    'dash.signInDesc': 'आपल्या तक्रारी पाहण्यासाठी व निवारण खात्री करण्यासाठी लॉगिन करा.',
    'dash.signInBtn': 'नागरिक डॅशबोर्डमध्ये लॉगिन करा',

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
    'cert.shareBtn': 'यश शेअर करा',

    // Report Problem
    'report.title': 'नागरी समस्या नोंदवा',
    'report.subtitle': 'AI खड्डे, कचरा, बंद पथदिवे व गळतीचे तत्काळ वर्गीकरण करते.',
    'report.photoLabel': 'समस्या फोटो पुरावा',
    'report.dragDrop': 'फोटो अपलोड करण्यासाठी क्लिक करा',
    'report.takePhoto': 'कॅमेऱ्याने फोटो काढा',
    'report.orChooseSample': 'किंवा पडताळणी नमुना फोटो निवडा',
    'report.aiPotholeAlert': 'प्रगत AI खड्डे व रस्ता धूप विश्लेषण',
    'report.potholeDetected': 'रस्त्यावरील खड्डा आढळला',
    'report.depthEstimated': 'अंदाजित खोली',
    'report.rimHazard': 'वाहन चाक नुकसान धोका',
    'report.multiPersonTitle': 'विविध नागरिकांच्या तक्रारींचे एकत्रीकरण',
    'report.multiPersonNotice': 'या परिसरातील इतर नागरिकांनीही ही समस्या नोंदवली आहे. समर्थन दिल्यास प्राधान्य वाढेल.',
    'report.upvoteInstead': 'नागरिक तक्रारीला समर्थन द्या',
    'report.descriptionLabel': 'समस्येचे सविस्तर वर्णन',
    'report.descriptionPlaceholder': 'खड्ड्याची खोली, अचूक रस्ता व धोका स्पष्ट करा...',
    'report.wardLabel': 'प्रभाग व कार्यक्षेत्र',
    'report.addressLabel': 'भौगोलिक पत्ता',
    'report.addressPlaceholder': 'रस्ता किंवा लँडमार्क पत्ता...',
    'report.submitting': 'नोंदणी होत आहे...',
    'report.submitBtn': 'अधिकृत तक्रार नोंदवा',
    'report.successMsg': 'तक्रार मनपाकडे यशस्वीरीत्या नोंदवली गेली!',

    // Auth & Owner Login
    'auth.citizenLogin': 'नागरिक लॉगिन',
    'auth.citizenSignup': 'नागरिक नोंदणी',
    'auth.citizenLoginSubtitle': 'आपल्या तक्रारी व स्थिती पाहण्यासाठी लॉगिन करा',
    'auth.citizenSignupSubtitle': 'तक्रार नोंदवण्यासाठी व नागरिक आयडी मिळवण्यासाठी सामील व्हा',
    'auth.ownerLogin': 'ऑनर लॉगिन',
    'auth.ownerSubtitle': 'अधिकृत महानगरपालिका ऑनर व प्रशासन पोर्टल',
    'auth.ownerBadge': 'प्रतिबंधित कक्ष',
    'auth.email': 'ईमेल पत्ता',
    'auth.password': 'पासवर्ड',
    'auth.fullName': 'पूर्ण नाव',
    'auth.signInBtn': 'लॉगिन करा',
    'auth.signUpBtn': 'नोंदणी करा व आयडी मिळवा',
    'auth.ownerSignInBtn': 'ऑनर म्हणून लॉगिन करा',
    'auth.googleBtn': 'Google सह सुरू ठेवा',
    'auth.noAccount': 'खाते नाही? नोंदणी करा',
    'auth.hasAccount': 'आधीच खाते आहे? लॉगिन करा',
    'auth.accessDenied': 'प्रवेश नाकारला: आपल्याकडे ऑनर/प्रशासक अधिकार नाहीत.',
    'auth.invalidCreds': 'अवैध ईमेल किंवा पासवर्ड.',
    'auth.restrictedTitle': 'प्रतिबंधित ऑनर व प्रशासन क्षेत्र',
    'auth.restrictedDesc': 'हे व्यासपीठ केवळ अधिकृत महानगरपालिका अधिकारी व ऑनर यांच्यासाठी राखीव आहे.',
    'auth.openOwnerLogin': 'ऑनर लॉगिन उघडा',

    // Messages
    'msg.upvoteSuccess': 'समर्थन नोंदवले! प्राधान्य वाढवले.',
    'msg.feedbackSuccess': 'नागरिक निवारण अभिप्राय नोंदवला गेला.',
    'msg.loginSuccess': 'यशस्वीरीत्या लॉगिन केले.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('civicconnect_lang');
      return (saved === 'hi' || saved === 'mr' || saved === 'en') ? saved : 'en';
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
    setLanguage(language === 'en' ? 'hi' : 'en');
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
