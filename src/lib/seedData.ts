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
    ward: 'Ward A',
    description: 'Dangerous 8-inch deep asphalt pothole on eastbound lane causing tire damage and sudden vehicular braking near Nigdi crosswalk.',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    resolvedPhotoUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.6538,
      lng: 73.7707,
      address: 'Pradhikaran Spine Road, Sector 24, Nigdi',
      city: 'PCMC Metro',
      ward: 'Ward A'
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
    complaintId: 'seed-garbage-03',
    reportedBy: 'seed-citizen-3',
    reporterName: 'Carlos Ramirez',
    reporterCitizenId: 'HJKL7820',
    category: 'garbage',
    ward: 'Ward B',
    description: 'Uncollected commercial cardboard boxes, wet waste, and plastic refuse overflowing onto the pedestrian footpath for 4 days.',
    photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.6298,
      lng: 73.7850,
      address: 'Thergaon High Street, Near D-Mart Junction',
      city: 'PCMC Metro',
      ward: 'Ward B'
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
    complaintId: 'seed-water-04',
    reportedBy: 'seed-citizen-7',
    reporterName: 'Amit Gokhale',
    reporterCitizenId: 'AMIT8841',
    category: 'water_leak',
    ward: 'Ward B',
    description: 'High pressure municipal supply mainline pipe valve leaking continuously, flooding the service road and reducing water pressure to nearby societies.',
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.6320,
      lng: 73.7890,
      address: 'Chinchwad Station Road, Opp. Mahavir Garden',
      city: 'PCMC Metro',
      ward: 'Ward B'
    },
    aiClassification: {
      label: 'water_leak',
      confidence: 0.96,
      aiDescription: 'Sub-surface pressurized valve leak resulting in freshwater wastage and street water pooling.',
      severity: 'high',
      tags: ['pipe-burst', 'clean-water-loss', 'road-seepage'],
      suggestedDepartment: 'Municipal Water & Sewerage Board'
    },
    priorityScore: 85,
    status: 'in_progress',
    assignedDepartment: 'Municipal Water & Sewerage Board',
    adminRemarks: 'Excavation team isolating section to replace rusted 4-inch flange gasket.',
    upvotes: ['seed-citizen-7', 'seed-citizen-2', 'seed-citizen-4'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 1.1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 1.1).toISOString(), remarks: 'Reported by citizen AMIT8841' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString(), remarks: 'Water board engineer confirmed pressure drop' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), remarks: 'Pipeline repair team dispatched' },
      { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 0.2).toISOString(), remarks: 'Gasket replacement underway' }
    ]
  },
  {
    complaintId: 'seed-water-05',
    reportedBy: 'seed-citizen-2',
    reporterName: 'Sarah Lin',
    reporterCitizenId: 'BXWP9302',
    category: 'water_leak',
    ward: 'Ward C',
    description: 'Heavy industrial drain overflow and broken culvert causing 1-foot stagnant water accumulation across MIDC access road.',
    photoUrl: 'https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?auto=format&fit=crop&w=800&q=80',
    resolvedPhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.6275,
      lng: 73.8450,
      address: 'Bhosari MIDC T-Block, Near General Hospital Road',
      city: 'PCMC Metro',
      ward: 'Ward C'
    },
    aiClassification: {
      label: 'water_leak',
      confidence: 0.98,
      aiDescription: 'Extensive roadway waterlogging and sewer drain blockage in industrial corridor.',
      severity: 'critical',
      tags: ['drainage-overflow', 'industrial-corridor', 'culvert-repair'],
      suggestedDepartment: 'Municipal Water & Sewerage Board'
    },
    priorityScore: 92,
    status: 'resolved',
    assignedDepartment: 'Municipal Water & Sewerage Board',
    adminRemarks: 'Suction jetting machine cleared main drain silt. Culvert headwall rebuilt.',
    upvotes: ['seed-citizen-2', 'seed-citizen-1', 'seed-citizen-5'],
    citizenConfirmedResolution: true,
    citizenFeedbackNotes: 'Water cleared completely and road is fully dry now. Thank you!',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), remarks: 'Report logged' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 3.5).toISOString(), remarks: 'Severe waterlogging confirmed' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), remarks: 'High capacity suction crew deployed' },
      { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 2.2).toISOString(), remarks: 'De-silting in progress' },
      { status: 'resolved', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), remarks: 'Culvert restored and flow normalised' }
    ]
  },
  {
    complaintId: 'seed-street-06',
    reportedBy: 'seed-citizen-8',
    reporterName: 'Rajesh Patil',
    reporterCitizenId: 'RJSH5193',
    category: 'streetlight',
    ward: 'Ward C',
    description: 'Damaged street illumination pole tilting dangerously towards the carriageway after a truck collision, with loose overhead feeder cables.',
    photoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.6310,
      lng: 73.8420,
      address: 'Landewadi Chowk, Pune-Nashik Highway Connector',
      city: 'PCMC Metro',
      ward: 'Ward C'
    },
    aiClassification: {
      label: 'streetlight',
      confidence: 0.95,
      aiDescription: 'Structural compromise to public utility pole with risk of collapse and live electrical cable hazard.',
      severity: 'critical',
      tags: ['pole-hazard', 'live-wire', 'traffic-danger'],
      suggestedDepartment: 'Electrical Engineering & Street Lighting'
    },
    priorityScore: 95,
    status: 'in_progress',
    assignedDepartment: 'Electrical Engineering & Street Lighting',
    adminRemarks: 'Crane truck on site to stabilize pole and secure power feeds.',
    upvotes: ['seed-citizen-8', 'seed-citizen-3', 'seed-citizen-4'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 0.6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.1).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 0.6).toISOString(), remarks: 'Urgent hazard report logged' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 0.4).toISOString(), remarks: 'Emergency team verified structural damage' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 0.3).toISOString(), remarks: 'Emergency crane and lineman team dispatched' },
      { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 0.1).toISOString(), remarks: 'Pole replacement and re-wiring active' }
    ]
  },
  {
    complaintId: 'seed-pothole-08',
    reportedBy: 'seed-citizen-9',
    reporterName: 'Sneha Kulkarni',
    reporterCitizenId: 'SNEH3920',
    category: 'pothole',
    ward: 'Ward D',
    description: 'Subsided asphalt cave-in (approx 1.2m diameter) around newly constructed drainage inspection chamber on main roadway.',
    photoUrl: 'https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.6010,
      lng: 73.7690,
      address: 'Kokane Chowk, Pimple Saudagar Main Road',
      city: 'PCMC Metro',
      ward: 'Ward D'
    },
    aiClassification: {
      label: 'pothole',
      confidence: 0.96,
      aiDescription: 'Significant asphalt sinking and rim shear failure surrounding utility manhole cover.',
      severity: 'high',
      tags: ['manhole-settlement', 'road-depression', 'two-wheeler-hazard'],
      suggestedDepartment: 'Public Works & Road Infrastructure'
    },
    priorityScore: 82,
    status: 'verified',
    assignedDepartment: 'Public Works & Road Infrastructure',
    adminRemarks: 'Barricaded area with warning reflective cones. Work order generated.',
    upvotes: ['seed-citizen-9', 'seed-citizen-4'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 0.9).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.4).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 0.9).toISOString(), remarks: 'Reported with photo evidence' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 0.4).toISOString(), remarks: 'Inspected by Ward D road engineer' }
    ]
  },
  {
    complaintId: 'seed-garbage-09',
    reportedBy: 'seed-citizen-10',
    reporterName: 'Aniket More',
    reporterCitizenId: 'ANKT7712',
    category: 'garbage',
    ward: 'Ward E',
    description: 'Piles of concrete demolition rubble, broken tiles, and plastic sacks dumped illegally along Shivar Garden footpath blocking walkers.',
    photoUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5910,
      lng: 73.7980,
      address: 'Shivar Garden Footpath, Rahatani-Pimple Saudagar Link',
      city: 'PCMC Metro',
      ward: 'Ward E'
    },
    aiClassification: {
      label: 'garbage',
      confidence: 0.93,
      aiDescription: 'Illegal roadside construction rubble and domestic debris obstructing public walkway.',
      severity: 'medium',
      tags: ['construction-debris', 'illegal-dumping', 'footpath-obstruction'],
      suggestedDepartment: 'Sanitation & Solid Waste Management'
    },
    priorityScore: 72,
    status: 'reported',
    assignedDepartment: 'Sanitation & Solid Waste Management',
    adminRemarks: '',
    upvotes: ['seed-citizen-10'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 0.4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.4).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 0.4).toISOString(), remarks: 'Report registered in sanitation queue' }
    ]
  },
  {
    complaintId: 'seed-pothole-12',
    reportedBy: 'seed-citizen-12',
    reporterName: 'Vikram Shinde',
    reporterCitizenId: 'VKRM4419',
    category: 'pothole',
    ward: 'Ward F',
    description: 'Extensive surface disintegration and multiple sharp potholes across 40 meters of the daily vegetable market approach road.',
    photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.6780,
      lng: 73.8430,
      address: 'Jadhavwadi Market Road, Chikhali',
      city: 'PCMC Metro',
      ward: 'Ward F'
    },
    aiClassification: {
      label: 'pothole',
      confidence: 0.95,
      aiDescription: 'Severe alligator cracking and surface aggregate loss over busy commercial transit route.',
      severity: 'high',
      tags: ['alligator-cracking', 'market-road', 'asphalt-deterioration'],
      suggestedDepartment: 'Public Works & Road Infrastructure'
    },
    priorityScore: 81,
    status: 'assigned',
    assignedDepartment: 'Public Works & Road Infrastructure',
    adminRemarks: 'Assigned to North Division road resurfacing contractor.',
    upvotes: ['seed-citizen-12', 'seed-citizen-6'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.4).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString(), remarks: 'Reported by local merchant association' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString(), remarks: 'Field engineer completed road measurement' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 0.4).toISOString(), remarks: 'Resurfacing contractor issued job code' }
    ]
  },
  {
    complaintId: 'seed-garbage-13',
    reportedBy: 'seed-citizen-5',
    reporterName: 'Marcus Vance',
    reporterCitizenId: 'WXZM8812',
    category: 'garbage',
    ward: 'Ward G',
    description: 'Public waste bin completely packed with domestic refuse spilling 10 feet onto the highway service lane, emitting foul odor.',
    photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5800,
      lng: 73.8250,
      address: 'Old Pune-Mumbai Highway, Near Dapodi CME Gate',
      city: 'PCMC Metro',
      ward: 'Ward G'
    },
    aiClassification: {
      label: 'garbage',
      confidence: 0.94,
      aiDescription: 'Severe roadside container spillage and organic waste decomposition.',
      severity: 'high',
      tags: ['highway-spillage', 'sanitation-alert', 'daily-sweep'],
      suggestedDepartment: 'Sanitation & Solid Waste Management'
    },
    priorityScore: 77,
    status: 'in_progress',
    assignedDepartment: 'Sanitation & Solid Waste Management',
    adminRemarks: 'Dedicated tipper truck and sanitation squad deployed for clearance and disinfectant spray.',
    upvotes: ['seed-citizen-5', 'seed-citizen-7'],
    citizenConfirmedResolution: null,
    createdAt: new Date(Date.now() - 86400000 * 0.7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    statusTimeline: [
      { status: 'reported', timestamp: new Date(Date.now() - 86400000 * 0.7).toISOString(), remarks: 'Report logged by commuter' },
      { status: 'verified', timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), remarks: 'Sanitation supervisor confirmed overflow' },
      { status: 'assigned', timestamp: new Date(Date.now() - 86400000 * 0.3).toISOString(), remarks: 'Assigned to Dapodi mobile sanitation unit' },
      { status: 'in_progress', timestamp: new Date(Date.now() - 86400000 * 0.2).toISOString(), remarks: 'Tipper truck currently loading waste' }
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
