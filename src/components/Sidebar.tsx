import { useEffect, useState } from 'react';
import type { ViewId, ViewSection } from '../types';
import { getHotels } from '../api/hotels';
import { getEvents } from '../api/events';
import { getBookings } from '../api/bookings';
import { getClients } from '../api/clients';
import { getStaff } from '../api/staff';
import { getOrganizers } from '../api/organizers';
import { Icon, type IconName } from './Icon';

interface NavLeaf {
  view: ViewId;
  /** Sous-section transmise à la vue (filtre de statut, onglet…). Absent = vue par défaut. */
  section?: string;
  label: string;
  icon: IconName;
  count?: number;
}

interface NavGroup {
  group: string;
  icon: IconName;
  children: NavLeaf[];
}

type NavEntry = NavLeaf | NavGroup;

interface SidebarProps {
  view: ViewId;
  section: ViewSection;
  onNavigate: (view: ViewId, section?: ViewSection) => void;
  role: 'ADMIN' | 'ORGANIZER';
}

const EMPTY_COUNTS = {
  hotels: 0,
  events: 0,
  bookings: 0,
  clients: 0,
  agents: 0,
  organizers: 0,
};

/** Une vue détail garde son entrée de menu parente surlignée. */
const DETAIL_PARENT: Partial<Record<ViewId, ViewId>> = {
  hotelDetail: 'hotels',
  eventDetail: 'events',
  bookingDetail: 'bookings',
  clientDetail: 'clients',
  agentDetail: 'agents',
  organizerAdminDetail: 'organizersAdmin',
  organizerEventDetail: 'organizerEvents',
  organizerAgentDetail: 'organizerAgents',
};

const COLLAPSE_KEY = 'eticket-back-office.sidebar.collapsed';
const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry;
}

function leafKey(leaf: NavLeaf): string {
  return `${leaf.view}:${leaf.section ?? ''}`;
}

