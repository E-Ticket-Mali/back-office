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
  | 'agentDetail';

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
  capacity: number | null;
  /** Tickets still available; null = unlimited. */
  remaining: number | null;
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
  tickets: EventTicket[];
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
