export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  handle?: string;
  contactMethod?: string;
  bio?: string;
}

export type CommissionStageName = 
  | 'Commission Received'
  | 'Project Discussion'
  | 'Concept Development'
  | 'Initial Design'
  | 'Client Review'
  | 'Revisions'
  | 'Final Approval'
  | 'Final Delivery';

export interface CommissionStageInfo {
  number: number;
  name: CommissionStageName;
  description: string;
  defaultPercentage: number;
}

export const COMMISSION_STAGES: CommissionStageInfo[] = [
  { number: 1, name: 'Commission Received', description: 'Request received and awaiting designer review', defaultPercentage: 10 },
  { number: 2, name: 'Project Discussion', description: 'Brief clarification, scope confirmation, and deposit', defaultPercentage: 25 },
  { number: 3, name: 'Concept Development', description: 'Moodboards, color exploration, and initial sketches', defaultPercentage: 40 },
  { number: 4, name: 'Initial Design', description: 'High-fidelity design execution and vector crafting', defaultPercentage: 55 },
  { number: 5, name: 'Client Review', description: 'Design draft submitted for client approval or feedback', defaultPercentage: 70 },
  { number: 6, name: 'Revisions', description: 'Applying client feedback and refining design assets', defaultPercentage: 85 },
  { number: 7, name: 'Final Approval', description: 'Design locked in; preparing production files and exports', defaultPercentage: 95 },
  { number: 8, name: 'Final Delivery', description: 'All final high-res source files packaged and delivered', defaultPercentage: 100 },
];

export type CommissionStatus = 
  | 'Pending'
  | 'In Progress'
  | 'Client Review'
  | 'Revision Requested'
  | 'Final Approval'
  | 'Completed'
  | 'Rejected';

export interface ReferenceDocument {
  id: string;
  name: string;
  size: string;
  url?: string;
}

export interface ClientReviewData {
  previewImages: string[];
  reviewNotes: string;
  submissionDate: string;
  clientStatus: 'Pending Review' | 'Approved' | 'Revision Requested';
  revisionFeedback?: string;
  revisionDate?: string;
}

export interface FinalDeliverableFile {
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface FinalFilesPackage {
  packageName: string;
  packageSize: string;
  formats: string[];
  downloadUrl: string;
  deliverablesList: string[];
  previewUrl: string;
  completedDate: string;
  filesList?: FinalDeliverableFile[];
}

export interface Commission {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAvatar: string;
  clientHandle?: string;
  contactMethod?: string;
  
  // Project Details
  projectName: string;
  service: string;
  serviceType?: string;
  description: string;
  purpose: string;
  targetAudience: string;
  preferredStyle: string;
  preferredColors: string[];
  requiredDimensions: string;
  
  // Timeline & Financials
  budget: string;
  currency: string;
  deadline: string;
  startDate?: string;
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  
  // Progress & State
  status: CommissionStatus;
  progress: number;
  currentStage: number; // 1 to 8
  
  // References & Notes
  referenceImages: string[];
  referenceLinks: string[];
  referenceDocs: ReferenceDocument[];
  communicationGoals: string;
  thingsToAvoid: string;
  additionalNotes: string;
  
  // Metadata
  assignedDesigner: string;
  depositPaid: boolean;
  totalPaid: boolean;
  revisionsAllowed: number;
  revisionsUsed: number;
  
  // Review & Delivery
  clientReviewData?: ClientReviewData;
  finalFiles?: FinalFilesPackage;
  timelineUpdates?: ProgressUpdate[];
  
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  name: string;
  url: string;
  type: 'image' | 'file';
  size?: string;
}

export interface Message {
  id: string;
  commissionId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  message: string;
  attachment?: MessageAttachment;
  timestamp: string;
  readStatus: boolean;
}

export interface ProgressUpdate {
  id: string;
  commissionId: string;
  stage: string;
  stageNumber: number;
  percentage: number;
  note: string;
  timestamp: string;
  updatedBy: string;
}

export interface ProjectFile {
  id: string;
  commissionId: string;
  filename: string;
  url: string;
  type: 'draft' | 'preview' | 'final' | 'reference' | 'document';
  size: string;
  uploadedBy: string;
  timestamp: string;
  stageTag?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  commissionId?: string;
  message: string;
  type: 'status' | 'message' | 'review' | 'delivery' | 'system';
  readStatus: boolean;
  timestamp: string;
  linkTab?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  shortDesc: string;
  startingPrice: number;
  turnaround: string;
  revisionsCount: number;
  deliverables: string[];
  popular?: boolean;
  iconName: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: 'Branding' | 'Logo' | 'Poster' | 'Illustration' | 'Social Media' | 'Book Covers' | 'Other';
  shortDesc: string;
  fullDesc: string;
  image: string;
  gallery: string[];
  tools: string[];
  date: string;
  client: string;
  colorPalette?: string[];
  tags: string[];
  featured?: boolean;
}

export interface StudioProfile {
  designerName: string;
  studioName: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  location: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    behance?: string;
    dribbble?: string;
    discord?: string;
  };
  currency: string;
  currencySymbol: string;
  commissionStatus: 'open' | 'waitlist' | 'closed';
  availableSlots: number;
}
