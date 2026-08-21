import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Complaint } from '../types';

export const SAMPLE_INITIAL_COMPLAINTS: (Omit<Complaint, 'complaintId'> & { complaintId?: string })[] = [
  {
    complaintId: 'seed-pothole-01',
    reportedBy: 'seed-citizen-1',
    reporterName: 'Mohammed Kaif',
    reporterCitizenId: 'QLMT4821',
    category: 'pothole',
    description: 'Dangerous 8-inch asphalt pothole on the eastbound lane near the intersection pedestrian crosswalk.',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    resolvedPhotoUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: '742 Market St, Financial District',
      city: 'Metro Central'
    },
    aiClassification: {
      label: 'pothole',
      confidence: 0.97,
      aiDescription: 'High severity road surface depression with exposed sub-base asphalt posing immediate vehicular hazard.',
      severity: 'high',
      tags: ['road-hazard', 'asphalt-crater', 'traffic-safety'],
      suggestedDepartment: 'Public Works & Road Infrastructure'
    },
    priorityScore: 88,
    status: 'resolved',
    assignedDepartment: 'Public Works & Road Infrastructure',
    adminRemarks: 'Field crew #3 asphalt patched and hot-rolled. Sub-surface inspection complete.',
    upvotes: ['seed-citizen-1', 'seed-citizen-2', 'seed-citizen-3'],
    citizenConfirmedResolution: true,
    citizenFeedbackNotes: 'Road was completely repaved within 24 hours. Excellent work!',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), remarks: 'Report logged by citizen QLMT4821' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 2.5).toISOString(), remarks: 'Verified by Municipal Road Safety Inspector' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), remarks: 'Work Order #PW-8492 issued to Road Maintenance Crew' },
      { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), remarks: 'Remediation underway on site' },
      { status: 'resolved', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), remarks: 'Pothole asphalted and inspected.' }
    ]
  },
  {
    complaintId: 'seed-water-02',
    reportedBy: 'seed-citizen-2',
    reporterName: 'Sarah Lin',
    reporterCitizenId: 'BXWP9302',
    category: 'water_leak',
    description: 'Clogged storm drain and broken underground pipe valve causing hazardous street flooding and sidewalk overflow.',
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 37.7833,
      lng: -122.4167,
      address: '450 Geary St, Theatre District',
      city: 'Metro Central'
    },
    aiClassification: {
      label: 'water_leak',
      confidence: 0.97,
      aiDescription: 'Severe storm drainage overflow and underground pipe seepage causing pooled water along road curb and pedestrian crossing.',
      severity: 'high',
      tags: ['drainage-overflow', 'street-flooding', 'pedestrian-safety'],
      suggestedDepartment: 'Municipal Water & Sewerage Board'
    },
    priorityScore: 88,
    status: 'in_progress',
    assignedDepartment: 'Municipal Water & Sewerage Board',
    adminRemarks: 'Drainage crew unblocking storm runoff grate and inspecting valve.',
    upvotes: ['seed-citizen-2', 'seed-citizen-1', 'seed-citizen-4', 'seed-citizen-5'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.4).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString(), remarks: 'Reported by Citizen BXWP9302' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 1.0).toISOString(), remarks: 'Water board alert raised' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 0.7).toISOString(), remarks: 'Dispatched emergency drainage squad #9' },
      { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 0.4).toISOString(), remarks: 'Grate clearance and valve inspection underway' }
    ]
  },
  {
    complaintId: 'seed-garbage-03',
    reportedBy: 'seed-citizen-3',
    reporterName: 'Carlos Ramirez',
    reporterCitizenId: 'HJKL7820',
    category: 'garbage',
    description: 'Commercial waste bin overflowing into public sidewalk with uncollected bagged garbage for 4 days.',
    photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 37.7650,
      lng: -122.4200,
      address: '2200 Mission St, Mission District',
      city: 'Metro Central'
    },
    aiClassification: {
      label: 'garbage',
      confidence: 0.94,
      aiDescription: 'Accumulation of mixed solid waste and overflowing container obstructing pedestrian access.',
      severity: 'high',
      tags: ['sanitation-hazard', 'waste-accumulation', 'public-health'],
      suggestedDepartment: 'Sanitation & Solid Waste Management'
    },
    priorityScore: 78,
    status: 'assigned',
    assignedDepartment: 'Sanitation & Solid Waste Management',
    adminRemarks: 'Heavy duty compactor truck scheduled for morning sweep.',
    upvotes: ['seed-citizen-3', 'seed-citizen-1'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 0.8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.3).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString(), remarks: 'Submitted by citizen HJKL7820' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), remarks: 'Sanitation dispatch confirmed route overflow' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 0.3).toISOString(), remarks: 'Assigned to Sector 2 Compactor Unit' }
    ]
  },
  {
    complaintId: 'seed-street-04',
    reportedBy: 'seed-citizen-4',
    reporterName: 'David Chen',
    reporterCitizenId: 'ELUM8820',
    category: 'streetlight',
    description: 'Major intersection traffic signal and overhead luminaire blacked out, causing severe vehicle congestion and pedestrian hazards.',
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 37.7880,
      lng: -122.4080,
      address: 'Columbus Ave & Broadway Junction',
      city: 'Metro Central'
    },
    aiClassification: {
      label: 'streetlight',
      confidence: 0.99,
      aiDescription: 'Critical municipal intersection traffic signal & overhead luminaire blackout creating acute vehicular collision and pedestrian crossing risk.',
      severity: 'critical',
      tags: ['signal-outage', 'traffic-hazard', 'overhead-lighting', 'urgent-dispatch'],
      suggestedDepartment: 'Electrical Engineering & Street Lighting'
    },
    priorityScore: 94,
    status: 'in_progress',
    assignedDepartment: 'Electrical Engineering & Street Lighting',
    adminRemarks: 'Emergency traffic management and electrical squad deployed with temporary generator.',
    upvotes: ['seed-citizen-4', 'seed-citizen-1', 'seed-citizen-2'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.1).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), remarks: 'Logged by citizen ELUM8820 via Mobile App' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 0.3).toISOString(), remarks: 'Traffic Control Center confirmed junction circuit failure' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 0.2).toISOString(), remarks: 'Rapid response electrical team dispatched' },
      { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 0.1).toISOString(), remarks: 'Technicians on site rebooting controller board' }
    ]
  },
  {
    complaintId: 'seed-amenity-05',
    reportedBy: 'seed-citizen-5',
    reporterName: 'Marcus Vance',
    reporterCitizenId: 'WXZM8812',
    category: 'damaged_facility',
    description: 'Vandalized transit shelter glass panel and broken public bench at central park bus stop.',
    photoUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 37.7700,
      lng: -122.4460,
      address: '501 Stanyan St, Golden Gate East',
      city: 'Metro Central'
    },
    aiClassification: {
      label: 'damaged_facility',
      confidence: 0.91,
      aiDescription: 'Structural vandalism to transit amenity with shattered tempered glass hazard.',
      severity: 'medium',
      tags: ['transit-amenity', 'broken-facility', 'public-parks'],
      suggestedDepartment: 'Parks & Public Amenities Division'
    },
    priorityScore: 68,
    status: 'reported',
    assignedDepartment: 'Parks & Public Amenities Division',
    adminRemarks: '',
    upvotes: ['seed-citizen-5'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 0.2).toISOString(), remarks: 'Report registered in public queue' }
    ]
  }
];

export function getInitialSampleComplaints(): Complaint[] {
  return SAMPLE_INITIAL_COMPLAINTS.map((item, idx) => ({
    ...item,
    complaintId: item.complaintId || `seed-complaint-${idx + 1}`
  })) as Complaint[];
}

export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'complaints'));
    if (snap.empty && auth.currentUser) {
      for (const comp of SAMPLE_INITIAL_COMPLAINTS) {
        const { complaintId: _id, ...cleanComp } = comp;
        await addDoc(collection(db, 'complaints'), cleanComp);
      }
      return true;
    }
    return false;
  } catch (err) {
    // If unauthenticated or read succeeded without write permissions, gracefully continue
    return false;
  }
}
