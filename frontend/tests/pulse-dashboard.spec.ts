import { test, expect } from '@playwright/test';

// The dropdown was clicked successfully!
// BUT `waitForResponse` timed out!
// Why did the request not trigger?
// Ah! In `ConnectWallet`:
// `const changeNetwork = () => { if (auth?.logged) { doChangeNetwork(networkToChange.chainId); } else { listenNetworkChange(networkToChange.chainId); } };`
// If I am NOT logged in, `listenNetworkChange` does:
// `updateNetwork(NETWORK_CONFIG[...])` -> which changes context `network` state!
// Changing `network` state in `PulseBHeroDashboard.tsx` triggers `useEffect`:
// `useEffect(() => { fetchMarketData(); }, [network]);`
// Did the request trigger before `waitForResponse` started?
// YES! `polygonOption.click()` triggers the request IMMEDIATELY!
// Playwright `waitForResponse` must be defined BEFORE the action that triggers it, using `Promise.all`!
// Otherwise, the response arrives before `waitForResponse` is called, resulting in a timeout!

const createMockHeroesISO = (count: number, rarity: number = 0, timestampHoursAgo: number = 1) => {
    const heroes = [];
    const baseTime = Date.now();
    for (let i = 0; i < count; i++) {
        heroes.push({
            id: i,
            token_id: i + 1000,
            rarity: rarity,
            level: 1,
            price: "1000000000000000000",
            amount: "1000000000000000000",
            updated_at: new Date(baseTime - (timestampHoursAgo * 3600 * 1000)).toISOString(),
            status: 'sold'
        });
    }
    return heroes;
};

test.describe('Pulse Dashboard E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: '.web3modal-modal-lightbox, #WEB3_CONNECT_MODAL_ID { display: none !important; }' });
  });

  test('Page loads without breaking', async ({ page }) => {
    await page.goto('/pulse');
    await expect(page.locator('text=BHero').first()).toBeVisible();
    await expect(page.locator('text=Macro Overview')).toBeVisible();
  });

  test('Time filters (24H/7D/30D/ALL) update the grid data', async ({ page }) => {
    await page.route('**/transactions/heroes/search*', async route => {
      const txs = [
             ...createMockHeroesISO(1, 1, 1),
             ...createMockHeroesISO(1, 1, 48),
             ...createMockHeroesISO(1, 1, 240)
         ];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ transactions: txs }) });
    });

    await page.goto('/pulse/bhero');
    const getTransactionsElement = () => page.locator('div:has-text("Total Transactions") + div').first();
    await expect(getTransactionsElement()).toBeVisible({ timeout: 10000 });

    await page.locator('button', { hasText: 'ALL' }).first().click();
    await expect(getTransactionsElement()).toContainText('3', { timeout: 10000 });

    await page.locator('button', { hasText: '30D' }).first().click();
    await expect(getTransactionsElement()).toContainText('3', { timeout: 10000 });

    await page.locator('button', { hasText: '7D' }).first().click();
    await expect(getTransactionsElement()).toContainText('2', { timeout: 10000 });

    await page.locator('button', { hasText: '24H' }).first().click();
    await expect(getTransactionsElement()).toContainText('1', { timeout: 10000 });
  });

  test('Rarity filter "Common" (0) renders the correct items', async ({ page }) => {
     await page.route('**/transactions/heroes/search*', async route => {
        const txs = [
               ...createMockHeroesISO(2, 0, 1),
               ...createMockHeroesISO(1, 1, 1)
           ];
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ transactions: txs }) });
      });

      await page.goto('/pulse/bhero');
      const getTransactionsElement = () => page.locator('div:has-text("Total Transactions") + div').first();
      await expect(getTransactionsElement()).toContainText('3', { timeout: 10000 });

      await page.locator('button', { hasText: 'Common' }).first().click();
      await expect(getTransactionsElement()).toContainText('2', { timeout: 10000 });
  });

  test('Network switch to Polygon changes proxy target', async ({ page }) => {
    let polygonApiCalled = false;

    page.on('request', request => {
        if (request.url().includes('/polygon')) polygonApiCalled = true;
    });

    await page.route('**/transactions/heroes/search*', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ transactions: [] }) });
    });

    await page.goto('/pulse/bhero');

    const trigger = page.locator('.ant-dropdown-trigger').first();
    await expect(trigger).toBeVisible({ timeout: 10000 });

    await trigger.hover();
    await trigger.click();

    const polygonOption = page.locator('li[role="menuitem"], .ant-dropdown-menu-item').filter({ hasText: 'Polygon' });
    await expect(polygonOption).toBeVisible({ timeout: 10000 });

    // Correct Playwright pattern: Setup wait FOR the response BEFORE triggering action!
    const responsePromise = page.waitForResponse(response => response.url().includes('/polygon') && response.url().includes('/transactions/heroes/search'), { timeout: 10000 });

    await polygonOption.click();

    // Await the promise to ensure the network request completes
    await responsePromise;
    expect(polygonApiCalled).toBe(true);
  });

});
