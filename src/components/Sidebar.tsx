import { useEffect, useState } from 'react';
import type { ViewId, ViewSection } from '../types';
import { getEvents } from '../api/events';
import { getOrganizers } from '../api/organizers';
import { getAdminPayoutRequests } from '../api/payouts';
import { getOrganizerNotifications } from '../api/organizerNotifications';
import { Icon, type IconName } from './Icon';

// Principes du menu (un seul niveau, pas d'accordéon) :
// - une entrée = une destination (un objet métier) ; les statuts sont des onglets de filtre dans
//   la page et les actions (« Nouvel événement ») des boutons dans la page ;
// - les sous-vues d'une même page (Tarifs / Ventes…) sont des onglets en haut de la page ;
// - les badges signalent ce qui attend une action, pas des totaux ;
// - Notifications et Profil/Paramètres sont regroupés en bas, séparés du travail courant.

type BadgeKey = 'eventsToReview' | 'organizersPending' | 'payoutsPending' | 'notifications';
type Badges = Partial<Record<BadgeKey, number>>;

interface NavItem {
  /** Vue ouverte au clic. */
  view: ViewId;
  /** Toutes les vues (onglets, fiches détail) qui gardent cette entrée surlignée. */
  matches: ViewId[];
  label: string;
  icon: IconName;
  badge?: BadgeKey;
}

interface NavSection {
  /** null = pas de libellé (premier bloc). */
  label: string | null;
  items: NavItem[];
}

interface SidebarProps {
  view: ViewId;
  section: ViewSection;
  onNavigate: (view: ViewId, section?: ViewSection) => void;
  role: 'ADMIN' | 'ORGANIZER';
}

const item = (view: ViewId, label: string, icon: IconName, extra: Partial<NavItem> = {}): NavItem => ({
  view,
  matches: [view],
  label,
  icon,
  ...extra,
});

const ADMIN_NAV: NavSection[] = [
  { label: null, items: [item('dashboard', 'Tableau de bord', 'dashboard')] },
  {
    label: 'Catalogue',
    items: [
      item('events', 'Événements', 'event', { matches: ['events', 'eventDetail'], badge: 'eventsToReview' }),
      item('hotels', 'Hôtels', 'hotel', { matches: ['hotels', 'hotelDetail'] }),
    ],
  },
  {
    label: 'Activité',
    items: [
      item('bookings', 'Réservations', 'booking', { matches: ['bookings', 'bookingDetail'] }),
      item('adminTickets', 'Billets & contrôle', 'scan', { matches: ['adminTickets', 'adminScans'] }),
    ],
  },
  {
    label: 'Utilisateurs',
    items: [
      item('clients', 'Clients', 'client', { matches: ['clients', 'clientDetail'] }),
      item('agents', 'Agents contrôleurs', 'agent', { matches: ['agents', 'agentDetail'] }),
      item('organizersAdmin', 'Organisateurs', 'organizer', {
        matches: ['organizersAdmin', 'organizerAdminDetail'],
        badge: 'organizersPending',
      }),
    ],
  },
  {
    label: 'Finances',
    items: [
      item('adminPayouts', 'Reversements', 'wallet', { badge: 'payoutsPending' }),
      item('adminCommissions', 'Commissions', 'percent'),
    ],
  },
];

const ADMIN_FOOTER: NavItem[] = [
  item('adminNotifications', 'Notifications', 'bell', { badge: 'notifications' }),
  item('security', 'Paramètres', 'settings'),
];

const ORGANIZER_NAV: NavSection[] = [
  {
    label: null,
    items: [
      item('organizerDashboard', 'Tableau de bord', 'dashboard'),
      item('organizerEvents', 'Événements', 'event', { matches: ['organizerEvents', 'organizerEventDetail'] }),
      item('organizerTicketing', 'Billetterie', 'booking'),
      item('organizerAgents', 'Agents contrôleurs', 'agent', {
        matches: ['organizerAgents', 'organizerAgentDetail', 'organizerAssignments'],
      }),
      item('organizerFinance', 'Finances', 'wallet'),
    ],
  },
];

const ORGANIZER_FOOTER: NavItem[] = [
  item('organizerNotifications', 'Notifications', 'bell', { badge: 'notifications' }),
  item('organizerSettings', 'Profil', 'settings'),
];

