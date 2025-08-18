import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { solveFromInterceptedItem } from './turnstile-solver.js';

const stealth = StealthPlugin();
// Disable specific evasions per user request
try { stealth.enabledEvasions.delete('webgl'); } catch {}
try { stealth.enabledEvasions.delete('chrome.runtime'); } catch {}
puppeteer.use(stealth);

// Proxy configuration
const USE_PROXY = process.env.USE_PROXY === 'true' || process.env.USE_PROXY === '1';
const proxyHost = process.env.PROXY_HOST || 'res.proxy-seller.com';
const proxyPort = process.env.PROXY_PORT || '10001';
const proxyUser = process.env.PROXY_USER || 'b02fa50863fc96e6';
const proxyPass = process.env.PROXY_PASS || 'b8tRlFYa';

// Persistent profile directory (stores cookies, localStorage, cache, etc.)
const USER_DATA_DIR = process.env.PUPPETEER_USER_DATA_DIR || path.resolve('./.puppeteer-profile');

// Login credentials (can be overridden via .env)
const LOGIN_EMAIL = process.env.UPWORK_LOGIN_EMAIL || 'panchyshyn33@gmail.com';
const LOGIN_PASSWORD = process.env.UPWORK_LOGIN_PASSWORD || 'Sobaka!PesKissAss';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Turnstile interceptor function
async function injectTurnstileInterceptor(page) {
  const turnstileScript = `
    window.turnstileInterceptedData = [];
    
    window.turnstileScriptLoaded = true;
    window.turnstileScriptTimestamp = new Date().toISOString();
    
    function interceptTurnstile() {
        if (window.turnstile) {
            console.log('[TURNSTILE] Found turnstile object, intercepting...');
            
            const originalRender = window.turnstile.render;
            
            window.turnstile.render = function(a, b) {
                console.log('[TURNSTILE] Render called with:', a, b);
                
                let p = {
                    type: "TurnstileTaskProxyless",
                    websiteKey: b.sitekey,
                    websiteURL: window.location.href,
                    data: b.cData,
                    pagedata: b.chlPageData,
                    action: b.action,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
                
                console.log('[TURNSTILE] Intercepted data:', p);
                window.turnstileInterceptedData.push(p);
                
                window.tsCallback = b.callback;

                if (originalRender) {
                    return originalRender.call(this, a, b);
                } else {
                    return 'foo';
                }
            }
            
            window.turnstileIntercepted = true;
            console.log('[TURNSTILE] Interceptor activated successfully');
        } else {
            console.log('[TURNSTILE] Turnstile object not found, retrying...');
            setTimeout(interceptTurnstile, 100);
        }
    }
    
    // Try to intercept immediately
    interceptTurnstile();
    
    // Also set up interval to catch late-loading turnstile
    const interval = setInterval(() => {
        if (window.turnstile && !window.turnstileIntercepted) {
            console.log('[TURNSTILE] Late detection, activating interceptor...');
            window.turnstileIntercepted = true;
            clearInterval(interval);
            interceptTurnstile();
        }
    }, 100);
    
    // Fallback if no turnstile found after 10 seconds
    setTimeout(() => {
        if (!window.turnstileIntercepted) {
            console.log('[TURNSTILE] No turnstile found, adding fallback data');
            window.turnstileInterceptedData = [{
                type: "TurnstileTaskProxyless",
                websiteKey: "NOT_FOUND",
                websiteURL: window.location.href,
                data: "NOT_FOUND",
                pagedata: "NOT_FOUND", 
                action: "NOT_FOUND",
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                note: "Turnstile object not found on this page"
            }];
            window.turnstileIntercepted = true;
        }
    }, 10000);
  `;
  
  try {
    // Register script to run before every new document
    await page.evaluateOnNewDocument((script) => {
      try { eval(script); } catch (e) { console.log('[TURNSTILE] evaluateOnNewDocument eval error:', e.message); }
    }, turnstileScript);
    console.log('[TURNSTILE INTERCEPTOR] Script registered via evaluateOnNewDocument');
    
    // Also execute immediately for current page context
    await page.evaluate(turnstileScript);
    console.log('[TURNSTILE INTERCEPTOR] Script executed immediately');
    
  } catch (e) {
    console.log(`[TURNSTILE INTERCEPTOR] Error registering script: ${e.message}`);
    // Fallback to evaluate only
    try {
      await page.evaluate(turnstileScript);
      console.log('[TURNSTILE INTERCEPTOR] Script executed via evaluate fallback');
    } catch (e2) {
      console.log(`[TURNSTILE INTERCEPTOR] Fallback also failed: ${e2.message}`);
    }
  }
}

