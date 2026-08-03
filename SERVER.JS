// Kids Emporium — web server
// Serves the storefront and gates it behind a demo trial period.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Trial settings ---
// Control these from Railway → Variables without touching code:
//   TRIAL_ENABLED = "false"        -> disable the trial gate (site fully live, forever)
//   TRIAL_UNTIL   = "2026-08-08"   -> change the expiry date
//   WHATSAPP      = "923187295941" -> number shown on the trial-over page
const TRIAL_ENABLED = (process.env.TRIAL_ENABLED || 'true').toLowerCase() !== 'false';
const TRIAL_UNTIL = new Date(process.env.TRIAL_UNTIL || '2026-08-08T23:59:59+05:00');
const WHATSAPP = process.env.WHATSAPP || '923187295941';

function trialExpired() {
  return TRIAL_ENABLED && new Date() > TRIAL_UNTIL;
}

const trialPage = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kids Emporium — Demo</title>
<style>
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle at 20% 15%,#f7b6c8,transparent 45%),
      radial-gradient(circle at 85% 20%,#c3b8e0,transparent 45%),
      radial-gradient(circle at 80% 85%,#a8d5ba,transparent 45%),#f7f3ee;color:#4a4038}
  .card{background:rgba(255,255,255,.82);backdrop-filter:blur(14px);border:1px solid #e8ded2;
    padding:48px 40px;border-radius:28px;max-width:440px;text-align:center;
    box-shadow:0 30px 60px -30px rgba(120,100,80,.4);margin:20px}
  h1{font-size:1.7rem;margin:0 0 10px}
  p{color:#8a8078;line-height:1.6;margin:0 0 26px}
  a{display:inline-block;background:linear-gradient(135deg,#ef8fab,#c3b8e0);color:#fff;
    text-decoration:none;font-weight:700;padding:14px 30px;border-radius:100px;
    box-shadow:0 14px 30px -8px rgba(239,143,171,.6)}
  .logo{font-weight:800;font-size:1.1rem;letter-spacing:.02em;margin-bottom:18px;color:#ef8fab}
</style></head><body>
  <div class="card">
    <div class="logo">KIDS EMPORIUM</div>
    <h1>Demo period has ended</h1>
    <p>Thanks for reviewing the Kids Emporium website demo.
       To activate your store and keep it running, please get in touch.</p>
    <a href="https://wa.me/${WHATSAPP}">Contact on WhatsApp</a>
  </div>
</body></html>`;

// --- Trial gate: runs before everything ---
app.use((req, res, next) => {
  if (req.path === '/health') return next(); // keep health check alive
  if (trialExpired()) {
    return res.status(200).send(trialPage);
  }
  next();
});

// --- Serve the storefront ---
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Health check (Railway pings this) ---
app.get('/health', (req, res) =>
  res.json({ ok: true, trialExpired: trialExpired() })
);

app.listen(PORT, () => {
  console.log(`Kids Emporium running on port ${PORT}`);
});
