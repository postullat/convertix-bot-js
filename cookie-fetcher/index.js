import 'dotenv/config'
import { chromium } from 'playwright-extra'

const USE_PROXY = process.env.USE_PROXY === 'true' || process.env.USE_PROXY === '1'
const proxyHost = process.env.PROXY_HOST || 'res.proxy-seller.com'
const proxyPort = process.env.PROXY_PORT || '10001'
const proxyUser = process.env.PROXY_USER || 'b02fa50863fc96e6'
const proxyPass = process.env.PROXY_PASS || 'b8tRlFYa'

async function run() {
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
      const masterToken = '22942ae7.oauth2v2_8715271296a46676020f5b37b379ea9d'
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
    await page.waitForTimeout(5000)
    // After page open (openLoginPage waits ~3s), dump HttpOnly cookies
    try {
      const allCookies = await context.cookies()
      const httpOnlyCookies = Array.isArray(allCookies) ? allCookies.filter(c => c && c.httpOnly) : []
      console.log('🍪 HttpOnly cookies count:', httpOnlyCookies.length)
      httpOnlyCookies.forEach(c => {
        try {
          console.log('🍪 HttpOnly cookie:', {
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            secure: c.secure,
            sameSite: c.sameSite,
            expires: c.expires,
          })
        } catch {}
      })
    } catch (e) {
      console.log('🍪 Failed to read HttpOnly cookies:', e?.message)
    }
  } catch (err) {
    console.error('❌ Playwright flow failed:', err?.message)
    throw err
  } finally {
    if (context) await context.close()
    if (browser) await browser.close()
  }
}

run().catch((e) => {
  console.error('💥 Script failed:', e?.stack || e)
})
