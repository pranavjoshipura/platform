# Deployment Guide to GitHub Pages (pjoshipu.github.io)

## Prerequisites
- GitHub account with access to the pjoshipu organization/account
- Repository should be named `agentic-ai-platformengineering` or update the base path in `vite.config.ts`

## Step 1: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
git add .
git commit -m "Add footer and prepare for GitHub Pages deployment"
git remote add origin https://github.com/pjoshipu/agentic-ai-platformengineering.git
git branch -M main
git push -u origin main
```

## Step 2: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/pjoshipu/agentic-ai-platformengineering`
2. Click on **Settings** (top right)
3. In the left sidebar, click **Pages**
4. Under **Build and deployment**:
   - Source: Select **GitHub Actions**
5. Save the changes

## Step 3: Configure Secrets (Optional)

If you're using Supabase or Anthropic API:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `VITE_SUPABASE_URL` (if using Supabase)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (if using Supabase)
   - `VITE_ANTHROPIC_API_KEY` (optional - can be set client-side)

## Step 4: Deploy

The deployment happens automatically!

- Push any changes to the `main` branch
- GitHub Actions will automatically:
  1. Build your app
  2. Deploy to GitHub Pages
  3. Available at: `https://pjoshipu.github.io/agentic-ai-platformengineering/`

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in your repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Verify Deployment

1. Go to the **Actions** tab
2. Watch the workflow progress
3. Once complete, visit: `https://pjoshipu.github.io/agentic-ai-platformengineering/`

## Custom Domain (Optional)

If you want to use a custom domain like `pjoshipu.github.io` directly:

1. Rename repository to `pjoshipu.github.io`
2. Update `vite.config.ts`:
   ```typescript
   base: "/",  // Change from "/agentic-ai-platformengineering/"
   ```
3. Push changes
4. Access at: `https://pjoshipu.github.io/`

## Troubleshooting

### Build fails
- Check the **Actions** tab for error logs
- Verify all dependencies are in `package.json`
- Ensure Node version matches (v20)

### 404 errors on deployment
- Verify the `base` path in `vite.config.ts` matches your repository name
- Check that GitHub Pages is enabled in repository settings

### Environment variables not working
- Verify secrets are added in repository settings
- Secrets must start with `VITE_` to be exposed to the client

## Footer Credit

The footer now includes credit to **Ajay Chankramath** for the course and materials that inspired this project, visible on every page of the application.

## Support

For issues with the application, check the repository issues page or contact the maintainer.
