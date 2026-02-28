# Split-Ledger
Open-Source Micro-SaaS Platform boilerplate built with Postgres, Node.js, Express, React, and Vite. Designed to scale gracefully, it provisions isolated PostgreSQL schemas per tenant, secures API Keys, streams Webhooks, and handles Usage-Based Billing via Stripe.

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=mrzeeshanahmed&button_colour=FFDD00&font_colour=000000&font_family=Bree&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/mrzeeshanahmed)

## Features
- **Multi-Tenant Architecture**: Automatic PostgreSQL schema provisioning per workspace (tenant).
- **Authentication**: Secure JWT access & refresh token rotation with scoped boundaries.
- **Frontend**: Modern React 18, Vite, TailwindCSS, and framer-motion/GSAP animations.
- **Backend API**: ExpressJS REST API with modular routing.
- **Stripe Billing**: Built-in webhook listening and lifecycle management for usage-based billing.
- **Redis Caching**: Rate-limiting and session acceleration.

---

## 🚀 Deployment Guide (Self-Hosted on VPS/Server)

This app ships with an optimized `docker-compose.yml` that makes running the backend, PostgreSQL, and Redis extremely straightforward on any VPS (DigitalOcean, AWS EC2, Hetzner, etc.).

### 1. Prerequisites
- Docker and Docker Compose installed on your server.
- Node.js (v18+) if you wish to run the frontend independently or for local development.

### 2. Setup the Environment
Clone the repository and prepare the environment files:
```bash
git clone https://github.com/mrzeeshanahmed/split-ledger.git
cd split-ledger

# Backend Environment
cp backend/.env.example backend/.env
# Update backend/.env with your generated secrets, Stripe keys, and database passwords.

# Frontend Environment
cp frontend/.env.example frontend/.env
# Update frontend/.env with your backend API URL (e.g. your server IP or domain)
```

### 3. Start Database Infrastructure
To start the locally bundled PostgreSQL and Redis instances:
```bash
docker-compose up -d
```
The application will automatically apply the baseline migrations and templates to the default database on startup.

### 4. Running the Backend Server
Once the databases are up, you can start the backend API:
```bash
cd backend
npm install
npm run build
npm start
```

### 5. Running the Frontend Server
The frontend is a Vite application that can be built into static assets.
```bash
cd frontend
npm install
npm run build
```
You can serve the `frontend/dist` directory using NGINX, Apache, or use `npm run preview`.

---

## ⚡ Deployment Guide (Vercel)

If you prefer going completely serverless, Split-Ledger can be deployed directly to Vercel.

**Important Note on Vercel:** Vercel cannot run Docker containers. You must provision an external PostgreSQL database (e.g., Supabase, Neon) and external Redis cache (e.g., Upstash).

### Backend (Vercel)
1. Import the `backend` directory into Vercel as a new Project.
2. In the Vercel Settings, configure your environment variables:
   - `DATABASE_URL`: Your external PostgreSQL instance connection string.
   - `REDIS_URL`: Your external Redis connection string.
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, etc.
3. Deploy the backend. Once deployed, note down the domain (e.g., `https://split-ledger-api.vercel.app`).

### Frontend (Vercel)
1. Import the `frontend` directory into Vercel as another new project.
2. Update the `vercel.json` rewrite rules inside the `frontend` project to target your backend Vercel domain:
   ```json
   {
       "rewrites": [
           {
               "source": "/api/:path*",
               "destination": "https://your-backend-domain.vercel.app/api/:path*"
           },
           {
               "source": "/((?!assets|favicon).*)",
               "destination": "/index.html"
           }
       ]
   }
   ```
3. Deploy the frontend project.

---

## Technical Stack
- **Database**: PostgreSQL 15, Redis 7
- **Backend API**: Node 18, Express, TS, pg, jsonwebtoken
- **Frontend App**: React 18, Vite, Tailwind CSS, Lucide React, Recharts

## Contributing
Feel free to open issues and pull requests to help improve the project. Please note that the `main` branch is protected and direct pushes are restricted.

## License
This project is published under the **Apache License 2.0 with a Commercial Revenue Exception**. 

Any Legal Entity or individual whose gross annual revenue exceeds **$10,000,000 USD** MUST contact the original developer (Zeeshan Ahmed) to negotiate a commercial license before integrating or distributing this Work in a production environment. See the [LICENSE](./LICENSE) file for full details.

## Support & Sponsor
We put a lot of time into making this boilerplate comprehensive and production-ready. If it helped you save time, please consider buying me a coffee!

<a href="https://www.buymeacoffee.com/mrzeeshanahmed" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
