import * as cheerio from 'cheerio';

export async function scrapePrice(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    if (url.includes('apple.com')) {
      const price = $('[data-test="full-price"]').first().text();
      if (price) return extractNumber(price);
    }

    if (url.includes('shopee')) {
      const price =
        $('[data-testid="pdp-product-price"]').first().text() ||
        $('span[class*="price"]').first().text() ||
        $('div[class*="price"]').first().text();
      if (price) return extractNumber(price);
    }

    const cleanText = $('body').text().replace(/\s+/g, ' ').substring(0, 2000);

    const geminiPrice = await askGeminiForPrice(cleanText);
    if (geminiPrice) return geminiPrice;

    const currencyMatch = cleanText.match(
      /(?:S?\$|SGD|USD|RM|£|€)\s?(\d{1,6}(?:[.,]\d{1,3})*(?:\.\d{1,2})?)/i
    );
    if (currencyMatch) return parseFloat(currencyMatch[1].replace(/,/g, ''));

    const broadMatch = cleanText.match(/(\d{2,6}(?:\.\d{2})?)/);
    return broadMatch ? parseFloat(broadMatch[1].replace(/,/g, '')) : null;

  } catch (error) {
    console.error('Scraper internal error:', error.message);
    return null;
  }
}

async function askGeminiForPrice(text) {
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `Extract only the numerical price of the product from this text. Return only the number with no currency symbols, commas, or words. If no price is found, return the word null and nothing else. Text: ${text}`
      }]
    }]
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API error:', data.error.message);
      return null;
    }

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!aiText || aiText.toLowerCase() === 'null') return null;

    const cleaned = aiText.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;

  } catch (err) {
    console.error('Gemini fetch error:', err);
    return null;
  }
}

function extractNumber(text) {
  const match = text.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
}