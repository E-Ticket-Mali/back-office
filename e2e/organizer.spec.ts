import path from 'node:path';
import { createOrganizerEvent, createStaff, findOrganizerEventByName } from './api';
import { expect, navTo, tab, test, uiLogin } from './fixtures';

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
    for (const label of ['Brouillons', 'Publiés', 'Rejetés', 'En attente de validation', 'Créer un événement']) {
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

    await tab(page, 'En attente de validation').click();
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

    const row = page.locator('div', { hasText: event.name }).filter({ has: page.getByRole('button', { name: 'Détails' }) }).last();
    await expect(row).toContainText('Validé (non publié)');
    await row.getByRole('button', { name: 'Publier' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publier' }).click();

    await tab(page, 'Publiés').click();
    const publishedRow = page.locator('div', { hasText: event.name }).filter({ has: page.getByRole('button', { name: 'Détails' }) }).last();
    await expect(publishedRow).toContainText('Publié');
    await publishedRow.getByRole('button', { name: 'Dépublier' }).click();
    await expect(page.getByRole('dialog')).toContainText('billets déjà vendus restent valides');
    await page.getByRole('dialog').getByRole('button', { name: 'Dépublier' }).click();

    await tab(page, 'Validés, à publier').click();
    await expect(page.getByText(event.name)).toBeVisible();
  });

  test('nouvel événement : couverture obligatoire, image importée', async ({ page, organizer }) => {
    const name = `E2E Orga Cover ${Date.now()}`;
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');
    await page.getByRole('button', { name: '+ Nouvel événement' }).click();

    await expect(page.getByTestId('cover-field')).toContainText('Image de couverture');
    await expect(page.getByTestId('cover-caption')).toContainText('logo de la catégorie');
    await page.getByLabel('Importer une image de couverture').setInputFiles(COVER_PNG);
    await expect(page.getByTestId('cover-caption')).toHaveText('cover.png');

    await page.locator('#field-name').fill(name);
    await page.locator('#field-city').fill('Ségou');
    await page.locator('#field-location').fill('Quai du fleuve');
    await page.locator('#field-date').fill('2027-02-10T20:00');
    await page.getByLabel('Prix du tarif Standard').fill('5000');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByText(`Événement ${name} créé avec succès (brouillon)`)).toBeVisible();

    const created = await findOrganizerEventByName(organizer, name);
    expect(created?.imageUrl).toMatch(/\/catalog\/events\/[^/]+\/image$/);
  });

  test('nouvel événement sans choix : le logo de la catégorie est appliqué', async ({ page, organizer }) => {
    const name = `E2E Orga Default ${Date.now()}`;
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');
    await page.getByRole('button', { name: '+ Nouvel événement' }).click();
    await page.locator('#field-category').selectOption('CINEMA');
    await page.locator('#field-name').fill(name);
    await page.locator('#field-city').fill('Bamako');
    await page.locator('#field-location').fill('Ciné Babemba');
    await page.locator('#field-date').fill('2027-02-12T20:00');
    await page.getByLabel('Prix du tarif Standard').fill('5000');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByText(`Événement ${name} créé avec succès (brouillon)`)).toBeVisible();

    const created = await findOrganizerEventByName(organizer, name);
    expect(created?.imageUrl).toContain('/presets/cinema.svg');
  });

  test('nouvel événement : l’organisateur fixe ses tarifs dès la création', async ({ page, organizer }) => {
    const name = `E2E Orga Tarifs ${Date.now()}`;
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerEvents');
    await page.getByRole('button', { name: '+ Nouvel événement' }).click();

    await page.locator('#field-name').fill(name);
    await page.locator('#field-city').fill('Bamako');
    await page.locator('#field-location').fill('Palais de la culture');
    await page.locator('#field-date').fill('2027-05-01T20:00');
    // Sans prix : refus clair, rien n'est créé.
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Prix invalide pour le tarif Standard');

    await page.getByLabel('Prix du tarif Standard').fill('5000');
    await page.getByLabel('Capacité du tarif Standard').fill('300');
    await page.getByRole('button', { name: '+ Ajouter un tarif' }).click();
    await page.getByLabel('Prix du tarif VIP').fill('20000');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByText(`Événement ${name} créé avec succès (brouillon)`)).toBeVisible();

    const created = await findOrganizerEventByName(organizer, name);
    expect(created?.tickets.find((t) => t.type === 'VIP')?.capacity ?? null).toBeNull();
    expect(created?.tickets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'STANDARD', price: 5000, capacity: 300 }),
        // Capacité illimitée : le champ est absent de la réponse (null non sérialisé).
        expect.objectContaining({ type: 'VIP', price: 20000 }),
      ]),
    );
  });

  test('billetterie : onglets Tarifs, Ventes, Manifestes & exports', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken, publish: true, capacity: 50 });
    await uiLogin(page, organizer.email, organizer.password);
    await navTo(page, 'organizerTicketing');

    await expect(tab(page, 'Billets & tarifs')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('50/50 restant(s)')).toBeVisible();

    await tab(page, 'Ventes').click();
    await expect(page.getByText('Événements en vente')).toBeVisible();
    await expect(page.getByText('0 vendu(s)')).toBeVisible();

    await tab(page, 'Manifestes & exports').click();
    await expect(page.getByTestId('nav-organizerTicketing')).toHaveAttribute('aria-current', 'page');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger', exact: true }).first().click();
    expect((await download).suggestedFilename()).toBe(`manifeste-${event.id}.csv`);
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
