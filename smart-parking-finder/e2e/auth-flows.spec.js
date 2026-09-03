// End-to-end coverage for flows that need a real signed-in session: owner
// registration -> lot submission -> admin approval, and reserve -> cancel.
//
// These can't run against the local JSON demo backend (backend/server.js) —
// it predates the Supabase Auth/JWT rewrite and doesn't implement owner,
// reservation, or review endpoints. They need a real deployed app
// (`E2E_BASE_URL`, e.g. a Vercel preview) wired to a real Supabase test
// project, plus two pre-created, email-confirmed test accounts: a plain
// owner/renter account and one already added to the `admins` table (see
// VERCEL_SUPABASE_SETUP.md, "Make yourself an admin").
//
// Set these to run this file:
//   E2E_BASE_URL, E2E_OWNER_EMAIL, E2E_OWNER_PASSWORD,
//   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
// Without them, every test here is skipped — CI runs e2e/smoke.spec.js
// unconditionally instead, which needs no external credentials.
const { test, expect } = require('@playwright/test');

const { E2E_BASE_URL, E2E_OWNER_EMAIL, E2E_OWNER_PASSWORD, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } = process.env;
const hasCreds = E2E_BASE_URL && E2E_OWNER_EMAIL && E2E_OWNER_PASSWORD && E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD;

test.describe('authenticated flows (live Supabase test project required)', () => {
  test.skip(!hasCreds, 'Set E2E_BASE_URL/E2E_OWNER_*/E2E_ADMIN_* to run against a real Supabase test project.');
  test.use({ baseURL: E2E_BASE_URL });

  async function signIn(page, email, password) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/owner/);
  }

  test('owner registers, submits a lot, and an admin approves it', async ({ page }) => {
    const lotName = `E2E Test Lot ${Date.now()}`;

    await signIn(page, E2E_OWNER_EMAIL, E2E_OWNER_PASSWORD);
    await page.goto('/owner');

    const registerHeading = page.getByRole('heading', { name: 'Register as an owner' });
    if (await registerHeading.isVisible().catch(() => false)) {
      await page.getByLabel('Full name').fill('E2E Owner');
      await page.getByLabel('Phone').fill('+2340000000000');
      await page.getByRole('button', { name: 'Register' }).click();
      await expect(page.getByRole('heading', { name: 'Add a parking lot' })).toBeVisible();
    }

    await page.getByLabel('Lot name').fill(lotName);
    await page.getByLabel('Area').fill('Victoria Island');
    await page.getByLabel('Address').fill('1 E2E Test Way');
    await page.getByRole('button', { name: 'Submit for verification' }).click();
    await expect(page.getByText(lotName)).toBeVisible();

    await page.goto('/login');
    await signIn(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Pending submissions' })).toBeVisible();

    const submissionCard = page.locator('.card', { hasText: lotName });
    await expect(submissionCard).toBeVisible();
    await submissionCard.getByRole('button', { name: 'Approve' }).click();
    await expect(submissionCard.getByText('Verified')).toBeVisible();
  });

  test('reserving a lot creates a held reservation that can be cancelled', async ({ page }) => {
    await signIn(page, E2E_OWNER_EMAIL, E2E_OWNER_PASSWORD);
    await page.goto('/lots');
    const firstCard = page.locator('.lot-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.getByRole('button', { name: 'Reserve' }).click();
    await firstCard.getByRole('button', { name: 'Hold this space' }).click();
    await expect(page).toHaveURL(/\/reservations/);

    const reservationCard = page.locator('.reservation-card').first();
    await expect(reservationCard.getByText('Held')).toBeVisible();
    await reservationCard.getByRole('button', { name: 'Cancel' }).click();
    await expect(reservationCard.getByText('Cancelled')).toBeVisible();
  });
});