async function loadAdminBadges(): Promise<Badges> {
  const [events, organizers, payouts] = await Promise.all([
    getEvents('PENDING_APPROVAL'),
    getOrganizers('PENDING'),
    getAdminPayoutRequests('PENDING'),
  ]);
  return {
    eventsToReview: events.length,
    organizersPending: organizers.length,
    payoutsPending: payouts.length,
    notifications: events.length + organizers.length + payouts.length,
  };
}

async function loadOrganizerBadges(): Promise<Badges> {
  const notifications = await getOrganizerNotifications();
  return { notifications: notifications.filter((n) => !n.read).length };
}

const COLLAPSE_KEY = 'eticket-back-office.sidebar.collapsed';
const EXPANDED_WIDTH = 248;
const COLLAPSED_WIDTH = 76;

type NavButtonProps = Readonly<{
  entry: NavItem;
  active: boolean;
  collapsed: boolean;
  badge: number;
  onActivate: () => void;
}>;

function NavButton({ entry, active, collapsed, badge, onActivate }: NavButtonProps) {
  return (
    <button
      type="button"
      data-testid={`nav-${entry.view}`}
      onClick={onActivate}
      title={collapsed ? entry.label : undefined}
      aria-current={active ? 'page' : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 10,
        width: '100%',
        padding: collapsed ? '10px 0' : '9px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        marginBottom: 2,
        background: active ? 'rgba(250,243,235,0.14)' : 'transparent',
        color: active ? '#FAF3EB' : 'rgba(250,243,235,0.78)',
        border: 'none',
        borderLeft: active && !collapsed ? '3px solid #E9D3A8' : '3px solid transparent',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Icon name={entry.icon} size={collapsed ? 18 : 16} />
        {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</span>}
      </span>
      {badge > 0 &&
        (collapsed ? (
          <span
            aria-label={`${badge} à traiter`}
            style={{ position: 'absolute', top: 6, right: 16, width: 8, height: 8, borderRadius: '50%', background: '#E9A23B' }}
          />
        ) : (
          <span
            data-testid={`badge-${entry.view}`}
            aria-label={`${badge} à traiter`}
            style={{
              minWidth: 20,
              padding: '1px 7px',
              borderRadius: 999,
              background: '#E9A23B',
              color: '#1F2E35',
              fontSize: 11,
              fontWeight: 700,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        ))}
    </button>
  );
}

export function Sidebar(props: Readonly<SidebarProps>) {
  const { view, onNavigate, role } = props;
  const [badges, setBadges] = useState<Badges>({});
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Rafraîchi à chaque navigation : une validation ou une décision faite sur une page doit
  // faire baisser le badge dès qu'on la quitte.
  useEffect(() => {
    let cancelled = false;
    (role === 'ADMIN' ? loadAdminBadges() : loadOrganizerBadges())
      .then((next) => {
        if (!cancelled) setBadges(next);
      })
      .catch(() => {
        // Badges purement indicatifs : un échec ne doit pas casser la navigation.
      });
    return () => {
      cancelled = true;
    };
  }, [role, view]);

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

  const sections = role === 'ADMIN' ? ADMIN_NAV : ORGANIZER_NAV;
  const footer = role === 'ADMIN' ? ADMIN_FOOTER : ORGANIZER_FOOTER;

  const renderItem = (entry: NavItem) => (
    <NavButton
      key={entry.view}
      entry={entry}
      active={entry.matches.includes(view)}
      collapsed={collapsed}
      badge={entry.badge ? (badges[entry.badge] ?? 0) : 0}
      onActivate={() => onNavigate(entry.view, null)}
    />
  );

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: "'Poppins',sans-serif",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(250,243,235,0.5)',
    padding: '16px 12px 6px',
  };

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
      <nav
        aria-label="Navigation principale"
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
              <div style={{ fontSize: 11.5, color: 'rgba(250,243,235,0.65)', marginTop: 1 }}>
                {role === 'ADMIN' ? 'Administration' : 'Espace organisateur'}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: collapsed ? '12px 8px' : '12px 10px', flex: 1 }}>
          {sections.map((section) => (
            <div key={section.label ?? 'main'}>
              {section.label &&
                (collapsed ? (
                  <div style={{ borderTop: '1px solid rgba(250,243,235,0.12)', margin: '10px 6px' }} />
                ) : (
                  <div style={sectionLabelStyle}>{section.label}</div>
                ))}
              {section.items.map(renderItem)}
            </div>
          ))}
        </div>

        <div style={{ padding: collapsed ? '10px 8px' : '10px', borderTop: '1px solid rgba(250,243,235,0.14)' }}>
          {footer.map(renderItem)}
        </div>
      </nav>

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
