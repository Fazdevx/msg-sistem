export default async function handler(req, res) {
  try {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
