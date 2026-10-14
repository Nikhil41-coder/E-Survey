# E-Survey

Complete family-tree app: animated landing page, private password-protected accounts, saved household records, both-parent connections, and member detail popups.

## Deploy from GitHub

This repository supports **GitHub → Render Web Service** deployment. The frontend and backend run together, with SQLite on a persistent disk. GitHub stores the code; the server host runs it. GitHub Pages cannot run this account/database server. [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

1. Upload all project files to the repository root, with `package.json`, `server.mjs`, and `render.yaml` visible there. Upload the ZIP's contents, not the ZIP itself.
2. In [Render](https://dashboard.render.com/), choose **New → Blueprint**, connect **Nikhil41-coder/E-Survey**, and choose the branch containing these files.
3. Review the price before creating resources: this configuration uses a **paid** web service and a 1 GB persistent disk. Free ephemeral storage would lose this SQLite database on redeployment. [Persistent disk requirements](https://render.com/docs/disks)
4. After deployment succeeds, open Render's HTTPS address. The landing page opens at `/`; create an account and begin your tree.
5. Later pushes deploy after GitHub checks pass. Enable GitHub Actions if needed; the Render build also runs the tests.

Render supplies the website origin through `RENDER_EXTERNAL_URL`. For a custom domain, set `APP_ORIGIN` to its exact HTTPS origin without a trailing slash. Keep one instance for this disk-backed database. No API keys or default passwords are needed.

[Deployment settings and troubleshooting](DEPLOYMENT.md) · [Render Git-connected web services](https://render.com/docs/web-services)

## Run locally

Use Node 22.13 or later in the Node 22 series. Double-click `start.cmd` on Windows or run `npm start`, then open `http://127.0.0.1:49321`. No packages need installing.

## Entry files

`public/index.html` is the landing page. `server.mjs` starts the complete app and serves it at `/`. Full-app hosting uses `npm start` and does not require a root `index.html`.

## Features and records

- Account creation, sign-in, logout, protected routes, and salted password hashes.
- Member names, places, door numbers, ages, occupations, and notes.
- Head-relative relationships, second-parent links, shared junctions, and detail popups.
- Editing, search, zoom, export, SQLite persistence, and revision/cycle checks.

The source contains no family records, passwords, sessions, or databases. Hosting starts with an empty database. Your existing local records stay in your local application and do not transfer automatically; a private database transfer is separate from uploading source to GitHub.

Run `npm test` to verify the app. GitHub and Render run the same checks. [Full project guide](PROJECT-GUIDE.md)
