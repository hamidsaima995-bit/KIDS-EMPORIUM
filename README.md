# Kids Emporium

Storefront for a Lahore baby-clothing brand (demo).

## Files
- `index.html` — the whole storefront (styles, images, cart, chatbot inside)
- `server.js` — Express server that serves the site + a 5-day demo trial gate
- `package.json` — tells Railway to run `node server.js`

## Deploy to Railway
1. Put ALL THREE files in your GitHub repo (index.html, server.js, package.json).
   Make sure the new file is named exactly `index.html`.
2. Railway auto-detects Node and runs `npm start`.
3. Railway sets `PORT` automatically — the server already reads it.
4. Open the Railway URL — the site loads (no more 404).

## Trial control (client demo)
Runs as a demo until the date below, then shows a "Demo period has ended"
page with a WhatsApp button. Control from Railway → Variables:

- `TRIAL_UNTIL`   = `2026-08-08`     -> demo end date (change to extend)
- `TRIAL_ENABLED` = `false`          -> turn trial OFF (site live forever)
- `WHATSAPP`      = `923187295941`   -> number on the trial-over page

When the client agrees: set `TRIAL_ENABLED=false` in Railway (or push
`TRIAL_UNTIL` to a later date). No code changes. Site redeploys and goes
fully live again.
