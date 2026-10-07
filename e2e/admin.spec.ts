import path from 'node:path';
import { createOrganizerEvent, findAdminEventByName } from './api';
import { ADMIN, expect, navTo, tab, test, uiLogin } from './fixtures';

const COVER_PNG = path.resolve('e2e/assets/cover.png');

test.describe('Espace ADMIN', () => {
  test.beforeEach(async ({ page }) => {
    await uiLogin(page, ADMIN.email, ADMIN.password);
  });

  test('menu à un niveau : une entrée par destination, aucun statut ni action', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    for (const section of ['Catalogue', 'Activité', 'Utilisateurs', 'Finances']) {
      await expect(nav.getByText(section, { exact: true })).toBeVisible();
    }
    for (const view of [
      'dashboard', 'events', 'hotels', 'bookings', 'adminTickets', 'clients', 'agents',
      'organizersAdmin', 'adminPayouts', 'adminCommissions', 'adminNotifications', 'security',
    ]) {
      await expect(page.getByTestId(`nav-${view}`)).toBeVisible();
    }
    // Les sous-vues sont des onglets de page, pas des entrées de menu.
    await expect(page.getByTestId('nav-adminScans')).toHaveCount(0);
    // Cloisonnement : aucune fonction de promoteur dans le menu admin.
    await expect(page.getByTestId('nav-organizerAssignments')).toHaveCount(0);
    await expect(page.getByTestId('nav-organizerFinance')).toHaveCount(0);
  });

  test('badge « à valider » et onglets de statut des événements', async ({ page, organizer }) => {
    const pending = await createOrganizerEvent(organizer, { submit: true });
    await page.reload();
    await expect(page.getByTestId('badge-events')).toBeVisible();

    await navTo(page, 'events');
    await expect(tab(page, 'Tous')).toHaveAttribute('aria-selected', 'true');
    await tab(page, 'À valider').click();
    // Filtrer par nom : la base locale accumule les données des exécutions précédentes (liste paginée).
    await page.getByPlaceholder('Rechercher...').fill(pending.name);
    await expect(page.getByText(pending.name)).toBeVisible();
    await tab(page, 'Publiés').click();
    await expect(page.getByText(pending.name)).toHaveCount(0);
  });

  test('le tableau de bord mène directement aux éléments à traiter', async ({ page }) => {
    await expect(page.getByRole('button', { name: /événements? en ligne/ })).toBeVisible();
    await page.getByRole('button', { name: /événements? à valider/ }).click();
    await expect(page.getByTestId('nav-events')).toHaveAttribute('aria-current', 'page');
    await expect(tab(page, 'À valider')).toHaveAttribute('aria-selected', 'true');

    await navTo(page, 'dashboard');
    await page.getByRole('button', { name: /demandes? de reversement/ }).click();
    await expect(page.getByTestId('nav-adminPayouts')).toHaveAttribute('aria-current', 'page');
    await expect(tab(page, 'À traiter')).toHaveAttribute('aria-selected', 'true');
  });

  test('notifications : un événement soumis mène à la liste « À valider »', async ({ page, organizer }) => {
    const event = await createOrganizerEvent(organizer, { submit: true });
    await page.reload();
    await navTo(page, 'adminNotifications');
    const card = page.locator('article', { hasText: event.name });
    await expect(card).toContainText('Événement soumis');
    await card.getByRole('button', { name: 'Valider / rejeter' }).click();
    await expect(page.getByTestId('nav-events')).toHaveAttribute('aria-current', 'page');
    await expect(tab(page, 'À valider')).toHaveAttribute('aria-selected', 'true');
    await page.getByPlaceholder('Rechercher...').fill(event.name);
    await expect(page.getByText(event.name)).toBeVisible();
  });

  test('nouvel événement : la couverture suit la catégorie puis un logo choisi est appliqué', async ({ page, adminToken }) => {
    const name = `E2E Admin Cover ${Date.now()}`;
    await navTo(page, 'events');
    await page.getByRole('button', { name: '+ Nouvel événement' }).click();

    const cover = page.getByTestId('cover-field');
    await expect(cover).toBeVisible();
    await expect(page.getByTestId('cover-caption')).toContainText('logo de la catégorie');
    await page.locator('#field-category').selectOption('SPORT');
    await expect(page.getByTestId('cover-caption')).toContainText('Sport');

    await cover.getByRole('button', { name: 'Logo Théâtre' }).click();
    await expect(page.getByTestId('cover-caption')).toHaveText('Théâtre');

    await page.locator('#field-name').fill(name);
    await page.locator('#field-city').fill('Bamako');
    await page.locator('#field-location').fill('Stade du 26 mars');
    await page.locator('#field-date').fill('2027-03-01T18:00');
    await page.getByLabel('Prix du tarif Standard').fill('5000');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByText(`Événement ${name} créé et publié avec succès`)).toBeVisible();

    const created = await findAdminEventByName(adminToken, name);
    expect(created?.imageUrl).toContain('/presets/theatre.svg');
  });

  test('nouvel événement : couverture importée', async ({ page, adminToken }) => {
    const name = `E2E Admin Upload ${Date.now()}`;
    await navTo(page, 'events');
    await page.getByRole('button', { name: '+ Nouvel événement' }).click();
    await page.getByLabel('Importer une image de couverture').setInputFiles(COVER_PNG);
    await expect(page.getByTestId('cover-caption')).toHaveText('cover.png');

    await page.locator('#field-name').fill(name);
    await page.locator('#field-city').fill('Bamako');
    await page.locator('#field-location').fill('Palais des sports');
    await page.locator('#field-date').fill('2027-04-01T18:00');
    await page.getByLabel('Prix du tarif Standard').fill('5000');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByText(`Événement ${name} créé et publié avec succès`)).toBeVisible();

    const created = await findAdminEventByName(adminToken, name);
    expect(created?.imageUrl).toMatch(/\/catalog\/events\/[^/]+\/image$/);
  });

  test('tarifs d’un événement organisateur : consultation seule pour l’admin', async ({ page, organizer }) => {
    const event = await createOrganizerEvent(organizer, { submit: true });
    await page.reload();
    await navTo(page, 'events');
    await page.getByPlaceholder('Rechercher...').fill(event.name);
    await expect(page.getByText(organizer.name)).toBeVisible();
    await page.getByRole('button', { name: 'Détails' }).first().click();

    await expect(page.getByTestId('pricing-locked')).toContainText(organizer.name);
    await expect(page.getByRole('button', { name: 'Ajouter', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Supprimer', exact: true })).toHaveCount(0);
  });

  test('événement de la plateforme : publié dès sa création, sans validation', async ({ page, adminToken }) => {
    const name = `E2E Plateforme ${Date.now()}`;
    await navTo(page, 'events');
    await page.getByRole('button', { name: '+ Nouvel événement' }).click();
    await page.locator('#field-name').fill(name);
    await page.locator('#field-city').fill('Bamako');
    await page.locator('#field-location').fill('Stade Modibo Keïta');
    await page.locator('#field-date').fill('2027-06-01T16:00');
    await page.getByLabel('Prix du tarif Standard').fill('0');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByText(`Événement ${name} créé et publié avec succès`)).toBeVisible();

    const created = await findAdminEventByName(adminToken, name);
    expect(created?.status).toBe('PUBLISHED');
    expect(created?.tickets).toEqual([expect.objectContaining({ type: 'STANDARD', price: 0 })]);
  });

  test('commissions : taux spécifique puis retour au taux par défaut', async ({ page, organizer }) => {
    await page.reload();
    await navTo(page, 'adminCommissions');
    await page.getByPlaceholder(/Rechercher/).fill(organizer.email);

    const row = page.locator('div', { hasText: organizer.email }).filter({ has: page.getByRole('spinbutton') }).last();
    await expect(row).toContainText('10 % (défaut)');
    await row.getByRole('spinbutton').fill('12.5');
    await row.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(row).toContainText('12.5 % (spécifique)');

    await row.getByRole('button', { name: 'Taux par défaut' }).click();
    await expect(row).toContainText('10 % (défaut)');
  });

  test('commissions : un taux hors bornes est refusé', async ({ page, organizer }) => {
    await page.reload();
    await navTo(page, 'adminCommissions');
    await page.getByPlaceholder(/Rechercher/).fill(organizer.email);
    const row = page.locator('div', { hasText: organizer.email }).filter({ has: page.getByRole('spinbutton') }).last();
    await row.getByRole('spinbutton').fill('150');
    await row.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('alert')).toContainText('entre 0 et 100');
  });

  test('billets & contrôle : onglets Manifestes et Scans', async ({ page, adminToken, organizer }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken, publish: true });
    await page.reload();
    await navTo(page, 'adminTickets');
    await expect(tab(page, 'Manifestes')).toHaveAttribute('aria-selected', 'true');
    await page.getByLabel('Événement').selectOption(event.id);
    await expect(page.getByText(/Manifeste \(0\)/)).toBeVisible();

    await tab(page, 'Scans').click();
    // L'entrée de menu reste la même pour les deux onglets.
    await expect(page.getByTestId('nav-adminTickets')).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: new RegExp(event.name) }).click();
    await expect(page.getByText(`Journal des scans — ${event.name}`)).toBeVisible();
    await expect(page.getByText('Aucun scan pour cet événement.')).toBeVisible();
  });

  test('reversements : onglets de statut', async ({ page }) => {
    await navTo(page, 'adminPayouts');
    for (const label of ['À traiter', 'À payer', 'Payées', 'Refusées', 'Toutes']) {
      await expect(tab(page, label)).toBeVisible();
    }
    await tab(page, 'Toutes').click();
    await expect(tab(page, 'Toutes')).toHaveAttribute('aria-selected', 'true');
  });
});
