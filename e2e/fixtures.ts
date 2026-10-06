import { test as base, expect, type Page } from '@playwright/test';
import { ADMIN, createApprovedOrganizer, login, type TestOrganizer } from './api';

/** Connexion par le vrai formulaire (couvre aussi la résolution du rôle côté serveur). */
export async function uiLogin(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByTestId('nav-group-Finances')).toBeVisible();
}

/** Clique une entrée de la sidebar en dépliant son groupe si nécessaire. */
export async function navTo(page: Page, group: string | null, testId: string) {
  const item = page.getByTestId(testId);
  if (group && !(await item.isVisible())) await page.getByTestId(`nav-group-${group}`).click();
  await item.click();
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
