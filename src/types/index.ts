export type UserRole = 'citizen' | 'admin' | 'department_head';

export interface UserProfile {
  uid: string;
  citizenId: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
}

export type ComplaintCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'water_leak'
  | 'damaged_facility';

export type ComplaintStatus =
  | 'reported'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved';

export interface ComplaintLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
}

export interface AIClassification {
  label: ComplaintCategory;
  confidence: number; // 0.0 - 1.0
  aiDescription: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  suggestedDepartment?: string;
}

export interface StatusTimelineEvent {
  status: ComplaintStatus;
  timestamp: string;
  remarks?: string;
  updatedBy?: string;
}

export interface Complaint {
  complaintId: string;
  reportedBy: string; // user uid
  reporterName?: string;
  reporterCitizenId?: string;
  category: ComplaintCategory;
  description: string;
  photoUrl: string;
  resolvedPhotoUrl?: string;
  location: ComplaintLocation;
  aiClassification: AIClassification;
  priorityScore: number;
  status: ComplaintStatus;
  assignedDepartment?: string;
  adminRemarks?: string;
  duplicateOf?: string;
  upvotes: string[]; // list of user uids
  citizenConfirmedResolution?: boolean | null; // true = confirmed, false = rejected/not resolved, null = pending
  citizenFeedbackNotes?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  statusTimeline?: StatusTimelineEvent[];
}

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  leadOfficer: string;
  contactEmail: string;
  categoryHandled: ComplaintCategory[];
  icon: string;
  color: string;
}

export const DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'dept-roads',
    name: 'Public Works & Road Infrastructure',
    code: 'PW-ROADS',
    leadOfficer: 'Director Marcus Vance',
    contactEmail: 'roads@civicconnect.gov',
    categoryHandled: ['pothole'],
    icon: 'Hammer',
    color: 'amber'
  },
  {
    id: 'dept-sanitation',
    name: 'Sanitation & Solid Waste Management',
    code: 'SAN-WASTE',
    leadOfficer: 'Director Elena Gomez',
    contactEmail: 'sanitation@civicconnect.gov',
    categoryHandled: ['garbage'],
    icon: 'Trash2',
    color: 'emerald'
  },
  {
    id: 'dept-electrical',
    name: 'Electrical Engineering & Street Lighting',
    code: 'ENG-LIGHT',
    leadOfficer: 'Director Kenji Takahashi',
    contactEmail: 'electrical@civicconnect.gov',
    categoryHandled: ['streetlight'],
    icon: 'Lightbulb',
    color: 'yellow'
  },
  {
    id: 'dept-water',
    name: 'Municipal Water & Sewerage Board',
    code: 'WAT-SEWER',
    leadOfficer: 'Director Sarah Jenkins',
    contactEmail: 'water@civicconnect.gov',
    categoryHandled: ['water_leak'],
    icon: 'Droplets',
    color: 'cyan'
  },
  {
    id: 'dept-facilities',
    name: 'Parks & Public Amenities Division',
    code: 'PARK-FAC',
    leadOfficer: 'Director David Sterling',
    contactEmail: 'facilities@civicconnect.gov',
    categoryHandled: ['damaged_facility'],
    icon: 'Building2',
    color: 'indigo'
  }
];

export const CATEGORY_CONFIG: Record<
  ComplaintCategory,
  {
    label: string;
    description: string;
    defaultDepartment: string;
    baseWeight: number;
    badgeColor: string;
    icon: string;
  }
> = {
  pothole: {
    label: 'Pothole / Road Damage',
    description: 'Crater, road depression, asphalt cracking, or dangerous road hazard',
    defaultDepartment: 'Public Works & Road Infrastructure',
    baseWeight: 70,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: 'Construction'
  },
  garbage: {
    label: 'Garbage & Waste Pile',
    description: 'Uncollected refuse, overflowing dumpsters, illegal dumping, or biohazard',
    defaultDepartment: 'Sanitation & Solid Waste Management',
    baseWeight: 55,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: 'Trash2'
  },
  streetlight: {
    label: 'Streetlight Outage / Dark Zone',
    description: 'Broken streetlight bulb, flickering pole, exposed wiring, or dark corridor',
    defaultDepartment: 'Electrical Engineering & Street Lighting',
    baseWeight: 65,
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    icon: 'Lightbulb'
  },
  water_leak: {
    label: 'Water Leak / Pipeline Burst',
    description: 'Burst municipal pipe, flooding valve, sewer overflow, or contamination',
    defaultDepartment: 'Municipal Water & Sewerage Board',
    baseWeight: 80,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: 'Droplet'
  },
  damaged_facility: {
    label: 'Damaged Public Facility',
    description: 'Broken park bench, damaged bus stop, vandalized signage, or park equipment',
    defaultDepartment: 'Parks & Public Amenities Division',
    baseWeight: 50,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: 'Building'
  }
};

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  {
    label: string;
    step: number;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    description: string;
  }
> = {
  reported: {
    label: 'Reported',
    step: 1,
    color: 'text-amber-700',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-400',
    icon: 'AlertCircle',
    description: 'Citizen report logged and queued for municipal verification.'
  },
  verified: {
    label: 'Verified',
    step: 2,
    color: 'text-blue-700',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-400',
    icon: 'CheckCircle2',
    description: 'Report validated by municipal officer. Authenticity confirmed.'
  },
  assigned: {
    label: 'Assigned',
    step: 3,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-500',
    borderColor: 'border-indigo-400',
    icon: 'UserCheck',
    description: 'Assigned to jurisdictional department team with work order generated.'
  },
  in_progress: {
    label: 'In Progress',
    step: 4,
    color: 'text-purple-700',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-400',
    icon: 'Wrench',
    description: 'Field crew dispatched and on-site remediation actively underway.'
  },
  resolved: {
    label: 'Resolved',
    step: 5,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-400',
    icon: 'CheckCircle',
    description: 'Civic issue remediated with photo evidence uploaded. Awaiting citizen confirmation.'
  }
};
