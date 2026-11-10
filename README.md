# Kiwi Digital Menu

Bilingual Arabic / English digital menu and protected admin dashboard.

## Features
- Arabic RTL / English LTR language switch
- Public menu, category filters and product search
- Supabase Auth admin sign-in
- Admin-only product create, edit, delete and availability controls
- Category creation and optional product image uploads
- Owner links: [LinkedIn](https://www.linkedin.com/in/mina-ayman-gerges-kamel)
- WhatsApp username: @mina.ayman.g (a direct chat URL needs a phone number)

## Stack
React, TypeScript, Vite, Tailwind CSS, Supabase.

## Local setup
1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env`.
3. Add the Supabase Project URL and publishable (or legacy anon) key.
4. Run `npm install`, then `npm run dev`.
5. Run `npm run build` before deployment.

## Supabase
Create an admin user in Supabase Authentication, then insert that user's UUID into `public.admin_users`. The schema and RLS policies are provisioned in the connected Kiwi Supabase project. Never expose a service-role key in frontend code.

## Scope
No online ordering, cart, checkout, payment gateway, delivery tracking, or QR integration.
