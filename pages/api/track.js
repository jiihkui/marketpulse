import { scrapePrice } from '../../lib/scraper';
import { pool } from '../../lib/db';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, name } = req.body ?? {};

  // Validate URL is a real URL, not just any string
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "A valid URL is required to track a product." });
  }

  // Optional: restrict to http/https only
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: "URL must use http or https." });
  }

  try {
    const price = await scrapePrice(url);

    if (!price) {
      return res.status(404).json({ error: "Price not found on the page. Please check the URL." });
    }

    // Upsert pattern — avoids two separate queries
    const upsert = await pool.query(
      `INSERT INTO products (name, url)
       VALUES ($1, $2)
       ON CONFLICT (url) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name?.trim() || 'Unknown Product', url]
    );
    const productId = upsert.rows[0].id;

    await pool.query(
      'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
      [productId, price]
    );

    return res.status(200).json({ success: true, productId, price });

  } catch (err) {
    console.error("Tracking Error:", err);          // log full error, not just message
    return res.status(500).json({ error: 'Internal server error during price tracking.' });
  }
}