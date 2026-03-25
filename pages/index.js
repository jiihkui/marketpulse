import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [data, setData] = useState([]);

  const handleTrack = async () => {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name }),
    });

    const res = await fetch(`/api/history?url=${encodeURIComponent(url)}`);
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

      <input placeholder="Product Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Product URL" onChange={(e) => setUrl(e.target.value)} />
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