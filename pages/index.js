import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const handleTrack = async () => {
  const res = await fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name }),
  });

  const data = await res.json();

  if (data.error) {
    alert("Error: " + data.error);
  } else {
    alert("Price: " + data.price);
  }
};

  return (
    <div style={{ padding: '2rem' }}>
      <h1>MarketPulse</h1>
      <input placeholder="Product Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Product URL" onChange={(e) => setUrl(e.target.value)} />
      <button onClick={handleTrack}>Track</button>
    </div>
  );
}