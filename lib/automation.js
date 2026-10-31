// lib/automation.js
const { chromium } = require('playwright-core');
const { getRandomProxy, getRandomDeviceProfile } = require('./config');

export async function createGmailAccount(params) {
  const {
    firstName,
    lastName,
    username,
    password
    // phone is optional now
  } = params;

  const proxyUrl = getRandomProxy();
  const deviceProfile = getRandomDeviceProfile();

  console.log(`Using Proxy: ${proxyUrl || 'Direct Connection'}`);
  console.log(`Using Device: ${deviceProfile.userAgent}`);

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--user-agent=${deviceProfile.userAgent}`
    ]
  };

  // If proxy is provided, add it to args
  if (proxyUrl) {
    launchOptions.args.push(`--proxy-server=${proxyUrl}`);
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: deviceProfile.viewport,
    locale: deviceProfile.locale,
    timezoneId: deviceProfile.timezone,
    userAgent: deviceProfile.userAgent
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
    // Google uses select dropdowns. We need to wait for them.
    await page.waitForTimeout(2000);
    
    // Try to select DOB. If it fails, it might mean the layout changed.
    try {
        // Assuming standard select elements
        // Note: Month/Day/Year values should be strings
        const birthMonth = params.birthMonth || "01";
        const birthDay = params.birthDay || "01";
        const birthYear = params.birthYear || "1990";
        
        await page.selectOption('select[aria-label="Month"]', birthMonth);
        await page.selectOption('select[aria-label="Day"]', birthDay);
        await page.selectOption('select[aria-label="Year"]', birthYear);
    } catch (e) {
        console.log("DOB selection skipped or failed, proceeding anyway.");
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

    // 6. Phone Number Step (The Critical Part)
    await page.waitForTimeout(2000);
    
    // Check if phone input is visible
    const phoneInput = await page.$('input[aria-label="Phone number"]');
    
    if (phoneInput) {
        console.log("Phone input detected. Attempting to skip or bypass...");
        
        // Strategy 1: Try to click "Next" directly (Sometimes works if previous steps were strong)
        const nextButton = await page.$('button[aria-label="Next"]');
        if (nextButton) {
            await nextButton.click();
            await page.waitForTimeout(2000);
            
            // Check if we are still on phone step
            const stillOnPhoneStep = await page.$('input[aria-label="Phone number"]');
            if (!stillOnPhoneStep) {
                console.log("Successfully skipped phone step!");
            } else {
                // Strategy 2: If skip failed, enter a dummy number
                console.log("Skip failed. Entering dummy number to proceed...");
                // Use a random US number format
                const dummyPhone = `+1555${Math.floor(10000000 + Math.random() * 89999999)}`;
                await page.fill('input[aria-label="Phone number"]', dummyPhone);
                await page.click('button[aria-label="Next"]');
            }
        }
    } else {
        console.log("No phone input detected. Proceeding...");
        // Click next if available
        const nextButton = await page.$('button[aria-label="Next"]');
        if (nextButton) {
            await nextButton.click();
        }
    }

    // 7. CAPTCHA Handling
    // Wait for the page to stabilize
    await page.waitForTimeout(3000);
    
    // If CAPTCHA appears, it will be visible. 
    // In a production environment, you'd integrate a CAPTCHA solver here.
    // For now, we assume the proxy is clean enough to pass CAPTCHA.
    
    // Check if we reached the final success screen or dashboard
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    if (currentUrl.includes('myaccount') || currentUrl.includes('dashboard')) {
        return {
            success: true,
            message: "Account created successfully!",
            username: `@${username}`
        };
    } else {
        // Check for any error messages
        const errorText = await page.$eval('div[role="alert"]', el => el.innerText).catch(() => null);
        return {
            success: false,
            message: errorText || "Process completed but final verification status unknown. Check logs.",
            username: `@${username}`
        };
    }

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
