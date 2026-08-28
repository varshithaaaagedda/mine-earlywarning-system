# Vercel Deployment Guide — Mine Subsidence Early Warning System 🚀

This guide explains how to deploy the **Mine Subsidence Early Warning System** (Frontend + Express Serverless REST API Backend + SQLite Telemetry Storage) to **Vercel**.

---

## 📋 Prerequisites

1. A [Vercel Account](https://vercel.com/signup).
2. [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`), OR your GitHub repository connected to Vercel.

---

## ⚡ Option 1: Deploying via Vercel CLI (Fastest)

1. **Open your terminal in the project directory**:
   ```bash
   cd c:/Users/BHAVANI/OneDrive/Desktop/sih
   ```

2. **Run Vercel CLI command**:
   ```bash
   vercel
   ```

3. **Follow the interactive prompts**:
   * *Set up and deploy?* **y**
   * *Which scope?* (Select your account)
   * *Link to existing project?* **n**
   * *Project name?* `mine-earlywarning-system`
   * *In which directory is your code located?* `./`
   * *Want to modify build settings?* **n**

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 🌐 Option 2: Deploying via GitHub Integration (Continuous Deployment)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel serverless deployment"
   git push origin main
   ```

2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** > **"Project"**.
3. Import your GitHub repository: `varshithaaaagedda/mine-earlywarning-system`.
4. Keep the Framework Preset as **"Other"** or **"Express"**.
5. Under **Environment Variables**, add the following key-value pairs:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Sets Node runtime environment to production |
| `CORS_ORIGIN` | `*` | Enables cross-origin API access |
| `DATABASE_PATH` | `/tmp/subsidence.db` | Directs SQLite storage to Vercel writable serverless temp directory |

6. Click **Deploy**. Vercel will automatically build static frontend assets and create serverless endpoints for `/api/*`.

---

## 🔍 Verifying Your Vercel Deployment

Once deployed, test your Vercel URL (e.g., `https://mine-earlywarning-system.vercel.app`):

1. **Health Check Endpoint**:
   `GET https://mine-earlywarning-system.vercel.app/api/health`
   Should return:
   ```json
   {
     "status": "UP",
     "system": "Mine Subsidence Early Warning Backend",
     "database": "Connected",
     "sitesCount": 4
   }
   ```

2. **Frontend GIS Dashboard**:
   Visit `https://mine-earlywarning-system.vercel.app` in your browser. The dashboard will automatically fetch telemetry, risk zones, underground tunnels, and KPI metrics from your Vercel serverless API backend.

3. **Interactive Simulation Triggers**:
   Click **"Heavy Rain Simulation"** or **"Accelerated Displacement Spike"** on the UI. The request will POST to `/api/simulation/*`, evaluate risk levels, update the SQLite database in `/tmp`, and update the UI in real time.
