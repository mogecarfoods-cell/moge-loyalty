
export default async function handler(req, res) {
  const pin = req.headers["x-moge-pin"];

  if (
    !process.env.MOGE_ADMIN_PIN ||
    pin !== process.env.MOGE_ADMIN_PIN
  ) {
    return res.status(401).json({
      error: "PIN Admin salah atau belum diatur"
    });
  }

if (!["GET", "POST", "DELETE"].includes(req.method)) {
  res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({
      error: "Metode tidak diizinkan"
    });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      error: "Konfigurasi database belum lengkap"
    });
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  try {
    if (req.method === "GET") {
      const response = await fetch(
        `${url}/rest/v1/loyalty_records?select=member_no,whatsapp,data&order=member_no.asc`,
        { headers }
      );

      if (!response.ok) {
        return res.status(502).json({
          error: "Gagal membaca database Supabase"
        });
      }

      const rows = await response.json();

      return res.status(200).json({
        members: rows.map(row => row.data)
      });
    }

    const member = req.body?.member;

    if (
      !member ||
      typeof member.nomor !== "string" ||
      typeof member.telepon !== "string" ||
      !member.nomor ||
      !member.telepon
    ) {
      return res.status(400).json({
        error: "Data member tidak lengkap"
      });
    }

    const response = await fetch(
      `${url}/rest/v1/loyalty_records?on_conflict=member_no`,
      {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({
          member_no: member.nomor,
          whatsapp: member.telepon,
          data: member
        })
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: "Gagal menyimpan data member ke database"
      });
    }

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      error: "Terjadi kesalahan pada server"
    });
  }
}
