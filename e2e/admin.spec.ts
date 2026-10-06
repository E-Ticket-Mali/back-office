import { createOrganizerEvent } from './api';
import { ADMIN, expect, navTo, test, uiLogin } from './fixtures';

test.describe('Espace ADMIN', () => {
  test.beforeEach(async ({ page }) => {
    await uiLogin(page, ADMIN.email, ADMIN.password);
  });

  test('menu regroupé par intention métier, sans entrée organisateur', async ({ page }) => {
    for (const group of ['Catalogue', 'Activité', 'Utilisateurs', 'Finances']) {
      await expect(page.getByTestId(`nav-group-${group}`)).toBeVisible();
    }
    await expect(page.getByTestId('nav-adminNotifications')).toBeVisible();
    await expect(page.getByTestId('nav-security')).toContainText('Paramètres / Profil');

    await page.getByTestId('nav-group-Activité').click();
    await expect(page.getByTestId('nav-bookings')).toBeVisible();
    await expect(page.getByTestId('nav-adminTickets')).toBeVisible();
    await expect(page.getByTestId('nav-adminScans')).toBeVisible();

    // Cloisonnement : aucune fonction de promoteur dans le menu admin.
    await expect(page.getByTestId('nav-organizerAssignments')).toHaveCount(0);
    await expect(page.getByTestId('nav-organizerFinance')).toHaveCount(0);
  });

  test('un groupe se replie et se déplie', async ({ page }) => {
    const group = page.getByTestId('nav-group-Utilisateurs');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('nav-clients')).toBeVisible();
    await group.click();
    await expect(page.getByTestId('nav-clients')).toBeHidden();
  });

  test('le tableau de bord affiche la synthèse actionnable', async ({ page }) => {
    await expect(page.getByRole('button', { name: /événements? en ligne/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /organisateurs? en attente/ })).toBeVisible();
    await page.getByRole('button', { name: /demandes? de reversement/ }).click();
    await expect(page.getByTestId('nav-adminPayouts')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('tab', { name: /À traiter/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('notifications : un événement soumis apparaît et mène à la validation', async ({ page, organizer }) => {
    const event = await createOrganizerEvent(organizer, { submit: true });
    await page.reload();
    await page.getByTestId('nav-adminNotifications').click();
    const card = page.locator('article', { hasText: event.name });
    await expect(card).toContainText('Événement soumis');
    await card.getByRole('button', { name: 'Valider / rejeter' }).click();
    await expect(page.getByTestId('nav-events')).toHaveAttribute('aria-current', 'page');
  });

  test('commissions : taux spécifique puis retour au taux par défaut', async ({ page, organizer }) => {
    await page.reload();
    await navTo(page, 'Finances', 'nav-adminCommissions');
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
    await navTo(page, 'Finances', 'nav-adminCommissions');
    await page.getByPlaceholder(/Rechercher/).fill(organizer.email);
    const row = page.locator('div', { hasText: organizer.email }).filter({ has: page.getByRole('spinbutton') }).last();
    await row.getByRole('spinbutton').fill('150');
    await row.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('alert')).toContainText('entre 0 et 100');
  });

  test('billets & manifestes : manifeste et KPI d’un événement', async ({ page, adminToken, organizer }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken });
    await page.reload();
    await navTo(page, 'Activité', 'nav-adminTickets');
    await page.getByLabel('Événement').selectOption(event.id);
    await expect(page.getByText('Billets émis')).toBeVisible();
    await expect(page.getByText(/Manifeste \(0\)/)).toBeVisible();
    await expect(page.getByText('Aucun billet.')).toBeVisible();
  });

  test('scans : vue par événement publié et journal', async ({ page, adminToken, organizer }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken });
    await page.reload();
    await navTo(page, 'Activité', 'nav-adminScans');
    await expect(page.getByText('Taux de contrôle')).toBeVisible();
    await page.getByRole('button', { name: new RegExp(event.name) }).click();
    await expect(page.getByText(`Journal des scans — ${event.name}`)).toBeVisible();
    await expect(page.getByText('Aucun scan pour cet événement.')).toBeVisible();
  });

  test('reversements : onglets de statut', async ({ page }) => {
    await navTo(page, 'Finances', 'nav-adminPayouts');
    for (const tab of ['À traiter', 'À payer', 'Payées', 'Refusées', 'Toutes']) {
      await expect(page.getByRole('tab', { name: new RegExp(tab) })).toBeVisible();
    }
    await page.getByRole('tab', { name: /Toutes/ }).click();
    await expect(page.getByRole('tab', { name: /Toutes/ })).toHaveAttribute('aria-selected', 'true');
  });
});
