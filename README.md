# 🌬️ Tarifa Wind

**Wind first. Meetings second.**

Stable React/Vite/TypeScript app for Tarifa nomads. It generates:

- a modern 7-day wind calendar web app
- a `forecast.json` feed
- a `tarifa-wind.ics` calendar feed
- an hourly GitHub Pages deployment

## Stable build

This version includes:

- `package.json`
- `package-lock.json`
- React + React DOM
- TypeScript type packages
- Vite config
- GitHub Actions using `npm ci`
- tested local build

## Deploy

```bash
chmod +x deploy.sh
./deploy.sh YOUR_GITHUB_USERNAME tarifa-wind
```

Then in GitHub:

1. **Settings → Pages**
2. Source: **GitHub Actions**
3. **Actions → Deploy production → Run workflow**

App:

```text
https://YOUR_GITHUB_USERNAME.github.io/tarifa-wind/
```

iCal:

```text
https://YOUR_GITHUB_USERNAME.github.io/tarifa-wind/tarifa-wind.ics
```

## Local dev

```bash
npm ci
npm run generate
npm run dev
```

Build:

```bash
npm run build
```

## Branches

- `main`: production
- `develop`: integration
- `feature/*`: new features

Production deploy runs on `main`.
