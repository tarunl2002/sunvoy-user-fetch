# Sunvoy Challenge Script

This is a small Node.js script to log into the [Sunvoy Challenge site](https://challenge.sunvoy.com), grab some user data, and save it to a file.

## Features

- Logs into the site using test credentials  
- Grabs hidden tokens from `/settings/tokens`
- Signs the request using HMAC SHA1 with a timestamp
- Fetches:
  - All users (`/api/users`)
  - Current user info (`/api/settings`)
- Saves everything to `users.json`

## Requirements

- Node.js (v18+ recommended)
- TypeScript
- `ts-node` for execution (or compile with `tsc`)

## Setup

1. Clone this repo or copy the script
2. Install dependencies:

   ```bash
   npm install
3. Run the script
    ```bash
    ts-node src/index.ts
4. Check the Output
    ```bash
    users.json

## Notes
- The HMAC key is hardcoded.

## Output (Users.json)
    
    {
      "users": [
        {
          "id": "a2e47ca6-6b56-463c-9207-31e688c22e1d",
          "firstName": "User1",
          "lastName": "Last1",
          "email": "user1@example.com"
        },
        {
          "id": "07d72632-7615-4c8b-bd44-808406f4e7ac",
          "firstName": "User2",
          "lastName": "Last2",
          "email": "user2@example.com"
        },
        {
          "id": "185dffd5-52fb-4798-8329-5ff1b03996f0",
          "firstName": "User3",
          "lastName": "Last3",
          "email": "user3@example.com"
        },
        {
          "id": "ef4bd4cb-62f9-4a77-9178-f4b5be347c9c",
          "firstName": "User4",
          "lastName": "Last4",
          "email": "user4@example.com"
        },
        {
          "id": "e7103d66-5410-41a4-ac2c-e677b37f7898",
          "firstName": "User5",
          "lastName": "Last5",
          "email": "user5@example.com"
        },
        {
          "id": "935407bc-a7c0-4e50-87ac-70f68e20b1ae",
          "firstName": "User6",
          "lastName": "Last6",
          "email": "user6@example.com"
        },
        {
          "id": "7aff321e-2368-42e2-9ef6-94c51cbee278",
          "firstName": "User7",
          "lastName": "Last7",
          "email": "user7@example.com"
        },
        {
          "id": "1b69ee14-f618-4a99-8ffa-eeb192466570",
          "firstName": "User8",
          "lastName": "Last8",
          "email": "user8@example.com"
        },
        {
          "id": "b0e16ec6-8ace-4303-8ae0-ad223b72665c",
          "firstName": "User9",
          "lastName": "Last9",
          "email": "user9@example.com"
        }
      ],
      "currentUser": {
        "id": "d9b30f76-2c07-468b-9c23-63de80f0ebf2",
        "firstName": "John",
        "lastName": "Doe",
        "email": "demo@example.org"
      }
    }
