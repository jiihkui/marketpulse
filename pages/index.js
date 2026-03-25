import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [input, setInput] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackedUrl, setTrackedUrl] = useState('');

  const handleTrack = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setData([]);

    try {
      // Step 1: AI parsing
      const aiRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (!aiRes.ok) throw new Error('Failed to parse input');
      const parsed = await aiRes.json();
      console.log("AI parsed:", parsed);

      // Use website if available, otherwise fall back to search, then raw input
      // ⚠️ Your original code used `parsed.search` as a URL — this is a search
      // term, not a URL. You likely want `parsed.website` here.
      const productUrl = parsed.website || parsed.search || input;
      setTrackedUrl(productUrl);

      // Step 2: Track
      const trackRes = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: parsed.name, url: productUrl }),
      });
      if (!trackRes.ok) {
        const { error } = await trackRes.json();
        throw new Error(error || 'Failed to track product');
      }

      // Step 3: Load history
      const histRes = await fetch(`/api/history?url=${encodeURIComponent(productUrl)}`);
      if (!histRes.ok) throw new Error('Failed to load price history');
      const history = await histRes.json();

      const formatted = history.map(item => ({
        price: Number(item.price),
        time: new Date(item.created_at).toLocaleTimeString(),
      }));
      setData(formatted);

    } catch (err) {
      console.error("Track error:", err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>MarketPulse</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Track anything... (e.g. iPhone 17 Apple SG)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
          style={{ width: '400px', marginRight: '10px', padding: '6px' }}
        />
        <button onClick={handleTrack} disabled={loading} style={{ padding: '6px 16px' }}>
          {loading ? 'Tracking...' : 'Track'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {trackedUrl && <p style={{ color: '#555', fontSize: '0.85rem' }}>Tracking: {trackedUrl}</p>}

      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {data.length === 0 && !loading && !error && (
        <p style={{ color: '#aaa' }}>No price history yet. Track a product to get started.</p>
      )}
    </div>
  );
}