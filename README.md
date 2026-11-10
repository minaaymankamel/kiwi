# Kiwi Digital Menu

Bilingual (Arabic / English) digital menu and protected admin dashboard for Kiwi.

## Scope
- Public menu with category browsing and product search.
- Arabic RTL and English LTR language switching.
- Admin authentication and CRUD for categories and products.
- Product availability and optional image upload.
- No cart, checkout, online ordering, payments, delivery tracking, or QR integration.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage, RLS)

## Owner links
- LinkedIn: https://www.linkedin.com/in/mina-ayman-gerges-kamel
- WhatsApp username: mina.ayman.g

## Setup
1. Copy `.env.example` to `.env`.
2. Add your Supabase project URL and publishable/anon key.
3. Run `npm install` and `npm run dev`.

Never put a Supabase service-role key in browser code.
