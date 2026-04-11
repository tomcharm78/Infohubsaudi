# 🏥 Healthcare Investor Intelligence Platform
## Deployment Guide (15 minutes, zero coding needed)

---

## What You're Getting
A live web app at `your-name.vercel.app` with:
- 22 pre-loaded healthcare investors (GCC + International)
- ⚡ **AI Update button** that searches the web and updates all investor data automatically
- ⚡ **Per-investor AI Update** button on each profile
- Manual editing (contacts, profiles, domains, portfolio)
- Excel import & export (.xlsx)
- All data saved in your browser (persists between visits)

---

## Step 1: Create a Vercel Account (2 minutes)

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (since you already have GitHub)
4. Authorize Vercel to access your GitHub
5. Done — you now have a Vercel account

---

## Step 2: Create a GitHub Repository (3 minutes)

1. Go to **https://github.com/new**
2. Repository name: `gcc-healthcare-investors` (or whatever you like)
3. Set it to **Private** (recommended)
4. Click **"Create repository"**
5. You'll see instructions — keep this page open

Now upload the project files:

### Option A: Upload via GitHub website (easiest)
1. On your new repo page, click **"uploading an existing file"**
2. Drag ALL the files from the unzipped project folder onto the page
3. Make sure the folder structure is preserved:
   ```
   app/
     globals.css
     layout.js
     page.js
     lib/
       data.js
     api/
       ai-update/
         route.js
   package.json
   next.config.js
   vercel.json
   .gitignore
   .env.example
   ```
4. Click **"Commit changes"**

### Option B: Upload via Git command line
```bash
cd gcc-investor-platform
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/gcc-healthcare-investors.git
git push -u origin main
```

---

## Step 3: Deploy on Vercel (3 minutes)

1. Go to **https://vercel.com/new**
2. You'll see your GitHub repos — click **"Import"** next to `gcc-healthcare-investors`
3. On the configure page:
   - Framework: **Next.js** (should auto-detect)
   - Root Directory: leave as `/`
4. Expand **"Environment Variables"**
5. Add one variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (paste your Claude API key)
6. Click **"Deploy"**
7. Wait 1-2 minutes for the build
8. ✅ You'll get a URL like `gcc-healthcare-investors.vercel.app`

---

## Step 4: Use Your Platform

1. Open your URL in any browser
2. You'll see the full investor dashboard
3. Click **"⚡ AI Update All"** to run the first AI-powered web search
4. The AI will search each investor and discover new ones
5. All changes are saved in your browser automatically

---

## How to Use

### AI Update (the main feature)
- **"AI Update All"** button in header → searches web for ALL investors + discovers new ones
- **"AI Update"** button on each investor profile → searches just that one investor
- Updates: AUM, C-suite contacts (names, emails, phones), recent deals, company news
- Discovers: new healthcare investors in GCC not yet in your database

### Manual Editing
- Click any investor → click **"Edit"** on any section
- Add phone numbers, emails, notes — all saved immediately

### Excel Import
- Click **"Import"** → upload .xlsx or .csv from GHE, Crunchbase, PitchBook
- Map your columns → import

### Excel Export
- Click **".xlsx"** → downloads everything as a formatted Excel file

---

## Updating the App Later

If you want to update the code:
1. Edit files in your GitHub repo
2. Vercel automatically re-deploys when you push changes

---

## Troubleshooting

**"AI Update" shows errors:**
- Check your ANTHROPIC_API_KEY is set correctly in Vercel → Settings → Environment Variables
- Make sure your API key has credits (check console.anthropic.com)

**Data disappeared:**
- Data is stored in your browser's localStorage
- If you clear browser data, the data resets to the 22 built-in investors
- Always export to Excel before clearing browser data

**Want to change the API key:**
- Go to Vercel dashboard → your project → Settings → Environment Variables
- Update the key → click "Save"
- Redeploy: Deployments → click "..." on latest → Redeploy
