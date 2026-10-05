import { useEffect, useState } from 'react';
import type { ViewId } from '../types';
import { getHotels } from '../api/hotels';
import { getEvents } from '../api/events';
import { getBookings } from '../api/bookings';
import { getClients } from '../api/clients';
import { getStaff } from '../api/staff';
import { Icon, type IconName } from './Icon';

interface NavItemDef {
  id: ViewId;
  label: string;
  icon: IconName;
  count: number;
}

interface OrganizerNavItemDef {
  id: ViewId;
  label: string;
  icon: IconName;
}

interface SidebarProps {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  role: 'ADMIN' | 'ORGANIZER';
}

const EMPTY_COUNTS = {
  hotels: 0,
  events: 0,
  bookings: 0,
  clients: 0,
  agents: 0,
};

const COLLAPSE_KEY = 'eticket-back-office.sidebar.collapsed';
const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

type SidebarNavButtonProps = Readonly<{
  item: NavItemDef;
  active: boolean;
  collapsed: boolean;
  onActivate: () => void;
}>;

function SidebarNavButton(props: SidebarNavButtonProps) {
  const { item, active, collapsed, onActivate } = props;
  return (
    <button
      type="button"
      data-testid={`nav-${item.id}`}
      onClick={onActivate}
      title={collapsed ? `${item.label} (${item.count})` : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 10,
        width: '100%',
        padding: collapsed ? '9px 0' : '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        marginBottom: 2,
        background: active ? 'rgba(250,243,235,0.14)' : 'transparent',
        color: active ? '#FAF3EB' : 'rgba(250,243,235,0.75)',
        border: 'none',
        textAlign: 'left',
      }}
    >
      {collapsed ? (
        <Icon name={item.icon} size={18} />
      ) : (
        <>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Icon name={item.icon} size={16} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          </span>
          <span style={{ fontSize: 11, opacity: 0.6, flexShrink: 0 }}>{item.count}</span>
        </>
      )}
    </button>
  );
}

type SidebarSimpleNavButtonProps = Readonly<{
  item: OrganizerNavItemDef;
  active: boolean;
  collapsed: boolean;
  onActivate: () => void;
}>;

function SidebarSimpleNavButton(props: SidebarSimpleNavButtonProps) {
  const { item, active, collapsed, onActivate } = props;
  return (
    <button
      type="button"
      data-testid={`nav-${item.id}`}
      onClick={onActivate}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        width: '100%',
        padding: collapsed ? '9px 0' : '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        marginBottom: 2,
        background: active ? 'rgba(250,243,235,0.14)' : 'transparent',
        color: active ? '#FAF3EB' : 'rgba(250,243,235,0.75)',
        border: 'none',
        textAlign: 'left',
      }}
    >
      <Icon name={item.icon} size={collapsed ? 18 : 16} />
      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
    </button>
  );
}

type SidebarDashboardButtonProps = Readonly<{
  active: boolean;
  collapsed: boolean;
  onActivate: () => void;
}>;

function SidebarDashboardButton(props: SidebarDashboardButtonProps) {
  const { active, collapsed, onActivate } = props;
  return (
    <button
      type="button"
      data-testid="nav-dashboard"
      onClick={onActivate}
      title={collapsed ? 'Tableau de bord' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        width: '100%',
        padding: collapsed ? '9px 0' : '9px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: "'Poppins',sans-serif",
        fontSize: 13.5,
        fontWeight: 600,
        marginBottom: 6,
        background: active ? 'rgba(250,243,235,0.14)' : 'transparent',
        color: active ? '#FAF3EB' : 'rgba(250,243,235,0.75)',
        border: 'none',
        textAlign: 'left',
      }}
    >
      <Icon name="dashboard" size={collapsed ? 18 : 16} />
      {!collapsed && 'Tableau de bord'}
    </button>
  );
}

export function Sidebar(props: Readonly<SidebarProps>) {
  const { view, onNavigate, role } = props;
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (role !== 'ADMIN') return;
    Promise.all([getHotels(), getEvents(), getBookings(), getClients(), getStaff()]).then(
      ([hotels, events, bookings, clients, agents]) => {
        setCounts({
          hotels: hotels.length,
          events: events.length,
          bookings: bookings.length,
          clients: clients.length,
          agents: agents.length,
        });
      }
    );
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

  const catalogueNav: NavItemDef[] = [
    { id: 'hotels', label: 'Hôtels', icon: 'hotel', count: counts.hotels },
    { id: 'events', label: 'Événements', icon: 'event', count: counts.events },
  ];
  const opsNav: NavItemDef[] = [
    { id: 'bookings', label: 'Réservations', icon: 'booking', count: counts.bookings },
    { id: 'clients', label: 'Clients', icon: 'client', count: counts.clients },
    { id: 'agents', label: 'Agents contrôleurs', icon: 'agent', count: counts.agents },
  ];
  const organizerNav: OrganizerNavItemDef[] = [
    { id: 'organizerEvents', label: 'Mes événements', icon: 'event' },
    { id: 'organizerAgents', label: 'Agents', icon: 'agent' },
  ];

  const groupLabelStyle: React.CSSProperties = {
    fontFamily: "'Poppins',sans-serif",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: 'rgba(250,243,235,0.5)',
    padding: collapsed ? '14px 0 6px' : '14px 12px 6px',
    textAlign: collapsed ? 'center' : 'left',
  };

  const dashboardId: ViewId = role === 'ADMIN' ? 'dashboard' : 'organizerDashboard';
  const dashboardActive = view === dashboardId;

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
          <SidebarDashboardButton active={dashboardActive} collapsed={collapsed} onActivate={() => onNavigate(dashboardId)} />

          {role === 'ADMIN' ? (
            <>
              <div style={groupLabelStyle}>{collapsed ? '•••' : 'CATALOGUE'}</div>
              {catalogueNav.map((item) => (
                <SidebarNavButton key={item.id} item={item} active={view === item.id} collapsed={collapsed} onActivate={() => onNavigate(item.id)} />
              ))}

              <div style={groupLabelStyle}>{collapsed ? '•••' : 'OPÉRATIONS'}</div>
              {opsNav.map((item) => (
                <SidebarNavButton key={item.id} item={item} active={view === item.id} collapsed={collapsed} onActivate={() => onNavigate(item.id)} />
              ))}
            </>
          ) : (
            organizerNav.map((item) => (
              <SidebarSimpleNavButton
                key={item.id}
                item={item}
                active={view === item.id}
                collapsed={collapsed}
                onActivate={() => onNavigate(item.id)}
              />
            ))
          )}
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
