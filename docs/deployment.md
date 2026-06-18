# Deployment

## Production Flow

Production deploys run from GitHub Actions after the `CI` workflow succeeds for
a push to `main`. You can also start the same workflow manually with
`workflow_dispatch`.

The deploy job connects to the Hetzner server over SSH, updates the checked-out
repository with `git pull`, writes a `.env.production` file from GitHub
Secrets, and rebuilds the production Docker Compose stack.

## Required GitHub Secrets

Create these repository or environment secrets before running the deploy
workflow:

- `SSH_HOST`: public server IP or domain
- `SSH_USER`: SSH user allowed to deploy
- `SSH_PRIVATE_KEY`: private key content for that SSH user
- `DEPLOY_PATH`: absolute path to the checked-out repo on the server
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `WEB_ORIGIN`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Server Preparation

Prepare the server once before the first deploy:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Clone the repository to the same path you store in `DEPLOY_PATH`:

```bash
mkdir -p /opt/ai-logistics
cd /opt/ai-logistics
git clone <your-repo-url> logistics-monorepo
cd logistics-monorepo
git checkout main
```

After Docker access is active for the deploy user, the workflow can run:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Notes

- The workflow expects the production branch to be `main`.
- `.env.production` is generated on the server during each deploy and should not
  be committed.
- If you do not use email or OpenAI in production yet, keep the matching
  secrets present but set them to an empty string.
