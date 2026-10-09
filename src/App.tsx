import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { AdminSettingsView } from './views/AdminSettingsView';
import { OrganizerDashboardView } from './views/OrganizerDashboardView';
import { OrganizerEventsView } from './views/OrganizerEventsView';
import { OrganizerEventDetailView } from './views/OrganizerEventDetailView';
import { OrganizerEventFormPage } from './views/OrganizerEventFormPage';
import { OrganizerAgentsView } from './views/OrganizerAgentsView';
import { OrganizerAgentDetailView } from './views/OrganizerAgentDetailView';
import { OrganizerSettingsView } from './views/OrganizerSettingsView';
import { OrganizerCustomerDetailView, OrganizerCustomersView } from './views/OrganizerCustomersView';
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
import { Tabs } from './components/ui';
import { useTableFilters } from './hooks/useTableFilters';
import { ADMIN_VIEWS, defaultViewForRole, ORGANIZER_VIEWS } from './types';
import type {
  AdminBooking,
  AdminClient,
  AdminOrganizer,
  EventItem,
  Hotel,
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
  agents: 'Agents de contrôle',
  agentDetail: '',
  organizersAdmin: 'Organisateurs',
  organizerAdminDetail: '',
  security: 'Paramètres',
  organizerDashboard: 'Tableau de bord',
  organizerEvents: 'Événements',
  organizerAgents: 'Agents de contrôle',
  organizerAgentDetail: '',
  organizerTicketing: 'Billetterie',
  organizerFinance: 'Finances',
  organizerNotifications: 'Notifications',
  organizerSettings: 'Paramètres',
  organizerCustomers: 'Clients',
  organizerCustomerDetail: 'Fiche client',
  organizerAssignments: 'Agents de contrôle',
  adminTickets: 'Contrôle des billets',
  adminScans: 'Contrôle des billets',
  adminCommissions: 'Commissions',
  adminPayouts: 'Reversements',
  adminNotifications: 'Notifications',
};

/** Pages à plusieurs vues : une seule entrée de menu, les vues sont des onglets en haut de page. */
interface PageTab {
  label: string;
  view: ViewId;
  section?: string;
}
const PAGE_TABS: { views: ViewId[]; tabs: PageTab[] }[] = [
  {
    views: ['adminTickets', 'adminScans'],
    tabs: [
      { label: 'Listes de participants', view: 'adminTickets' },
      { label: 'Scans', view: 'adminScans' },
    ],
  },
  {
    views: ['organizerTicketing'],
    tabs: [
      { label: 'Catégories de billets', view: 'organizerTicketing' },
      { label: 'Ventes de billets', view: 'organizerTicketing', section: 'sales' },
      { label: 'Listes de participants', view: 'organizerTicketing', section: 'exports' },
    ],
  },
  {
    views: ['organizerAgents', 'organizerAssignments'],
    tabs: [
      { label: 'Mes agents', view: 'organizerAgents' },
      { label: 'Affectations', view: 'organizerAssignments' },
    ],
  },
  {
    views: ['organizerFinance'],
    tabs: [
      { label: "Vue d'ensemble", view: 'organizerFinance' },
      { label: 'Reversements', view: 'organizerFinance', section: 'payouts' },
    ],
  },
];

const tabId = (view: ViewId, section: ViewSection | undefined) => `${view}:${section ?? ''}`;

function buildViewTitle(
  view: ViewId,
  selectedHotel: Hotel | null,
  selectedEvent: EventItem | null,
  selectedBooking: AdminBooking | null,
  selectedClient: AdminClient | null,
  selectedAgent: StaffAgent | null,
  selectedOrganizer: AdminOrganizer | null,
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
    case 'organizerAgentDetail':
      return `Agent — ${selectedOrganizerAgent?.agentName ?? ''}`;
    default:
      return TITLES[view];
  }
}

type EventRoute = { kind: 'list' } | { kind: 'new' } | { kind: 'detail'; id: string } | { kind: 'edit'; id: string };

const EVENT_ROUTE_TITLES: Record<EventRoute['kind'], string> = {
  list: 'Événements',
  new: 'Nouvel événement',
  detail: 'Événement',
  edit: "Modifier l'événement",
};

