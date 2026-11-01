export type UserRole = 'admin' | 'organizer' | 'gate';
export type UserAccountStatus = 'active' | 'pending_password' | 'blocked';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  assignedGate?: string;
  assignedEventIds?: string[];
  status: UserAccountStatus;
  password?: string;
  inviteToken?: string;
  resetToken?: string;
  invitedAt?: string;
  passwordCreatedAt?: string;
  lastLoginAt?: string;
}

export interface TicketCategory {
  id: string;
  eventId?: string;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  quota: number;
  description: string;
  accessZone: string;
  validTime: string;
}

export interface FormField {
  id: string;
  eventId?: string;
  label: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'radio' | 'terms' | 'file';
  required: boolean;
  isInternal: boolean;
  isCustom: boolean;
  options?: string[];
  placeholder?: string;
  order: number;
}

export type GuestStatus = 'pending' | 'sent' | 'viewed' | 'confirmed' | 'cancelled' | 'blocked';
export type DeliveryStatus = 'not_sent' | 'sent' | 'delivered' | 'failed';

export interface Guest {
  id: string;
  eventId?: string;
  publicCode: string;
  qrPayloadToken: string;
  name: string;
  email: string;
  phone: string;
  ticketCategoryId: string;
  status: GuestStatus;
  
  // Check-in details
  isCheckedIn: boolean;
  checkInTimestamp?: string;
  checkInOperator?: string;
  checkInDevice?: string;
  checkInGate?: string;
  
  // Delivery metrics
  emailStatus: DeliveryStatus;
  whatsappStatus: DeliveryStatus;
  sentAt?: string;
  
  // Extra fields
  docNumber?: string;
  companions: number;
  notes?: string;
  customData?: Record<string, string>;
  
  // Security
  qrVersion: number;
  createdAt: string;
  reissuedAt?: string;
}

export type InviteThemePreset = 
  | 'dark'
  | 'indigo' 
  | 'emerald' 
  | 'gold' 
  | 'ruby' 
  | 'purple' 
  | 'sunset' 
  | 'ocean' 
  | 'cyberpunk' 
  | 'rosegold' 
  | 'slate' 
  | 'pure_white'
  | 'custom';

export type InviteBgMode = 'preset' | 'custom_color' | 'custom_gradient' | 'image';
export type InvitePatternStyle = 'none' | 'dots' | 'grid' | 'lines' | 'paper_grain' | 'bokeh' | 'luxury_geo' | 'carbon';
export type InviteGradientDirection = 'to-b' | 'to-br' | 'to-r' | 'to-tr' | 'radial';

export interface InviteLayoutConfig {
  bgTheme: InviteThemePreset;
  bgMode?: InviteBgMode;
  customBgColor?: string;
  customBgColorEnd?: string;
  gradientDirection?: InviteGradientDirection;
  patternStyle?: InvitePatternStyle;
  bgImageUrl?: string;
  bgOverlayOpacity?: number; // 0 to 90
  bgBlur?: number; // 0 to 12
  logoUrl?: string;
  title: string;
  subtitle: string;
  instructions: string;
  showQr: boolean;
  showName: boolean;
  showCategory: boolean;
  showLocation: boolean;
  showTime: boolean;
  showDoc: boolean;
  showCompanions: boolean;
  accentColor: string;
  textColor: string;
  cardStyle: 'modern' | 'ticket' | 'badge' | 'minimal';
}

export interface EventFaqItem {
  id: string;
  question: string;
  answer: string;
  category?: 'location' | 'schedule' | 'dresscode' | 'parking' | 'vip' | 'general';
}

export interface EventAiConfig {
  enabled: boolean;
  botName: string;
  tone: 'formal_vip' | 'friendly' | 'executive' | 'concise';
  personaPreset?: 'formal_vip' | 'friendly' | 'executive' | 'concise' | 'custom';
  customPersona?: string;
  venueAddress: string;
  googleMapsUrl: string;
  wazeUrl?: string;
  scheduleDetails: string;
  dressCode: string;
  parkingInfo: string;
  vipPerks: string;
  foodAndDrinksInfo?: string;
  emergencyContact?: string;
  customKnowledgeBase: string;
  faqs: EventFaqItem[];
  welcomeMessage: string;
  fallbackMessage: string;
}

export interface ChannelConfig {
  whatsapp: {
    enabled: boolean;
    serverUrl: string;
    sessionName: string;
    delayMin: number;
    delayMax: number;
    maxRetries: number;
  };
}

export interface AppSettings {
  groqApiKey: string;
  groqModel: string;
  channelConfig: ChannelConfig;
  lucyEnabled: boolean;
  lucyApiUrl: string;
}

export interface EventScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
}

export interface EventLandingPageConfig {
  enabled: boolean;
  heroTagline?: string;
  welcomeMessage?: string;
  bannerImageUrl?: string;
  
  // Horários & Cronograma
  entryTime?: string;
  startTime?: string;
  endTime?: string;
  scheduleItems?: EventScheduleItem[];
  
  // Cardápio / Menu Gastronômico
  menuEnabled?: boolean;
  menuTitle?: string;
  welcomeDrinks?: string;
  starters?: string;
  mainCourses?: string;
  desserts?: string;
  beverages?: string;
  dietaryNotice?: string;
  
  // Localização & Acesso
  venueName?: string;
  address?: string;
  cityState?: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
  parkingInfo?: string;
  dressCode?: string;
  
  // Confirmação de Presença
  allowRsvp?: boolean;
  rsvpDeadline?: string;
  
  // Contato & Avisos
  contactWhatsapp?: string;
  importantNotices?: string[];
}

export interface EventData {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  locationName: string;
  address: string;
  cityState: string;
  maxCapacity: number;
  status: 'draft' | 'published' | 'closed';
  coverUrl: string;
  inviteLayout: InviteLayoutConfig;
  aiConfig?: EventAiConfig;
  landingPageConfig?: EventLandingPageConfig;
}

export type AuditActionType =
  | 'guest_created'
  | 'bulk_imported'
  | 'qr_generated'
  | 'qr_reissued'
  | 'email_sent'
  | 'whatsapp_sent'
  | 'checkin_success'
  | 'checkin_duplicate_attempt'
  | 'checkin_invalid'
  | 'guest_updated'
  | 'guest_blocked';

export interface AuditLog {
  id: string;
  eventId?: string;
  timestamp: string;
  action: AuditActionType;
  guestId?: string;
  guestName?: string;
  publicCode?: string;
  operator: string;
  device: string;
  details: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

export interface CheckInScanResult {
  status: 'success' | 'duplicate' | 'invalid' | 'blocked' | 'cancelled';
  guest?: Guest;
  message: string;
  timestamp: string;
  operator: string;
  device: string;
  previousCheckIn?: {
    timestamp: string;
    operator: string;
    device: string;
    gate?: string;
  };
}
