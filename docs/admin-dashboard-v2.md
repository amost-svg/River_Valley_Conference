# RVC Administrator Dashboard

The signed-in dashboard is organized around the daily work of RVC principals, athletic directors, conference officials, publicists, and conference administrators.

## Main sections

- **Today** — all RVC games scheduled today, with upcoming contests below
- **Conference Calendar** — date-based game browsing; selecting a game opens its score workflow
- **Scores & Confirmations** — opponent confirmation and dispute review
- **Add / Manage Games** — school-scoped game creation
- **My School / School Profiles** — logos, leadership, contact information, addresses, and public links
- **Standings** — current confirmed conference records
- **Resources** — constitution, operations guides, calendars, and internal conference files
- **News & Publicity** — complete announcements and conference-publicist PDF releases
- **User Accounts** — conference-admin directory, role/school assignments, status, last sign-in, and password-reset links

## Sport-specific score entry

The score editor reads each sport's `scoring_profile`:

- Volleyball: set-by-set scoring with automatic match-set totals
- Basketball, soccer, and Scholastic Bowl: final team scores
- Baseball and softball: final scores plus innings played
- Other activities: the configured scoring type is retained in the result details

Every score is submitted through the opponent-confirmation workflow before it becomes final.

## School permissions

Principals and athletic directors may update their own school and add games involving their school. Conference administrators may update any member school or game.

School logos upload to the public `school-logos` Supabase Storage bucket under the school's slug folder.

## News and publicist PDFs

Conference administrators and press editors may create a complete web announcement, attach an image, upload a PDF press release, save a draft, or publish immediately. Published items feed the public homepage.

## Account administration

The dashboard exposes a conference-admin-only user directory through a role-checked database function. Conference administrators may update membership role, school assignment, and status, and send a standard Supabase password-reset link.

Direct invitations remain a server-only Auth Admin operation and must not expose a Supabase secret or service-role key in browser code.
