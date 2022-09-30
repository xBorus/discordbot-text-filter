import express from "express";
import crypto from "crypto";

const hashSalt = process.env["BOT_API_HASH_SALT"] ?? "ThisIsMySuperSalt";
const app = express();

app.put("/linkAccount/:discordId", (req, res) => {
  const { discordId } = req.params;
  const slId = req.body.slId as string;
  const hash = req.body.hash as string;
  var shaSum = crypto.createHash("sha1");
  shaSum.update(`link:${discordId}:${slId}:${hashSalt}`);
  const computedHash = shaSum.digest("hex");
  if (computedHash !== hash) return res.status(400);
  //discord_to_sl.set(discordId, slId);
  //sl_to_discord.set(slId, discordId);
  return res.status(200).json({ success: true });
});
app.put("/reportGagged/:slId", (req, res) => {
  const { slId } = req.params;
  const gagged = req.body.gagged as string;
  const hash = req.body.hash;
  var shaSum = crypto.createHash("sha1");
  shaSum.update(`gagged:${slId}:${gagged}:${hashSalt}`);
  const computedHash = shaSum.digest("hex");
  if (computedHash !== hash) return res.status(400);
  if (gagged === "Y") {
    //sl_is_gagged.add(slId);
  } else {
    //sl_is_gagged.delete(slId);
  }
  return res.status(200).json({ success: true });
});
app.listen(8044, () => {});
