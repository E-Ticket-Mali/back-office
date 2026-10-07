export type ViewId =
  | 'dashboard'
  | 'hotels'
  | 'hotelDetail'
  | 'events'
  | 'eventDetail'
  | 'bookings'
  | 'bookingDetail'
  | 'clients'
  | 'clientDetail'
  | 'agents'
  | 'agentDetail'
  | 'organizersAdmin'
  | 'organizerAdminDetail'
  | 'organizerDashboard'
  | 'organizerEvents'
  | 'organizerEventDetail'
  | 'organizerAgents'
  | 'organizerAgentDetail'
  | 'organizerTicketing'
  | 'organizerFinance'
  | 'organizerNotifications'
  | 'organizerSettings'
  | 'organizerAssignments'
  | 'adminTickets'
  | 'adminScans'
  | 'adminCommissions'
  | 'adminPayouts'
  | 'adminNotifications'
  | 'security';

/** Sous-section d'une vue (ex. filtre de statut « Brouillons » sous Événements) — pilotée par
 * les sous-menus de la sidebar. `null` = vue par défaut. */
export type ViewSection = string | null;

/** Single source of truth for which ViewIds belong to which role, and each role's landing
 * view — consumed by both the initial-state derivation and the stale-view correction in
 * App.tsx, so the two can never drift out of sync with opposite polarity. */
export const ADMIN_VIEWS = new Set<ViewId>([
  'dashboard', 'hotels', 'hotelDetail', 'events', 'eventDetail',
  'bookings', 'bookingDetail', 'clients', 'clientDetail', 'agents', 'agentDetail',
  'organizersAdmin', 'organizerAdminDetail', 'security',
  'adminTickets', 'adminScans', 'adminCommissions', 'adminPayouts', 'adminNotifications',
]);
export const ORGANIZER_VIEWS = new Set<ViewId>([
  'organizerDashboard', 'organizerEvents', 'organizerEventDetail', 'organizerAgents', 'organizerAgentDetail',
  'organizerTicketing', 'organizerFinance', 'organizerNotifications',
  'organizerSettings', 'organizerAssignments',
]);

export function defaultViewForRole(role: 'ADMIN' | 'ORGANIZER'): ViewId {
  return role === 'ADMIN' ? 'dashboard' : 'organizerDashboard';
}

export type RoomType = 'SINGLE' | 'DOUBLE' | 'SUITE';
export type EventCategory = 'HIPPIQUE' | 'CONCERT' | 'SPORT' | 'CONFERENCE' | 'CINEMA' | 'THEATRE';
export type TicketType = 'VIP' | 'STANDARD' | 'EARLY_BIRD';
export type BookingKind = 'HOTEL' | 'EVENT';
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'ORANGE_MONEY' | 'WAVE';
export type ScanStatus = 'VALID' | 'USED' | 'INVALID';

export interface Room {
  id: string;
  type: RoomType;
  price: number;
  capacity: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  location: string;
  rating: number;
  desc: string | null;
  rooms: Room[];
}

export interface EventTicket {
  id: string;
  type: TicketType;
  price: number;
  /** Max tickets for this type; null = unlimited. */
  capacity?: number | null;
  /** Tickets still available; null = unlimited. */
  remaining?: number | null;
  /** Null when no image/preset has been set — render a generic icon instead. */
  imageUrl?: string | null;
}

export interface EventItem {
  id: string;
  category: EventCategory;
  name: string;
  location: string;
  city: string;
  date: string;
  desc: string | null;
  icon: string | null;
  /** Always PUBLISHED for events the public catalog ever returns (CatalogService filters to
   * that before mapping); organizer-submitted events reaching /admin/events can be any
   * OrganizerEventStatus. Optional only as defence against older/cached responses. */
  status?: OrganizerEventStatus;
  /** Set only when status === 'REJECTED' (cleared by the backend on approval). */
  rejectionReason: string | null;
  tickets: EventTicket[];
  /** Null when no image/preset has been set — render a generic category icon instead. */
  imageUrl: string | null;
  /** Organisateur propriétaire ; null = événement de la plateforme (créé par l'admin). */
  organizerName?: string | null;
}

export interface AdminBooking {
  id: string;
  clientName: string;
  clientPhone: string;
  kind: BookingKind;
  hotelName: string;
  itemLabel: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  fee: number;
  total: number;
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  nights: number | null;
  eventDate: string | null;
  qty: number | null;
  createdAt: string;
}

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  remindersOn: boolean;
  promosOn: boolean;
  statusUpdatesOn: boolean;
  bookingCount: number;
  createdAt: string;
}

export interface StaffAgent {
  id: string;
  staffCode: string;
  agentName: string;
  createdAt: string;
}

export interface TicketManifestEntry {
  code: string;
  type: string;
  holder: string;
  used: boolean;
  usedAt: string | null;
}

export interface AdminScanRecord {
  code: string;
  status: ScanStatus;
  time: string;
  staffName: string;
}

export interface EventStats {
  totalTickets: number;
  scanned: number;
  valid: number;
  used: number;
  invalid: number;
}

export interface DashboardStats {
  totalHotels: number;
  totalEvents: number;
  upcomingEvents: number;
  totalClients: number;
  totalStaff: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  ticketsIssued: number;
  ticketsScanned: number;
}

// --- Organisateur (Story 6.3) -------------------------------------------------------------
// Types dupliqués depuis les équivalents ADMIN plutôt que partagés : même raisonnement que la
// duplication assumée côté backend (organizer/* vs admin/* services) — Story 2.2.

export type OrganizerEventStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';

export interface OrganizerEventItem {
  id: string;
  category: EventCategory;
  name: string;
  location: string;
  city: string;
  date: string;
  desc: string | null;
  icon: string | null;
  status: OrganizerEventStatus;
  /** Renseigné uniquement quand `status === 'REJECTED'`. */
  rejectionReason: string | null;
  tickets: EventTicket[];
  /** Null tant qu'aucune image/logo prédéfini n'a été défini — afficher une icône générique. */
  imageUrl: string | null;
}

export interface OrganizerStaffAgent {
  id: string;
  staffCode: string;
  agentName: string;
  createdAt: string;
}

export interface AssignedEvent {
  id: string;
  name: string;
}

export interface Balance {
  netRevenue: number;
  committed: number;
  available: number;
}

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface PayoutRequest {
  id: string;
  amount: number;
  status: PayoutStatus;
  adminNote: string | null;
  requestedAt: string;
  decidedAt: string | null;
}

export interface AdminPayoutRequest extends PayoutRequest {
  organizerId: string;
  organizerName: string;
}

export interface OrganizerDashboardStats {
  eventsByStatus: Record<OrganizerEventStatus, number>;
  ticketsSold: number;
  balance: Balance;
}

export interface OrganizerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// --- Organisateurs — modération ADMIN (Story 6.4) -----------------------------------------

export type OrganizerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type OrganizerDocumentKind = 'NIF' | 'RCCM' | 'ID_PIECE';

export interface AdminOrganizerDocument {
  id: string;
  kind: OrganizerDocumentKind;
  contentType: string;
  uploadedAt: string;
}

export interface AdminOrganizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  nif: string;
  rccm: string;
  status: OrganizerStatus;
  createdAt: string;
  rejectionReason: string | null;
  /** `null` = taux par défaut de la plateforme (10 %). */
  commissionRate: number | null;
  documents: AdminOrganizerDocument[];
}
