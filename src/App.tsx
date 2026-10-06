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
import { OrganizersView } from './views/OrganizersView';
import { OrganizerDetailView } from './views/OrganizerDetailView';
import { SecurityView } from './views/SecurityView';
import { OrganizerDashboardView } from './views/OrganizerDashboardView';
import { OrganizerEventsView } from './views/OrganizerEventsView';
import { OrganizerEventDetailView } from './views/OrganizerEventDetailView';
import { OrganizerAgentsView } from './views/OrganizerAgentsView';
import { OrganizerAgentDetailView } from './views/OrganizerAgentDetailView';
import { OrganizerSettingsView } from './views/OrganizerSettingsView';
import { OrganizerTicketingView } from './views/OrganizerTicketingView';
import { OrganizerFinanceView } from './views/OrganizerFinanceView';
import { OrganizerNotificationsView } from './views/OrganizerNotificationsView';
import { OrganizerAssignmentsView } from './views/OrganizerAssignmentsView';
import { AdminTicketsView } from './views/AdminTicketsView';
import { AdminScansView } from './views/AdminScansView';
import { AdminCommissionsView } from './views/AdminCommissionsView';
import { AdminPayoutsView } from './views/AdminPayoutsView';
import { AdminNotificationsView } from './views/AdminNotificationsView';
import { useAuth } from './AuthContext';
import { useTableFilters } from './hooks/useTableFilters';
import { ADMIN_VIEWS, defaultViewForRole, ORGANIZER_VIEWS } from './types';
import type {
  AdminBooking,
  AdminClient,
  AdminOrganizer,
  EventItem,
  Hotel,
  OrganizerEventItem,
  OrganizerStaffAgent,
  StaffAgent,
  ViewId,
  ViewSection,
} from './types';

const TABLE_VIEWS = new Set<ViewId>([
  'hotels', 'events', 'bookings', 'clients', 'agents', 'organizersAdmin', 'organizerEvents', 'organizerAgents',
  'organizerTicketing', 'adminCommissions', 'adminPayouts',
]);

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
  organizersAdmin: 'Organisateurs',
  organizerAdminDetail: '',
  security: 'Paramètres / Profil',
  organizerDashboard: 'Tableau de bord',
  organizerEvents: 'Mes événements',
  organizerEventDetail: '',
  organizerAgents: 'Agents',
  organizerAgentDetail: '',
  organizerTicketing: 'Billetterie',
  organizerFinance: 'Finances',
  organizerNotifications: 'Notifications',
  organizerSettings: 'Profil',
  organizerAssignments: 'Affectations des agents',
  adminTickets: 'Billets & Manifestes',
  adminScans: 'Scans',
  adminCommissions: 'Commissions',
  adminPayouts: 'Demandes de reversement',
  adminNotifications: 'Notifications',
};

/** Titre d'une sous-section choisie dans un sous-menu (clé `vue:section`). */
const SECTION_TITLES: Record<string, string> = {
  'organizerEvents:DRAFT': 'Brouillons',
  'organizerEvents:PENDING_APPROVAL': 'En attente de validation',
  'organizerEvents:PUBLISHED': 'Événements publiés',
  'organizerEvents:REJECTED': 'Événements rejetés',
  'organizerEvents:CREATE': 'Mes événements',
  'organizerTicketing:sales': 'Ventes',
  'organizerTicketing:manifests': 'Manifestes',
  'organizerTicketing:exports': 'Exports',
  'organizerFinance:balance': 'Solde disponible',
  'organizerFinance:requests': 'Demandes de reversement',
  'organizerFinance:history': 'Historique des reversements',
};

function buildViewTitle(
  view: ViewId,
  section: ViewSection,
  selectedHotel: Hotel | null,
  selectedEvent: EventItem | null,
  selectedBooking: AdminBooking | null,
  selectedClient: AdminClient | null,
  selectedAgent: StaffAgent | null,
  selectedOrganizer: AdminOrganizer | null,
  selectedOrganizerEvent: OrganizerEventItem | null,
  selectedOrganizerAgent: OrganizerStaffAgent | null
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
    case 'organizerAdminDetail':
      return `Organisateur — ${selectedOrganizer?.name ?? ''}`;
    case 'organizerEventDetail':
      return `Événement — ${selectedOrganizerEvent?.name ?? ''}`;
    case 'organizerAgentDetail':
      return `Agent — ${selectedOrganizerAgent?.agentName ?? ''}`;
    default:
      return (section && SECTION_TITLES[`${view}:${section}`]) || TITLES[view];
  }
}

