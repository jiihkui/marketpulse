import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Home() {
  const [input, setInput] = useState('');
  const [data, setData] = useState([]);

  const handleTrack = async () => {
    // 🔥 Step 1: AI parsing
    const aiRes = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });

    const parsed = await aiRes.json();
    console.log("AI parsed:", parsed);

    // 🔥 Step 2: track
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: parsed.name,
        url: parsed.search
      }),
    });

    // 🔥 Step 3: load history
    const res = await fetch(`/api/history?url=${encodeURIComponent(parsed.search)}`);
    const history = await res.json();

    const formatted = history.map(item => ({
      price: Number(item.price),
      time: new Date(item.created_at).toLocaleTimeString(),
    }));

    setData(formatted);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>MarketPulse</h1>

      <input 
        placeholder="Track anything... (e.g. iPhone 17 Apple SG)"
        onChange={(e) => setInput(e.target.value)} 
        style={{ width: '400px', marginRight: '10px' }}
      />

      <button onClick={handleTrack}>Track</button>

      {data.length > 0 && (
        <LineChart width={700} height={300} data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="price" />
        </LineChart>
      )}
    </div>
  );
}