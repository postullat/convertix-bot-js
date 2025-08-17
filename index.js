import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

const jar = new CookieJar();
const client = wrapper(axios.create({ 
  jar,
  timeout: 30000,
  maxRedirects: 5
}));

async function authenticateWithUpwork() {
  try {
    // Step 1: Visit homepage first to get initial cookies
    console.log('Step 1: Visiting homepage...');
    await client.get('https://www.upwork.com/', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    // Small delay to mimic human behavior
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Now make the actual request with your master token
    console.log('Step 2: Making authenticated request...');
    const response = await client.get('https://www.upwork.com/nx/find-work/best-matches', {
      headers: {
        "Cookie": "master_access_token=a6a18f89.oauth2v2_0edb0dbf6ce3eb634d8dc8a3016260b2",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.upwork.com/nx/find-work/",
        "X-Requested-With": "XMLHttpRequest", // Important for AJAX requests
        "DNT": "1",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
      }
    });
    
    console.log('Success! Status:', response.status);
    console.log('Set-Cookie headers:', response.headers['set-cookie']);
    return response.data;
  } catch (error) {
    console.error('Request failed:', error.response?.status);
    if (error.response?.status === 403) {
      console.error('Possible reasons for 403:');
      console.error('1. Invalid or expired master_access_token');
      console.error('2. IP-based rate limiting');
      console.error('3. Missing CSRF token or session cookies');
      console.error('4. Cloudflare protection triggered');
    }
    throw error;
  }
}

authenticateWithUpwork();