await delay(4000);

// Get turnstile intercepted data function
async function getTurnstileInterceptedData(page) {
  try {
    // Check script status with more detailed info
    const scriptStatus = await page.evaluate(() => {
      return {
        scriptLoaded: typeof window.turnstileScriptLoaded !== 'undefined' ? window.turnstileScriptLoaded : false,
        scriptTimestamp: typeof window.turnstileScriptTimestamp !== 'undefined' ? window.turnstileScriptTimestamp : null,
        hasData: typeof window.turnstileInterceptedData !== 'undefined',
        dataLength: window.turnstileInterceptedData ? window.turnstileInterceptedData.length : 0,
        intercepted: typeof window.turnstileIntercepted !== 'undefined' ? window.turnstileIntercepted : false,
        // Additional debugging
        turnstileExists: typeof window.turnstile !== 'undefined',
        turnstileRenderExists: window.turnstile && typeof window.turnstile.render !== 'undefined',
        currentUrl: window.location.href,
        pageTitle: document.title,
        // Check if data array exists and is accessible
        dataArrayType: typeof window.turnstileInterceptedData,
        dataArrayLength: Array.isArray(window.turnstileInterceptedData) ? window.turnstileInterceptedData.length : 'not array'
      };
    });
    
    console.log(`[TURNSTILE INTERCEPTOR] Script status:`, scriptStatus);
    
    if (scriptStatus.scriptLoaded) {
      console.log(`[TURNSTILE INTERCEPTOR] Script loaded at: ${scriptStatus.scriptTimestamp}`);
      console.log(`[TURNSTILE INTERCEPTOR] Current page: ${scriptStatus.pageTitle} (${scriptStatus.currentUrl})`);
      console.log(`[TURNSTILE INTERCEPTOR] Turnstile object exists: ${scriptStatus.turnstileExists}`);
      console.log(`[TURNSTILE INTERCEPTOR] Turnstile render function exists: ${scriptStatus.turnstileRenderExists}`);
      console.log(`[TURNSTILE INTERCEPTOR] Data array type: ${scriptStatus.dataArrayType}, length: ${scriptStatus.dataArrayLength}`);
      
      if (scriptStatus.hasData) {
        // Try to get the data directly
        const interceptedData = await page.evaluate(() => {
          if (window.turnstileInterceptedData && Array.isArray(window.turnstileInterceptedData)) {
            return window.turnstileInterceptedData;
          } else {
            console.log('[TURNSTILE] turnstileInterceptedData is not an array or undefined');
            return [];
          }
        });
        
        console.log(`[TURNSTILE INTERCEPTOR] Retrieved ${interceptedData.length} items`);
        

        console.log(`🔍 Intercepted Data: ${JSON.stringify(interceptedData, null, 2)}`);
        return interceptedData;
      } else {
        console.log("[TURNSTILE INTERCEPTOR] turnstileInterceptedData not found");
        return [];
      }
    } else {
      console.log("[TURNSTILE INTERCEPTOR] Script not loaded yet");
      return [];
    }
  } catch (e) {
    console.log(`[TURNSTILE INTERCEPTOR] Error getting intercepted data: ${e.message}`);
    console.log(`[TURNSTILE INTERCEPTOR] Error stack: ${e.stack}`);
    return [];
  }
}

