import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);

  const handleTrack = async () => {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name }),
    });
    const data = await res.json();
    setPriceHistory([...priceHistory, { price: data.price, date: new Date().toLocaleTimeString() }]);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Universal Price Tracker</h1>
      <input placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Product URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button onClick={handleTrack}>Track Price</button>

      {priceHistory.length > 0 && (
        <LineChart width={600} height={300} data={priceHistory} margin={{ top: 20, right: 20 }}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#8884d8" />
        </LineChart>
      )}
    </div>
  );
}
