import cheerio from 'cheerio';

export async function scrapePrice(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  // VERY SIMPLE fallback (will improve later)
  const bodyText = $('body').text();

  // find first number like 1234 or 1,234
  const match = bodyText.match(/(\d{2,6}(\.\d{1,2})?)/);

  if (!match) {
    throw new Error("Price not found");
  }

  return parseFloat(match[0].replace(',', ''));
}