<div align="center">

# Route Mapper

### Discover every page, API endpoint, and credential your web app exposes.

A powerful web crawler and API route mapper built with **Next.js 16**, **Playwright**, and **React 19**. Automatically navigates your site, detects authentication flows, captures tokens, and generates comprehensive reports with interactive visualizations.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.59-2EAD33?logo=playwright)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest)](https://vitest.dev/)

</div>

---

## Overview

**Route Mapper** crawls your web application like a real user would — clicking links, interacting with elements, and recording every HTTP request along the way. It produces a detailed inventory of:

- **Page routes** discovered during navigation
- **API endpoints** grouped by path pattern and HTTP method
- **Static assets** (CSS, JS, images, fonts)
- **External requests** to third-party domains
- **Captured credentials** from headers, cookies, localStorage, and sessionStorage
- **Errors** encountered during the crawl

All results are presented in a real-time dashboard with charts, an interactive sitemap graph, and filterable tables.

---

## Features

### Crawl Engine
- **Playwright-powered** browser automation with full JavaScript rendering
- **Smart navigation** — follows links, clicks interactive elements (up to 20 per page)
- **Auto-scroll** for lazy-loaded content (8 steps, 1250px each)
- **Configurable scope** — same-origin or related hosts
- **Abort support** — cancel running crawls at any time

### Authentication Detection
- **Auto-detect login pages** — finds username/password fields, submit buttons, and remember-me checkboxes automatically
- **Form-based auth** — fill and submit login forms with custom selectors
- **Storage state** — inject pre-captured browser state (cookies, localStorage)
- **Bearer token** — inject Authorization headers into all requests

### Real-Time Results
- **Server-Sent Events (SSE)** stream with live progress updates
- **Interactive sitemap graph** powered by XYFlow
- **Charts and analytics** with Recharts
- **Virtual scrolling** for large datasets via TanStack Virtual
- **Export** results as JSON or copy summary to clipboard

### Developer Experience
- **Clean Architecture** — domain, application, infrastructure, and presentation layers
- **Zod validation** on all API boundaries
- **Rate limiting** — 5 requests/minute per IP
- **Security headers** — X-Content-Type-Options, X-Frame-Options, CSP, and more
- **i18n** — Portuguese (pt-BR) and English out of the box
- **Dark/Light theme** with system preference detection

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router) |
| **UI** | React 19.2, Tailwind CSS 4, shadcn/ui |
| **Crawling** | Playwright 1.59 |
| **Validation** | Zod 4.3 |
| **Charts** | Recharts 3.8 |
| **Graph** | @xyflow/react 12.10 |
| **Virtualization** | @tanstack/react-virtual 3.13 |
| **Testing** | Vitest 4.1, jsdom 29 |
| **Language** | TypeScript 6.0 (strict mode) |

---

## Getting Started

### Prerequisites

- **Node.js** 18.18 or later
- **npm** 9+ (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/HanielCota/RouteMapper.git
cd RouteMapper

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

---

## Usage

### 1. Start a Crawl

Enter a URL in the home page form. Optionally configure:

| Option | Default | Description |
|---|---|---|
| **Max Pages** | 50 | Maximum number of pages to visit |
| **Timeout** | 15s | Page navigation timeout |
| **Scope** | Related | `same-origin` or `related` hosts |

### 2. Authentication (Optional)

If the target site requires login, you have three options:

**Auto-detect** — Click "Detect Login" and Route Mapper will analyze the page to find form fields automatically.

**Manual form config** — Provide CSS selectors for email, password, and submit button fields.

**Storage state** — Paste a JSON blob of cookies and localStorage entries.

**Bearer token** — Provide an Authorization header value.

### 3. View Results

The results dashboard updates in real-time via SSE and includes:

| Tab | Content |
|---|---|
| **Summary** | Overview cards with totals and captured tokens |
| **Charts** | Response codes, content types, and route distribution |
| **Sitemap** | Interactive graph of discovered pages |
| **Page Routes** | Table of all visited URLs with status codes |
| **API Routes** | Endpoints grouped by pattern and HTTP method |
| **Assets** | CSS, JS, images, and fonts |
| **External** | Third-party requests |
| **Errors** | Failures and timeouts |

---

## API Reference

### `POST /api/crawl`

Start a new crawl job.

**Request Body:**
```json
{
  "url": "https://example.com",
  "maxPages": 50,
  "timeoutMs": 15000,
  "allowedHostsMode": "related",
  "auth": {
    "strategy": "form",
    "email": "user@example.com",
    "password": "secret",
    "emailSelector": "input[type='email']",
    "passwordSelector": "input[type='password']",
    "submitSelector": "button[type='submit']"
  }
}
```

**Response:** `201 Created`
```json
{ "id": "job-uuid" }
```

### `GET /api/crawl/[id]`

Get the current status and results of a crawl job.

**Response:** `200 OK` — Returns a `CrawlJobSnapshot` with status, progress, and results.

### `GET /api/crawl/[id]/stream`

Subscribe to real-time crawl events via Server-Sent Events.

**Event types:** `progress`, `log`, `error`, `done`

### `POST /api/detect-login`

Analyze a URL to auto-detect login form selectors.

**Request Body:**
```json
{ "url": "https://example.com/login" }
```

**Response:** `200 OK`
```json
{
  "usernameSelector": "input#email",
  "passwordSelector": "input#password",
  "submitSelector": "button[type='submit']",
  "rememberMeSelector": "input#remember",
  "loginUrl": "https://example.com/login",
  "isPasswordOnly": false
}
```

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers
│   │   ├── crawl/                # Crawl endpoints
│   │   └── detect-login/         # Login detection
│   ├── results/[id]/             # Results page (dynamic)
│   ├── layout.tsx                # Root layout + providers
│   ├── page.tsx                  # Home page
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 page
├── features/crawl/               # Core feature module
│   ├── domain/                   # Business rules & types
│   ├── application/              # Use cases & ports
│   ├── infrastructure/           # Playwright, storage, events
│   └── presentation/             # UI components
│       ├── form/                 # Crawl input form
│       ├── results/              # Results dashboard
│       └── auth/                 # Credentials store
├── components/                   # Shared UI (shadcn, theme, locale)
├── shared/                       # i18n, hooks, message catalogs
└── lib/                          # Utilities (rate-limit, design tokens)
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run test suite with Vitest |
| `npm run analyze` | Build with bundle analyzer |

---

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npx vitest --coverage
```

The test suite covers domain logic, API routes, application services, and key UI interactions across **13 test files**.

---

## Internationalization

Route Mapper supports two locales out of the box:

| Locale | Language |
|---|---|
| `pt-BR` | Portuguese (Brazil) — default |
| `en` | English |

Toggle between languages using the locale switcher in the header.

---

## Security

- **Zod validation** on all API inputs — no unvalidated data reaches business logic
- **Rate limiting** — 5 requests/minute per IP with `429 Retry-After` responses
- **Security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, strict referrer policy, restricted permissions policy
- **No secrets in code** — credentials are handled in-memory and never persisted to disk
- **CSS selector validation** — prevents injection through form fields

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source. See the repository for license details.

---

<div align="center">

Built with [Next.js](https://nextjs.org/) and [Playwright](https://playwright.dev/)

</div>
