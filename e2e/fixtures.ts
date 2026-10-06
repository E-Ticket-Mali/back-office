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
