import fs from 'fs';
import fetchBase from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import FileCookieStore from 'tough-cookie-file-store';
import crypto from 'crypto';
const jar = new CookieJar(new FileCookieStore('./cookies.json'));
const fetch = fetchCookie(fetchBase, jar);
const LOGIN_URL = 'https://challenge.sunvoy.com/login';
const USERS_API = 'https://challenge.sunvoy.com/api/users';
const TOKENS_PAGE = 'https://challenge.sunvoy.com/settings/tokens';
const SETTINGS_API = 'https://api.challenge.sunvoy.com/api/settings';
const CREDENTIALS = {
    username: 'demo@example.org',
    password: 'test',
};
function createSignedRequest(data) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = {
        ...data,
        timestamp,
    };
    const sortedString = Object.keys(payload)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(payload[key])}`)
        .join('&');
    const hmac = crypto.createHmac('sha1', 'mys3cr3t');
    hmac.update(sortedString);
    const checkcode = hmac.digest('hex').toUpperCase();
    const fullPayload = `${sortedString}&checkcode=${checkcode}`;
    return { fullPayload, timestamp };
}
function extractHiddenInputs(html) {
    const tokens = {};
    const inputRegex = /<input[^>]+id="([^"]+)"[^>]+value="([^"]+)"[^>]*>/g;
    let match;
    while ((match = inputRegex.exec(html)) !== null) {
        const [, id, value] = match;
        tokens[id] = value;
    }
    return tokens;
}
async function fetchNonce() {
    const res = await fetch(LOGIN_URL);
    const html = await res.text();
    const match = html.match(/name="nonce" value="(.+?)"/);
    if (!match)
        throw new Error('Nonce not found');
    return match[1];
}
async function login() {
    const nonce = await fetchNonce();
    const form = new URLSearchParams({
        nonce,
        username: CREDENTIALS.username,
        password: CREDENTIALS.password,
    });
    const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        redirect: 'manual',
    });
    if (res.status !== 302)
        throw new Error(`Login failed: ${res.status}`);
    const cookies = await jar.getCookies(LOGIN_URL);
    for (const cookie of cookies) {
        const clone = cookie.clone?.();
        if (clone) {
            clone.domain = 'api.challenge.sunvoy.com';
            await jar.setCookie(clone.toString(), 'https://api.challenge.sunvoy.com');
        }
    }
    console.log(' Login successful and cookies forwarded to API domain.');
}
async function fetchUsers() {
    const res = await fetch(USERS_API, { method: 'POST' });
    if (!res.ok)
        throw new Error(`Failed to fetch users: ${res.status}`);
    const data = (await res.json());
    console.log(` Users fetched: ${data.length}`);
    return data;
}
async function fetchCurrentUser() {
    const html = await fetch(TOKENS_PAGE).then(res => res.text());
    const tokens = extractHiddenInputs(html);
    console.log('Extracted tokens:', tokens);
    if (!tokens.access_token || !tokens.userId || !tokens.operateId) {
        throw new Error('Missing one or more required tokens.');
    }
    const cookieHeader = await jar.getCookieString(SETTINGS_API);
    const { fullPayload, timestamp } = createSignedRequest({
        access_token: tokens.access_token,
        userId: tokens.userId,
        operateId: tokens.operateId,
    });
    const res = await fetchBase(SETTINGS_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookieHeader,
        },
        body: fullPayload,
    });
    const text = await res.text();
    try {
        const json = JSON.parse(text);
        console.log('👤 Current user fetched successfully!');
        return json;
    }
    catch {
        console.error('❌ Response Body:', text);
        throw new Error(`Failed to fetch current user: ${res.status}`);
    }
}
async function isLoggedIn() {
    const res = await fetch(TOKENS_PAGE, { redirect: 'manual' });
    return res.status === 200;
}
async function main() {
    try {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
            console.log('🔐 Session not valid. Logging in...');
            await login();
        }
        else {
            console.log('✅ Already logged in. Reusing session.');
        }
        const users = await fetchUsers();
        const currentUser = await fetchCurrentUser();
        const result = {
            users,
            currentUser,
        };
        fs.writeFileSync('users.json', JSON.stringify(result, null, 2));
        console.log('✅ users.json written successfully!');
    }
    catch (err) {
        console.error('❌ Error:', err);
    }
}
main();
