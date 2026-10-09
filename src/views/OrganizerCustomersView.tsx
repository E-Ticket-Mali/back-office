import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizerCustomer, getOrganizerCustomers } from '../api/organizerAudience';
import { RTable, BookingStatusBadge, CustomerCell, EmptyRow, SearchBox, matchesQuery, right, shortDate, td, th } from '../components/AudienceBlocks';
import { Icon } from '../components/Icon';
import { KpiCard } from '../components/KpiCard';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { useCollection } from '../hooks/useCollection';
import { cardStyle, formatFcfa, mutedText } from '../components/uiStyles';
import { GOLD, GREEN } from '../theme';

type Sort = 'recent' | 'spent' | 'tickets';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'recent', label: 'Plus récents' },
  { id: 'spent', label: 'Plus gros acheteurs' },
  { id: 'tickets', label: 'Plus de billets' },
];

/** ORGANIZER › Clients : toutes les personnes ayant réservé un de ses événements. */
export function OrganizerCustomersView({ onOpen }: Readonly<{ onOpen: (customerId: string) => void }>) {
  const { data: customers, loading, error } = useCollection(getOrganizerCustomers);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');

  if (loading) return <LoadingState label="Chargement des clients…" />;
  if (error) return <ErrorState message={error} />;

  const rows = customers
    .filter((c) => matchesQuery(query, c.name, c.phone, c.email))
    .sort((a, b) => {
      if (sort === 'spent') return b.totalSpent - a.totalSpent;
      if (sort === 'tickets') return b.tickets - a.tickets;
      return b.lastBookingAt.localeCompare(a.lastBookingAt);
    });
  const revenue = customers.reduce((n, c) => n + c.totalSpent, 0);
  const tickets = customers.reduce((n, c) => n + c.tickets, 0);
  const loyal = customers.filter((c) => c.events > 1).length;

  return (
    <div className="bo-page">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }} data-testid="customer-kpis">
        <KpiCard label="Clients" value={customers.length} sub="ont réservé chez vous" color={GREEN} />
        <KpiCard label="Billets achetés" value={tickets} sub="hors réservations annulées" color={GOLD} />
        <KpiCard label="Clients fidèles" value={loyal} sub="présents sur plusieurs événements" color="#1D5C8A" />
        <KpiCard label="Panier moyen" value={formatFcfa(customers.length ? Math.round(revenue / customers.length) : 0)} sub="par client" color="#7A3E9D" />
      </div>

      <div className="bo-card" style={{ ...cardStyle, padding: 22 }} data-testid="customers-card">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <SearchBox value={query} onChange={setQuery} placeholder="Rechercher un client (nom, téléphone, e-mail)" />
          <select aria-label="Trier les clients" value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ padding: '9px 12px', border: '1.5px solid #E7DED0', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', background: '#FFFFFF' }}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <span style={{ ...mutedText, marginLeft: 'auto' }}>{rows.length} client(s)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <RTable style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E7DED0' }}>
                <th style={th}>Client</th>
                <th style={{ ...th, ...right }}>Événements</th>
                <th style={{ ...th, ...right }}>Réservations</th>
                <th style={{ ...th, ...right }}>Billets</th>
                <th style={{ ...th, ...right }}>Total dépensé</th>
                <th style={th}>Dernière réservation</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <EmptyRow colSpan={6}>
                  {customers.length === 0 ? 'Aucun client pour le moment : ils apparaîtront ici dès la première réservation.' : 'Aucun client ne correspond à la recherche.'}
                </EmptyRow>
              )}
              {rows.map((c) => (
                <tr key={c.id} onClick={() => onOpen(c.id)} style={{ borderBottom: '1px solid #F1EADF', cursor: 'pointer' }} title="Ouvrir la fiche client">
                  <td style={td}>
                    <CustomerCell name={c.name} phone={c.phone} email={c.email} />
                  </td>
                  <td style={{ ...td, ...right }}>{c.events}</td>
                  <td style={{ ...td, ...right }}>{c.bookings}</td>
                  <td style={{ ...td, ...right }}>{c.tickets}</td>
                  <td style={{ ...td, ...right, fontWeight: 600 }}>{formatFcfa(c.totalSpent)}</td>
                  <td style={td}>{shortDate(c.lastBookingAt)}</td>
                </tr>
              ))}
            </tbody>
          </RTable>
        </div>
      </div>
    </div>
  );
}

/** Fiche d'un client : coordonnées, chiffres et historique de ses réservations chez l'organisateur. */
export function OrganizerCustomerDetailView({ customerId, onBack }: Readonly<{ customerId: string; onBack: () => void }>) {
  const navigate = useNavigate();
  const { data: rows, loading, error } = useCollection(() => getOrganizerCustomer(customerId).then((d) => [d]));

  if (loading) return <LoadingState label="Chargement du client…" />;
  if (error) return <ErrorState message={error} />;
  const detail = rows[0];
  if (!detail) return <ErrorState message="Client introuvable." />;
  const { customer, bookings } = detail;

  return (
    <div className="bo-page">
      <button
        type="button"
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#164A23', cursor: 'pointer', marginBottom: 18, background: 'transparent', border: 'none', padding: 0 }}
      >
        <Icon name="back" size={15} /> Clients
      </button>

      <div className="bo-card" style={{ ...cardStyle, padding: 22, marginBottom: 18 }} data-testid="customer-card">
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800, color: '#1F2E35' }}>{customer.name}</div>
        <div style={{ ...mutedText, marginTop: 4 }}>
          {customer.phone}
          {customer.email ? ` · ${customer.email}` : ''} · client depuis le {shortDate(customer.firstBookingAt)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        <KpiCard label="Événements" value={customer.events} sub="auxquels il est inscrit" color={GREEN} />
        <KpiCard label="Billets" value={customer.tickets} sub={`${customer.bookings} réservation(s)`} color={GOLD} />
        <KpiCard label="Total dépensé" value={formatFcfa(customer.totalSpent)} sub="réservations confirmées" color="#1D5C8A" />
      </div>

      <div className="bo-card" style={{ ...cardStyle, padding: 22, overflowX: 'auto' }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 14 }}>Historique des réservations</div>
        <RTable style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E7DED0' }}>
              <th style={th}>Événement</th>
              <th style={th}>Catégorie</th>
              <th style={{ ...th, ...right }}>Billets</th>
              <th style={{ ...th, ...right }}>Montant</th>
              <th style={th}>Statut</th>
              <th style={th}>Réservé le</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.bookingId} onClick={() => navigate(`/organizer/events/${b.eventId}?tab=attendees`)} style={{ borderBottom: '1px solid #F1EADF', cursor: 'pointer' }} title="Ouvrir l'événement">
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{b.eventName}</div>
                  <div style={{ fontSize: 12, color: '#6B6459' }}>{shortDate(b.eventDate)}</div>
                </td>
                <td style={td}>{b.category ?? '—'}</td>
                <td style={{ ...td, ...right }}>{b.qty}</td>
                <td style={{ ...td, ...right, fontWeight: 600 }}>{formatFcfa(b.amount)}</td>
                <td style={td}>
                  <BookingStatusBadge status={b.status} />
                </td>
                <td style={td}>{shortDate(b.bookedAt)}</td>
              </tr>
            ))}
          </tbody>
        </RTable>
      </div>
    </div>
  );
}
