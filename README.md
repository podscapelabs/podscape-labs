# Podscape Labs

Platform-first website for Podscape Labs™, built with Next.js App Router, TypeScript, and plain CSS.

## Local setup

Requirements:

- Node.js 20.9 or newer
- npm 10 or newer

Install and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Construction mode and owner preview

The public homepage is a construction page. The complete working site is available only through the owner studio at `/admin`.

Create `.env.local` from `.env.example` and set both values:

```text
PODSCAPE_ADMIN_PASSWORD=
PODSCAPE_ADMIN_SECRET=
```

Use a long unique password and a random secret of at least 32 characters. Both values must also be added to the Vercel project before deploying. Owner sessions use a signed, HTTP-only cookie, expire after 12 hours, and can be ended from the studio dashboard.

The protected site preview is never linked from the public construction page. `/admin` and its preview are marked `noindex`, disallowed in `robots.txt`, and checked on the server for every request.

The working platform also includes protected PodDex routes at `/poddex`, `/poddex/species`, and `/poddex/species/[slug]`. Until construction mode is removed, every PodDex request receives the same server-side owner check and redirects public visitors to the construction page.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Edit content

Platform copy, navigation links, project status, Lab Notes, and social links live in [`content/site.ts`](content/site.ts). PodDex records live in [`content/species.ts`](content/species.ts). Edit those files to update content without changing page components.

The Facebook and Discord links are placeholders and should be replaced in `siteContent.social` before launch.

## Replace assets

Replace the placeholder files below while keeping the same filenames. The layout will update without code changes.

| Asset | Stable path | Recommended format |
| --- | --- | --- |
| Podscape wordmark | `public/assets/logos/podscape-wordmark.svg` | Wide transparent SVG |
| PodBound logo | `public/assets/logos/podbound-logo.png` | Wide transparent PNG |
| Hero photo | `public/assets/photos/hero-photo.svg` | Portrait image, at least 1200 × 1600 px |
| PodBound tilted card | `public/assets/podbound/podbound-card.png` | Card face artwork, approximately 5:7 aspect ratio |

For raster replacements, export the image as WebP and update the matching `src` in `app/page.tsx`. Logo assets can be replaced directly with no code change when their filenames and formats stay the same.

Asset directories:

```text
public/assets/
├── icons/
├── logos/
├── photos/
└── podbound/
```

Any remaining supplied placeholders are neutral and clearly labelled “Official asset coming soon.”

The tilted card in the PodBound feature panel is intentionally isolated at a stable path. Replace `podbound-card.png` with another finished card face using the same filename, or update that single `src` in `app/page.tsx`.

## Theme behavior

The first visit follows the operating system light or dark preference. The header toggle saves a manual choice to `localStorage` under `podscape-theme`, and that saved choice is applied before the page renders to prevent a theme flash.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, select **Add New → Project** and import the repository.
3. Keep the detected framework preset as **Next.js**.
4. Leave the build command as `next build` and output settings at their defaults.
5. Deploy.

Add `PODSCAPE_ADMIN_PASSWORD` and `PODSCAPE_ADMIN_SECRET` to the Vercel project before deploying. Vercel will use the Node.js requirement declared in `package.json`.

## Structure

```text
app/              App Router layout, page, metadata, and global styles
components/       Platform shell, reusable cards, search, theme control, and interface pieces
content/site.ts   Centralized editable site content
content/species.ts Structured PodDex catalogue records and release status
public/assets/    Stable paths for official brand and project assets
```
