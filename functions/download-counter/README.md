# download-counter

Redirect-through Cloud Function: `GET /?type=module|tool&slug=...&version=...`
resolves the real Yandex Object Storage URL from a server-side allowlist
(`manifest.mjs`), increments `_meta/counters.json` in the bucket, then 302s to
the file. Never redirects to a client-supplied URL — see comments in
`index.mjs` for why.

## Deploy (Yandex Cloud CLI, `yc`)

1. Service account with least privilege — don't reuse the CI deploy key:
   ```
   yc iam service-account create --name abrmove-counter-fn
   yc resource-manager folder add-access-binding <folder-id> \
     --role storage.editor \
     --subject serviceAccount:<service-account-id>
   yc iam access-key create --service-account-name abrmove-counter-fn
   ```
   Save the printed `key_id` / `secret` — used as `YC_ACCESS_KEY_ID` / `YC_SECRET_ACCESS_KEY` below.

2. Install deps and deploy:
   ```
   cd functions/download-counter
   npm install
   yc serverless function create --name abrmove-download-counter
   yc serverless function version create \
     --function-name abrmove-download-counter \
     --runtime nodejs20 \
     --entrypoint index.handler \
     --memory 128m \
     --execution-timeout 5s \
     --source-path . \
     --environment YC_BUCKET=abrmove-modules,YC_ACCESS_KEY_ID=<key_id>,YC_SECRET_ACCESS_KEY=<secret>
   yc serverless function allow-unauthenticated-invoke abrmove-download-counter
   ```

3. Get the invoke URL:
   ```
   yc serverless function get abrmove-download-counter
   ```
   Looks like `https://functions.yandexcloud.net/<function-id>`.

4. Wire it into the site build — set in `.env` (local) and as a build-time
   env var in `.github/workflows/deploy.yml`:
   ```
   PUBLIC_COUNTER_URL=https://functions.yandexcloud.net/<function-id>
   ```
   Until this is set, `downloadHref()` in `src/data/counter-endpoint.ts` falls
   back to the direct storage link — buttons work with no count, nothing breaks.

## Known limitations (accepted, not fixed)

- Counter increments are read-modify-write against one JSON object — a race
  under concurrent hits can lose an increment. Fine at this site's traffic;
  would need per-key conditional writes (or a real KV/DB) to fix properly.
- No rate limiting on the invoke URL. Low-stakes for a personal download
  counter; front it with API Gateway + a rate-limit policy if that changes.
