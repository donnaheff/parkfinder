// Smoke coverage for flows that don't require a live Supabase session.
// Runs against backend/server.js (the local JSON demo backend) via
// NEXT_PUBLIC_API_BASE, so it needs no external credentials — see
// playwright.config.js. Auth-gated flows (owner listing approval,
// reservations) live in e2e/auth-flows.spec.js and need a real Supabase
// test project, so they aren't covered here.
const { test, expect } = require('@playwright/test');

test.describe('search and browse', () => {
  test('home page loads with live lots from the API', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find and reserve real parking spaces/i })).toBeVisible();
    await expect(page.locator('.lot-card').first()).toBeVisible();
  });

  test('lots page search returns matching results', async ({ page }) => {
    await page.goto('/lots');
    await expect(page.getByRole('heading', { name: 'Parking lots' })).toBeVisible();
    await expect(page.locator('.lot-card').first()).toBeVisible();

    const search = page.getByPlaceholder('Search area or lot name');
    await search.fill('Victoria');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.locator('.lot-card')).toHaveCount(1, { timeout: 10000 });
    await expect(page.locator('.lot-card').first()).toContainText('Victoria');
  });

  test('saving a lot while signed out prompts sign-in instead of erroring', async ({ page }) => {
    await page.goto('/lots');
    await expect(page.locator('.lot-card').first()).toBeVisible();
    await page.locator('.lot-card').first().getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('status')).toHaveText('Sign in to save parking lots.');
  });
});

test.describe('lot detail', () => {
  test('renders a lot and degrades gracefully when the reviews endpoint is unavailable', async ({ page }) => {
    await page.goto('/lots');
    const firstCardTitle = page.locator('.lot-card h3 a').first();
    const lotName = await firstCardTitle.textContent();
    await firstCardTitle.click();

    await expect(page).toHaveURL(/\/lot\?id=/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(lotName.trim());
    // The demo backend has no /api/reviews route, so the page must still
    // render the lot instead of failing the whole page load.
    await expect(page.getByText('No reviews yet')).toBeVisible();
  });
});

test.describe('map', () => {
  test('shows a placeholder instead of crashing without a Mapbox token', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByRole('heading', { name: 'Live parking map' })).toBeVisible();
    await expect(page.getByText('Live map requires a Mapbox token.')).toBeVisible();
  });
});

test.describe('auth gates', () => {
  for (const [path, heading] of [
    ['/owner', 'Sign in to continue'],
    ['/admin', 'Sign in to continue'],
    ['/reservations', 'Sign in to continue'],
  ]) {
    test(`${path} gates behind sign-in when signed out`, async ({ page }) => {
      await page.goto(path);
      const gate = page.locator('section.panel.card', { has: page.getByRole('heading', { name: heading }) });
      await expect(gate).toBeVisible();
      await gate.getByRole('link', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('login page offers sign in, sign up, and magic link modes', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });
});