/** /organizer/events · /organizer/events/new · /organizer/events/:id · /organizer/events/:id/edit */
function parseEventRoute(pathname: string): EventRoute | null {
  const match = /^\/organizer\/events(?:\/([^/]+)(?:\/(edit))?)?\/?$/.exec(pathname);
  if (!match) return null;
  const [, id, edit] = match;
  if (!id) return { kind: 'list' };
  if (id === 'new') return edit ? null : { kind: 'new' };
  return edit ? { kind: 'edit', id } : { kind: 'detail', id };
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
  const [selectedOrganizerAgent, setSelectedOrganizerAgent] = useState<OrganizerStaffAgent | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  // Petit écran : le menu latéral est un tiroir, fermé par défaut.
  const [navOpen, setNavOpen] = useState(false);
  const filters = useTableFilters();
  const location = useLocation();
  const routerNavigate = useNavigate();

  if (!session) {
    return <LoginView />;
  }

  // Derived at render time (not via a useEffect + setState) so a role switch (logout, then
  // login as the other role) never paints a frame where `view` still points at a ViewId that
  // belongs to the previous role's branch — the content area would otherwise render nothing
  // for that one frame. `view` itself is left untouched; only what gets rendered/compared
  // against is corrected, and the next explicit `navigate()` call still writes to real state.
  const roleViews = session.role === 'ADMIN' ? ADMIN_VIEWS : ORGANIZER_VIEWS;
  // Les pages « événement » de l'organisateur ont de vraies URL (/organizer/events, /new, /:id, /:id/edit) :
  // l'adresse fait foi, le reste de l'application garde sa navigation par état.
  const eventRoute = session.role === 'ORGANIZER' ? parseEventRoute(location.pathname) : null;
  let effectiveView = roleViews.has(view) ? view : defaultViewForRole(session.role);
  if (eventRoute) effectiveView = 'organizerEvents';
  else if (effectiveView === 'organizerEvents') effectiveView = defaultViewForRole(session.role);

  const navigate = (nextView: ViewId, nextSection: ViewSection = null) => {
    setNavOpen(false);
    setView(nextView);
    setSection(nextSection);
    filters.reset();
    routerNavigate(nextView === 'organizerEvents' ? '/organizer/events' : '/');
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
  const openCustomerDetail = (customerId: string) => {
    setSelectedCustomerId(customerId);
    navigate('organizerCustomerDetail');
  };
  const openOrganizerAgentDetail = (agent: OrganizerStaffAgent) => {
    setSelectedOrganizerAgent(agent);
    navigate('organizerAgentDetail');
  };

  const effectiveSection = effectiveView === view ? section : null;
  const titleOverride = eventRoute ? EVENT_ROUTE_TITLES[eventRoute.kind] : null;
  const pageTabs = PAGE_TABS.find((family) => family.views.includes(effectiveView));
  const viewTitle = buildViewTitle(
    effectiveView,
    selectedHotel,
    selectedEvent,
    selectedBooking,
    selectedClient,
    selectedAgent,
    selectedOrganizer,
    selectedOrganizerAgent
  );
  const hasSearch = TABLE_VIEWS.has(effectiveView);

  return (
    <div className={navOpen ? 'bo-shell bo-nav-open' : 'bo-shell'} style={{ background: '#FAF3EB', color: '#1F2E35' }}>
      <button type="button" className="bo-nav-backdrop" aria-label="Fermer le menu" onClick={() => setNavOpen(false)} />
      <Sidebar view={effectiveView} section={effectiveSection} onNavigate={navigate} role={session.role} />

      <div className="bo-main">
        <Topbar
          title={titleOverride ?? viewTitle}
          hasSearch={hasSearch && (!eventRoute || eventRoute.kind === 'list')}
          search={filters.search}
          onSearch={filters.onSearch}
          notifications={[]}
          onMarkAllRead={() => {}}
          adminName={session.name}
          role={session.role === 'ADMIN' ? 'Administrateur' : 'Organisateur'}
          onLogout={logout}
          onOpenNav={() => setNavOpen(true)}
        />

        <div className="bo-content">
          {pageTabs && (
            <div className="bo-page" style={{ paddingBottom: 0 }}>
              <Tabs
                tabs={pageTabs.tabs.map((t) => ({ id: tabId(t.view, t.section), label: t.label }))}
                active={tabId(effectiveView, effectiveSection)}
                onChange={(id) => {
                  const tab = pageTabs.tabs.find((t) => tabId(t.view, t.section) === id);
                  if (tab) navigate(tab.view, tab.section ?? null);
                }}
              />
            </div>
          )}
          {session.role === 'ADMIN' ? (
            <>
              {effectiveView === 'dashboard' && <DashboardView onNavigate={navigate} />}

              {effectiveView === 'hotels' && <HotelsView filters={filters} onOpenDetail={openHotelDetail} />}
              {effectiveView === 'hotelDetail' && selectedHotel && (
                <HotelDetailView hotel={selectedHotel} onBack={() => navigate('hotels')} />
              )}

              {effectiveView === 'events' && (
                <EventsView key={effectiveSection ?? 'ALL'} filters={filters} section={effectiveSection} onOpenDetail={openEventDetail} />
              )}
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

              {effectiveView === 'security' && <AdminSettingsView />}
            </>
          ) : (
            <>
              {effectiveView === 'organizerDashboard' && <OrganizerDashboardView onNavigate={navigate} />}

              {effectiveView === 'organizerEvents' && (!eventRoute || eventRoute.kind === 'list') && (
                <OrganizerEventsView key={effectiveSection ?? 'ALL'} filters={filters} section={effectiveSection} />
              )}
              {eventRoute?.kind === 'new' && <OrganizerEventFormPage />}
              {eventRoute?.kind === 'edit' && <OrganizerEventFormPage key={eventRoute.id} eventId={eventRoute.id} />}
              {eventRoute?.kind === 'detail' && (
                <OrganizerEventDetailView key={eventRoute.id} eventId={eventRoute.id} onNavigateView={navigate} onOpenCustomer={openCustomerDetail} />
              )}

              {effectiveView === 'organizerAgents' && (
                <OrganizerAgentsView filters={filters} onOpenDetail={openOrganizerAgentDetail} />
              )}
              {effectiveView === 'organizerAgentDetail' && selectedOrganizerAgent && (
                <OrganizerAgentDetailView agent={selectedOrganizerAgent} onBack={() => navigate('organizerAgents')} />
              )}

              {effectiveView === 'organizerSettings' && <OrganizerSettingsView />}
              {effectiveView === 'organizerCustomers' && <OrganizerCustomersView onOpen={openCustomerDetail} />}
              {effectiveView === 'organizerCustomerDetail' &&
                (selectedCustomerId ? (
                  <OrganizerCustomerDetailView key={selectedCustomerId} customerId={selectedCustomerId} onBack={() => navigate('organizerCustomers')} />
                ) : (
                  <OrganizerCustomersView onOpen={openCustomerDetail} />
                ))}
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
