# Attendance tracker and the Discord bot: setup

The tracker (app → Team → Attendance) works as soon as step 1 is done. Steps 2 to 6 turn on the Discord bot, which
messages members when a removal timer starts, collects their answer, and tells the leadership channel about no-shows.
Until then, "Ask on Discord" says the bot isn't set up and nothing is sent.

Everything below happens on the BuhurtOS home server (self-hosted Supabase at `api-home.buhurtoshome.app`) and in Discord.

## 1. Database

Apply `app/supabase/migrations/20261110010000_reavers_app_attendance.sql` to the home server, the same way as the other
`reavers_app_*` files (Studio → SQL editor, or `psql -f`). It only adds new `reavers_app_*` tables, a view and functions.
Check it first against a throwaway Postgres with `PGHOST=... PGUSER=postgres app/supabase/tests/run.sh`.

## 2. Create the Discord bot (about 5 minutes)

1. Go to <https://discord.com/developers/applications> → **New Application** → name it `Reavers Bot` → Create.
2. **General Information**: copy the **Public Key**. That's `DISCORD_PUBLIC_KEY`.
3. **Bot** (left menu): press **Reset Token**, copy it. That's `DISCORD_BOT_TOKEN`. Keep it secret; anyone with it can
   speak as the bot. Leave every "Privileged Gateway Intent" off; the bot doesn't need them.
4. **Installation** (left menu): under Install Link pick **Discord Provided Link**, under Guild Install add the scope
   `bot` and the permission `Send Messages`. Open the link and add the bot to the Reavers server.
   (The bot has to share a server with a member to message them.)

## 3. Leadership channel webhook

In the Reavers Discord, open the private captains or leadership channel → Edit Channel → Integrations → Webhooks →
**New Webhook** → name it `Attendance` → **Copy Webhook URL**. That's `DISCORD_LEADERSHIP_WEBHOOK`.

## 4. Deploy the function on the home server

1. Copy the folder `app/supabase/functions/reavers-attendance-bot` into the server's functions folder
   (in the Supabase docker setup: `volumes/functions/reavers-attendance-bot`).
2. Add these to the server's `.env`, and pass them to the `functions` service in `docker-compose.yml`
   (next to `SUPABASE_URL` and the other keys already there):

   ```
   DISCORD_BOT_TOKEN=...            # step 2.3
   DISCORD_PUBLIC_KEY=...           # step 2.2
   DISCORD_LEADERSHIP_WEBHOOK=...   # step 3
   REAVERS_CRON_SECRET=...          # make one up: openssl rand -hex 24
   ```

   The function also uses `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`, which the functions
   service already has.
3. Discord can't send a Supabase sign-in token, so this function must run with JWT checking off, like the Stripe webhook.
   The function checks every caller itself: the app's sign-in (captain or executive only), Discord's signature, or the
   cron secret. If the server sets `VERIFY_JWT=true` for all functions, exempt this one the same way you exempt
   `reavers-stripe-webhook` (in `volumes/functions/main/index.ts`, skip the JWT check when the function name is
   `reavers-attendance-bot`).
4. Restart: `docker compose up -d functions`.

Quick check: `curl -X POST https://api-home.buhurtoshome.app/functions/v1/reavers-attendance-bot` should answer
`{"error":"Sign in first"}`.

## 5. Point Discord at it

Back in the developer portal → **General Information** → **Interactions Endpoint URL**:

```
https://api-home.buhurtoshome.app/functions/v1/reavers-attendance-bot
```

Save. Discord sends a test request; if it saves without an error, the signature check works. This is what lets members
press "Tell the captains why" and answer in a pop-up.

## 6. Daily no-show check

In Studio → SQL editor on the home server, store the cron secret from step 4 and schedule the check for 9 AM Red Deer time
(16:00 UTC; it moves to 10 AM during daylight time):

```sql
select vault.create_secret('<the REAVERS_CRON_SECRET value>', 'reavers_cron_secret');

select cron.schedule('reavers-attendance-daily', '0 16 * * *', $$
  select net.http_post(
    url := 'https://api-home.buhurtoshome.app/functions/v1/reavers-attendance-bot',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-reavers-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'reavers_cron_secret')),
    body := '{}'::jsonb)
$$);
```

Each day it posts, once per absence, anyone active who hasn't been marked present in over 3 months, and any removal timer
that ran out. To turn it off: `select cron.unschedule('reavers-attendance-daily');`

## How members get matched to Discord

The bot finds a member's Discord account from their BuhurtOS sign-in: the account on the tracker record, the account
behind their club membership, or the account that claimed their fighter profile, if that account signed in with
Discord. People added with "Add from roster" are linked this way automatically. For anyone else, open them in the
tracker → Edit details → Discord user ID (Discord: Settings → Advanced → Developer Mode, then right-click them → Copy
User ID).

If a message can't be delivered (DMs from server members turned off, or not in the server), the person's record in the
app says so, and a captain should reach out directly.

## What it never does

It never kicks anyone from Discord or BuhurtOS. "Mark removed" only records the decision in the tracker, and only after
the timer runs out; take them off the BuhurtOS roster and the Discord server yourself.
