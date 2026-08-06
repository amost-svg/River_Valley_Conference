# RVC Google OAuth setup

The RVC frontend supports **Continue with Google** through Supabase Auth. Google OAuth credentials belong in Google Cloud and Supabase only. Never commit the Google client secret to GitHub or add it to Cloudflare Pages.

## Architecture

1. The user selects **Continue with Google** on `/login`.
2. The browser opens the Supabase Auth authorization endpoint.
3. Supabase sends the user to Google.
4. Google returns to the Supabase callback URL.
5. Supabase returns the authenticated session to `/login` on the active RVC site.
6. The frontend saves the Supabase session and opens `/admin`.

The frontend builds its return address from `window.location.origin`. The same build therefore supports both the Cloudflare Pages hostname and the RVC custom domain without storing a domain or Google secret in the browser bundle.

Existing confirmed RVC accounts are linked automatically when the Google account uses the same email address. The RVC before-user-created hook continues to prevent unapproved email addresses from creating accounts.

## 1. Google Cloud project

Use the existing Google Cloud project named `rvc-principals` unless its credentials are obsolete or owned by the wrong organization.

In **Google Auth Platform**:

- App name: `River Valley Conference`
- User support email: a monitored RVC/Grace address
- Audience: **External** because member schools use different Google Workspace domains
- Contact email: a monitored administrative address
- Requested scopes only:
  - `openid`
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`

Keep the application in testing only during initial validation. Move it to production before inviting the full conference.

## 2. Web OAuth client

Create or update a **Web application** OAuth client.

### Authorized JavaScript origins

Add each origin that will host the login page. Origins do not include paths or trailing slashes.

```text
https://river-valley-conference.pages.dev
https://www.rvc-il.com
http://localhost:5173
```

The apex domain `https://rvc-il.com` should redirect to `https://www.rvc-il.com`. Add it separately only if the application will be served directly from both hostnames.

### Authorized redirect URI

Google returns to Supabase, not directly to the RVC website. Add this exact URI:

```text
https://vekqbtfojdnnkdernxzp.supabase.co/auth/v1/callback
```

Copy the generated **Client ID** and **Client secret**. Do not place either value in source code; the secret must remain server-side in Supabase.

## 3. Supabase Google provider

Open the River Valley Conference Supabase project:

```text
Project ref: vekqbtfojdnnkdernxzp
```

Go to **Authentication → Providers → Google** and:

1. Enable Google.
2. Paste the Google OAuth Client ID.
3. Paste the Google OAuth Client secret.
4. Save.

## 4. Supabase URL configuration

Go to **Authentication → URL Configuration**.

While the Cloudflare Pages hostname is serving the new application, keep this Site URL:

```text
https://river-valley-conference.pages.dev
```

Add all of these Redirect URLs:

```text
https://river-valley-conference.pages.dev/login
https://www.rvc-il.com/login
http://localhost:5173/login
```

When the Cloudflare custom-domain cutover is complete and `www.rvc-il.com` is serving this application, change the Site URL to:

```text
https://www.rvc-il.com
```

Keep the Pages `/login` redirect during the transition so existing links and administrative recovery remain available.

## 5. Cloudflare custom-domain cutover

Do not change DNS merely because the OAuth origin has been registered. The current `www.rvc-il.com` site should remain online until the new Pages deployment has been reviewed.

At cutover:

1. Add `www.rvc-il.com` as a custom domain on the River Valley Conference Cloudflare Pages project.
2. Configure `rvc-il.com` to redirect permanently to `https://www.rvc-il.com`.
3. Confirm `/`, `/login`, `/admin`, `/reset-password`, and static assets load through the custom domain.
4. Change the Supabase Site URL to `https://www.rvc-il.com`.
5. Update the repository sitemap, robots file, canonical metadata, and Search Console property to the custom domain.

## 6. Validation

Test in a private browser window:

1. Open the deployed `/login` page.
2. Select **Continue with Google**.
3. Sign in with an approved RVC contact email.
4. Confirm the browser reaches `/admin`.
5. Confirm the user retains the correct school and role.
6. In Supabase Auth, confirm the existing user now has both `email` and `google` identities rather than a duplicate user.
7. Repeat with one principal or AD from another member school.
8. Attempt sign-in with an unapproved Google account and confirm access is denied.
9. Repeat the login test from `https://www.rvc-il.com/login` after the Cloudflare domain cutover.

A completed Google sign-in also counts as use of the OAuth client named in Google's inactivity warning.

## Security notes

- Do not enable unrestricted public signup.
- Do not use Google profile metadata for authorization. RVC access remains controlled by the existing database memberships and school contacts.
- Do not request Drive, Gmail, Calendar, or other Google API scopes merely for login.
- Keep the password login and password-reset path available as a recovery option.
- Review and delete obsolete OAuth clients in the `rvc-principals` project rather than keeping unused credentials indefinitely.
