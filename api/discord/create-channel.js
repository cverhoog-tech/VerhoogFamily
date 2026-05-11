
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false });
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const categoryId = process.env.DISCORD_CATEGORY_ID;
  if (!token || !guildId) return res.status(200).json({ ok:false, message:"Missing Discord env vars" });
  const body = req.body || {};
  const name = (body.channelName || "SquadUp Voice").toLowerCase().replace(/[^a-z0-9- ]/g,"").replace(/\s+/g,"-").slice(0,80);
  try {
    const r = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method:"POST",
      headers:{ Authorization:`Bot ${token}`, "Content-Type":"application/json" },
      body:JSON.stringify({ name, type:2, parent_id: categoryId || undefined, user_limit:6 })
    });
    const data = await r.json();
    return res.status(200).json({ ok:r.ok, channel:data, message:r.ok ? "Channel created" : data.message });
  } catch(e) {
    return res.status(500).json({ ok:false, message:e.message });
  }
}
