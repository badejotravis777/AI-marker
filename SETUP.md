# Snap & Mark: setup guide

Snap & Mark lets a teacher photograph a handwritten answer sheet and get it marked against their own marking guide in seconds. The teacher checks and approves every mark.

## 1. Get an AI key (10 minutes)

The marking is done by Claude, Anthropic's AI. You need an API key.

1. Go to **console.anthropic.com** and create an account.
2. Open **Billing** and add credit. $5 is enough for a demo.
3. Open **API keys**, click **Create key** and copy it. It starts with `sk-ant-`.
4. Keep the key secret. Never put it in the code or send it in chat.

**Cost:** roughly 4 US cents per script at the default settings (about 100 scripts for $5). Check the Usage page in the console after your first few scripts to see the real figure.

## 2. Put the app online with Netlify (10 minutes)

1. Log in to **app.netlify.com**.
2. Click **Add new project** > **Import an existing project** > **GitHub**, then choose the `ai-marker` repository.
3. Pick the branch to deploy (`main` once this work is merged).
4. Netlify reads the build settings from `netlify.toml`, so leave them as they are.
5. Before deploying, open **Environment variables** and add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: the key from step 1
6. Click **Deploy**. When it finishes, open the site link on your phone.

The badge in the top-right corner should say **AI ready**. If it says **AI not set up**, the key is missing: add it under **Project configuration > Environment variables**, then redeploy.

## 3. Before the meeting

- [ ] Open the site on your phone and check the badge says **AI ready**.
- [ ] Add the site to your home screen so it opens like an app.
- [ ] Mark 2 or 3 real scripts yourself so you know how long it takes on your network.
- [ ] Prepare a handwritten answer sheet: print a blank one from **Guide > Print a blank answer sheet**, or write answers to the 5 sample questions on plain paper with the numbers 1 to 5 and a name at the top.
- [ ] Make sure your phone has data. If the network fails in the meeting, tap **See an example result** on the Mark page. It is clearly labelled as an example.
- [ ] Open the **Impact** page and put in the school's real numbers with the HR manager.

## How it works

- **Mark page:** take a photo. It is shrunk on the phone, sent to the marking server, and marked against the guide. The teacher adjusts any mark with + and −, then approves.
- **Results page:** class average, highest and lowest, the hardest question, and how often teachers changed the AI's marks. Download as CSV for Excel.
- **Guide page:** write the questions, the marks and what earns each mark. The AI marks only by this guide.
- **Impact page:** works out teacher hours saved per term for the HR pitch.

Photos are sent to Anthropic's API to be marked and are not saved by this app. Results are saved only on the phone that marked them.

## Run it on your own computer (optional)

You need Node.js 20.12 or newer.

```bash
npm install
cp .env.example .env    # then paste your key into .env
npm run build
npm start               # opens on http://localhost:8787
```

While changing the code, run `npm run api` in one terminal and `npm run dev` in another. Run the tests with `npm test`.

## Settings

| Variable | What it does | Default |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Your AI key (required) | none |
| `MARKER_EFFORT` | How hard the AI thinks: `low`, `medium` or `high`. Higher is slower and costs more. Keep `low` on Netlify, which stops functions after about 30 seconds. | `low` |
| `MARKER_MODEL` | Which Claude model marks the scripts | `claude-opus-5-5` |

If a safety check ever declines a script, the server automatically retries it on Anthropic's recommended fallback model (the `fallbacks` setting in `server/marker.js`).

## Files

- `server/marker.js`: the marking logic and the instructions given to the AI.
- `netlify/functions/mark.mjs`: the online marking endpoint (`/api/mark`).
- `server/dev-server.js`: the same endpoint for running on your computer.
- `src/`: the phone app (React).

## Claude demo version (no API key)

`claude-demo/snap-and-mark.html` is a one-file version of the app that runs inside Claude as a published artifact. It marks photos using the signed-in viewer's own Claude account, so it needs no API key or hosting. Results stay on that phone. It also has a **Plan** tab that explains the full product and the pilot. Use it for demos; use the main app above for the real product.
