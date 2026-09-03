// Automated axe-core scan of the main pages, run against the local JSON
// demo backend (same setup as e2e/smoke.spec.js) — no external credentials
// needed. Complements a manual keyboard/contrast pass; axe only catches
// what's mechanically detectable (missing labels/alt text, contrast,
// landmark/heading structure, etc.), not full keyboard-operability.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function expectNoViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test('home page has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.lot-card').first()).toBeVisible();
  await expectNoViolations(page);
});

test('lots page (with search results) has no violations', async ({ page }) => {
  await page.goto('/lots');
  await expect(page.locator('.lot-card').first()).toBeVisible();
  await expectNoViolations(page);
});

test('lot detail page has no violations', async ({ page }) => {
  await page.goto('/lots');
  await page.locator('.lot-card h3 a').first().click();
  await expect(page).toHaveURL(/\/lot\?id=/);
  await expectNoViolations(page);
});

test('map page (placeholder, no Mapbox token) has no violations', async ({ page }) => {
  await page.goto('/map');
  await expectNoViolations(page);
});

test('login page has no violations in every mode', async ({ page }) => {
  await page.goto('/login');
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Magic link' }).click();
  await expectNoViolations(page);
});

for (const path of ['/owner', '/admin', '/reservations']) {
  test(`${path} sign-in gate has no violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoViolations(page);
  });
}
