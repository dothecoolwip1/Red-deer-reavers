# Automatic reminders: setup

The app (Team → **Reminders**) lets an admin turn on, and set the timing for:

| Reminder | Goes to | By | When |
| --- | --- | --- | --- |
| Monthly dues | Each active club member with nothing paid, waived or exempt for the month | Discord DM, email or both | On a chosen day of the month, with an optional second nudge some days later |
| Practices | The members' Discord channel (or every active member by email) | Channel post, email or both | A chosen number of hours before each weekly practice on the Practices page |
| Calendar events | Same as practices; public events only | Channel post, email or both | A chosen number of days before each public event on the Calendar page |
| Attendance warning | A member getting close to 3 months without coming out | Discord DM | A chosen number of days before they hit 3 months |
| Leadership no-show post | The leadership channel (the attendance bot's existing post) | Channel post | Daily, as before; now it can be switched off |

Everything new starts **off**. Each reminder goes out once (the app keeps a history, with anything skipped or failed and why).
Payment-exempt members (Money → Dues → click a name) never get a dues reminder for their exempt months, and members marked
away in Attendance never get the attendance warning.

Steps 1 to 4 happen on the BuhurtOS home server (self-hosted Supabase at `api-home.buhurtoshome.app`), like the attendance bot.

## 1. Database

Apply `app/supabase/migrations/20261112000000_reavers_app_reminders.sql` (Studio → SQL editor, or `psql -f`), on the home
server and the cloud copy. It only adds `reavers_app_reminder_settings`, `reavers_app_reminder_log` and two functions only the
service role can call. Check it first with `PGHOST=... PGUSER=postgres app/supabase/tests/run.sh`.

## 2. Where messages go

- **Discord DMs** (dues, attendance warning) use the attendance bot. If `DISCORD_BOT_TOKEN` is already set for
  `reavers-attendance-bot` (see `docs/attendance-discord-bot.md`), nothing new is needed. Members are matched to Discord the
  same way: their BuhurtOS sign-in with Discord, or the Discord user ID on their Attendance record.
- **Members' channel** (practices, events): in the Reavers Discord, open the general members' or announcements channel →
  Edit Channel → Integrations → Webhooks → **New Webhook** → name it `Reavers reminders` → **Copy Webhook URL**. That's
  `DISCORD_MEMBERS_WEBHOOK`.
- **Email** (optional) goes through [Resend](https://resend.com) (free for 3,000 emails a month). Sign up, add the domain
  `reddeerreavers.com` under Domains and add the DNS records it shows in Vercel (Domains → reddeerreavers.com → DNS), then
  create an API key. That's `RESEND_API_KEY`. Each member gets their own email; nobody sees anyone else's address. Emails go to
  the address on their BuhurtOS account.

## 3. Deploy the function

1. Copy `app/supabase/functions/_shared` (it now also has `reminders.ts`) and `app/supabase/functions/reavers-reminders`
   into the server's `volumes/functions/` folder. Copy `reavers-attendance-bot` again too: it now checks the new on/off switch
   for the leadership post.
2. Add to the server's `.env`, and pass them to the `functions` service in `docker-compose.yml` under `environment:`:

   ```
   DISCORD_MEMBERS_WEBHOOK=...                          # step 2
   RESEND_API_KEY=...                                   # step 2, only for email
   REMINDER_EMAIL_FROM=Red Deer Reavers <reminders@reddeerreavers.com>
   REMINDER_EMAIL_REPLY_TO=reddeerreavers@gmail.com     # optional: where replies go
   ```

   `DISCORD_BOT_TOKEN` and `REAVERS_CRON_SECRET` are the attendance bot's and are already there.
3. Like the attendance bot, this function runs with JWT checking off (pg_cron sends the cron secret, not a sign-in) and checks
   every caller itself. If the server has `VERIFY_JWT=true`, add `reavers-reminders` next to `reavers-attendance-bot` in the
   skip list in `volumes/functions/main/index.ts`.
4. `docker compose up -d functions`.

Quick check: `curl -X POST https://api-home.buhurtoshome.app/functions/v1/reavers-reminders` should answer `{"error":"Sign in first"}`.

## 4. Hourly schedule

In Studio → SQL editor (the `reavers_cron_secret` vault entry is the attendance bot's; create it first if that isn't set up):

```sql
select cron.schedule('reavers-reminders-hourly', '5 * * * *', $$
  select net.http_post(
    url := 'https://api-home.buhurtoshome.app/functions/v1/reavers-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-reavers-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'reavers_cron_secret')),
    body := '{}'::jsonb)
$$);
```

It runs at five past every hour and sends only what's due, in Red Deer time: dues, events and attendance warnings from the
chosen hour onward (once each), practice reminders once a practice is within the chosen number of hours. To stop everything:
`select cron.unschedule('reavers-reminders-hourly');` (or switch each one off in the app).

## 5. Turn them on

App → Team → **Reminders**: switch on what you want and pick the timing. The page says if a key from step 2 is missing for
something that's on. **Send what's due now** runs the same check as the schedule straight away. The History list shows each
reminder with Sent, Skipped (no Discord account or email for that person, or that channel isn't set up) or Failed (Discord or
the email service refused; it's tried again a few hours later).