function buildAdminNav(counts: typeof EMPTY_COUNTS): NavEntry[] {
  return [
    { view: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    {
      group: 'Catalogue',
      icon: 'event',
      children: [
        { view: 'events', label: 'Événements', icon: 'event', count: counts.events },
        { view: 'hotels', label: 'Hôtels', icon: 'hotel', count: counts.hotels },
      ],
    },
    {
      group: 'Activité',
      icon: 'booking',
      children: [
        { view: 'bookings', label: 'Réservations', icon: 'booking', count: counts.bookings },
        { view: 'adminTickets', label: 'Billets & Manifestes', icon: 'manifest' },
        { view: 'adminScans', label: 'Scans', icon: 'scan' },
      ],
    },
    {
      group: 'Utilisateurs',
      icon: 'client',
      children: [
        { view: 'clients', label: 'Clients', icon: 'client', count: counts.clients },
        { view: 'agents', label: 'Agents contrôleurs', icon: 'agent', count: counts.agents },
        { view: 'organizersAdmin', label: 'Organisateurs', icon: 'organizer', count: counts.organizers },
      ],
    },
    {
      group: 'Finances',
      icon: 'wallet',
      children: [
        { view: 'adminCommissions', label: 'Commissions', icon: 'percent' },
        { view: 'adminPayouts', label: 'Demandes de reversement', icon: 'wallet' },
      ],
    },
    { view: 'adminNotifications', label: 'Notifications', icon: 'bell' },
    { view: 'security', label: 'Paramètres / Profil', icon: 'settings' },
  ];
}

const ORGANIZER_NAV: NavEntry[] = [
  { view: 'organizerDashboard', label: 'Tableau de bord', icon: 'dashboard' },
  {
    group: 'Événements',
    icon: 'event',
    children: [
      { view: 'organizerEvents', label: 'Tous mes événements', icon: 'event' },
      { view: 'organizerEvents', section: 'DRAFT', label: 'Brouillons', icon: 'event' },
      { view: 'organizerEvents', section: 'PENDING_APPROVAL', label: 'En attente de validation', icon: 'event' },
      { view: 'organizerEvents', section: 'PUBLISHED', label: 'Publiés', icon: 'event' },
      { view: 'organizerEvents', section: 'REJECTED', label: 'Rejetés', icon: 'event' },
      { view: 'organizerEvents', section: 'CREATE', label: 'Créer un événement', icon: 'event' },
    ],
  },
  {
    group: 'Billetterie',
    icon: 'booking',
    children: [
      { view: 'organizerTicketing', label: 'Billets & tarifs', icon: 'booking' },
      { view: 'organizerTicketing', section: 'sales', label: 'Ventes', icon: 'booking' },
      { view: 'organizerTicketing', section: 'manifests', label: 'Manifestes', icon: 'manifest' },
      { view: 'organizerTicketing', section: 'exports', label: 'Exports', icon: 'download' },
    ],
  },
  {
    group: 'Agents contrôleurs',
    icon: 'agent',
    children: [
      { view: 'organizerAgents', label: 'Mes agents', icon: 'agent' },
      { view: 'organizerAssignments', label: 'Affectations', icon: 'link' },
    ],
  },
  {
    group: 'Finances',
    icon: 'wallet',
    children: [
      { view: 'organizerFinance', label: 'Vue financière', icon: 'wallet' },
      { view: 'organizerFinance', section: 'balance', label: 'Solde disponible', icon: 'wallet' },
      { view: 'organizerFinance', section: 'requests', label: 'Demandes de reversement', icon: 'wallet' },
      { view: 'organizerFinance', section: 'history', label: 'Historique', icon: 'wallet' },
    ],
  },
  { view: 'organizerNotifications', label: 'Notifications', icon: 'bell' },
  { view: 'organizerSettings', label: 'Profil', icon: 'settings' },
];

type NavLeafButtonProps = Readonly<{
  leaf: NavLeaf;
  active: boolean;
  collapsed: boolean;
  nested: boolean;
  onActivate: () => void;
}>;

function leafPadding(collapsed: boolean, nested: boolean): string {
  if (collapsed) return '9px 0';
  return nested ? '7px 12px 7px 38px' : '9px 12px';
}

function NavLeafButton(props: NavLeafButtonProps) {
  const { leaf, active, collapsed, nested, onActivate } = props;
  const topLevel = !nested && !collapsed;
  return (
    <button
      type="button"
      data-testid={`nav-${leaf.view}${leaf.section ? `-${leaf.section}` : ''}`}
      onClick={onActivate}
      title={collapsed ? leaf.label : undefined}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 10,
        width: '100%',
        padding: leafPadding(collapsed, nested),
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: topLevel ? "'Poppins',sans-serif" : undefined,
        fontSize: nested ? 12.5 : 13.5,
        fontWeight: topLevel || active ? 600 : 400,
        marginBottom: 2,
        background: active ? 'rgba(250,243,235,0.14)' : 'transparent',
        color: active ? '#FAF3EB' : 'rgba(250,243,235,0.75)',
        border: 'none',
        textAlign: 'left',
      }}
    >
      {collapsed ? (
        <Icon name={leaf.icon} size={18} />
      ) : (
        <>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {!nested && <Icon name={leaf.icon} size={16} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leaf.label}</span>
          </span>
          {leaf.count !== undefined && <span style={{ fontSize: 11, opacity: 0.6, flexShrink: 0 }}>{leaf.count}</span>}
        </>
      )}
    </button>
  );
}

type NavGroupHeaderProps = Readonly<{
  group: NavGroup;
  open: boolean;
  containsActive: boolean;
  onToggle: () => void;
}>;

function NavGroupHeader(props: NavGroupHeaderProps) {
  const { group, open, containsActive, onToggle } = props;
  return (
    <button
      type="button"
      data-testid={`nav-group-${group.group}`}
      onClick={onToggle}
      aria-expanded={open}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: "'Poppins',sans-serif",
        fontSize: 13.5,
        fontWeight: 600,
        marginTop: 4,
        marginBottom: 2,
        background: 'transparent',
        color: containsActive ? '#FAF3EB' : 'rgba(250,243,235,0.75)',
        border: 'none',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Icon name={group.icon} size={16} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.group}</span>
      </span>
      <span
        style={{
          display: 'flex',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.15s ease',
          opacity: 0.7,
        }}
      >
        <Icon name="chevronDown" size={14} />
      </span>
    </button>
  );
}

