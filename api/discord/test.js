
export default async function handler(req, res) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) {
    return res.status(200).json({ ok:false, message:"Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID" });
  }
  try {
    const r = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    const data = await r.json();
    return res.status(200).json({ ok:r.ok, guild:data.name || null, message:r.ok ? "Bot connected" : data.message });
  } catch (e) {
    return res.status(500).json({ ok:false, message:e.message });
  }
}
