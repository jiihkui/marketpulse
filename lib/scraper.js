import { chromium } from 'playwright';

export async function scrapePrice(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Example: Apple Store selector, adjust per store
  const priceText = await page.locator('span[data-test="product-price"]').first().innerText();

  await browser.close();
  return parseFloat(priceText.replace(/[^0-9.]/g, ''));
}
