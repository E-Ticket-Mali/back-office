import { useEffect, useState } from 'react';

import type { ViewId, ViewSection } from '../types';

import { getEvents } from '../api/events';
import { getOrganizers } from '../api/organizers';
import { getAdminPayoutRequests } from '../api/payouts';
import { getOrganizerNotifications } from '../api/organizerNotifications';

import { Icon, type IconName } from './Icon';

/**
 * Principes UX :
 *
 * - Navigation à un seul niveau.
 * - Les statuts sont des filtres dans les pages.
 * - Les sous-vues sont des onglets dans les pages.
 * - Les actions métier sont dans le contenu des pages.
 * - Les badges indiquent uniquement les éléments nécessitant une action.
 * - Sidebar sobre : aucun gradient, aucune bordure latérale.
 */

type BadgeKey =
  | 'eventsToReview'
  | 'organizersPending'
  | 'payoutsPending'
  | 'notifications';

type Badges = Partial<Record<BadgeKey, number>>;

interface NavItem {
  view: ViewId;
  matches: ViewId[];
  label: string;
  icon: IconName;
  badge?: BadgeKey;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

interface SidebarProps {
  view: ViewId;
  section: ViewSection;
  onNavigate: (view: ViewId, section?: ViewSection) => void;
  role: 'ADMIN' | 'ORGANIZER';
}

const item = (
  view: ViewId,
  label: string,
  icon: IconName,
  extra: Partial<NavItem> = {},
): NavItem => ({
  view,
  matches: [view],
  label,
  icon,
  ...extra,
});

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

const ADMIN_NAV: NavSection[] = [
  {
    label: null,
    items: [item('dashboard', 'Tableau de bord', 'dashboard')],
  },
  {
    label: 'Catalogue',
    items: [
      item('events', 'Événements', 'event', {
        matches: ['events', 'eventDetail'],
        badge: 'eventsToReview',
      }),
      item('hotels', 'Hôtels', 'hotel', {
        matches: ['hotels', 'hotelDetail'],
      }),
    ],
  },
  {
    label: 'Activité',
    items: [
      item('bookings', 'Réservations', 'booking', {
        matches: ['bookings', 'bookingDetail'],
      }),
      item('adminTickets', 'Contrôle des billets', 'scan', {
        matches: ['adminTickets', 'adminScans'],
      }),
    ],
  },
  {
    label: 'Utilisateurs',
    items: [
      item('clients', 'Clients', 'client', {
        matches: ['clients', 'clientDetail'],
      }),
      item('agents', 'Agents de contrôle', 'agent', {
        matches: ['agents', 'agentDetail'],
      }),
      item('organizersAdmin', 'Organisateurs', 'organizer', {
        matches: ['organizersAdmin', 'organizerAdminDetail'],
        badge: 'organizersPending',
      }),
    ],
  },
  {
    label: 'Finances',
    items: [
      item('adminPayouts', 'Reversements', 'wallet', {
        badge: 'payoutsPending',
      }),
      item('adminCommissions', 'Commissions', 'percent'),
    ],
  },
];

const ADMIN_FOOTER: NavItem[] = [
  item('adminNotifications', 'Notifications', 'bell', {
    badge: 'notifications',
  }),
  item('security', 'Paramètres', 'settings'),
];

const ORGANIZER_NAV: NavSection[] = [
  {
    label: null,
    items: [
      item('organizerDashboard', 'Tableau de bord', 'dashboard'),
      item('organizerEvents', 'Événements', 'event', {
      }),
      item('organizerTicketing', 'Billetterie', 'booking'),
      item('organizerCustomers', 'Clients', 'client', {
        matches: ['organizerCustomers', 'organizerCustomerDetail'],
      }),
      item('organizerAgents', 'Agents de contrôle', 'agent', {
        matches: [
          'organizerAgents',
          'organizerAgentDetail',
          'organizerAssignments',
        ],
      }),
      item('organizerFinance', 'Finances', 'wallet'),
    ],
  },
];

const ORGANIZER_FOOTER: NavItem[] = [
  item('organizerNotifications', 'Notifications', 'bell', {
    badge: 'notifications',
  }),
  item('organizerSettings', 'Paramètres', 'settings'),
];

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

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

