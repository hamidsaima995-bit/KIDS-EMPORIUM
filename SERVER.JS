// Kids Emporium — web server
// Serves the storefront and (optionally) saves orders to Supabase.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Trial settings ---
// Control these from Railway → Variables without touching code:
//   TRIAL_ENABLED = "false"  -> disable the trial gate (site fully live, forever)
//   TRIAL_UNTIL   = "2026-08-07"  -> change the expiry date
// When the trial is ON and the date has passed, visitors see a "trial over" page.
const TRIAL_ENABLED = (process.env.TRIAL_ENABLED || 'true').toLowerCase() !== 'false';
const TRIAL_UNTIL = new Date(process.env.TRIAL_UNTIL || '2026-08-07T23:59:59+05:00');
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
    background:radial-gradient(circle at 20% 15%,#FFD9DE,transparent 45%),
      radial-gradient(circle at 85% 20%,#E4D9FF,transparent 45%),
      radial-gradient(circle at 80% 85%,#CFF3E4,transparent 45%),#FBF7FF;color:#2E2A3F}
  .card{background:rgba(255,255,255,.8);backdrop-filter:blur(14px);border:1px solid rgba(46,42,63,.08);
    padding:48px 40px;border-radius:28px;max-width:440px;text-align:center;
    box-shadow:0 30px 60px -30px rgba(168,139,255,.5);margin:20px}
  h1{font-size:1.7rem;margin:0 0 10px}
  p{color:#6b6480;line-height:1.6;margin:0 0 26px}
  a{display:inline-block;background:linear-gradient(135deg,#FF7A85,#A88BFF);color:#fff;
    text-decoration:none;font-weight:800;padding:14px 30px;border-radius:100px;
    box-shadow:0 14px 30px -8px rgba(255,122,133,.6)}
  .logo{font-weight:900;font-size:1.1rem;letter-spacing:.02em;margin-bottom:18px;color:#A88BFF}
</style></head><body>
  <div class="card">
    <div class="logo">KIDS EMPORIUM</div>
    <h1>Demo period has ended</h1>
    <p>Thanks for reviewing the Kids Emporium website demo.
       To activate your store and keep it running, please get in touch.</p>
    <a href="https://wa.me/${WHATSAPP}">Contact on WhatsApp</a>
  </div>
</body></html>`;

app.use(express.json({ limit: '1mb' }));

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

// --- Orders API ---
// Saves an order to Supabase if env vars are set; otherwise just logs it.
// Front-end can POST { name, phone, items, total } here.
app.post('/api/order', async (req, res) => {
  const { name, phone, items, total } = req.body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Cart is empty.' });
  }

  const order = {
    customer_name: name || null,
    customer_phone: phone || null,
    items,
    total: total || 0,
    created_at: new Date().toISOString(),
  };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  // If Supabase isn't configured yet, still succeed (WhatsApp handoff is primary)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('New order (no DB configured):', order);
    return res.json({ ok: true, saved: false, order });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(order),
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error('Supabase error:', txt);
      return res.json({ ok: true, saved: false, order }); // don't block the customer
    }
    const data = await r.json();
    return res.json({ ok: true, saved: true, order: data[0] || order });
  } catch (err) {
    console.error('Order save failed:', err);
    return res.json({ ok: true, saved: false, order });
  }
});

app.listen(PORT, () => {
  console.log(`Kids Emporium running on port ${PORT}`);
});
