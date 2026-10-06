import { createOrganizerEvent, createStaff } from './api';
import { expect, navTo, test, uiLogin } from './fixtures';

test.describe('Espace ORGANIZER', () => {
  test('menu de promoteur, sans aucune fonction d’administration globale', async ({ page, organizer }) => {
    await uiLogin(page, organizer.email, organizer.password);
    for (const group of ['Événements', 'Billetterie', 'Agents contrôleurs', 'Finances']) {
      await expect(page.getByTestId(`nav-group-${group}`)).toBeVisible();
    }
    await expect(page.getByTestId('nav-organizerNotifications')).toBeVisible();
    await expect(page.getByTestId('nav-organizerSettings')).toContainText('Profil');

    for (const adminOnly of ['nav-hotels', 'nav-bookings', 'nav-clients', 'nav-organizersAdmin', 'nav-adminPayouts', 'nav-adminCommissions', 'nav-adminScans']) {
      await expect(page.getByTestId(adminOnly)).toHaveCount(0);
    }
  });

  test('tableau de bord : synthèse personnelle cliquable', async ({ page, organizer, adminToken }) => {
    await createOrganizerEvent(organizer, { approveWith: adminToken });
    await uiLogin(page, organizer.email, organizer.password);
    await expect(page.getByRole('button', { name: '1 événement publié' })).toBeVisible();
    await expect(page.getByRole('button', { name: /billets? vendus?/ })).toBeVisible();
    await page.getByRole('button', { name: /FCFA disponibles/ }).click();
    await expect(page.getByTestId('nav-organizerFinance-balance')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Calcul du solde')).toBeVisible();
  });

  test('sous-menus Événements : filtres par statut', async ({ page, organizer, adminToken }) => {
    const draft = await createOrganizerEvent(organizer, { name: `E2E Brouillon ${Date.now()}` });
    const pending = await createOrganizerEvent(organizer, { name: `E2E Attente ${Date.now()}`, submit: true });
    const published = await createOrganizerEvent(organizer, { name: `E2E Publie ${Date.now()}`, approveWith: adminToken });
    await uiLogin(page, organizer.email, organizer.password);

    await navTo(page, 'Événements', 'nav-organizerEvents');
    for (const ev of [draft, pending, published]) await expect(page.getByText(ev.name)).toBeVisible();

    await page.getByTestId('nav-organizerEvents-DRAFT').click();
    await expect(page.getByText(draft.name)).toBeVisible();
    await expect(page.getByText(pending.name)).toHaveCount(0);
    await expect(page.getByText(published.name)).toHaveCount(0);

    await page.getByTestId('nav-organizerEvents-PENDING_APPROVAL').click();
    await expect(page.getByText(pending.name)).toBeVisible();
    await expect(page.getByText(draft.name)).toHaveCount(0);

    await page.getByTestId('nav-organizerEvents-PUBLISHED').click();
    await expect(page.getByText(published.name)).toBeVisible();
    await expect(page.getByText(draft.name)).toHaveCount(0);
  });

  test('« Créer un événement » ouvre directement le formulaire', async ({ page, organizer }) => {
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'Événements', 'nav-organizerEvents-CREATE');
    await expect(page.getByText('Nouvel événement')).toBeVisible();
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByText('Nouvel événement')).toBeHidden();
    // Fermer le formulaire ramène sur « Tous mes événements ».
    await expect(page.getByTestId('nav-organizerEvents')).toHaveAttribute('aria-current', 'page');
  });

  test('billetterie : tarifs, ventes, manifestes, exports', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken, capacity: 50 });
    await uiLogin(page, organizer.email, organizer.password);

    await navTo(page, 'Billetterie', 'nav-organizerTicketing');
    await expect(page.getByText('50/50 restant(s)')).toBeVisible();

    await page.getByTestId('nav-organizerTicketing-sales').click();
    await expect(page.getByText('Événements en vente')).toBeVisible();
    await expect(page.getByText('0 vendu(s)')).toBeVisible();

    await page.getByTestId('nav-organizerTicketing-manifests').click();
    await expect(page.getByRole('button', { name: 'Télécharger le manifeste' })).toBeVisible();

    await page.getByTestId('nav-organizerTicketing-exports').click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /CSV/ }).first().click();
    expect((await download).suggestedFilename()).toBe(`manifeste-${event.id}.csv`);
  });

  test('affectations : affecter puis retirer un agent', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken });
    await createStaff(organizer, 'Agent E2E');
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'Agents contrôleurs', 'nav-organizerAssignments');

    const card = page.locator('.bo-card', { hasText: event.name });
    await expect(card).toContainText('0 agent(s) affecté(s)');
    await card.getByLabel('Agent à affecter').selectOption({ index: 1 });
    await card.getByRole('button', { name: 'Affecter' }).click();
    await expect(card).toContainText('1 agent(s) affecté(s)');

    await card.getByRole('button', { name: 'Retirer Agent E2E' }).click();
    await expect(card).toContainText('0 agent(s) affecté(s)');
  });

  test('finances : sous-sections et contrôle du solde', async ({ page, organizer }) => {
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'Finances', 'nav-organizerFinance');
    await expect(page.getByText('Dernières demandes')).toBeVisible();

    await page.getByTestId('nav-organizerFinance-requests').click();
    await page.getByPlaceholder('Montant en FCFA').fill('1000');
    await page.getByRole('button', { name: 'Demander' }).click();
    await expect(page.getByRole('alert')).toContainText('dépasse le solde disponible');

    await page.getByTestId('nav-organizerFinance-history').click();
    await expect(page.getByText('Aucune demande de reversement.')).toBeVisible();
  });
});
