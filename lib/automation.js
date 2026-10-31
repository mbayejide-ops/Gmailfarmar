// lib/automation.js
const { chromium } = require('playwright-core');
const { generateDeviceProfile, getRandomProxy } = require('./config');

/**
 * Automates the creation of a Gmail account
 * @param {Object} params - { firstName, lastName, username, password, phone, birthYear, birthMonth, birthDay }
 * @returns {Object} - Result object with status and message
 */
export async function createGmailAccount(params) {
  const {
    firstName,
    lastName,
    username,
    password,
    phone,
    birthYear,
    birthMonth,
    birthDay
  } = params;

  const proxyUrl = getRandomProxy();
  const profile = generateDeviceProfile();

  console.log(`Using Proxy: ${proxyUrl}`);
  console.log(`Using UA: ${profile.userAgent}`);

  // Playwright Launch Options
  const launchOptions = {
    headless: true,
    args: [
      `--proxy-server=${proxyUrl}`,
      `--user-agent=${profile.userAgent}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  };

  // If using a proxy service that requires auth in URL, playwright handles it via --proxy-server
  // If your proxy requires separate auth, you might need to handle that differently or use 'proxy' object in newer playwright versions
  // For simplicity, we use args here.

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: profile.viewport,
    locale: profile.locale,
    timezoneId: profile.timezoneId,
    userAgent: profile.userAgent
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to Google Signup...");
    await page.goto('https://accounts.google.com/signup', { waitUntil: 'networkidle' });

    // 1. First Name
    await page.waitForSelector('input[aria-label="First name"]', { timeout: 10000 });
    await page.fill('input[aria-label="First name"]', firstName);
    
    // 2. Last Name
    await page.fill('input[aria-label="Last name"]', lastName);
    await page.click('button[aria-label="Next"]');

    // 3. Birth Date
    // Google uses select dropdowns for DOB in many regions. 
    // This part is fragile. If it fails, user might need to handle DOB manually or use a specific selector.
    await page.waitForTimeout(2000);
    
    // Attempting to select DOB. This might vary based on locale.
    // Assuming standard select elements
    try {
        // Select Month
        await page.selectOption('select[aria-label="Month"]', birthMonth);
        // Select Day
        await page.selectOption('select[aria-label="Day"]', birthDay);
        // Select Year
        await page.selectOption('select[aria-label="Year"]', birthYear);
    } catch (e) {
        console.log("DOB selection failed, might need manual adjustment or different selectors.");
    }

    await page.click('button[aria-label="Next"]');

    // 4. Username
    await page.waitForSelector('input[aria-label="Choose a username"]', { timeout: 10000 });
    await page.fill('input[aria-label="Choose a username"]', username);
    await page.click('button[aria-label="Next"]');

    // 5. Password
    await page.waitForSelector('input[aria-label="Create a password"]', { timeout: 10000 });
    await page.fill('input[aria-label="Create a password"]', password);
    await page.fill('input[aria-label="Confirm password"]', password);
    await page.click('button[aria-label="Next"]');

    // 6. Phone Number
    await page.waitForSelector('input[aria-label="Phone number"]', { timeout: 10000 });
    await page.fill('input[aria-label="Phone number"]', phone);
    await page.click('button[aria-label="Next"]');

    // 7. CAPTCHA Handling
    // This is the hardest part. In a production environment, you would integrate a CAPTCHA solver API here.
    // For this demo, we will wait for the user to solve it if headless is false, 
    // or we assume it passes if we are using high-quality residential proxies.
    // If headless is true, it will hang here until timeout if a CAPTCHA appears.
    
    console.log("Waiting for CAPTCHA/Verification...");
    
    // Wait for the "Next" button to be enabled again or the page to change
    // This is a heuristic. In a real app, you'd detect the reCAPTCHA iframe.
    await page.waitForFunction(() => {
        const nextBtn = document.querySelector('button[aria-label="Next"]');
        return nextBtn && !nextBtn.disabled;
    }, { timeout: 30000 }); // Wait up to 30s for verification to clear

    await page.click('button[aria-label="Next"]');

    // 8. Final Step
    // Usually lands on the dashboard or a "Finish" screen
    await page.waitForTimeout(5000);
    
    return {
        success: true,
        message: "Account creation process completed.",
        username: `@${username}`
    };

  } catch (error) {
    console.error("Automation Error:", error);
    return {
        success: false,
        message: `Error: ${error.message}`,
        username: `@${username}`
    };
  } finally {
    await browser.close();
  }
}
