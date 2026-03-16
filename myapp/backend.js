import express from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
var today  = new Date();

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const port = process.env.PORT

if (!DISCORD_WEBHOOK_URL || !port){
  throw new Error("Missing Discord Webhook or port in env");
}

const submitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2,             // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.redirect("/confessions.html?error=rate_limited");
  }
});

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..");

const app = express()

app.use(express.urlencoded({ extended: false }));

app.use(express.static(rootDir));

app.post("/submit", submitLimiter, async (req, res) =>{
  console.log("Received POST request");
  const {message} = req.body;

  if(!message){
    return res.redirect("/confessions.html?error=missing");
  };

  const payload={
    "username": "Webhook",
    "content": "New confession has arrived!",
    "embeds":[{
      "author":{
        "name":"Anonymous"
      },
      "title":today.toLocaleDateString("en-US", options),
      "description": message,
    }]
  };

  try{
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok){
      throw new Error("Failed to send Webhook");
    }

  console.log("Sent to Discord");
  return res.redirect("/confessions.html");

  }catch (err){
    return res.redirect("/confessions.html?error=failed");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})