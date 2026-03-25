import { pool } from '../../lib/db';

export default async function handler(req, res) {
  const { url } = req.query;

  try {
    const product = await pool.query(
      'SELECT id FROM products WHERE url=$1',
      [url]
    );

    if (product.rows.length === 0) {
      return res.status(200).json([]);
    }

    const productId = product.rows[0].id;

    const history = await pool.query(
      'SELECT price, created_at FROM price_history WHERE product_id=$1 ORDER BY created_at ASC',
      [productId]
    );

    res.status(200).json(history.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}