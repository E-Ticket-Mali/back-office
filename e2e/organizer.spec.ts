import path from 'node:path';
import { createOrganizerEvent, createStaff, findOrganizerEventByName } from './api';
import { addCategory, expect, navTo, tab, test, uiLogin } from './fixtures';

const COVER_PNG = path.resolve('e2e/assets/cover.png');

test.describe('Espace ORGANIZER', () => {
  test('menu à un niveau, sans statut, action ni fonction d’administration', async ({ page, organizer }) => {
    await uiLogin(page, organizer.email, organizer.password);
    for (const view of [
      'organizerDashboard', 'organizerEvents', 'organizerTicketing', 'organizerAgents',
      'organizerFinance', 'organizerNotifications', 'organizerSettings',
    ]) {
      await expect(page.getByTestId(`nav-${view}`)).toBeVisible();
    }
    // Les statuts et « Créer » ne sont plus des entrées de menu.
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    for (const label of ['Brouillons', 'Publiés', 'Rejetés', 'En cours de validation', 'Créer un événement']) {
      await expect(nav.getByText(label)).toHaveCount(0);
    }
    for (const adminOnly of ['hotels', 'bookings', 'clients', 'organizersAdmin', 'adminPayouts', 'adminCommissions', 'adminTickets']) {
      await expect(page.getByTestId(`nav-${adminOnly}`)).toHaveCount(0);
    }
  });

  test('tableau de bord : synthèse cliquable, sans formulaire de reversement', async ({ page, organizer, adminToken }) => {
    await createOrganizerEvent(organizer, { approveWith: adminToken, publish: true });
    await uiLogin(page, organizer.email, organizer.password);
    await expect(page.getByRole('button', { name: '1 événement publié' })).toBeVisible();
    await expect(page.getByText('Demander un reversement')).toHaveCount(0);
    await expect(page.getByPlaceholder('Montant en FCFA')).toHaveCount(0);

    await page.getByRole('button', { name: /FCFA disponibles/ }).click();
    await expect(page.getByTestId('nav-organizerFinance')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Calcul du solde')).toBeVisible();

    await navTo(page, 'organizerDashboard');
    await page.getByRole('button', { name: '1 événement publié' }).click();
    await expect(tab(page, 'Publiés')).toHaveAttribute('aria-selected', 'true');
  });

  test('événements : les statuts sont des onglets de filtre avec compteurs', async ({ page, organizer, adminToken }) => {
    const draft = await createOrganizerEvent(organizer, { name: `E2E Brouillon ${Date.now()}` });
    const pending = await createOrganizerEvent(organizer, { name: `E2E Attente ${Date.now()}`, submit: true });
    const published = await createOrganizerEvent(organizer, { name: `E2E Publie ${Date.now()}`, approveWith: adminToken, publish: true });
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');

    await expect(tab(page, 'Tous')).toContainText('3');
    for (const ev of [draft, pending, published]) await expect(page.getByText(ev.name)).toBeVisible();

    await tab(page, 'Brouillons').click();
    await expect(page.getByText(draft.name)).toBeVisible();
    await expect(page.getByText(pending.name)).toHaveCount(0);

    await tab(page, 'En cours de validation').click();
    await expect(page.getByText(pending.name)).toBeVisible();
    await expect(page.getByText(draft.name)).toHaveCount(0);

    await tab(page, 'Publiés').click();
    await expect(page.getByText(published.name)).toBeVisible();
    await expect(tab(page, 'Rejetés')).toContainText('0');
  });

  test('publication : l’organisateur publie puis dépublie un événement validé', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { name: `E2E A publier ${Date.now()}`, approveWith: adminToken });
    await uiLogin(page, organizer.email, organizer.password);
    // Le tableau de bord signale l'événement validé en attente de publication.
    await page.getByRole('button', { name: '1 événement à publier' }).click();
    await expect(tab(page, 'Validés, à publier')).toHaveAttribute('aria-selected', 'true');

    const row = page.locator('div', { hasText: event.name }).filter({ has: page.getByRole('button', { name: 'Gérer' }) }).last();
    await expect(row).toContainText('Validé, à publier');
    await row.getByRole('button', { name: 'Publier' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publier' }).click();

    await tab(page, 'Publiés').click();
    const publishedRow = page.locator('div', { hasText: event.name }).filter({ has: page.getByRole('button', { name: 'Gérer' }) }).last();
    await expect(publishedRow).toContainText('Publié');
    await publishedRow.getByRole('button', { name: 'Dépublier' }).click();
    await expect(page.getByRole('dialog')).toContainText('billets déjà vendus restent valides');
    await page.getByRole('dialog').getByRole('button', { name: 'Dépublier' }).click();

    // Dépublié : un statut à part entière, distinct de « Validé, à publier ».
    await tab(page, 'Dépubliés').click();
    const unpublishedRow = page.locator('div', { hasText: event.name }).filter({ has: page.getByRole('button', { name: 'Gérer' }) }).last();
    await expect(unpublishedRow).toContainText('Dépublié');
    await unpublishedRow.getByRole('button', { name: 'Republier' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publier' }).click();
    await tab(page, 'Publiés').click();
    await expect(page.getByText(event.name)).toBeVisible();
  });

  test('nouvel événement : page dédiée, visuel et couverture distincts', async ({ page, organizer }) => {
    const name = `E2E Orga Cover ${Date.now()}`;
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');
    await page.getByRole('button', { name: '+ Créer un événement' }).click();
    await expect(page).toHaveURL(/\/organizer\/events\/new$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(page.getByTestId('logo-field')).toContainText('Visuel de l\u2019événement'.replace('\u2019', "'"));
    await expect(page.getByTestId('logo-caption')).toContainText('visuel de la catégorie');
    await expect(page.getByTestId('cover-field')).toContainText('Image de couverture');
    await page.getByLabel('Importer une image de couverture').setInputFiles(COVER_PNG);
    await expect(page.getByTestId('cover-caption')).toHaveText('cover.png');

    await page.locator('#ev-name').fill(name);
    await page.locator('#ev-city').fill('Ségou');
    await page.locator('#ev-location').fill('Quai du fleuve');
    await page.locator('#ev-date').fill('2027-02-10');
    await page.locator('#ev-time').fill('20:00');
    await addCategory(page, { name: 'Standard', price: '5000' });
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page).toHaveURL(/\/organizer\/events\/[0-9a-f-]{36}$/);
    await expect(page.getByText(name).first()).toBeVisible();

    const created = await findOrganizerEventByName(organizer, name);
    expect(created?.coverUrl).toMatch(/\/catalog\/events\/[^/]+\/cover$/);
    expect(created?.logoUrl).toContain('/presets/concert.svg');
    expect(created?.status).toBe('DRAFT');
  });

  test('nouvel événement sans choix : visuel de la catégorie appliqué, pas de couverture', async ({ page, organizer }) => {
    const name = `E2E Orga Default ${Date.now()}`;
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');
    await page.getByRole('button', { name: '+ Créer un événement' }).click();
    await page.locator('#ev-category').selectOption('CINEMA');
    await expect(page.getByTestId('logo-caption')).toContainText('Cinéma');
    await page.locator('#ev-name').fill(name);
    await page.locator('#ev-city').fill('Bamako');
    await page.locator('#ev-location').fill('Ciné Babemba');
    await page.locator('#ev-date').fill('2027-02-12');
    await page.locator('#ev-time').fill('20:00');
    await addCategory(page, { name: 'Standard', price: '5000' });
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page).toHaveURL(/\/organizer\/events\/[0-9a-f-]{36}$/);
    await expect(page.getByText('Aucune image de couverture')).toBeVisible();

    const created = await findOrganizerEventByName(organizer, name);
    expect(created?.logoUrl).toContain('/presets/cinema.svg');
    // Champ absent de la réponse quand il n'y a pas de couverture (null non sérialisé).
    expect(created?.coverUrl ?? null).toBeNull();
  });

  test('nouvel événement : catégories de billets créées dans la fenêtre rapide', async ({ page, organizer }) => {
    const name = `E2E Orga Tarifs ${Date.now()}`;
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');
    await page.getByRole('button', { name: '+ Créer un événement' }).click();

    await page.locator('#ev-name').fill(name);
    await page.locator('#ev-city').fill('Bamako');
    await page.locator('#ev-location').fill('Palais de la culture');
    await page.locator('#ev-date').fill('2027-05-01');
    await page.locator('#ev-time').fill('20:00');

    // Sans prix : refus clair dans le panneau (dans la page, pas une fenêtre), la catégorie n'est pas ajoutée.
    await page.getByRole('button', { name: /catégorie de billet/ }).first().click();
    const panel = page.getByTestId('category-panel');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await panel.getByLabel('Nom').fill('Standard');
    await panel.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(panel.getByRole('alert')).toContainText('Prix invalide');
    await panel.getByLabel('Prix (FCFA)').fill('5000');
    await panel.getByLabel('Quantité disponible').fill('300');
    await panel.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(panel).toHaveCount(0);

    // La catégorie créée est ajoutée d'office au formulaire ; une seconde, de nom libre.
    await expect(page.getByTestId('ticket-categories-field')).toContainText('Standard');
    await addCategory(page, { name: 'Carré Or', price: '20000' });
    await expect(page.getByTestId('ticket-categories-field')).toContainText('Carré Or');

    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page).toHaveURL(/\/organizer\/events\/[0-9a-f-]{36}$/);

    const created = await findOrganizerEventByName(organizer, name);
    expect(created?.tickets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Standard', type: 'STANDARD', price: 5000, capacity: 300 }),
        expect.objectContaining({ name: 'Carré Or', type: 'STANDARD', price: 20000 }),
      ]),
    );
  });

  test('billetterie d\u2019un événement : désactiver une catégorie vendue ne touche pas aux billets', async ({ page, organizer }) => {
    const event = await createOrganizerEvent(organizer, { name: `E2E Desactive ${Date.now()}` });
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');
    await page.getByRole('button', { name: 'Gérer' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/organizer/events/${event.id}$`));

    await tab(page, 'Billetterie').click();
    await expect(page).toHaveURL(/tab=ticketing/);
    await page.getByRole('button', { name: 'Désactiver' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Désactiver' }).click();
    await expect(page.getByText('Cette catégorie n\u2019est plus disponible à la vente'.replace('\u2019', "'"))).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réactiver' })).toBeVisible();

    const after = await findOrganizerEventByName(organizer, event.name);
    expect(after?.tickets[0]).toMatchObject({ active: false, name: 'Standard' });
    // Désactiver n'est pas une modification de contenu : pas de re-revue, l'événement garde son statut.
    expect(after?.status).toBe('DRAFT');
  });

  test('publication impossible sans image de couverture', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { name: `E2E Sans couverture ${Date.now()}`, approveWith: adminToken, cover: false });
    await uiLogin(page, organizer.email, organizer.password);
    await page.goto(`/organizer/events/${event.id}`);
    await expect(page.getByText('Aucune image de couverture')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publier' })).toBeDisabled();
  });

  test('billetterie : onglets Catégories de billets, Ventes de billets, Listes de participants', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken, publish: true, capacity: 50 });
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerTicketing');

    await expect(tab(page, 'Catégories de billets')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('50/50 disponible(s)')).toBeVisible();

    await tab(page, 'Ventes de billets').click();
    await expect(page.getByText('Événements en vente')).toBeVisible();
    await expect(page.getByText('0 vendu(s)')).toBeVisible();

    await tab(page, 'Listes de participants').click();
    await expect(page.getByTestId('nav-organizerTicketing')).toHaveAttribute('aria-current', 'page');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger', exact: true }).first().click();
    expect((await download).suggestedFilename()).toBe(`participants-${event.id}.csv`);
  });

  test('agents : onglet Affectations, affecter puis retirer', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken, publish: true });
    await createStaff(organizer, 'Agent E2E');
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerAgents');
    await tab(page, 'Affectations').click();
    await expect(page.getByTestId('nav-organizerAgents')).toHaveAttribute('aria-current', 'page');

    const card = page.locator('.bo-card', { hasText: event.name });
    await expect(card).toContainText('0 agent(s) affecté(s)');
    await card.getByLabel('Agent à affecter').selectOption({ index: 1 });
    await card.getByRole('button', { name: 'Affecter' }).click();
    await expect(card).toContainText('1 agent(s) affecté(s)');

    await card.getByRole('button', { name: 'Retirer Agent E2E' }).click();
    await expect(card).toContainText('0 agent(s) affecté(s)');
  });

  test('finances : onglet Reversements, contrôle du solde et historique', async ({ page, organizer }) => {
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerFinance');
    await expect(page.getByText('Calcul du solde')).toBeVisible();

    await tab(page, 'Reversements').click();
    await page.getByPlaceholder('Montant en FCFA').fill('1000');
    await page.getByRole('button', { name: 'Demander' }).click();
    await expect(page.getByRole('alert')).toContainText('dépasse le solde disponible');
    await expect(page.getByText('Aucune demande de reversement.')).toBeVisible();
  });
});
