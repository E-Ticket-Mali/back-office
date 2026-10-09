import { ADMIN, expect, test } from './fixtures';

test.describe('Affichage sur téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('le menu est un tiroir et les tableaux deviennent des cartes, sans défilement horizontal', async ({ page }) => {
    await page.goto('/');
    await page.locator('#login-email').fill(ADMIN.email);
    await page.locator('#login-password').fill(ADMIN.password);
    await page.locator('button[type="submit"]').click();

    // Menu fermé par défaut : il ne recouvre pas la page.
    const toggle = page.getByTestId('nav-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId('nav-organizersAdmin')).not.toBeInViewport();

    // Le bouton ouvre le tiroir ; choisir une entrée le referme.
    await toggle.click();
    await expect(page.getByTestId('nav-organizersAdmin')).toBeInViewport();
    await page.getByTestId('nav-organizersAdmin').click();
    await expect(page.getByTestId('nav-organizersAdmin')).not.toBeInViewport();

    // Tableau en cartes : chaque ligne tient dans l'écran, la page ne défile pas horizontalement.
    const row = page.getByTestId('table-row').first();
    await expect(row).toBeVisible();
    const box = await row.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(390);
    const overflow = await page.evaluate(() => {
      const content = document.querySelector('.bo-content')!;
      return content.scrollWidth - content.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
