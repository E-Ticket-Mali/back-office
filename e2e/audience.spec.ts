import { bookEvent, createClient, createOrganizerEvent } from './api';
import { expect, tab, test, uiLogin, navTo } from './fixtures';

test.describe('Espace organisateur : inscrits et clients', () => {
  test('la fiche événement montre les chiffres et les inscrits ; le menu Clients mène à la fiche client', async ({ page, organizer, adminToken }) => {
    const event = await createOrganizerEvent(organizer, { approveWith: adminToken, publish: true, capacity: 50 });
    await bookEvent(await createClient(), organizer, event.id, 2);

    await uiLogin(page, organizer.email, organizer.password);
    await page.goto(`/organizer/events/${event.id}`);

    // Vue d'ensemble : chiffres clés et fiche complète (début, fin, capacité, description).
    const kpis = page.getByTestId('event-kpis');
    await expect(kpis).toContainText('sur 50 places');
    await expect(kpis).toContainText('1 réservation(s)');
    const facts = page.getByTestId('event-facts');
    await expect(facts).toContainText('Début');
    await expect(facts).toContainText('Fin');
    await expect(facts).toContainText('50 places');
    await expect(facts).toContainText('Créé par les tests E2E');

    // Inscrits : le client apparaît avec ses billets, et la recherche filtre la liste.
    await tab(page, 'Inscrits').click();
    const attendees = page.getByTestId('attendees-card');
    await expect(attendees).toContainText('Test E2E');
    await expect(attendees).toContainText('Confirmée');
    await page.getByLabel('Rechercher un inscrit (nom, téléphone, e-mail)').fill('introuvable-xyz');
    await expect(attendees).toContainText('Aucun inscrit ne correspond');

    // Menu Clients : liste puis fiche client avec l'historique.
    await navTo(page, 'organizerCustomers');
    await expect(page.getByTestId('customer-kpis')).toContainText('Clients');
    await page.getByTestId('customers-card').getByText('Test E2E').first().click();
    await expect(page.getByTestId('customer-card')).toContainText('Test E2E');
    await expect(page.getByText(event.name)).toBeVisible();
  });
});
