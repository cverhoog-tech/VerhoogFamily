
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false });
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_TEXT_CHANNEL_ID;
  if (!token || !channelId) return res.status(200).json({ ok:false, message:"Missing Discord env vars" });
  const body = req.body || {};
  const content = body.template || `SquadUp party is live for ${body.game || "a game"}!`;
  try {
    const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method:"POST",
      headers:{ Authorization:`Bot ${token}`, "Content-Type":"application/json" },
      body:JSON.stringify({
        content,
        embeds:[{
          title:"SquadUp Party",
          description:content,
          color:0x7c3aed,
          footer:{text:"Sent from SquadUp"}
        }]
      })
    });
    const data = await r.json();
    return res.status(200).json({ ok:r.ok, message:r.ok ? "Template sent" : data.message });
  } catch(e) {
    return res.status(500).json({ ok:false, message:e.message });
  }
}
