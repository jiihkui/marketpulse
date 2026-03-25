import { scrapePrice } from '../../lib/scraper';
import { pool } from '../../lib/db';

export default async function handler(req, res) {
  const { url, name } = req.body;

  try {
    const price = await scrapePrice(url);

    // ✅ ADD IT HERE (immediately after scraping)
    if (!price) {
      return res.status(200).json({ error: "Price not found" });
    }

    // check if product exists
    let result = await pool.query('SELECT id FROM products WHERE url=$1', [url]);

    let productId;

if (!url) {
  return res.status(400).json({ error: "Invalid URL" });
}

    if (result.rows.length === 0) {
      const insert = await pool.query(
        'INSERT INTO products (name, url) VALUES ($1, $2) RETURNING id',
        [name, url]
      );
      productId = insert.rows[0].id;
    } else {
      productId = result.rows[0].id;
    }

    // insert price
    await pool.query(
      'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
      [productId, price]
    );

    res.status(200).json({ price });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scrape price' });
  }
}