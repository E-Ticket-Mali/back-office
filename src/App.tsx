import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { HotelsView } from './views/HotelsView';
import { HotelDetailView } from './views/HotelDetailView';
import { EventsView } from './views/EventsView';
import { EventDetailView } from './views/EventDetailView';
import { BookingsView } from './views/BookingsView';
import { BookingDetailView } from './views/BookingDetailView';
import { ClientsView } from './views/ClientsView';
import { ClientDetailView } from './views/ClientDetailView';
import { AgentsView } from './views/AgentsView';
import { AgentDetailView } from './views/AgentDetailView';
import { OrganizerDashboardView } from './views/OrganizerDashboardView';
import { OrganizerEventsView } from './views/OrganizerEventsView';
import { OrganizerAgentsView } from './views/OrganizerAgentsView';
import { useAuth } from './AuthContext';
import { useTableFilters } from './hooks/useTableFilters';
import { ADMIN_VIEWS, defaultViewForRole, ORGANIZER_VIEWS } from './types';
import type { AdminBooking, AdminClient, EventItem, Hotel, StaffAgent, ViewId } from './types';

const TABLE_VIEWS = new Set<ViewId>(['hotels', 'events', 'bookings', 'clients', 'agents']);

const TITLES: Record<ViewId, string> = {
  dashboard: 'Tableau de bord',
  hotels: 'Hôtels',
  hotelDetail: '',
  events: 'Événements',
  eventDetail: '',
  bookings: 'Réservations',
  bookingDetail: '',
  clients: 'Clients',
  clientDetail: '',
  agents: 'Agents contrôleurs',
  agentDetail: '',
  organizerDashboard: 'Tableau de bord',
  organizerEvents: 'Mes événements',
  organizerAgents: 'Agents',
};

function buildViewTitle(
  view: ViewId,
  selectedHotel: Hotel | null,
  selectedEvent: EventItem | null,
  selectedBooking: AdminBooking | null,
  selectedClient: AdminClient | null,
  selectedAgent: StaffAgent | null
): string {
  switch (view) {
    case 'hotelDetail':
      return `Hôtel — ${selectedHotel?.name ?? ''}`;
    case 'eventDetail':
      return `Événement — ${selectedEvent?.name ?? ''}`;
    case 'bookingDetail':
      return `Réservation — ${selectedBooking?.id.slice(0, 8) ?? ''}`;
    case 'clientDetail':
      return `Client — ${selectedClient?.name ?? ''}`;
    case 'agentDetail':
      return `Agent — ${selectedAgent?.agentName ?? ''}`;
    default:
      return TITLES[view];
  }
}

function App() {
  const { session, logout } = useAuth();
  const [view, setView] = useState<ViewId>('dashboard');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<StaffAgent | null>(null);
  const filters = useTableFilters();

  if (!session) {
    return <LoginView />;
  }

  // Derived at render time (not via a useEffect + setState) so a role switch (logout, then
  // login as the other role) never paints a frame where `view` still points at a ViewId that
  // belongs to the previous role's branch — the content area would otherwise render nothing
  // for that one frame. `view` itself is left untouched; only what gets rendered/compared
  // against is corrected, and the next explicit `navigate()` call still writes to real state.
  const roleViews = session.role === 'ADMIN' ? ADMIN_VIEWS : ORGANIZER_VIEWS;
  const effectiveView = roleViews.has(view) ? view : defaultViewForRole(session.role);

  const navigate = (nextView: ViewId) => {
    setView(nextView);
    filters.reset();
  };

  const openHotelDetail = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    navigate('hotelDetail');
  };
  const openEventDetail = (event: EventItem) => {
    setSelectedEvent(event);
    navigate('eventDetail');
  };
  const openBookingDetail = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    navigate('bookingDetail');
  };
  const openClientDetail = (client: AdminClient) => {
    setSelectedClient(client);
    navigate('clientDetail');
  };
  const openAgentDetail = (agent: StaffAgent) => {
    setSelectedAgent(agent);
    navigate('agentDetail');
  };

  const viewTitle = buildViewTitle(effectiveView, selectedHotel, selectedEvent, selectedBooking, selectedClient, selectedAgent);
  const hasSearch = TABLE_VIEWS.has(effectiveView);

  return (
    <div className="bo-shell" style={{ background: '#FAF3EB', color: '#1F2E35' }}>
      <Sidebar view={effectiveView} onNavigate={navigate} role={session.role} />

      <div className="bo-main">
        <Topbar
          title={viewTitle}
          hasSearch={hasSearch}
          search={filters.search}
          onSearch={filters.onSearch}
          notifications={[]}
          onMarkAllRead={() => {}}
          adminName={session.name}
          onLogout={logout}
        />

        <div className="bo-content">
          {session.role === 'ADMIN' ? (
            <>
              {effectiveView === 'dashboard' && <DashboardView />}

              {effectiveView === 'hotels' && <HotelsView filters={filters} onOpenDetail={openHotelDetail} />}
              {effectiveView === 'hotelDetail' && selectedHotel && (
                <HotelDetailView hotel={selectedHotel} onBack={() => navigate('hotels')} />
              )}

              {effectiveView === 'events' && <EventsView filters={filters} onOpenDetail={openEventDetail} />}
              {effectiveView === 'eventDetail' && selectedEvent && (
                <EventDetailView event={selectedEvent} onBack={() => navigate('events')} />
              )}

              {effectiveView === 'bookings' && <BookingsView filters={filters} onOpenDetail={openBookingDetail} />}
              {effectiveView === 'bookingDetail' && selectedBooking && (
                <BookingDetailView booking={selectedBooking} onBack={() => navigate('bookings')} />
              )}

              {effectiveView === 'clients' && <ClientsView filters={filters} onOpenDetail={openClientDetail} />}
              {effectiveView === 'clientDetail' && selectedClient && (
                <ClientDetailView client={selectedClient} onBack={() => navigate('clients')} />
              )}

              {effectiveView === 'agents' && <AgentsView filters={filters} onOpenDetail={openAgentDetail} />}
              {effectiveView === 'agentDetail' && selectedAgent && (
                <AgentDetailView agent={selectedAgent} onBack={() => navigate('agents')} />
              )}
            </>
          ) : (
            <>
              {effectiveView === 'organizerDashboard' && <OrganizerDashboardView />}
              {effectiveView === 'organizerEvents' && <OrganizerEventsView />}
              {effectiveView === 'organizerAgents' && <OrganizerAgentsView />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
