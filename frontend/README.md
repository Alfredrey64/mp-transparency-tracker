# Simple Politics

A simple breakdown of UK politics: who your MP is, who funds them, how they vote and what the numbers say about the country, from official sources and in plain English. Independent and unofficial.

Designed and built by Alfred Reynolds.

## Running it

```bash
cd frontend
npm install
npm run dev
```

The data pipeline lives in the `fetch-*.js` scripts at the top of the repository. Run them by hand, or on the schedule in `.github/workflows`, to refresh what the site shows.

## Voice

Plain, calm and specific. Short sentences, everyday words, no jargon without an explanation and no spin. Where there are two sides, state both fairly.

## Identity

- **Name:** Simple Politics
- **Line:** UK politics, made simple.
- **Mark:** a speech bubble with a tick in it, a clear answer, on indigo (`public/favicon.svg`, and `src/components/LogoMark.jsx`).

## Embeddable cards

Any answer, and any chart on a Britain in numbers page, has an **Embed** button that gives out an iframe for another website. The card is a second Vite page (`embed.html`, `src/embed.jsx`, `src/components/EmbedApp.jsx`) with no menu or search, at `/embed.html#/answer/<id>` or `/embed.html#/chart/<page>/<measure>`, with `?theme=dark` for a dark card. The address helpers are in `src/lib/embed.js`. `vercel.json` lets these two paths be framed by any site (`frame-ancestors *`) while the rest of the site still refuses to be framed.
