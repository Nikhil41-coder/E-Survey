# Deploy E-Survey for free

Use GitHub Pages for the frontend and a separate Supabase Free project for authentication and records. The website address is https://nikhil41-coder.github.io/E-Survey/ after a successful deployment.

## Supabase setup

1. Open https://supabase.com/dashboard and sign in.
2. Choose an existing Free organization, or select **New organization**, name it **E-Survey**, and select **Free**.
3. Create a project named **E-Survey**. Choose a nearby region such as Mumbai. Stay on Free; do not select paid upgrades.
4. Open **SQL Editor**, paste `supabase/migrations/202610140001_esurvey.sql`, and run it once. It creates the family table, account isolation rules, validated save function, and revision checks.
5. Copy the project's URL and **publishable** key from its connection/API settings into `pages/config.js`:

```js
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YOUR-PUBLIC-KEY';
```

These two values are intended for browser use. Database policies and functions enforce account ownership. The build rejects secret keys and service-role JWTs. Never commit database passwords, private keys, session tokens, or family exports.

## Authentication settings

In **Authentication → URL Configuration**, set:

- Site URL: `https://nikhil41-coder.github.io/E-Survey/`
- Allowed redirect URL: `https://nikhil41-coder.github.io/E-Survey/app.html`
- For development only, add the exact local `app.html` address displayed by Vite.

Keep email confirmation enabled and configure custom SMTP for public registration. Supabase's default email sender is restricted to organization members and intended for testing. Until delivery is configured, ordinary visitors may be unable to register. The app shows a check-email message when confirmation is required.

Passwords must contain 10–128 characters. Configure the authentication service's password policy accordingly. Local accounts are separate; register again on the cloud version. Recovery is managed through Supabase; the local SQLite reset utility does not reset hosted accounts.

## Enable GitHub Pages

1. Open https://github.com/Nikhil41-coder/E-Survey/settings/pages.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push the complete source to `main`.
4. Open **Actions → Publish free GitHub Pages site**. If necessary, use **Run workflow** on `main`.
5. Wait for build and deploy jobs to succeed, then open the deployment URL.

The workflow installs dependencies, runs tests, builds, and publishes `pages-dist/`. Relative links support the `/E-Survey/` path.

## Verify the live app

Create and confirm an account. Add a head, spouse, son, the son's wife, and their child with both parents selected. Check the child's connections and member popups. Reload to verify saved records. Sign out and use a second account to verify its family starts empty.

## Troubleshooting and backups

- **Sign-in is being configured:** set both public configuration values and redeploy.
- **Registration or email error:** check SMTP, authentication rate limits, and redirect settings.
- **Family save fails:** apply the SQL migration in the configured project.
- **Family changed in another window:** refresh before saving again.
- **Pages deployment fails:** check Source is GitHub Actions and inspect the failing job.
- **Backend paused:** restore the Free project in Supabase after inactivity.

Export family JSON regularly and keep copies private. Free does not include automatic backups. Export is a backup file; this version has no import screen.

## Optional local/server mode

`npm start` runs the original Node/SQLite app. Production settings are in `.env.example`; it needs a Node-capable server and durable private storage. `deploy/optional-render.yaml` is an optional **paid** Render example and is not used by the free deployment.

References: [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [email authentication](https://supabase.com/docs/guides/auth/passwords), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [database access rules](https://supabase.com/docs/guides/database/postgres/row-level-security), [Free plan](https://supabase.com/pricing).

