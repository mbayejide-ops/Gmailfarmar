// lib/config.js
import fs from "fs";
import path from "path";

// ---------- Built-in proxies (তোমার দেওয়া লিস্ট) ----------
const BUILTIN_PROXIES = [
  "http://185.22.188.198:80",
  "http://185.22.25.229:80",
  "http://185.100.87.106:80",
  "http://185.100.86.106:80",
  // 185.156.224.9 -> 185.156.224.72
  ...Array.from({ length: 64 }, (_, i) => `http://185.156.224.${i + 9}:80`),
];

// ---------- Proxy loading ----------
// অতিরিক্ত সোর্স: proxies.txt (প্রতি লাইনে একটা), env PROXY_LIST (কমা/নতুন লাইন)
// ফরম্যাট: http://user:pass@host:port | user:pass@host:port | host:port | host:port:user:pass
// দেশ চিহ্নিত করতে শুরুতে "US|" দেওয়া যায়। '#' = কমেন্ট।

const COUNTRY_RE = /(?:country|cc|region)[-_=]([a-z]{2})(?![a-z])/i;

function normalizeProxy(raw) {
  let line = raw.trim();
  if (!line || line.startsWith("#")) return null;

  let country = null;
  const prefix = line.match(/^([A-Za-z]{2})\|(.+)$/);
  if (prefix) {
    country = prefix[1].toUpperCase();
    line = prefix[2].trim();
  }

  let url = null;
  if (/^(https?|socks[45]):\/\//i.test(line)) {
    url = line;
  } else if (line.includes("@")) {
    url = `http://${line}`;
  } else {
    const parts = line.split(":");
    if (parts.length === 2) url = `http://${parts[0]}:${parts[1]}`;
    else if (parts.length === 4) {
      const [host, port, user, pass] = parts;
      url = `http://${user}:${pass}@${host}:${port}`;
    }
  }
  if (!url) return null;

  if (!country) {
    const m = url.match(COUNTRY_RE);
    if (m) country = m[1].toUpperCase();
  }
  return { url, country };
}

function loadProxies() {
  const raw = [...BUILTIN_PROXIES];

  if (process.env.PROXY_LIST) {
    raw.push(...process.env.PROXY_LIST.split(/[,\r\n]+/));
  }

  const file = path.join(process.cwd(), "proxies.txt");
  if (fs.existsSync(file)) {
    raw.push(...fs.readFileSync(file, "utf8").split(/\r?\n/));
  }

  const seen = new Set();
  const out = [];
  for (const r of raw) {
    const p = normalizeProxy(r);
    if (p && !seen.has(p.url)) {
      seen.add(p.url);
      out.push(p);
    }
  }
  return out;
}

const LOADED = loadProxies();

export const PROXY_POOL = LOADED.map((p) => p.url);
export const PROXY_COUNTRY = new Map(
  LOADED.filter((p) => p.country).map((p) => [p.url, p.country])
);
export const USE_DIRECT = PROXY_POOL.length === 0;

console.log(
  USE_DIRECT
    ? "[config] কোনো প্রক্সি নেই, Direct কানেকশন ব্যবহার হবে।"
    : `[config] ${PROXY_POOL.length}টি প্রক্সি লোড হয়েছে।`
);

// ---------- Proxy health tracking ----------
const MAX_FAILS = 2;                 // ২ বার ফেইল করলেই ব্যান (ফ্রি প্রক্সি তাড়াতাড়ি মরে)
const COOLDOWN_MS = 30 * 60 * 1000;  // ৩০ মিনিট

const failCount = new Map();
const bannedUntil = new Map();

export function markProxyFailed(proxy) {
  if (!proxy) return;
  const n = (failCount.get(proxy) || 0) + 1;
  failCount.set(proxy, n);
  if (n >= MAX_FAILS) {
    bannedUntil.set(proxy, Date.now() + COOLDOWN_MS);
    failCount.set(proxy, 0);
  }
}

export function markProxyOk(proxy) {
  if (proxy) failCount.set(proxy, 0);
}

export function getRandomProxy() {
  if (USE_DIRECT) return null;
  const now = Date.now();
  const alive = PROXY_POOL.filter((p) => (bannedUntil.get(p) || 0) <= now);
  const pool = alive.length ? alive : PROXY_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------- Device profiles ----------
const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const CHROME_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15";

const UAS = [CHROME_WIN, CHROME_LINUX, SAFARI_MAC];
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
];

const COUNTRY_INFO = {
  US: { timezones: ["America/New_York", "America/Chicago", "America/Los_Angeles"], locale: "en-US" },
  CA: { timezones: ["America/Toronto", "America/Vancouver"], locale: "en-CA" },
  GB: { timezones: ["Europe/London"], locale: "en-GB" },
  DE: { timezones: ["Europe/Berlin"], locale: "de-DE" },
  FR: { timezones: ["Europe/Paris"], locale: "fr-FR" },
  NL: { timezones: ["Europe/Amsterdam"], locale: "nl-NL" },
  IN: { timezones: ["Asia/Kolkata"], locale: "en-IN" },
  BD: { timezones: ["Asia/Dhaka"], locale: "bn-BD" },
  SG: { timezones: ["Asia/Singapore"], locale: "en-SG" },
  AU: { timezones: ["Australia/Sydney", "Australia/Melbourne"], locale: "en-AU" },
  JP: { timezones: ["Asia/Tokyo"], locale: "ja-JP" },
  BR: { timezones: ["America/Sao_Paulo"], locale: "pt-BR" },
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const DEVICE_PROFILES = [
  { userAgent: CHROME_WIN, viewport: VIEWPORTS[0], timezone: "America/New_York", locale: "en-US" },
  { userAgent: SAFARI_MAC, viewport: VIEWPORTS[1], timezone: "Europe/London", locale: "en-GB" },
  { userAgent: CHROME_LINUX, viewport: VIEWPORTS[2], timezone: "Asia/Kolkata", locale: "en-IN" },
];

export function getRandomDeviceProfile() {
  return pick(DEVICE_PROFILES);
}

export function getDeviceProfileForCountry(country) {
  const info = country && COUNTRY_INFO[country.toUpperCase()];
  if (!info) return getRandomDeviceProfile();
  return {
    userAgent: pick(UAS),
    viewport: pick(VIEWPORTS),
    timezone: pick(info.timezones),
    locale: info.locale,
  };
}

// ---------- এক কলে প্রক্সি + মানানসই প্রোফাইল ----------
export function getSession() {
  const proxy = getRandomProxy();
  const country = proxy ? PROXY_COUNTRY.get(proxy) || null : null;
  const profile = country ? getDeviceProfileForCountry(country) : getRandomDeviceProfile();
  return { proxy, country, profile };
  }
