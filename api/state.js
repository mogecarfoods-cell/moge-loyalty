export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  const expected = process.env.MOGE_ACCESS_TOKEN;
  const supplied = req.headers["x-moge-token"];

  if (!expected || supplied !== expected) {
    return res.status(401).json({ error: "Tautan akses tidak valid." });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: "Pengaturan Supabase belum lengkap di Vercel."
    });
  }

  const endpoint = `${supabaseUrl}/rest/v1/moge_loyalty_state`;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };

  try {
    if (req.method === "GET") {
      const response = await fetch(
        `${endpoint}?id=eq.1&select=data`,
        { headers }
      );

      if (!response.ok) {
        return res.status(502).json({ error: "Gagal membaca database." });
      }

      const rows = await response.json();

      return res.status(200).json({
        data: rows[0]?.data || {
          members: [],
          nextMemberNumber: 1
        }
      });
    }

    const data = req.body;

    if (
      !data ||
      !Array.isArray(data.members) ||
      typeof data.nextMemberNumber
