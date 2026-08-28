# E-Commerce Store

This repository contains a static e-commerce frontend and an Express API that can be deployed together on Vercel.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:5000`.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, select **Add New Project** and import the repository.
3. Keep the project root and build settings at their defaults.
4. Deploy. Vercel serves the HTML files and routes `/api/*` to `api/index.js`.

The frontend uses same-origin API requests, so no Render URL or environment variable is required.

## Important storage note

Products are source data in the API, but users, orders, and reviews are currently stored in memory. They can reset when a Vercel function restarts. Add a persistent database before using this for real customer accounts or payments.
