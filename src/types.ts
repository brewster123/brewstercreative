export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  handle?: string;
  phone?: string;
  contactMethod?: string;
  bio?: string;
  createdAt?: string;
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
  | 'pending'
  | 'reviewing'
  | 'accepted'
  | 'in_progress'
  | 'for_review'
  | 'revision'
  | 'final_approval'
  | 'completed'
  | 'cancelled'
  | 'Pending'
  | 'In Progress'
  | 'Client Review'
  | 'Revision Requested'
  | 'Final Approval'
  | 'Completed'
  | 'Rejected';

export type CommissionPriority = 'low' | 'normal' | 'high' | 'urgent';

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

export interface CommissionDeliverable {
  id: string;
  commissionId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  version: number;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;

  // Snake_case database compatibility aliases
  commission_id?: string;
  uploaded_by?: string;
  file_name?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  created_at?: string;
  updated_at?: string;
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
  purpose?: string;
  targetAudience?: string;
  preferredStyle?: string;
  preferredColors?: string[];
  requiredDimensions?: string;
  
  // Timeline & Financials
  budget: string;
  currency: string;
  deadline: string;
  startDate?: string;
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  priority?: CommissionPriority;
  
  // Progress & State
  status: CommissionStatus;
  progress: number;
  currentStage: number; // 1 to 8
  
  // References & Notes
  referenceImages?: string[];
  referenceLinks?: string[];
  referenceDocs?: ReferenceDocument[];
  communicationGoals?: string;
  thingsToAvoid?: string;
  additionalNotes?: string;
  
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
  proofs?: CommissionProof[];
  
  createdAt: string;
  updatedAt: string;
}

export type CommissionProofStatus = 'pending_review' | 'revision_requested' | 'approved';

export interface CommissionProof {
  id: string;
  commissionId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  version: number;
  status: CommissionProofStatus;
  revisionNote?: string;
  createdAt: string;
  updatedAt: string;

  // Supabase raw row snake_case compatibility properties
  commission_id?: string;
  uploaded_by?: string;
  file_name?: string;
  file_path?: string;
  file_url?: string | null;
  file_type?: string;
  file_size?: number;
  revision_note?: string | null;
  created_at?: string;
  updated_at?: string;
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
  body?: string;
  attachment?: MessageAttachment;
  timestamp: string;
  readStatus: boolean;
  createdAt?: string;

  // Supabase raw row snake_case compatibility properties
  commission_id?: string;
  sender_id?: string;
  created_at?: string;
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

export type NotificationType = 
  | 'message' 
  | 'commission_update' 
  | 'proof_review' 
  | 'proof_revision' 
  | 'proof_approved' 
  | 'commission_completed' 
  | 'system'
  // Legacy alias compatibility
  | 'status' 
  | 'review' 
  | 'delivery';

export interface AppNotification {
  id: string;
  userId: string;
  user_id?: string;
  recipientId?: string;
  recipient_id?: string;
  commissionId?: string;
  commission_id?: string;
  title?: string;
  message: string;
  type: NotificationType;
  readStatus: boolean;
  is_read?: boolean;
  timestamp: string;
  created_at?: string;
  createdAt?: string;
  linkTab?: string;
  link_tab?: string;
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

  // Cross-selling metadata (Phase 4D.3: Services -> Shop)
  relatedShopProductIds?: string[];
}

export type ProjectType = 'client' | 'concept';

export interface CaseStudyMediaItem {
  id?: string;
  url: string;
  caption?: string;
  type?: 'image' | 'video' | 'comparison';
  aspectRatio?: string;
}

export interface CaseStudyContent {
  overview?: string;
  challenge?: string;
  objective?: string;
  researchInspiration?: string;
  conceptDevelopment?: string;
  designDecisions?: string;
  finalSolution?: string;
  reflection?: string;
  deliverablesSummary?: string[];
  media?: Record<string, CaseStudyMediaItem[]>;
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

  // Cross-selling metadata (Phase 4D.2: Portfolio -> Shop)
  relatedShopProductIds?: string[];

  // Phase 5F: Social Portfolio & Case Study Studio
  projectType?: ProjectType;
  serviceId?: string;
  commissionId?: string;
  caseStudy?: CaseStudyContent;
  likesCount?: number;
  viewsCount?: number;
  sharesCount?: number;

  // Snake_case & alias database compatibility
  likes_count?: number;
  views_count?: number;
  shares_count?: number;
  views?: number;
  likes?: number;
  shares?: number;
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

export type ProofStatus = 'pending_review' | 'revision_requested' | 'approved';

export type ShopCategoryName =
  | 'All'
  | 'Branding Kits'
  | 'Vector Packs'
  | 'Print & Posters'
  | 'Typography'
  | 'Digital Mockups';

export type ShopCategoryId =
  | 'all'
  | 'branding-kits'
  | 'vector-packs'
  | 'print-posters'
  | 'typography'
  | 'digital-mockups';

export interface ShopCategory {
  id: ShopCategoryId;
  name: ShopCategoryName;
  description: string;
  badge?: string;
}

export type ShopProductType = 'Digital' | 'Physical';

export type ShopProductStatus = 'Coming Soon' | 'In Production' | 'Available' | 'Sold Out';

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  category: ShopCategoryName;
  categoryId: ShopCategoryId;
  description: string;
  shortDescription: string;
  productType: ShopProductType;
  price: number;
  priceLabel?: string;
  image?: string;
  visualGradient?: string;
  status: ShopProductStatus;
  featured?: boolean;
  tags: string[];
  formats?: string;
  badge?: string;
  phaseTag?: string;
  iconName?: 'Tag' | 'Palette' | 'Package' | 'Type' | 'Layers';

  // Template metadata (Phase 4B.1)
  isTemplate?: boolean;
  templateType?: string;
  intendedUse?: string;
  editableFormat?: string;

  // Downloadable product metadata (Phase 4B.2)
  isDownloadable?: boolean;
  downloadLabel?: string;
  availableFormats?: string;
  fileSizeLabel?: string;
  downloadStatus?: 'Not Yet Available' | 'Coming Soon' | 'Available';
  downloadUrl?: string;

  // External checkout metadata (Phase 4B.3)
  externalCheckoutUrl?: string;
  externalCheckoutLabel?: string;
  externalCheckoutProvider?: string;

  // Physical merchandise metadata (Phase 4C.1)
  isPhysical?: boolean;
  material?: string;
  dimensions?: string;
  careInstructions?: string;
  variantLabel?: string;

  // Product image metadata (Phase 4C.2)
  productImage?: string;
  productImageAlt?: string;
  productImageCredit?: string;

  // Sizes / Variants metadata (Phase 4C.3)
  variants?: ShopProductVariant[];

  // Cross-selling metadata (Phase 4D.1: Shop -> Portfolio)
  relatedPortfolioIds?: string[];

  // Cross-selling metadata (Phase 4D.4: Shop -> Services / Commissions)
  relatedServiceIds?: string[];
}

export interface ShopProductVariant {
  id: string;
  name: string;
  label?: string;
  description?: string;
  price?: number;
  priceLabel?: string;
}

export type UpcomingShopRelease = ShopProduct;
