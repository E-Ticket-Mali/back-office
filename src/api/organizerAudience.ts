import { http } from './http';

export type AudienceBookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

/** Chiffres d'un événement ; `capacity` est null dès qu'une catégorie active est sans limite. */
export interface EventSummary {
  capacity: number | null;
  sold: number;
  checkedIn: number;
  bookings: number;
  customers: number;
  grossRevenue: number;
  netRevenue: number;
}

/** Une réservation de l'événement, vue comme un inscrit. */
export interface Attendee {
  bookingId: string;
  customerId: string;
  customerName: string;
  phone: string;
  email: string | null;
  category: string | null;
  qty: number;
  amount: number;
  status: AudienceBookingStatus;
  bookedAt: string;
  /** Billets de cette réservation déjà contrôlés à l'entrée. */
  checkedIn: number;
}

export interface EventAudience {
  summary: EventSummary;
  attendees: Attendee[];
}

/** Un client de l'organisateur, tous événements confondus. */
export interface OrganizerCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  bookings: number;
  tickets: number;
  totalSpent: number;
  events: number;
  firstBookingAt: string;
  lastBookingAt: string;
}

export interface CustomerBooking {
  bookingId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  category: string | null;
  qty: number;
  amount: number;
  status: AudienceBookingStatus;
  bookedAt: string;
}

export interface OrganizerCustomerDetail {
  customer: OrganizerCustomer;
  bookings: CustomerBooking[];
}

export const getEventAudience = (eventId: string) => http.get<EventAudience>(`/organizer/events/${eventId}/attendees`);
export const getOrganizerCustomers = () => http.get<OrganizerCustomer[]>('/organizer/customers');
export const getOrganizerCustomer = (id: string) => http.get<OrganizerCustomerDetail>(`/organizer/customers/${id}`);
