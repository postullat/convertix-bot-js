import { getOAuth2v2Cookies } from './cookie-fetcher/index.js'

async function testCookies() {
  try {
    console.log('🔍 Starting cookie fetch...')
    const cookies = await getOAuth2v2Cookies()
    console.log('✅ Found cookies:', cookies)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testCookies()