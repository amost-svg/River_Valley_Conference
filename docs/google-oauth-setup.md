# RVC Google OAuth setup

The RVC frontend supports **Continue with Google** through Supabase Auth. Google OAuth credentials belong in Google Cloud and Supabase only. Never commit the Google client secret to GitHub or add it to Cloudflare Pages.

## Architecture

1. The user selects **Continue with Google** on `/login`.
2. The browser opens the Supabase Auth authorization endpoint.
3. Supabase sends the user to Google.
4. Google returns to the Supabase callback URL.
5. Supabase returns the authenticated session to `/login` on the active RVC site.
6. The frontend saves the Supabase session and opens `/admin`.

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
http://localhost:5173
```

When an RVC custom domain is connected, add its exact HTTPS origin as well.

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

Use the live RVC site as the Site URL. While the Cloudflare Pages domain is the production host, use:

```text
https://river-valley-conference.pages.dev
```

Add these Redirect URLs:

```text
https://river-valley-conference.pages.dev/login
http://localhost:5173/login
```

When a custom RVC domain becomes canonical, add its `/login` URL before changing the Site URL.

## 5. Validation

Test in a private browser window:

1. Open the deployed `/login` page.
2. Select **Continue with Google**.
3. Sign in with an approved RVC contact email.
4. Confirm the browser reaches `/admin`.
5. Confirm the user retains the correct school and role.
6. In Supabase Auth, confirm the existing user now has both `email` and `google` identities rather than a duplicate user.
7. Repeat with one principal or AD from another member school.
8. Attempt sign-in with an unapproved Google account and confirm access is denied.

A completed Google sign-in also counts as use of the OAuth client named in Google's inactivity warning.

## Security notes

- Do not enable unrestricted public signup.
- Do not use Google profile metadata for authorization. RVC access remains controlled by the existing database memberships and school contacts.
- Do not request Drive, Gmail, Calendar, or other Google API scopes merely for login.
- Keep the password login and password-reset path available as a recovery option.
- Review and delete obsolete OAuth clients in the `rvc-principals` project rather than keeping unused credentials indefinitely.
