import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createOrganizerEvent,
  getOrganizerEvent,
  setOrganizerEventImagePreset,
  updateOrganizerEvent,
  uploadOrganizerEventCover,
  uploadOrganizerEventImage,
  type OrganizerEventInput,
} from '../api/organizerEvents';
import { CoverField } from '../components/CoverField';
import { LogoField } from '../components/LogoField';
import { Icon } from '../components/Icon';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { TicketCategoriesField } from '../components/TicketCategoriesField';
import { useCollection } from '../hooks/useCollection';
import { cardStyle, mutedText, outlineButtonStyle } from '../components/uiStyles';
import { applyCoverFile, applyLogo, initialLogo, type LogoChoice } from '../utils/logo';
import { toTicketPayloads, type TicketDraft } from '../utils/ticketDrafts';
import type { EventCategory, OrganizerEventItem } from '../types';
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from '../utils/eventLabels';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#1F2E35',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  background: '#FFFFFF',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 6, display: 'block' };
const sectionTitle: React.CSSProperties = { fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 700, color: '#1F2E35', marginBottom: 4 };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 };

function Section(props: Readonly<{ n: number; title: string; hint?: string; children: React.ReactNode }>) {
  return (
    <section style={{ ...cardStyle, padding: 22, display: 'grid', gap: 16 }}>
      <div>
        <div style={sectionTitle}>
          {props.n}. {props.title}
        </div>
        {props.hint && <div style={mutedText}>{props.hint}</div>}
      </div>
      {props.children}
    </section>
  );
}

interface FormState {
  name: string;
  category: EventCategory;
  description: string;
  date: string;
  time: string;
  city: string;
  location: string;
}

const EMPTY: FormState = { name: '', category: 'CONCERT', description: '', date: '', time: '', city: '', location: '' };

function fromEvent(ev: OrganizerEventItem): FormState {
  return {
    name: ev.name,
    category: ev.category,
    description: ev.desc ?? '',
    date: ev.date.slice(0, 10),
    time: ev.date.slice(11, 16),
    city: ev.city,
    location: ev.location,
  };
}

function toIso(date: string, time: string): string {
  return `${date}T${time}:00Z`;
}

function Back({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#164A23', cursor: 'pointer', marginBottom: 18, background: 'transparent', border: 'none', padding: 0 }}
    >
      <Icon name="back" size={15} /> Événements
    </button>
  );
}

/** Page de création / modification d'un événement : un formulaire en sections, sans fenêtre modale. */
export function OrganizerEventFormPage(props: Readonly<{ eventId?: string }>) {
  const { eventId } = props;
  const navigate = useNavigate();
  const { data: rows, loading, error } = useCollection(() => (eventId ? getOrganizerEvent(eventId).then((e) => [e]) : Promise.resolve([])));
  if (eventId && loading) return <LoadingState label="Chargement de l'événement…" />;
  if (eventId && error) return <ErrorState message={error} />;
  const existing = eventId ? rows[0] : undefined;

  return (
    <div className="bo-page">
      <Back onClick={() => navigate('/organizer/events')} />
      {existing ? <EditorBody key={existing.id} existing={existing} /> : <EditorBody key="new" />}
    </div>
  );
}

