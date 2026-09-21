# classque-dev (Cloudflare Worker + D1 + TypeScript)

This project is configured with Cloudflare Workers, Cloudflare D1 (serverless SQL database), TypeScript, and Wrangler.

---

## 1. Prerequisites

Make sure Node.js (v20+ recommended) and npm are installed:
```bash
sudo pacman -S nodejs npm
```

Install dependencies:
```bash
npm install
```

---

## 2. GitHub Setup

### A. Set your Git identity (already configured)
```bash
git config --global user.name "mraxxi"
git config --global user.email "49807069+mraxxi@users.noreply.github.com"
```

### B. Add your SSH Key to GitHub
1. Copy your public key:
```bash
cat ~/.ssh/id_ed25519.pub
```
2. Add it at: **https://github.com/settings/ssh/new**
3. Test connection:
```bash
ssh -T git@github.com
```

### C. Link to your GitHub Repository
Create a repository named `classque-dev` (or another name) on GitHub, then link and push:
```bash
git remote add origin git@github.com:mraxxi/classque-dev.git
git push -u origin main
```

---

## 3. Cloudflare & Wrangler Setup

### A. Authenticate Wrangler with Cloudflare
```bash
npx wrangler login
```
This opens a browser window to authorize your Cloudflare account.

### B. Create your Cloudflare D1 Database
```bash
npx wrangler d1 create classque-db
```
Wrangler will output something like:
```toml
[[d1_databases]]
binding = "DB"
database_name = "classque-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
Copy that `database_id` and paste it into [`wrangler.jsonc`](./wrangler.jsonc) under `d1_databases[0].database_id`.

---

## 4. Development & D1 Migrations

### A. Run migrations locally
```bash
npm run db:migrate:local
```
*(Runs `./migrations/0001_initial_schema.sql` against the local SQLite database in `.wrangler/`)*

### B. Start local development server
```bash
npm run dev
```
Open [http://localhost:8787](http://localhost:8787) or [http://localhost:8787/api/users](http://localhost:8787/api/users) to verify D1 reads.

### C. Execute raw SQL query locally
```bash
npx wrangler d1 execute classque-db --local --command="SELECT * FROM users;"
```

---

## 5. Deployment

### A. Apply migrations to the production D1 database
```bash
npm run db:migrate:remote
```

### B. Deploy Worker to Cloudflare
```bash
npm run deploy
```
