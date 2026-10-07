import { test as base, expect, type Page } from '@playwright/test';
import { ADMIN, createApprovedOrganizer, login, type TestOrganizer } from './api';

/** Connexion par le vrai formulaire (couvre aussi la résolution du rôle côté serveur). */
export async function uiLogin(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
}

/** Ouvre une page depuis la sidebar (un seul niveau de menu). */
export async function navTo(page: Page, view: string) {
  await page.getByTestId(`nav-${view}`).click();
  await expect(page.getByTestId(`nav-${view}`)).toHaveAttribute('aria-current', 'page');
}

/** Onglet de page ou de filtre, par son libellé (le compteur éventuel est ignoré). */
export function tab(page: Page, label: string) {
  return page.getByRole('tab', { name: new RegExp(`^${label}(\\s*\\d+)?$`) });
}

/** Crée une catégorie de billet via la fenêtre rapide (formulaire d'événement ou onglet Billetterie). */
export async function addCategory(page: Page, c: { name: string; price: string; capacity?: string }) {
  const dialogs = page.getByRole('dialog');
  const before = await dialogs.count();
  await page.getByRole('button', { name: /catégorie de billet|Ajouter une catégorie/ }).first().click();
  const dialog = dialogs.nth(before);
  await dialog.getByLabel('Nom').fill(c.name);
  await dialog.getByLabel('Prix (FCFA)').fill(c.price);
  if (c.capacity) await dialog.getByLabel('Quantité disponible').fill(c.capacity);
  await dialog.getByRole('button', { name: 'Créer', exact: true }).click();
  await expect(dialogs).toHaveCount(before);
}

type Fixtures = {
  adminToken: string;
  organizer: TestOrganizer;
};

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  adminToken: async ({}, provide) => {
    await provide(await login(ADMIN.email, ADMIN.password));
  },
  organizer: async ({ adminToken }, provide) => {
    await provide(await createApprovedOrganizer(adminToken));
  },
});

export { expect, ADMIN };
