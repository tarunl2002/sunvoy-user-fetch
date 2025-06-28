import fs from 'fs';
import fetchBase from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const fetch = fetchCookie(fetchBase, jar);

const LOGIN_URL = 'https://challenge.sunvoy.com/login';
const USERS_API = 'https://challenge.sunvoy.com/api/users';
const TOKENS_PAGE = 'https://challenge.sunvoy.com/settings/tokens';
const SETTINGS_API = 'https://api.challenge.sunvoy.com/api/settings';

const CREDENTIALS = {
  username: 'demo@example.org',
  password: 'test',
};


function extractHiddenInputs(html: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const inputRegex = /<input[^>]+id="([^"]+)"[^>]+value="([^"]+)"[^>]*>/g;
  let match;
  while ((match = inputRegex.exec(html)) !== null) {
    const [, id, value] = match;
    tokens[id] = value;
  }
  return tokens;
}

async function fetchNonce(): Promise<string> {
  const res = await fetch(LOGIN_URL);
  const html = await res.text();
  const match = html.match(/name="nonce" value="(.+?)"/);
  if (!match) throw new Error('Nonce not found');
  return match[1];
}

async function login(): Promise<void> {
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

  if (res.status !== 302) throw new Error(`Login failed: ${res.status}`);

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

async function fetchUsers(): Promise<any[]> {
  const res = await fetch(USERS_API, { method: 'POST' });

  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);

  const data = await res.json() as any[];


  console.log(`📦 Users fetched: ${data.length}`);
  return data;
}


async function fetchCurrentUser(): Promise<any> {
  const html = await fetch(TOKENS_PAGE).then(res => res.text());
  const tokens = extractHiddenInputs(html);
  console.log('🧩 Extracted tokens:', tokens);

  if (!tokens.access_token || !tokens.userId || !tokens.operateId) {
    throw new Error('Missing one or more required tokens.');
  }

  const body = new URLSearchParams({
    access_token: tokens.access_token,
    userId: tokens.userId,
    operateId: tokens.operateId,
  });

  const cookieHeader = await jar.getCookieString(SETTINGS_API);

  const res = await fetchBase(SETTINGS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader,
    },
    body: body.toString(),
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json;
  } catch {
    console.error(' Response Body:', text);
    throw new Error(`Failed to fetch current user: ${res.status}`);
  }
}

async function main() {
  try {
    await login();
    const users = await fetchUsers();
    const currentUser = await fetchCurrentUser();

    const result = {
      users,
      currentUser,
    };

    fs.writeFileSync('users.json', JSON.stringify(result, null, 2));
    console.log('users.json written successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
