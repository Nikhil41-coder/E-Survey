# Deploy Nikhil41-coder/E-Survey

The included `render.yaml` configures full-app hosting. Uploading source to GitHub does not by itself publish the running app: connect the repository to a server host and create the service.

## Manual Render setup

Choose **New → Web Service → Git Provider**, select **Nikhil41-coder/E-Survey**, and choose the branch containing the application.

| Setting | Value |
| --- | --- |
| Type | Web Service |
| Runtime | Node |
| Root directory | Empty when package.json is at repository root |
| Build command | `npm test` |
| Start command | `npm start` |
| Health check | `/healthz` |
| Node version | Node 22, selected by `.node-version` |
| Instances | 1 |

Select a paid compute plan and attach a persistent disk at `/var/data` before collecting records. Review the price in Render before creation. The Blueprint requests `0.5c-512mb` and a 1 GB disk; preparing the file does not purchase resources.

| Environment variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `DB_PATH` | `/var/data/family.sqlite` |

Render supplies `PORT` and `RENDER_EXTERNAL_URL`; the app reads both. On another host, set `APP_ORIGIN` to its exact HTTPS origin and keep `DB_PATH` on durable storage. For a custom domain, set `APP_ORIGIN` to that domain, without a path or trailing slash. HTTPS is required for production sign-in cookies.

## Verify after deployment

Create a test account; add a head, spouse, and child with both parents selected. Check the child's popup, restart the service, and check that records still load. Sign out and confirm `/app` redirects to the landing page.

## Troubleshooting

- GitHub Pages sign-in fails: use a Web Service, because Pages cannot run the backend.
- Origin error: set `APP_ORIGIN` to your exact HTTPS address; the default Render address can use `RENDER_EXTERNAL_URL` automatically.
- Records vanish: confirm the disk mount and database path. Ephemeral storage does not preserve the database.
- No open port: use `HOST=0.0.0.0`; the app reads the host's `PORT`.
- Health check fails: inspect logs for a database path, permission, or runtime error. `/healthz` checks database access.

Keep databases and credentials out of GitHub. Hosted accounts start empty. Transfer existing private records separately if needed. For recovery, the host's private shell can run `node scripts/reset-password.mjs account@example.com`; the utility reads `DB_PATH` and prompts without showing the new password.

Sources: [web services](https://render.com/docs/web-services), [persistent disks](https://render.com/docs/disks), [Blueprint fields](https://render.com/docs/blueprint-spec), [environment variables](https://render.com/docs/environment-variables), [Node version selection](https://render.com/docs/node-version).
