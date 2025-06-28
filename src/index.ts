import fs from 'fs';
import fetchBase from 'node-fetch';
import fetchCookieBase from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';


const fetch = fetchCookieBase(fetchBase);
const BASE_URL = 'https://challenge.sunvoy.com';
const LOGIN_URL = `${BASE_URL}/login`;
const USERS_URL = `${BASE_URL}/api/users`;

const credentials = {
  username: 'demo@example.org',
  password: 'test',
};

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

async function getLoginNonce(): Promise<string> {
  const res = await fetch(LOGIN_URL);
  const html = await res.text();

  const match = html.match(/name="nonce" value="(.+?)"/);
  if (!match) throw new Error('Nonce not found on login page');

  return match[1];
}

async function login(): Promise<void> {
  const nonce = await getLoginNonce();

  const body = new URLSearchParams({
    nonce,
    username: credentials.username,
    password: credentials.password,
  });

  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual',
  });

  if (res.status !== 302) throw new Error(`Login failed: ${res.status}`);

  console.log('✅ Logged in');
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch(USERS_URL, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      Origin: BASE_URL,
      Referer: `${BASE_URL}/list`,
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);

 const users = (await res.json()) as User[];

  return users;
}

async function main(): Promise<void> {
  try {
    await login();
    const users = await fetchUsers();

    fs.writeFileSync('users.json', JSON.stringify({ users }, null, 2));
    console.log('✅ users.json created');
  } catch (err) {
    console.error('❌ Error:', (err as Error).message);
  }
}

main();
