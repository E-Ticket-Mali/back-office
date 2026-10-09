import { bookRoom, createClient, createHotel, createOrganizerEvent, getHotelRooms, getRoomAvailability } from './api';
import { ADMIN, expect, navTo, tab, test, uiLogin } from './fixtures';

/** Date ISO (AAAA-MM-JJ) à J+n. */
const inDays = (n: number) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString().slice(0, 10);

test.describe('Stock hôtelier (R2)', () => {
  test('une chambre ne peut pas être réservée au-delà de son stock sur une même période', async ({ page, adminToken }) => {
    const hotel = await createHotel(adminToken);
    await uiLogin(page, ADMIN.email, ADMIN.password);
    await navTo(page, 'hotels');
    await page.getByPlaceholder('Rechercher...').fill(hotel.name);
    await page.getByRole('button', { name: 'Détails' }).first().click();

    // Le nombre de chambres est obligatoire pour une nouvelle chambre.
    await page.getByPlaceholder('Prix (FCFA)').fill('30000');
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('nombre de chambres');
    await page.getByLabel('Nombre de chambres de ce type').fill('1');
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
    // (Le prix affiché contient une espace insécable : on cible la fin de la ligne de la chambre.)
    await expect(page.getByText(/pers\. · 1 chambre\(s\)/)).toBeVisible();

    const [room] = await getHotelRooms(adminToken, hotel.id);
    expect(room.quantity).toBe(1);
    const client = await createClient();
    const stay = { hotelId: hotel.id, roomId: room.id, checkIn: inDays(10), checkOut: inDays(13) };

    expect((await getRoomAvailability(client, hotel.id, stay.checkIn, stay.checkOut))[0].remaining).toBe(1);
    expect((await bookRoom(client, stay)).status).toBe(200);

    // Même période, ou période qui chevauche : complet.
    const overlap = await bookRoom(await createClient(), { ...stay, checkIn: inDays(12), checkOut: inDays(15) });
    expect(overlap.status).toBe(409);
    expect(overlap.message).toContain('disponible');
    expect((await getRoomAvailability(client, hotel.id, stay.checkIn, stay.checkOut))[0].remaining).toBe(0);

    // Le jour du départ, la chambre est de nouveau libre.
    expect((await bookRoom(client, { ...stay, checkIn: inDays(13), checkOut: inDays(14) })).status).toBe(200);
  });
});

test.describe('Admin = modération seule (R15) et historique des décisions (R11)', () => {
  test('un événement d’organisateur n’est pas modifiable par l’admin, et sa validation est tracée', async ({ page, organizer }) => {
    const event = await createOrganizerEvent(organizer, { submit: true });
    await uiLogin(page, ADMIN.email, ADMIN.password);
    await navTo(page, 'events');
    await page.getByPlaceholder('Rechercher...').fill(event.name);
    await expect(page.getByText(event.name)).toBeVisible();

    // Liste : ni « Modifier » ni modification possible ; la suppression (modération) reste offerte.
    await expect(page.getByRole('button', { name: 'Modifier', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Supprimer', exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: 'Détails' }).first().click();

    await expect(page.getByTestId('content-locked')).toContainText(organizer.name);
    await expect(page.getByLabel('Importer une image de couverture')).toHaveCount(0);
    await expect(page.getByTestId('decision-history')).toContainText('Aucune décision enregistrée');

    await page.getByRole('button', { name: 'Approuver', exact: true }).click();
    const history = page.getByTestId('decision-history');
    await expect(history).toContainText('Approuvé');
    await expect(history).toContainText('par ');
  });

  test('le rejet d’un organisateur garde son auteur et son motif', async ({ page, adminToken }) => {
    // Organisateur en attente : inscrit sans être approuvé.
    const stamp = `${Date.now()}`;
    const email = `e2e.pending.${stamp}@example.test`;
    const form = new FormData();
    for (const [k, v] of Object.entries({
      name: `E2E Pending ${stamp}`, email, password: `E2e-${stamp}-pw`, phone: `+2236${stamp.slice(-7)}`, nif: `NIF${stamp.slice(-8)}`, rccm: `RC${stamp.slice(-8)}`,
      documentKind: 'NIF',
    })) form.append(k, v);
    form.append('document', new Blob(['%PDF-1.4\n%e2e\n'], { type: 'application/pdf' }), 'nif.pdf');
    const res = await fetch(`${process.env.E2E_API_URL ?? 'http://127.0.0.1:5000/api/v1'}/auth/organizer/register`, { method: 'POST', body: form });
    expect(res.ok).toBeTruthy();
    expect(adminToken).toBeTruthy();

    await uiLogin(page, ADMIN.email, ADMIN.password);
    await navTo(page, 'organizersAdmin');
    await page.getByPlaceholder('Rechercher...').fill(email);
    await page.getByRole('button', { name: 'Détails' }).first().click();
    await page.getByRole('button', { name: 'Rejeter', exact: true }).click();
    await page.getByRole('dialog').getByRole('textbox').fill('Pièce justificative illisible');
    await page.getByRole('dialog').getByRole('button', { name: 'Rejeter', exact: true }).click();

    const history = page.getByTestId('decision-history');
    await expect(history).toContainText('Rejeté');
    await expect(history).toContainText('Motif : Pièce justificative illisible');
  });
});

test.describe('Notifications organisateur (R6)', () => {
  test('consulter ses notifications fait retomber le badge', async ({ page, organizer, adminToken }) => {
    // L'approbation d'un événement notifie l'organisateur.
    await createOrganizerEvent(organizer, { approveWith: adminToken });
    await uiLogin(page, organizer.email, organizer.password);
    await expect(page.getByTestId('badge-organizerNotifications')).toBeVisible();

    await navTo(page, 'organizerNotifications');
    await expect(page.getByText('Nouvelle').first()).toBeVisible();

    await navTo(page, 'organizerDashboard');
    await expect(page.getByTestId('badge-organizerNotifications')).toHaveCount(0);
    // Et les statuts restent des onglets (non-régression du menu).
    await navTo(page, 'organizerEvents');
    await expect(tab(page, 'Tous')).toBeVisible();
  });
});

test.describe('Session expirée', () => {
  test('un jeton périmé ramène à la connexion au lieu d’une erreur 403', async ({ page, organizer }) => {
    await uiLogin(page, organizer.email, organizer.password);
    // Session conservée par le navigateur, mais jeton devenu invalide (expiré, autre serveur…).
    await page.evaluate(() => localStorage.setItem('eticket-back-office.token', 'jeton.perime.invalide'));
    await page.reload();

    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.getByText(/Erreur 403/)).toHaveCount(0);
  });
});
