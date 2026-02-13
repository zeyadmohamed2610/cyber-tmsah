# CYBER TMSAH

> An academic platform for cybersecurity students at Capital Technology University (جامعة العاصمة التكنولوجية). Study materials, lecture schedules, and reviews — all in one place.

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![RTL](https://img.shields.io/badge/RTL-Arabic-009639)](https://en.wikipedia.org/wiki/Right-to-left)

---

## Features

- **Home** — Hero, today's schedule with section selector, founder introduction
- **Materials** — Browse subjects with PDF links and article summaries
- **Schedule** — Full weekly timetable (all sections, all days)
- **Subject Detail** — Per-subject PDF viewer placeholder and linked articles
- **PWA Support** — Installable, works offline, cached assets
- **SEO** — Meta tags, Open Graph, Twitter Cards, structured data (JSON-LD)
- **RTL Layout** — Full Arabic right-to-left support with Cairo font
- **Performance** — Lazy-loaded routes, code splitting, optimized fonts

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 5 |
| Framework | React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix) |
| Routing | React Router 6 |
| SEO | react-helmet-async |
| PWA | vite-plugin-pwa (Workbox) |

---

## Project Structure

```
cyber-tmsah/
├── public/                    # Static assets (served at root)
│   ├── favicon.png            # App icon (tab, PWA, apple-touch)
│   ├── hero-bg.jpg            # Hero section background
│   ├── placeholder.svg        # Fallback image
│   ├── robots.txt             # Search engine directives
│   └── sitemap.xml            # URL map for crawlers
│
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Root component, routes, providers
│   ├── index.css              # Global styles, Tailwind, Cairo font
│   ├── App.css                # Component-specific styles
│   ├── vite-env.d.ts          # Vite client types
│   │
│   ├── assets/                # Images imported in code
│   │   ├── founder.jpg        # Founder profile photo
│   │   └── hero-bg.jpg        # (alternate path for hero)
│   │
│   ├── components/            # Reusable UI components
│   │   ├── Layout.tsx         # Page shell: Navbar, main, Footer, FloatingBlogButton
│   │   ├── Navbar.tsx         # Top navigation, mobile menu
│   │   ├── NavLink.tsx        # Navigation link with active state
│   │   ├── Footer.tsx         # Footer with links and copyright
│   │   ├── FounderCard.tsx    # Founder profile card (photo, bio, socials)
│   │   ├── FloatingBlogButton.tsx  # Floating CTA to blog
│   │   ├── SEO.tsx            # Dynamic meta tags (Helmet)
│   │   ├── ScrollReveal.tsx   # Scroll-triggered animations
│   │   ├── Loading.tsx        # Loading screen for lazy routes
│   │   ├── ErrorBoundary.tsx  # Error catching UI
│   │   ├── Analytics.tsx      # Analytics / tracking
│   │   ├── OptimizedImage.tsx # Image with lazy load, placeholders
│   │   │
│   │   └── ui/                # shadcn/ui primitives
│   │       ├── button.tsx     # Buttons
│   │       ├── card.tsx       # Card layout
│   │       ├── accordion.tsx  # Collapsible sections
│   │       ├── dialog.tsx     # Modals
│   │       ├── select.tsx     # Dropdowns
│   │       ├── tabs.tsx       # Tab panels
│   │       └── ...            # Other Radix-based components
│   │
│   ├── pages/                 # Route-level components
│   │   ├── Index.tsx          # Home: hero, today schedule, founder
│   │   ├── Materials.tsx      # Materials list (subjects grid)
│   │   ├── SubjectDetail.tsx  # Subject detail (PDF, articles)
│   │   ├── Schedule.tsx       # Full week schedule
│   │   └── NotFound.tsx       # 404 page
│   │
│   ├── data/
│   │   └── mockData.ts        # Mock data: subjects, schedule, founder
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx     # Mobile breakpoint detection
│   │   ├── use-toast.ts       # Toast notifications
│   │   └── use-performance.ts # Performance monitoring
│   │
│   └── lib/
│       └── utils.ts           # Utilities (e.g. cn for classnames)
│
├── index.html                 # HTML entry, favicon, meta
├── vite.config.ts             # Vite + PWA config
├── tailwind.config.ts         # Tailwind theme, Cairo font
├── postcss.config.js          # PostCSS (Tailwind)
├── tsconfig.json              # TypeScript config
├── tsconfig.app.json          # App TS config
├── tsconfig.node.json         # Node (Vite) TS config
├── components.json            # shadcn/ui config
├── eslint.config.js           # ESLint rules
├── vitest.config.ts           # Test config
└── package.json               # Dependencies and scripts
```

