import path from 'node:path';
import { API_URL } from './api';
import { ADMIN, expect, tab, test, uiLogin, navTo } from './fixtures';

const DOC_PNG = path.resolve('e2e/assets/cover.png');

/** Organisateur créé par l'ADMIN (donc sans NIF ni RCCM) : le cas où il reste des informations à compléter. */
async function createBareOrganizer(adminToken: string) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 100)}`;
  const account = { name: `E2E Params ${stamp}`, email: `e2e.params.${stamp}@example.test`, password: `Init-${stamp}`, phone: `6${stamp.slice(-7)}` };
  const res = await fetch(`${API_URL}/admin/organizers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(account),
  });
  expect(res.status).toBe(201);
  return account;
}

test.describe('Paramètres ADMIN', () => {
  test('compte, sécurité et règles de la plateforme', async ({ page }) => {
    await uiLogin(page, ADMIN.email, ADMIN.password);
    await navTo(page, 'security');

    // Mon compte : e-mail en lecture, changement de mot de passe refusé si l'actuel est faux — sans déconnexion.
    await expect(tab(page, 'Mon compte')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('account-card')).toContainText(ADMIN.email);
    await page.locator('#current-password').fill('mauvais-mot-de-passe');
    await page.locator('#new-password').fill('NouveauMotDePasse1');
    await page.getByRole('button', { name: 'Mettre à jour le mot de passe' }).click();
    await expect(page.getByTestId('password-card').getByRole('alert')).toContainText('Mot de passe actuel incorrect');
    await expect(page.getByTestId('nav-security')).toBeVisible();

    // Plateforme : les règles réellement appliquées par le serveur.
    await tab(page, 'Plateforme').click();
    const platform = page.getByTestId('platform-card');
    await expect(platform).toContainText('10 %');
    await expect(platform).toContainText('6 %');

    await tab(page, 'Sécurité').click();
    await expect(page.getByText(/double authentification/i).first()).toBeVisible();
  });
});

test.describe('Paramètres organisateur', () => {
  test('informations à compléter, justificatifs (KYC) et mot de passe', async ({ page, adminToken }) => {
    const account = await createBareOrganizer(adminToken);
    await uiLogin(page, account.email, account.password);
    await navTo(page, 'organizerSettings');

    // Informations : le NIF manquant se complète, puis devient une information vérifiée (lecture seule).
    await page.locator('#org-nif').fill('NIF-E2E-0042');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('org-info-card').getByRole('status')).toContainText('Informations enregistrées');
    await expect(page.locator('#org-nif')).toHaveCount(0);
    await expect(page.getByText('NIF-E2E-0042')).toBeVisible();

    // Vérification : dépôt d'un justificatif, qui apparaît dans la liste et coche l'étape.
    await tab(page, 'Vérification').click();
    await expect(page.getByTestId('kyc-status-card')).toContainText('Vérifié');
    await expect(page.getByTestId('kyc-documents-card')).toContainText('Aucun justificatif');
    await page.getByLabel('Type de justificatif').selectOption('RCCM');
    await page.getByLabel('Fichier du justificatif').setInputFiles(DOC_PNG);
    await page.getByRole('button', { name: 'Déposer' }).click();
    await expect(page.getByTestId('kyc-upload-card').getByRole('status')).toContainText('Justificatif déposé');
    await expect(page.getByTestId('kyc-documents-card')).toContainText('Justificatif RCCM');
    await expect(page.getByTestId('kyc-documents-card')).toContainText('(1)');

    // Sécurité : changement de mot de passe, puis connexion avec le nouveau.
    await tab(page, 'Sécurité').click();
    const newPassword = `${account.password}-v2`;
    await page.locator('#current-password').fill(account.password);
    await page.locator('#new-password').fill(newPassword);
    await page.getByRole('button', { name: 'Mettre à jour le mot de passe' }).click();
    await expect(page.getByTestId('password-card').getByRole('status')).toContainText('Mot de passe mis à jour');

    const context = await page.context().browser()!.newContext();
    const fresh = await context.newPage();
    await uiLogin(fresh, account.email, newPassword);
    await context.close();
  });
});