async function checkProxyConnection(page) {
  if (!USE_PROXY) {
    console.log('🔌 Proxy is disabled, skipping connection check');
    return true;
  }

  try {
    console.log('🔍 Checking proxy connection...');
    await page.goto('https://api.ipify.org?format=json', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    const ipText = await page.$eval('pre', el => el.textContent);
    const ipData = JSON.parse(ipText);
    
    console.log(`✅ Proxy works. IP: ${ipData.ip}`);
    return true;
  } catch (err) {
    console.error(`❌ Proxy check failed: ${err.message}`);
    return false;
  }
}

async function authenticateWithUpwork() {
  let browser;
  
  try {
    // Browser launch options (persistent profile)
    const launchOptions = {
      headless: false, // Set to true for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      userDataDir: USER_DATA_DIR,
      defaultViewport: null
    };

    // Optional: use a real Chrome executable if provided
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    }

    // Add proxy if enabled
    if (USE_PROXY) {
      launchOptions.args.push(`--proxy-server=${proxyHost}:${proxyPort}`);
    }

    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log(`🗂️ Using persistent profile at: ${USER_DATA_DIR}`);
    
    const page = await browser.newPage();
    

    // Anti-detection overrides before any navigation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });
    
    // Set viewport to Full HD resolution
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36');
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    // Authenticate proxy if enabled
    if (USE_PROXY) {
      await page.authenticate({
        username: proxyUser,
        password: proxyPass
      });
    }

    // Check proxy connection
    const proxyOk = await checkProxyConnection(page);
    if (!proxyOk) {
      throw new Error('Proxy connection failed');
    }

    // Helper: attempt the login steps once
    const loginOnce = async () => {
      await page.goto('https://www.upwork.com/ab/account-security/login', { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForSelector('#login_username', { visible: true, timeout: 30000 });
      await page.click('#login_username', { delay: 50 });
      await page.type('#login_username', LOGIN_EMAIL, { delay: 50 });
      await page.click('#login_password_continue');
      await page.waitForSelector('#login_password', { visible: true, timeout: 30000 });
      await page.click('#login_password', { delay: 50 });
      await page.type('#login_password', LOGIN_PASSWORD, { delay: 60 });
      await page.click('#login_control_continue');
      // wait for possible navigation or server-side checks
      try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }); } catch {}
      await delay(1000);
      return !page.url().includes('/ab/account-security/login');
    };

    // Step 0: Perform login flow with retry if needed (solve captcha on failure)
    console.log('🔐 Logging into Upwork...');
    await injectTurnstileInterceptor(page);
    let loggedIn = false;
    try {
      loggedIn = await loginOnce();
      if (!loggedIn) {
        console.log('⚠️ Login not successful, checking for Turnstile...');
        const intercepted = await getTurnstileInterceptedData(page);
        if (intercepted.length > 0) {
          const token = await solveFromInterceptedItem(intercepted[0]);
          if (token) {
            await page.evaluate((t) => { if (typeof window.tsCallback === 'function') window.tsCallback(t); }, token);
            await delay(1000);
            console.log('🔁 Retrying login after solving Turnstile...');
            loggedIn = await loginOnce();
          } else {
            console.log('❌ Could not obtain Turnstile token');
          }
        } else {
          console.log('ℹ️ No Turnstile data intercepted during login');
        }
      }
      console.log(loggedIn ? '✅ Login successful' : '⚠️ Login still unsuccessful');
    } catch (e) {
      console.log('⚠️ Login flow encountered an issue:', e.message);
    }

    // Step 1: Visit homepage first to get initial cookies
    console.log('Step 1: Visiting homepage...');
    
    // Inject turnstile interceptor BEFORE visiting the page
    await injectTurnstileInterceptor(page);
    
    // try {
    //   await page.goto('https://www.upwork.com/', { 
    //     waitUntil: 'networkidle0',
    //     timeout: 30000 
    //   });
      
    //   console.log('✅ Homepage loaded successfully');
      
      // Show current URL and title
    //   const currentUrl = page.url();
    //   const currentTitle = await page.title();
    //   console.log(`📍 Current URL: ${currentUrl}`);
    //   console.log(`📄 Current title: ${currentTitle}`);
      
    // } catch (err) {
    //   console.log('⚠️ Homepage load had issues, but continuing...');
    //   console.log('Error details:', err.message);
    // }

    // Small delay to mimic human behavior
    console.log('⏳ Waiting 2 seconds...');
    await delay(1000);

    // Step 2: Set the master access token cookie
    console.log('Step 2: Setting authentication cookie...');
    const masterToken = process.env.UPWORK_MASTER_TOKEN || '22942ae7.oauth2v2_ceab6b5298fa3630844467570bd3a5f2';
    
    try {
      await page.setCookie({
        name: 'master_access_token',
        value: masterToken,
        domain: '.upwork.com',
        path: '/'
      });
      console.log('✅ Cookie set successfully');
      
      // Verify cookie was set
      const cookies = await page.cookies();
      const masterCookie = cookies.find(c => c.name === 'master_access_token');
      if (masterCookie) {
        console.log('🔍 Cookie verification: master_access_token found');
      } else {
        console.log('⚠️ Cookie verification: master_access_token NOT found');
      }
      
    } catch (err) {
      console.log('⚠️ Cookie setting had issues:', err.message);
    }

    // Step 3: Navigate to best matches page
    console.log('Step 3: Navigating to best matches...');
    console.log('🎯 Target URL: https://www.upwork.com/nx/find-work/best-matches');
    
    // Inject turnstile interceptor BEFORE visiting the page
    await injectTurnstileInterceptor(page);
    
    try {
      console.log('🔄 Starting navigation...');
      await page.goto('https://www.upwork.com/nx/find-work/best-matches', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      console.log('✅ Best matches page loaded successfully');
      
      // Show final URL and title
      const finalUrl = page.url();
      const finalTitle = await page.title();
      console.log(`📍 Final URL: ${finalUrl}`);
      console.log(`📄 Final title: ${finalTitle}`);
      
    } catch (err) {
      console.log('❌ Best matches page load failed');
      console.log('Error details:', err.message);
      
      // Try to get current page info even if navigation failed
      try {
        const currentUrl = page.url();
        const currentTitle = await page.title();
        console.log(`📍 Current URL after failed navigation: ${currentUrl}`);
        console.log(`📄 Current title after failed navigation: ${currentTitle}`);
      } catch (e) {
        console.log('Could not get current page info');
      }
      
      throw new Error(`Failed to navigate to best matches: ${err.message}`);
    }

    // Wait for content to load
    console.log('⏳ Waiting 5 seconds for content to load...');
    await delay(2000);

    // Simulate human behavior
    console.log('🤖 Simulating human behavior...');
    
    try {
      // Get page dimensions for scrolling
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      
      console.log(`📏 Page height: ${pageHeight}px, Viewport height: ${viewportHeight}px`);
      
      // Random mouse movements
      console.log('🖱️ Simulating mouse movements...');
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * 800) + 100;
        const y = Math.floor(Math.random() * 400) + 100;
        await page.mouse.move(x, y);
        await delay(Math.random() * 500 + 200); // Random delay 200-700ms
      }
      
      // Scroll down slowly like a human
      console.log('📜 Scrolling down slowly...');
      const scrollSteps = 8;
      const scrollAmount = Math.min(pageHeight - viewportHeight, 2000) / scrollSteps;
      
    //   for (let i = 0; i < scrollSteps; i++) {
    //     await page.evaluate((amount) => {
    //       window.scrollBy(0, amount);
    //     }, scrollAmount);
    //     await delay(Math.random() * 800 + 400); // Random delay 400-1200ms
    //   }
      
    //   // Scroll back up a bit
    //   console.log('📜 Scrolling back up...');
    //   await page.evaluate(() => {
    //     window.scrollBy(0, -500);
    //   });
    //   await delay(1000);
      
      // Move mouse to some elements (if they exist)
      console.log('🔍 Moving mouse to page elements...');
      try {
        // Try to find and hover over some common elements
        const selectors = [
          'h1', 'h2', 'h3', 
          'a[href*="job"]', 
          'button', 
          '.job-tile', 
          '[data-test="job-tile"]',
          '.up-card',
          '.up-skill-badge'
        ];
        
        for (const selector of selectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              await element.hover();
              console.log(`✅ Hovered over: ${selector}`);
              await delay(Math.random() * 600 + 300);
              break; // Found and hovered over one element
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      } catch (e) {
        console.log('⚠️ Could not hover over elements');
      }
      
    //   // Random pause like human reading
    //   console.log('📖 Simulating reading pause...');
    //   await delay(Math.random() * 2000 + 1500); // 1.5-3.5 seconds
      
    //   // Move mouse to center and click (like selecting text)
    //   console.log('👆 Simulating text selection...');
    //   await page.mouse.move(400, 300);
    //   await delay(500);
    //   await page.mouse.down();
    //   await page.mouse.move(600, 300);
    //   await page.mouse.up();
    //   await delay(1000);
      
      console.log('✅ Human behavior simulation completed');
      
    } catch (err) {
      console.log('⚠️ Human behavior simulation had issues:', err.message);
    }

    // Check for turnstile intercepted data
    console.log('🔍 Checking for turnstile intercepted data...');
    const turnstileData = await getTurnstileInterceptedData(page);
    
    if (turnstileData.length > 0) {
      const token = await solveFromInterceptedItem(turnstileData[0]);

      console.log(`🔍 Token: ${token}`);
      if (token) {
        await page.evaluate((t) => {
          if (typeof window.tsCallback === 'function') {
            console.log(`🔍 Applying turnstile ${t} to the page`);
            window.tsCallback(t);
          }
        }, token);
        await delay(1000);
        console.log('✅ Turnstile token applied');
      } else {
        console.log('❌ Failed to solve Turnstile');
      }
    } else {
      console.log('ℹ️ No turnstile data intercepted on this page');
    }

    // Check if we got blocked or got content
    const pageTitle = await page.title();
    const pageUrl = page.url();
    
    console.log('📄 Final page title:', pageTitle);
    console.log('🔗 Final page URL:', pageUrl);

    // Check for error pages or blocks
    if (pageTitle.includes('Access Denied') || pageTitle.includes('Blocked') || pageUrl.includes('blocked')) {
      console.error('❌ Access denied or blocked');
      throw new Error('Access denied or blocked by Upwork');
    }

    // Get page content and screenshot
    console.log('📄 Getting page content and screenshot...');
    await page.screenshot({ path: 'upwork-page.png', fullPage: true });
    console.log('📸 Screenshot saved as upwork-page.png');
    const htmlContent = await page.content();
    console.log('✅ Page content retrieved');
    
    // Try to extract JSON data if it's available
    let jobsData = null;
    try {
      console.log('🔍 Looking for JSON data in page...');
      // Look for JSON data in the page
      const jsonScripts = await page.$$eval('script[type="application/json"]', scripts => 
        scripts.map(script => script.textContent)
      );
      
      console.log(`Found ${jsonScripts.length} JSON scripts`);
      
      for (const script of jsonScripts) {
        try {
          const data = JSON.parse(script);
          if (data && (data.jobs || data.data || data.results)) {
            jobsData = data;
            console.log('✅ Jobs data found in JSON script');
            break;
          }
        } catch (e) {
          // Continue to next script
        }
      }
    } catch (e) {
      console.log('No JSON data found in page');
    }

    console.log('✅ Successfully loaded page');
    console.log('📊 Jobs data found:', jobsData ? 'Yes' : 'No');
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
    console.log('💡 You can now manually check the page in the browser');
    await delay(30000);
    
    return {
      html: htmlContent,
      jobs: jobsData,
      title: pageTitle,
      url: pageUrl
    };

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
    }
  }
}

await delay(40000);
// Main execution
console.log(`🚀 Starting Puppeteer script... Proxy is ${USE_PROXY ? 'enabled' : 'disabled'}`);

authenticateWithUpwork()
  .then(data => {
    console.log('📋 Script completed successfully!');
    console.log('📄 Page title:', data.title);
    console.log('🔗 Final URL:', data.url);
    if (data.jobs) {
      console.log('💼 Jobs data extracted:', Object.keys(data.jobs));
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error.message);
    console.error('Stack trace:', error.stack);
  });