---

## Folder & File Reference

### Root

| File | Purpose |
|------|---------|
| `index.html` | HTML shell, favicon, preconnect, meta tags |
| `vite.config.ts` | Vite bundler, PWA plugin, path alias `@` → `src` |
| `tailwind.config.ts` | Theme colors, Cairo font, animations |
| `postcss.config.js` | PostCSS pipeline (Tailwind) |
| `tsconfig.json` | Base TypeScript configuration |
| `components.json` | shadcn/ui settings (paths, Tailwind) |

### `public/`

Static files served at `/`. No processing.

| File | Purpose |
|------|---------|
| `favicon.png` | Single source for all favicon uses |
| `hero-bg.jpg` | Hero background image |
| `placeholder.svg` | Generic fallback image |
| `robots.txt` | Crawler allow/disallow rules |
| `sitemap.xml` | URLs for SEO |

### `src/`

| File | Purpose |
|------|---------|
| `main.tsx` | React root, mounts `<App />` |
| `App.tsx` | Routes, HelmetProvider, ErrorBoundary, lazy-loaded pages |
| `index.css` | Global CSS, Tailwind directives, Cairo @font-face |
| `App.css` | Extra component styles |
| `vite-env.d.ts` | Vite client type declarations |

### `src/components/`

| Component | Purpose |
|-----------|---------|
| `Layout.tsx` | Wraps pages with Navbar, main, Footer, FloatingBlogButton |
| `Navbar.tsx` | Header, logo, nav links, mobile hamburger menu |
| `NavLink.tsx` | Styled nav link with active state |
| `Footer.tsx` | Footer content, social links, copyright |
| `FounderCard.tsx` | Founder profile (photo, bio, experience, socials) |
| `FloatingBlogButton.tsx` | Floating CTA button (e.g. to blog) |
| `SEO.tsx` | Dynamic title, description, Open Graph, Twitter, JSON-LD |
| `ScrollReveal.tsx` | Scroll animation wrapper |
| `Loading.tsx` | Full-screen loader for Suspense fallback |
| `ErrorBoundary.tsx` | Catches React errors, shows fallback UI |
| `Analytics.tsx` | Analytics / tracking setup |
| `OptimizedImage.tsx` | Lazy loading, placeholder handling |
| `ui/*` | shadcn/ui components (Radix primitives + Tailwind) |

### `src/pages/`

| Page | Route | Purpose |
|------|-------|---------|
| `Index.tsx` | `/` | Home: hero, today’s schedule, founder |
| `Materials.tsx` | `/materials` | Subject cards grid |
| `SubjectDetail.tsx` | `/materials/:id` | Subject PDF placeholder + articles |
| `Schedule.tsx` | `/schedule` | Full week schedule |
| `NotFound.tsx` | `*` | 404 fallback |

### `src/data/`

| File | Purpose |
|------|---------|
| `mockData.ts` | Sections, `weekSchedule`, `subjects`, `founderSocials`, helpers |

### `src/hooks/`

| Hook | Purpose |
|------|---------|
| `use-mobile.tsx` | Detects mobile viewport |
| `use-toast.ts` | Toast state and API |
| `use-performance.ts` | Performance metrics / monitoring |

### `src/lib/`

| File | Purpose |
|------|---------|
| `utils.ts` | `cn()` for merging Tailwind classes |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

Runs at [http://localhost:8080](http://localhost:8080).

### Build

```bash
npm run build
```

Output: `dist/`

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm run test
```

---

## Configuration

### Environment

No env vars required for basic run. Analytics or API keys (if used) can be set via `.env` (not committed).

### PWA

PWA is configured in `vite.config.ts`:

- `registerType: "autoUpdate"` — auto-updates on new deploy
- Icons use `favicon.png`
- Workbox caches fonts (Google Fonts)

---

## License

Private project. All rights reserved.