function EditorBody(props: Readonly<{ existing?: OrganizerEventItem }>) {
  const { existing } = props;
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(existing ? fromEvent(existing) : EMPTY);
  // En modification, `null` = conserver le visuel actuel.
  const [logo, setLogo] = useState<LogoChoice | null>(existing ? null : initialLogo(EMPTY.category));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // Aucune catégorie au départ : elles sont créées par la fenêtre rapide (au moins une exigée à l'envoi).
  const [drafts, setDrafts] = useState<TicketDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const locked = existing?.status === 'PENDING_APPROVAL';
  const reReview = existing && (existing.status === 'APPROVED' || existing.status === 'PUBLISHED' || existing.status === 'UNPUBLISHED');
  const logoFile = logo?.kind === 'file' ? logo.file : null;

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const base = {
        category: form.category,
        name: form.name.trim(),
        location: form.location.trim(),
        city: form.city.trim(),
        date: toIso(form.date, form.time),
        desc: form.description.trim(),
      };
      const warnings: string[] = [];
      let id: string;
      if (existing) {
        await updateOrganizerEvent(existing.id, base);
        id = existing.id;
        // Modification : le visuel n'est renvoyé que si l'utilisateur en a choisi un nouveau.
        if (logo?.kind === 'file') await uploadOrganizerEventImage(id, logo.file);
        else if (logo?.kind === 'preset') await setOrganizerEventImagePreset(id, logo.key);
      } else {
        const tickets = toTicketPayloads(drafts);
        const created = await createOrganizerEvent({ ...base, tickets } as OrganizerEventInput);
        id = created.id;
        const w = await applyLogo(id, form.category, logo ?? initialLogo(form.category), {
          upload: uploadOrganizerEventImage,
          preset: setOrganizerEventImagePreset,
        });
        if (w) warnings.push(w);
      }
      const cw = await applyCoverFile(id, coverFile, uploadOrganizerEventCover);
      if (cw) warnings.push(cw);
      navigate(`/organizer/events/${id}`, { state: warnings.length > 0 ? { warnings } : undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  if (locked) {
    return (
      <div style={{ ...cardStyle, padding: 22 }}>
        <div style={sectionTitle}>Modification impossible</div>
        <div style={mutedText}>Cet événement est en cours de validation : il ne peut plus être modifié tant que l&apos;administrateur n&apos;a pas statué.</div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      style={{ display: 'grid', gap: 18, maxWidth: 880 }}
    >
      <div>
        <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800, margin: 0 }}>
          {existing ? "Modifier l'événement" : 'Créer un événement'}
        </h1>
        <div style={mutedText}>
          {existing ? existing.name : 'Créez votre événement et configurez sa billetterie.'}
        </div>
      </div>

      {reReview && (
        <div role="note" style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(252,209,22,0.18)', color: '#6B5400', fontSize: 13 }}>
          Cet événement est {existing.status === 'PUBLISHED' ? 'publié' : 'validé'} : toute modification le renverra en validation et le retirera de la vente jusqu&apos;à nouvelle approbation.
        </div>
      )}

      <Section n={1} title="Informations générales">
        <div style={grid2}>
          <div>
            <label style={labelStyle} htmlFor="ev-name">
              Nom de l&apos;événement
            </label>
            <input id="ev-name" style={inputStyle} required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ev-category">
              Catégorie
            </label>
            <select
              id="ev-category"
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.category}
              onChange={(e) => set('category', e.target.value as EventCategory)}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {EVENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle} htmlFor="ev-desc">
            Description (facultative)
          </label>
          <textarea id="ev-desc" style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
      </Section>

      <Section n={2} title="Identité visuelle" hint="Deux images distinctes : le visuel identifie l'événement dans les listes, la couverture le présente sur sa page de détail.">
        <LogoField category={form.category} value={logo} onChange={setLogo} currentUrl={existing?.logoUrl ?? existing?.imageUrl} />
        <CoverField file={coverFile} onChange={setCoverFile} currentUrl={existing?.coverUrl} logoFile={logoFile} />
      </Section>

      <Section n={3} title="Date et lieu">
        <div style={grid2}>
          <div>
            <label style={labelStyle} htmlFor="ev-date">
              Date
            </label>
            <input id="ev-date" style={inputStyle} type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ev-time">
              Heure
            </label>
            <input id="ev-time" style={inputStyle} type="time" required value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ev-city">
              Ville
            </label>
            <input id="ev-city" style={inputStyle} required value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ev-location">
              Lieu
            </label>
            <input id="ev-location" style={inputStyle} required value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
        </div>
      </Section>

      <Section n={4} title="Billetterie">
        {existing ? (
          <div style={mutedText}>
            Les catégories de billets se gèrent depuis l&apos;onglet <strong>Billetterie</strong> de l&apos;événement.
            <div style={{ marginTop: 10 }}>
              <button type="button" style={outlineButtonStyle} onClick={() => navigate(`/organizer/events/${existing.id}?tab=ticketing`)}>
                Gérer la billetterie
              </button>
            </div>
          </div>
        ) : (
          <TicketCategoriesField value={drafts} onChange={setDrafts} />
        )}
      </Section>

      {error && (
        <div role="alert" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(206,17,38,0.08)', color: '#CE1126', fontSize: 13 }}>
          {error}
        </div>
      )}

      {!existing && <div style={{ ...mutedText, textAlign: 'right' }}>L&apos;événement est créé en brouillon : vous le soumettrez à validation depuis sa page.</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate(existing ? `/organizer/events/${existing.id}` : '/organizer/events')}
          style={{ padding: '10px 18px', border: '1.5px solid #E7DED0', background: 'transparent', color: '#6B6459', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={busy}
          style={{ opacity: busy ? 0.6 : 1, padding: '10px 22px', border: 'none', background: '#164A23', color: '#FAF3EB', borderRadius: 8, fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {existing ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
