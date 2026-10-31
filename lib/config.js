// lib/config.js

// এখানে তোমার Residential Proxy লিংকগুলো যোগ করো
// ফরম্যাট: protocol://username:password@host:port
export const PROXY_LIST = [
  "http://user1:pass1@proxy-provider.com:8000",
  "http://user2:pass2@proxy-provider.com:8001",
  "http://user3:pass3@proxy-provider.com:8002",
  // এখানে তোমার নিজস্ব প্রক্সি লিংকগুলো বসাও
];

// র‍্যান্ডম ডিভাইস ফিঙ্গারপ্রিন্ট জেনারেট করার জন্য ডেটা
export const USER_AGENTS = [
  // Windows Chrome
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  // Mac Safari
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15",
  // Android Chrome
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Mobile Safari/537.36",
  // iPhone Safari
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
];

export const TIMEZONES = [
  "America/New_York",
  "Europe/London",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC"
];

export const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 375, height: 667 }, // Mobile
  { width: 414, height: 896 }  // Mobile
];

export function getRandomProxy() {
  const index = Math.floor(Math.random() * PROXY_LIST.length);
  return PROXY_LIST[index];
}

export function generateDeviceProfile() {
  return {
    userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    timezoneId: TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)],
    viewport: VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)],
    locale: "en-US"
  };
}
