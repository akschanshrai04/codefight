// pages/api/execute.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  
    try {
      const pistonRes = await fetch('http://localhost:2000/api/v2/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
  
      const result = await pistonRes.json();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to call piston', detail: error.message });
    }
  }
  