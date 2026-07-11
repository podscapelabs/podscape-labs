# Podscape Labs

Production website for Podscape Labs™, built with Next.js App Router, TypeScript, and plain CSS.

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

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Edit content

All site copy, navigation links, project status, Lab Notes, and social links live in [`content/site.ts`](content/site.ts). Edit that file to update content without changing page components.

The Facebook and Discord links are placeholders and should be replaced in `siteContent.social` before launch.

## Replace assets

Replace the placeholder files below while keeping the same filenames. The layout will update without code changes.

| Asset | Stable path | Recommended format |
| --- | --- | --- |
| Podscape wordmark | `public/assets/logos/podscape-wordmark.svg` | Wide transparent SVG |
| PodBound logo | `public/assets/logos/podbound-logo.svg` | Wide transparent SVG |
| Hero photo | `public/assets/photos/hero-photo.svg` | Portrait image, at least 1200 × 1600 px |
| PodBound feature image | `public/assets/podbound/podbound-feature.svg` | Portrait image, at least 1400 × 1600 px |
| PodBound tilted card | `public/assets/podbound/podbound-card.png` | Card face artwork, approximately 5:7 aspect ratio |

For raster replacements, export the image as WebP and update the matching `src` in `app/page.tsx`. SVG logos can be replaced directly with no code change.

Asset directories:

```text
public/assets/
├── icons/
├── logos/
├── photos/
└── podbound/
```

The supplied assets are neutral, non-illustrative placeholders labelled “Official asset coming soon.”

The tilted card in the PodBound feature panel is intentionally isolated at a stable path. Replace `podbound-card.png` with another finished card face using the same filename, or update that single `src` in `app/page.tsx`.

## Theme behavior

The first visit follows the operating system light or dark preference. The header toggle saves a manual choice to `localStorage` under `podscape-theme`, and that saved choice is applied before the page renders to prevent a theme flash.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, select **Add New → Project** and import the repository.
3. Keep the detected framework preset as **Next.js**.
4. Leave the build command as `next build` and output settings at their defaults.
5. Deploy.

No environment variables are required. Vercel will use the Node.js requirement declared in `package.json`.

## Structure

```text
app/              App Router layout, page, metadata, and global styles
components/       Header, footer, theme control, and interface icons
content/site.ts   Centralized editable site content
public/assets/    Stable paths for official brand and project assets
```