  return {
    notifications: notifications.filter((notification) => !notification.read)
      .length,
  };
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                       */
/* -------------------------------------------------------------------------- */

const COLLAPSE_KEY = 'eticket-back-office.sidebar.collapsed';

const EXPANDED_WIDTH = 252;
const COLLAPSED_WIDTH = 72;

/* -------------------------------------------------------------------------- */
/* Navigation item                                                              */
/* -------------------------------------------------------------------------- */

type NavButtonProps = Readonly<{
  entry: NavItem;
  active: boolean;
  collapsed: boolean;
  badge: number;
  onActivate: () => void;
}>;

function NavButton({
  entry,
  active,
  collapsed,
  badge,
  onActivate,
}: NavButtonProps) {
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
        minHeight: 40,
        padding: collapsed ? '9px 0' : '9px 10px',
        marginBottom: 2,

        border: 'none',
        borderRadius: 7,

        background: active ? '#F0F5F2' : 'transparent',
        color: active ? '#176B3A' : '#4F5B55',

        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,

        textAlign: 'left',

        transition:
          'background-color 120ms ease, color 120ms ease',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          minWidth: 0,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            flexShrink: 0,
            opacity: active ? 1 : 0.78,
          }}
        >
          <Icon
            name={entry.icon}
            size={17}
            color={active ? '#176B3A' : '#66736C'}
          />
        </span>

        {!collapsed && (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.label}
          </span>
        )}
      </span>

      {badge > 0 &&
        (collapsed ? (
          <span
            aria-label={`${badge} à traiter`}
            style={{
              position: 'absolute',
              top: 7,
              right: 8,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#C67A19',
            }}
          />
        ) : (
          <span
            data-testid={`badge-${entry.view}`}
            aria-label={`${badge} à traiter`}
            style={{
              minWidth: 20,
              height: 20,
              padding: '0 6px',

              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',

              borderRadius: 10,

              background: '#F3E7D2',
              color: '#855514',

              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,

              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        ))}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                      */
/* -------------------------------------------------------------------------- */

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

  useEffect(() => {
    let cancelled = false;

    const loadBadges =
      role === 'ADMIN' ? loadAdminBadges() : loadOrganizerBadges();

    loadBadges
      .then((next) => {
        if (!cancelled) {
          setBadges(next);
        }
      })
      .catch(() => {
        // Les badges sont indicatifs.
        // Une erreur de chargement ne doit jamais bloquer la navigation.
      });

    return () => {
      cancelled = true;
    };
  }, [role, view]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;

      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // La préférence reste simplement non persistée.
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

  return (
    <aside
      className="bo-sidebar"
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',

        background: '#FFFFFF',

        transition: 'width 160ms ease',
      }}
    >
      <nav
        aria-label="Navigation principale"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',

          background: '#FFFFFF',
          color: '#17201B',

          padding: '0 10px',
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Brand                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 10,
            padding: collapsed ? '0 8px' : '0 10px',

            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: '#17201B',
                  lineHeight: 1.2,
                }}
              >
                E-TICKET
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 11.5,
                  color: '#7A847F',
                  lineHeight: 1.2,
                }}
              >
                {role === 'ADMIN'
                  ? 'Administration'
                  : 'Espace organisateur'}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={
              collapsed ? 'Développer le menu' : 'Réduire le menu'
            }
            title={collapsed ? 'Développer le menu' : 'Réduire le menu'}
            style={{
              width: 32,
              height: 32,

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              border: 'none',
              borderRadius: 6,

              background: '#F5F7F6',
              color: '#59655F',

              cursor: 'pointer',
              flexShrink: 0,

              transition: 'background-color 120ms ease',
            }}
          >
            <Icon
              name={collapsed ? 'expand' : 'collapse'}
              size={15}
              color="#59655F"
            />
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Main navigation                                                  */}
        {/* ---------------------------------------------------------------- */}

        <div
          style={{
            flex: 1,
            padding: '8px 2px',
          }}
        >
          {sections.map((section, sectionIndex) => (
            <div
              key={section.label ?? `section-${sectionIndex}`}
              style={{
                marginBottom: sectionIndex < sections.length - 1 ? 18 : 0,
              }}
            >
              {section.label && !collapsed && (
                <div
                  style={{
                    padding: '10px 10px 7px',

                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.7px',
                    textTransform: 'uppercase',

                    color: '#98A19C',
                  }}
                >
                  {section.label}
                </div>
              )}

              {section.label && collapsed && (
                <div
                  aria-hidden="true"
                  style={{
                    height: 1,
                    margin: '10px 8px 12px',
                    background: '#F0F2F1',
                  }}
                />
              )}

              {section.items.map(renderItem)}
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer navigation                                                */}
        {/* ---------------------------------------------------------------- */}

        <div
          style={{
            padding: '10px 2px 12px',
            marginTop: 'auto',
          }}
        >
          {footer.map(renderItem)}
        </div>
      </nav>
    </aside>
  );
}