function App() {
  const { session, logout } = useAuth();
  const [view, setView] = useState<ViewId>('dashboard');
  const [section, setSection] = useState<ViewSection>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<StaffAgent | null>(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState<AdminOrganizer | null>(null);
  const [selectedOrganizerEvent, setSelectedOrganizerEvent] = useState<OrganizerEventItem | null>(null);
  const [selectedOrganizerAgent, setSelectedOrganizerAgent] = useState<OrganizerStaffAgent | null>(null);
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

  const navigate = (nextView: ViewId, nextSection: ViewSection = null) => {
    setView(nextView);
    setSection(nextSection);
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
  const openOrganizerDetail = (organizer: AdminOrganizer) => {
    setSelectedOrganizer(organizer);
    navigate('organizerAdminDetail');
  };
  const openOrganizerEventDetail = (event: OrganizerEventItem) => {
    setSelectedOrganizerEvent(event);
    navigate('organizerEventDetail');
  };
  const openOrganizerAgentDetail = (agent: OrganizerStaffAgent) => {
    setSelectedOrganizerAgent(agent);
    navigate('organizerAgentDetail');
  };

  const effectiveSection = effectiveView === view ? section : null;
  const viewTitle = buildViewTitle(
    effectiveView,
    effectiveSection,
    selectedHotel,
    selectedEvent,
    selectedBooking,
    selectedClient,
    selectedAgent,
    selectedOrganizer,
    selectedOrganizerEvent,
    selectedOrganizerAgent
  );
  const hasSearch = TABLE_VIEWS.has(effectiveView);

  return (
    <div className="bo-shell" style={{ background: '#FAF3EB', color: '#1F2E35' }}>
      <Sidebar view={effectiveView} section={effectiveSection} onNavigate={navigate} role={session.role} />

      <div className="bo-main">
        <Topbar
          title={viewTitle}
          hasSearch={hasSearch}
          search={filters.search}
          onSearch={filters.onSearch}
          notifications={[]}
          onMarkAllRead={() => {}}
          adminName={session.name}
          role={session.role === 'ADMIN' ? 'Administrateur' : 'Organisateur'}
          onLogout={logout}
        />

        <div className="bo-content">
          {session.role === 'ADMIN' ? (
            <>
              {effectiveView === 'dashboard' && <DashboardView onNavigate={navigate} />}

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

              {effectiveView === 'organizersAdmin' && (
                <OrganizersView filters={filters} onOpenDetail={openOrganizerDetail} />
              )}
              {effectiveView === 'organizerAdminDetail' && selectedOrganizer && (
                <OrganizerDetailView organizer={selectedOrganizer} onBack={() => navigate('organizersAdmin')} />
              )}

              {effectiveView === 'adminTickets' && <AdminTicketsView />}
              {effectiveView === 'adminScans' && <AdminScansView />}
              {effectiveView === 'adminCommissions' && <AdminCommissionsView filters={filters} />}
              {effectiveView === 'adminPayouts' && <AdminPayoutsView filters={filters} />}
              {effectiveView === 'adminNotifications' && <AdminNotificationsView onNavigate={navigate} />}

              {effectiveView === 'security' && <SecurityView />}
            </>
          ) : (
            <>
              {effectiveView === 'organizerDashboard' && <OrganizerDashboardView onNavigate={navigate} />}

              {effectiveView === 'organizerEvents' && (
                <OrganizerEventsView
                  key={effectiveSection ?? 'ALL'}
                  filters={filters}
                  section={effectiveSection}
                  onOpenDetail={openOrganizerEventDetail}
                  onCreateHandled={() => setSection(null)}
                />
              )}
              {effectiveView === 'organizerEventDetail' && selectedOrganizerEvent && (
                <OrganizerEventDetailView event={selectedOrganizerEvent} onBack={() => navigate('organizerEvents')} />
              )}

              {effectiveView === 'organizerAgents' && (
                <OrganizerAgentsView filters={filters} onOpenDetail={openOrganizerAgentDetail} />
              )}
              {effectiveView === 'organizerAgentDetail' && selectedOrganizerAgent && (
                <OrganizerAgentDetailView agent={selectedOrganizerAgent} onBack={() => navigate('organizerAgents')} />
              )}

              {effectiveView === 'organizerSettings' && <OrganizerSettingsView />}
              {effectiveView === 'organizerTicketing' && <OrganizerTicketingView filters={filters} section={effectiveSection} />}
              {effectiveView === 'organizerFinance' && <OrganizerFinanceView section={effectiveSection} />}
              {effectiveView === 'organizerAssignments' && <OrganizerAssignmentsView />}
              {effectiveView === 'organizerNotifications' && <OrganizerNotificationsView />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
