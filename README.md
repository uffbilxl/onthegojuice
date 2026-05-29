# On The Go Juice 🥤

Cold-pressed, freshly made juices delivered personally within Birmingham by the founder, David.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Storefront | Vanilla HTML / CSS / JS (static) |
| Checkout & Admin | Next.js 14 (Pages Router) |
| Payments | Stripe Checkout (Sandbox → Live) |
| Database | Supabase (PostgreSQL + RLS) |
| Deployment | Vercel (recommended) |

---

## Project Structure

```
onthegojuice/
├── index.html              # Main storefront
├── css/                    # Shared stylesheets
├── js/                     # Cart logic (localStorage)
├── images/                 # Product images + hero video
├── public/                 # Static assets served by Next.js
├── src/
│   ├── pages/
│   │   ├── checkout.js     # Stripe-wired checkout page
│   │   ├── thank-you.js    # Post-payment confirmation
│   │   ├── admin/          # Operations dashboard
│   │   └── api/
│   │       ├── checkout-session.js   # Creates Stripe session
│   │       ├── webhooks/stripe.js    # Saves paid orders to Supabase
│   │       └── admin/                # Login + fulfillment updates
│   └── lib/
│       ├── supabaseClient.js   # Anon client (browser)
│       └── supabaseAdmin.js    # Service-role client (server only)
└── schema.sql              # Supabase orders table + RLS policies
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

ADMIN_PASSWORD=your-secure-password
```

### 3. Set up the database

Paste the contents of `schema.sql` into the **Supabase SQL Editor** and run it.

### 4. Run locally

```bash
# Static storefront (port 3000)
python3 -m http.server 3000

# Next.js app (port 3001)
npm run dev
```

Visit `http://localhost:3000` for the storefront and `http://localhost:3001/admin` for the dashboard.

### 5. Test webhooks locally

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Copy the webhook signing secret it prints and add it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## Deployment (Vercel)

1. Push to GitHub (already done)
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all `.env.local` variables in the Vercel dashboard under **Settings → Environment Variables**
4. Set `STRIPE_WEBHOOK_SECRET` to your live/test webhook secret from the Stripe dashboard

---

## Delivery Area

On The Go Juice delivers personally within a **10-mile radius of Birmingham City Centre**. The checkout validates postcodes against the `B` prefix (B1, B2, B15, etc.). Orders outside this area are directed to local pickup instead.

---

## Admin Dashboard

Visit `/admin` and log in with the password set in `ADMIN_PASSWORD`. David can:

- View all orders (newest first)
- See delivery vs. pickup at a glance (colour-coded rows)
- Update fulfilment status: **Processing → Out for Delivery → Completed**
