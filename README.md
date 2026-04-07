# Bakery ERD Oral Trainer

Solo study app for the Stratos / Group 8 CIS 4365 Oral Exam 1 ERD defense. It is built with Vite, React, TypeScript, Tailwind CSS, static JSON study content, and localStorage progress tracking.

## Run Locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Study Flow

Use the app in this order:

1. `Study` → review flashcards and domain pages.
   - `Visual ERD` uses the actual Group 8 ERD image with revealable table highlights.
2. `Practice` → run checked drills for entity PKs, FKs, attributes, domain recall, relationship rules, FK placement, bridge entities, and subtypes.
3. `Mock Oral` → run the five-minute simulation with one entity question and one relationship question.
4. `Review` → retry missed or low-mastery items.

To share the app on the same Wi-Fi network during a team study session:

```powershell
npm run dev:host
```

Then share the network URL Vite prints.

## Build

```powershell
npm run build
```

The production output is written to `dist/`.

## Content Source

The app content is project-specific, not generic database content. Seed data is stored in:

- `src/data/domains.json`
- `src/data/entities.json`
- `src/data/relationships.json`
- `src/data/associative-entities.json`
- `src/data/oral-questions.json`
- `src/data/subtypes.json`
- `src/data/erd-hotspots.json`

The current release uses `Stratos_BusinessRules.docx` plus the text-extractable `Mama_s_Little_Bakery_Management_System_ERD.pdf` as the source of truth for keys and relationships. The actual visual ERD used in the app is `public/erd/group8-erd.png`, rendered from the Group 8 ERD PDF. Relationship drill content intentionally stops at rule 46, so rules 47 and 48 are excluded from the business-rule drill set.

## Deploy

GitHub Pages:

This project includes `.github/workflows/deploy-github-pages.yml`. Push the repo to GitHub, set Pages source to GitHub Actions in the repository settings, then push to the `main` branch. The workflow builds the Vite app and publishes `dist/`.

Vercel:

```powershell
npm run build
```

Set the build command to `npm run build` and the output directory to `dist`.

Netlify:

```powershell
npm run build
```

Set the publish directory to `dist`. The included `netlify.toml` handles single-page-app route fallback.

## Local Progress

No login is required. Each teammate gets their own progress data in their browser localStorage. Use Settings to export or import progress JSON.
