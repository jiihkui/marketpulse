import cheerio from 'cheerio';

export async function scrapePrice(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const bodyText = $('body').text();

  const match = bodyText.match(/(\d{2,6}(\.\d{1,2})?)/);

  if (!match) {
    return null; // instead of throwing error
  }

  const price = parseFloat(match[0].replace(',', ''));

  if (isNaN(price)) {
    return null;
  }

  return price;
}