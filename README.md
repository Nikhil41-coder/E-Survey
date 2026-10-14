# E-Survey

Family-tree application with the original animated landing page, separate password accounts, private saved records, both-parent connections, and member detail popups.

## Free GitHub Pages deployment

GitHub Pages hosts the website. Supabase Auth and PostgreSQL handle accounts and private records. The deployment address is **https://nikhil41-coder.github.io/E-Survey/** once Pages is enabled and deployment succeeds.

1. Create a separate Supabase project on a Free organization.
2. Apply `supabase/migrations/202610140001_esurvey.sql` in that project.
3. Set its URL and **publishable** key in `pages/config.js`. Never use a secret or service-role key.
4. Configure authentication redirects and email delivery as described in [DEPLOYMENT.md](DEPLOYMENT.md).
5. In GitHub **Settings → Pages → Source**, select **GitHub Actions**. Push to `main`; the Pages workflow tests, builds, and deploys.

Supabase Free currently costs $0/month within its limits and pauses projects after one week of inactivity. Back up records with Export. [Supabase pricing](https://supabase.com/pricing)

## Main files

`index.html` is the GitHub Pages landing-page entry. `app.html` is the family-tree dashboard. These and their Pages scripts are generated from the original interface by `npm run build:pages`, which outputs the publishable website into `pages-dist/`.

Extract the source ZIP before uploading. Keep the complete folder structure, including `.github/`, rather than uploading the ZIP itself.

## Run locally

For the cloud version, use Node 22.13 or later in the Node 22 series, run `npm ci`, then `npm run dev:pages`. It uses the configured Supabase project.

The original local Node/SQLite version remains available: run `npm start` or double-click `start.cmd`, then open http://127.0.0.1:49321. Its separate accounts and records stay in local `data/family.sqlite`; it does not require Supabase. [Local guide](PROJECT-GUIDE.md)

## Features

- Password account creation, sign-in, logout, and private records per account.
- Names, places, door numbers, ages, occupations, and notes.
- Head-relative relationships, second-parent links, and clickable detail popups.
- Editing, search, zoom, export, cycle validation, and revision checks to prevent conflicting writes.

The repository excludes family databases, passwords, and sessions. Uploading source does not transfer existing private records.

Run `npm test` and `npm run build:pages` to verify the application. GitHub runs both before deployment.