export function Sidebar(props: Readonly<SidebarProps>) {
  const { view, section, onNavigate, role } = props;
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  // Groupes dépliés manuellement ; le groupe contenant la vue active reste toujours déplié.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (role !== 'ADMIN') return;
    Promise.all([getHotels(), getEvents(), getBookings(), getClients(), getStaff(), getOrganizers()])
      .then(([hotels, events, bookings, clients, agents, organizers]) => {
        setCounts({
          hotels: hotels.length,
          events: events.length,
          bookings: bookings.length,
          clients: clients.length,
          agents: agents.length,
          organizers: organizers.length,
        });
      })
      .catch(() => {
        // Compteurs purement indicatifs : un échec ne doit pas casser la navigation.
      });
  }, [role]);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // localStorage indisponible (mode privé, etc.) — le repli reste juste non persisté.
      }
      return next;
    });
  };

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const nav = role === 'ADMIN' ? buildAdminNav(counts) : ORGANIZER_NAV;
  const parentView = DETAIL_PARENT[view];
  const activeView = parentView ?? view;
  // Sur une vue détail, la section n'a plus de sens : on surligne l'entrée par défaut.
  const activeSection = parentView ? null : section;
  const isActive = (leaf: NavLeaf) => leaf.view === activeView && (leaf.section ?? null) === (activeSection ?? null);

  const renderLeaf = (leaf: NavLeaf, nested: boolean) => (
    <NavLeafButton
      key={leafKey(leaf)}
      leaf={leaf}
      active={isActive(leaf)}
      collapsed={collapsed}
      nested={nested}
      onActivate={() => onNavigate(leaf.view, leaf.section ?? null)}
    />
  );

  return (
    <div
      className="bo-sidebar"
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'width 0.18s ease',
      }}
    >
      <div
        style={{
          background: '#164A23',
          color: '#FAF3EB',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            padding: collapsed ? '22px 0 18px' : '22px 20px 18px',
            borderBottom: '1px solid rgba(250,243,235,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#A6741D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            <Icon name="event" size={18} color="#FAF3EB" />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 19, fontWeight: 800, letterSpacing: 0.3 }}>
                <span style={{ color: '#E9D3A8' }}>E</span>-<span style={{ color: '#FAF3EB' }}>TICKET</span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'rgba(250,243,235,0.65)',
                  marginTop: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Back-office — Réservations &amp; billetterie
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: collapsed ? '14px 8px 10px' : '14px 10px 10px', flex: 1 }}>
          {nav.map((entry) => {
            if (!isGroup(entry)) return renderLeaf(entry, false);
            const containsActive = entry.children.some(isActive);
            if (collapsed) {
              return (
                <div key={entry.group} style={{ borderTop: '1px solid rgba(250,243,235,0.1)', marginTop: 6, paddingTop: 6 }}>
                  {entry.children.map((leaf) => renderLeaf(leaf, false))}
                </div>
              );
            }
            const open = containsActive || openGroups.has(entry.group);
            return (
              <div key={entry.group}>
                <NavGroupHeader group={entry} open={open} containsActive={containsActive} onToggle={() => toggleGroup(entry.group)} />
                {open && entry.children.map((leaf) => renderLeaf(leaf, true))}
              </div>
            );
          })}
        </div>

        {!collapsed && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(250,243,235,0.14)',
              fontSize: 11,
              color: 'rgba(250,243,235,0.6)',
            }}
          >
            Mali E-Ticket · Back-office
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
        title={collapsed ? 'Développer le menu' : 'Réduire le menu'}
        style={{
          position: 'absolute',
          top: 26,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '1px solid rgba(250,243,235,0.25)',
          background: '#0F3419',
          color: '#FAF3EB',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          zIndex: 10,
        }}
      >
        <Icon name={collapsed ? 'expand' : 'collapse'} size={14} />
      </button>
    </div>
  );
}
