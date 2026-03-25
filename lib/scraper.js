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

    // 1. Hardcoded Selectors (Fastest)
    if (url.includes('apple.com')) {
      const price = $('[data-test="full-price"]').first().text();
      if (price) return extractNumber(price);
    }

    if (url.includes('shopee')) {
      const price = $('.pmmxKx').first().text();
      if (price) return extractNumber(price);
    }

    // 2. Gemini AI Fallback (The "Smart" way)
    // We clean the text to save tokens/money before sending to Gemini
    const cleanText = $('body').text().replace(/\s+/g, ' ').substring(0, 2000); 
    
    const geminiPrice = await askGeminiForPrice(cleanText);
    if (geminiPrice) return geminiPrice;

    // 3. Final Regex Fallback (Last resort)
    const match = cleanText.match(/(\d{2,6}(\.\d{1,2})?)/);
    return match ? parseFloat(match[0].replace(',', '')) : null;

  } catch (error) {
    console.error("Scraper internal error:", error.message);
    return null;
  }
}

async function askGeminiForPrice(text) {
  // Use the 2026 stable endpoint
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `Extract only the numerical price of the product from this text. Return only the number, no currency symbols or words. If no price is found, return "null". Text: ${text}`
      }]
    }]
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    const data = await response.json();
    
    // Check for API errors (like your 404)
    if (data.error) {
      console.error("Gemini API Error:", data.error.message);
      return null;
    }

    const aiText = data.candidates[0].content.parts[0].text.trim();
    return aiText !== "null" ? parseFloat(aiText) : null;
  } catch (err) {
    console.error("Gemini Fetch Error:", err);
    return null;
  }
}

function extractNumber(text) {
  const match = text.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
}