import { useState } from 'react';
import { addRoom, deleteRoom, getHotel, updateRoom } from '../api/hotels';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState } from '../components/LoadingState';
import type { Hotel, Room, RoomType } from '../types';

interface HotelDetailViewProps {
  hotel: Hotel;
  onBack: () => void;
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 22,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "'Poppins',sans-serif",
  fontSize: 14.5,
  fontWeight: 700,
  marginBottom: 16,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#FAF3EB',
  borderRadius: 8,
};

const selectStyle: React.CSSProperties = {
  padding: '7px 10px',
  border: '1.5px solid #E7DED0',
  borderRadius: 7,
  fontSize: 12,
  background: '#FFFFFF',
  color: '#1F2E35',
};

const smallBtn = (color: string): React.CSSProperties => ({
  padding: '6px 10px',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
});

const ROOM_TYPES: RoomType[] = ['SINGLE', 'DOUBLE', 'SUITE'];
const ROOM_LABELS: Record<RoomType, string> = { SINGLE: 'Chambre Simple', DOUBLE: 'Chambre Double', SUITE: 'Suite' };

export function HotelDetailView(props: Readonly<HotelDetailViewProps>) {
  const { hotel: initialHotel, onBack } = props;
  const { data: hotelRows, loading, reload } = useCollection(() => getHotel(initialHotel.id).then((h) => [h]));
  const [newType, setNewType] = useState<RoomType>('SINGLE');
  const [newPrice, setNewPrice] = useState('');
  const [newCapacity, setNewCapacity] = useState('1');
  const [editingRoom, setEditingRoom] = useState<Record<string, { price: string; capacity: string }>>({});
  const { run, banner } = useActionError();

  if (loading || hotelRows.length === 0) return <LoadingState label="Chargement de l'hôtel…" />;
  const hotel = hotelRows[0];

  const addNewRoom = () =>
    run(async () => {
      const price = Number(newPrice);
      const capacity = Number(newCapacity);
      if (!(price > 0) || !Number.isInteger(capacity) || capacity < 1) {
        throw new Error('Renseignez un prix positif et une capacité d’au moins 1.');
      }
      await addRoom(hotel.id, { type: newType, price, capacity });
      setNewPrice('');
      setNewCapacity('1');
      reload();
    });

  const startEditRoom = (room: Room) => {
    setEditingRoom((r) => ({ ...r, [room.id]: { price: String(room.price), capacity: String(room.capacity) } }));
  };

  const saveRoom = (room: Room) =>
    run(async () => {
      const draft = editingRoom[room.id];
      if (!draft) return;
      await updateRoom(hotel.id, room.id, { price: Number(draft.price), capacity: Number(draft.capacity) });
      setEditingRoom((r) => {
        const { [room.id]: _removed, ...rest } = r;
        return rest;
      });
      reload();
    });

  const removeRoom = (room: Room) =>
    run(async () => {
      await deleteRoom(hotel.id, room.id);
      reload();
    });

  return (
    <div className="bo-page">
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: '#164A23',
          cursor: 'pointer',
          marginBottom: 18,
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        ← Retour aux hôtels
      </button>
      {banner}

      <div
        className="bo-hero"
        style={{
          background: 'linear-gradient(135deg,#164A23,#0F3419)',
          borderRadius: 14,
          padding: '26px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600, marginBottom: 4 }}>
          {hotel.city} · {hotel.location}
        </div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: '#FAF3EB' }}>{hotel.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
          ★ {hotel.rating.toFixed(1)} · {hotel.rooms.length} chambre(s)
        </div>
        {hotel.desc && <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.85)', marginTop: 10 }}>{hotel.desc}</div>}
      </div>

      <div className="bo-card" style={cardStyle}>
        <div style={cardTitleStyle}>Chambres</div>

        <div className="bo-compact-form-row" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={newType} onChange={(e) => setNewType(e.target.value as RoomType)} style={selectStyle}>
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {ROOM_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Prix (FCFA)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            style={{ ...selectStyle, flex: 1 }}
          />
          <input
            type="number"
            placeholder="Capacité"
            value={newCapacity}
            onChange={(e) => setNewCapacity(e.target.value)}
            style={{ ...selectStyle, width: 90 }}
          />
          <button type="button" onClick={addNewRoom} style={smallBtn('#164A23')}>
            Ajouter
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hotel.rooms.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucune chambre.</div>}
          {hotel.rooms.map((room) => {
            const draft = editingRoom[room.id];
            return (
              <div key={room.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>{ROOM_LABELS[room.type]}</div>
                  {!draft && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => startEditRoom(room)} style={smallBtn('#164A23')}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => removeRoom(room)} style={smallBtn('#A6341D')}>
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
                {draft ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      value={draft.price}
                      onChange={(e) => setEditingRoom((r) => ({ ...r, [room.id]: { ...draft, price: e.target.value } }))}
                      style={{ ...selectStyle, flex: 1 }}
                    />
                    <input
                      type="number"
                      value={draft.capacity}
                      onChange={(e) => setEditingRoom((r) => ({ ...r, [room.id]: { ...draft, capacity: e.target.value } }))}
                      style={{ ...selectStyle, width: 90 }}
                    />
                    <button type="button" onClick={() => saveRoom(room)} style={smallBtn('#164A23')}>
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#6B6459' }}>
                    {room.price.toLocaleString('fr-FR')} FCFA / nuit · {room.capacity} pers.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
