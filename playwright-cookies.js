import 'dotenv/config'
import { chromium } from 'playwright-extra'

const USE_PROXY = true
const proxyHost = 'res.proxy-seller.com'
const proxyPort = '10001'
const proxyUser = 'b02fa50863fc96e6'
const proxyPass = 'b8tRlFYa'
const masterToken = '22942ae7.oauth2v2_8715271296a46676020f5b37b379ea9d'

async function getOAuth2v2Cookies() {
  let browser
  let context
  try {
    const launchOptions = {
      headless: false,
      args: [
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-web-security',
      ],
    }

    browser = await chromium.launch(launchOptions)

    const contextOptions = {
      ...(USE_PROXY && {
        proxy: {
          server: `http://${proxyHost}:${proxyPort}`,
          username: proxyUser,
          password: proxyPass,
        },
      }),
    }

    context = await browser.newContext(contextOptions)
    const page = await context.newPage()

    await context.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    })

    // Pre-seed Upwork master token cookie
    try {
      if (masterToken) {
        const expires = Math.floor(Date.now() / 1000) + 7 * 24 * 3600
        await context.addCookies([{
          name: 'master_access_token', value: String(masterToken), domain: '.upwork.com', path: '/',
          httpOnly: false, secure: true, sameSite: 'None', expires
        }])
        console.log('🔑 master_access_token cookie set for .upwork.com')
      } else {
        console.log('ℹ️ UPWORK_MASTER_TOKEN is not set; skipping master_access_token cookie')
      }
    } catch (e) {
      console.log('⚠️ Failed to set master_access_token cookie:', e?.message)
    }

    await page.goto('https://www.upwork.com/ab/account-security/login')
    await page.waitForTimeout(3000)

    // Get all cookies and filter those with oauth2v2 values
    try {
      const allCookies = await context.cookies()
      const oauth2v2Cookies = Array.isArray(allCookies)
          ? allCookies.filter(c => c && c.value && c.value.startsWith('oauth2v2'))
          : []

      console.log('🍪 OAuth2v2 cookies count:', oauth2v2Cookies.length)
      oauth2v2Cookies.forEach(c => {
        try {
          const expiresAt = c.expires
              ? new Date(c.expires * 1000).toString() // convert seconds → ms
              : "Session (no expiration)";

          console.log("🍪 OAuth2v2 cookie:", {
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            secure: c.secure,
            sameSite: c.sameSite,
            expires: c.expires,        // original number
            expiresReadable: expiresAt // human readable
          });
        } catch {}
      });


      return oauth2v2Cookies
    } catch (e) {
      console.log('🍪 Failed to read cookies:', e?.message)
      return []
    }
  } catch (err) {
    console.error('❌ Playwright flow failed:', err?.message)
    throw err
  } finally {
    if (context) await context.close()
    if (browser) await browser.close()
  }
}

async function playwrightCookies() {
  try {
    console.log('🔍 Starting cookie fetch...')
    const cookies = await getOAuth2v2Cookies()
    console.log('✅ Found cookies:', cookies)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

playwrightCookies()