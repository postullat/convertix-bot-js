import axios from 'axios';

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 20000;

export class TwoCaptchaClient {
	constructor(apiKey) {
		this.apiKey = apiKey || process.env.TWOCAPTCHA_API_KEY;
		if (!this.apiKey) {
			throw new Error('TWOCAPTCHA_API_KEY is not set');
		}
	}

	async solveCloudflareTurnstile({ siteKey, url, action, data, pagedata, timeoutMs = DEFAULT_TIMEOUT_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, }) {
		try {
			const payload = {
				clientKey: this.apiKey,
				task: {
					type: 'TurnstileTaskProxyless',
					websiteURL: url,
					websiteKey: siteKey,
					action: action || undefined,
					data: data || undefined,
					pagedata: pagedata || undefined,
				},
			};

			const createResp = await axios.post('https://api.2captcha.com/createTask', payload, { timeout: 15000 });
			if (!createResp?.data?.taskId) {
				throw new Error(`Invalid createTask response: ${JSON.stringify(createResp?.data)}`);
			}
			const taskId = createResp.data.taskId;

			const start = Date.now();
			while (Date.now() - start < timeoutMs) {
				const res = await axios.get('https://2captcha.com/res.php', {
					params: { key: this.apiKey, action: 'get', id: taskId },
					timeout: 10000,
				});
				const text = typeof res.data === 'string' ? res.data : String(res.data);

				if (text === 'CAPCHA_NOT_READY') {
					await new Promise(r => setTimeout(r, pollIntervalMs));
					continue;
				}
				if (text.startsWith('OK|')) {
					return text.slice(3);
				}
				throw new Error(`2Captcha error: ${text}`);
			}

			throw new Error('Timeout waiting for 2Captcha token');
		} catch (err) {
			return null;
		}
	}

	async getBalance() {
		try {
			const res = await axios.get('https://2captcha.com/res.php', {
				params: { key: this.apiKey, action: 'getbalance' },
				timeout: 10000,
			});
			return (res.data ?? '').toString().trim();
		} catch (err) {
			return null;
		}
	}
}

// Helper to solve directly from an intercepted turnstile item structure
// Expected shape (from interceptor):
// { websiteKey, websiteURL, action, data, pagedata }
export async function solveFromInterceptedItem(interceptedItem, apiKey) {
	if (!interceptedItem) return null;
	const client = new TwoCaptchaClient(apiKey);
	return client.solveCloudflareTurnstile({
		siteKey: interceptedItem.websiteKey,
		url: interceptedItem.websiteURL,
		action: interceptedItem.action,
		data: interceptedItem.data,
		pagedata: interceptedItem.pagedata,
	});
}
