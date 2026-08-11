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
import { useAuth } from './AuthContext';
import { useTableFilters } from './hooks/useTableFilters';
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

  const viewTitle = buildViewTitle(view, selectedHotel, selectedEvent, selectedBooking, selectedClient, selectedAgent);
  const hasSearch = TABLE_VIEWS.has(view);

  return (
    <div className="bo-shell" style={{ background: '#FAF3EB', color: '#1F2E35' }}>
      <Sidebar view={view} onNavigate={navigate} />

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
          {view === 'dashboard' && <DashboardView />}

          {view === 'hotels' && <HotelsView filters={filters} onOpenDetail={openHotelDetail} />}
          {view === 'hotelDetail' && selectedHotel && (
            <HotelDetailView hotel={selectedHotel} onBack={() => navigate('hotels')} />
          )}

          {view === 'events' && <EventsView filters={filters} onOpenDetail={openEventDetail} />}
          {view === 'eventDetail' && selectedEvent && (
            <EventDetailView event={selectedEvent} onBack={() => navigate('events')} />
          )}

          {view === 'bookings' && <BookingsView filters={filters} onOpenDetail={openBookingDetail} />}
          {view === 'bookingDetail' && selectedBooking && (
            <BookingDetailView booking={selectedBooking} onBack={() => navigate('bookings')} />
          )}

          {view === 'clients' && <ClientsView filters={filters} onOpenDetail={openClientDetail} />}
          {view === 'clientDetail' && selectedClient && (
            <ClientDetailView client={selectedClient} onBack={() => navigate('clients')} />
          )}

          {view === 'agents' && <AgentsView filters={filters} onOpenDetail={openAgentDetail} />}
          {view === 'agentDetail' && selectedAgent && (
            <AgentDetailView agent={selectedAgent} onBack={() => navigate('agents')} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
