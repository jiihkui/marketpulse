import * as cheerio from 'cheerio';

export async function scrapePrice(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // 🔥 Apple Store
  if (url.includes('apple.com')) {
    const price = $('[data-test="full-price"]').first().text();

    if (price) {
      return extractNumber(price);
    }
  }

  // 🔥 Shopee
  if (url.includes('shopee')) {
    const price = $('.pmmxKx').first().text();

    if (price) {
      return extractNumber(price);
    }
  }

  // 🔥 Fallback (generic)
  const bodyText = $('body').text();
  const match = bodyText.match(/(\d{2,6}(\.\d{1,2})?)/);

  if (!match) return null;

  return parseFloat(match[0].replace(',', ''));
}

// helper
function extractNumber(text) {
  const match = text.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[0]);
}