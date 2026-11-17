import { test, expect } from '@playwright/test';
async function assertHealthyCourseCards(page) {
  const cards = page.locator('.course-cover');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  for (let i = 0; i < Math.min(count, 10); i++) {
    const card = cards.nth(i),
      number = card.locator('.course-index'),
      title = card.locator('.course-title-line strong');
    const [nb, tb, styles] = await Promise.all([
      number.boundingBox(),
      title.boundingBox(),
      title.evaluate((el) => {
        const s = getComputedStyle(el);
        return { writingMode: s.writingMode, wordBreak: s.wordBreak, overflowWrap: s.overflowWrap };
      }),
    ]);
    expect(tb.width, 'título estreito/vertical').toBeGreaterThan(
      page.viewportSize().width > 900 ? 220 : 140,
    );
    expect(tb.height / tb.width, 'proporção vertical anormal').toBeLessThan(1.25);
    expect(
      Math.abs(nb.y + nb.height / 2 - (tb.y + tb.height / 2)),
      'número fora da linha do título',
    ).toBeLessThanOrEqual(4);
    expect(styles.writingMode).toBe('horizontal-tb');
    expect(styles.wordBreak).toBe('normal');
  }
}
test.skip(!process.env.E2E_AUTH_STATE, 'catálogo autenticado exige E2E_AUTH_STATE de homologação');
test('catálogo não verticaliza títulos', async ({ page }) => {
  await page.goto('/#/academy/pentest/courses');
  await assertHealthyCourseCards(page);
});
