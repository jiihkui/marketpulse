import { scrapePrice } from '../../lib/scraper';
import { pool } from '../../lib/db';

export default async function handler(req, res) {
  // 1. Move validation to the TOP to prevent passing 'undefined' to the scraper
  const { url, name } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: "A valid URL is required to track a product." });
  }

  try {
    // 2. Now call the scraper with a guaranteed string
    const price = await scrapePrice(url);

    // 3. Handle cases where the scraper succeeds but finds no price
    if (!price) {
      return res.status(404).json({ error: "Price not found on the page. Please check the URL." });
    }

    // 4. Database Logic: Check if product exists
    let result = await pool.query('SELECT id FROM products WHERE url=$1', [url]);
    let productId;

    if (result.rows.length === 0) {
      const insert = await pool.query(
        'INSERT INTO products (name, url) VALUES ($1, $2) RETURNING id',
        [name || 'Unknown Product', url]
      );
      productId = insert.rows[0].id;
    } else {
      productId = result.rows[0].id;
    }

    // 5. Insert price history
    await pool.query(
      'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
      [productId, price]
    );

    // 6. Success response
    return res.status(200).json({ 
      success: true,
      productId,
      price 
    });

  } catch (err) {
    console.error("Tracking Error:", err.message);
    return res.status(500).json({ error: 'Internal server error during price tracking.' });
  }
}