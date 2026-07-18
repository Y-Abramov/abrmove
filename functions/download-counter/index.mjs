import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { MODULE_TPM_PREFIX, TOOL_DOWNLOADS } from './manifest.mjs';

const BUCKET = process.env.YC_BUCKET || 'abrmove-modules';
const COUNTERS_KEY = '_meta/counters.json';

// Allowlist patterns — reject anything else before it touches path construction
// or the counters store. This is what keeps /?type=&slug=&version= from being
// an open redirect: the target is always {known bucket}/{known prefix}/{validated version},
// never a client-supplied URL.
const SLUG_RE = /^[a-z0-9-]{1,64}$/;
const VERSION_RE = /^\d+(\.\d+){1,3}$/;

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.YC_ACCESS_KEY_ID,
    secretAccessKey: process.env.YC_SECRET_ACCESS_KEY,
  },
});

function resolveTarget(type, slug, version) {
  if (type === 'module') {
    const prefix = MODULE_TPM_PREFIX[slug];
    if (!prefix || !version || !VERSION_RE.test(version)) return null;
    return `https://storage.yandexcloud.net/${BUCKET}/tpm/${prefix}-${version}.tpm`;
  }
  if (type === 'tool') {
    return TOOL_DOWNLOADS[slug] ?? null;
  }
  return null;
}

async function readCounters() {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: COUNTERS_KEY }));
    const body = await res.Body.transformToString();
    return JSON.parse(body);
  } catch {
    return {};
  }
}

// Best-effort increment: read-modify-write against a single JSON object.
// Under concurrent hits this can lose an increment (last write wins) — acceptable
// at this site's traffic; revisit with per-key conditional writes if volume grows.
async function bumpCounter(key) {
  try {
    const counters = await readCounters();
    counters[key] = (counters[key] ?? 0) + 1;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: COUNTERS_KEY,
        Body: JSON.stringify(counters),
        ContentType: 'application/json',
        ACL: 'public-read',
      })
    );
  } catch (err) {
    console.error('counter bump failed', err);
  }
}

export async function handler(event) {
  const params = event.queryStringParameters ?? {};
  const { type, slug, version } = params;

  if (type !== 'module' && type !== 'tool') {
    return { statusCode: 400, body: 'invalid type' };
  }
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    return { statusCode: 400, body: 'invalid slug' };
  }

  const target = resolveTarget(type, slug, version);
  if (!target) {
    return { statusCode: 404, body: 'unknown target' };
  }

  // Counting never blocks or fails the redirect — a storage hiccup shouldn't
  // cost a visitor their download.
  await bumpCounter(`${type}:${slug}`);

  return {
    statusCode: 302,
    headers: { Location: target, 'Cache-Control': 'no-store' },
    body: '',
  };
}
