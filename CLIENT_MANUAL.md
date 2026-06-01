# On The Go Juice — Client Operations Manual

This guide explains how to manage your website content, products, events, and partner inquiries directly through the Supabase Dashboard — no coding required.

---

## 1. Logging Into the Supabase Dashboard

1. Open your browser and go to **[https://app.supabase.com](https://app.supabase.com)**
2. Sign in with the email and password associated with your On The Go Juice project.
3. From the project list, click on **"onthegojuice"** (or the project name you used when setting up).
4. You are now inside your project dashboard.

> **Tip:** Bookmark `https://app.supabase.com` for quick access. Never share your login credentials.

---

## 2. Navigating to Your Tables

Once inside your project:

1. In the left sidebar, click **"Table Editor"** (the grid icon).
2. You will see a list of all your database tables on the left. The main ones are:

| Table | What It Contains |
|---|---|
| `orders` | All customer orders placed through the website |
| `event_rsvps` | Registrations for your soft launch events |
| `partner_inquiries` | B2B / wholesale enquiries from businesses |
| `discount_codes` | Promo codes for customer discounts |
| `customer_rewards` | Reward points tracking per customer |

Click any table name to open it and view or edit its rows.

---

## 3. Viewing Orders

1. Click **`orders`** in the Table Editor.
2. You'll see all customer orders, newest first.
3. Key columns to look at:
   - **`customer_name`** / **`customer_email`** — who ordered
   - **`items`** — what they ordered (JSON format)
   - **`total_amount`** — order value in pounds
   - **`payment_status`** — `paid` or `pending`
   - **`fulfillment_status`** — `processing`, `fulfilled`, or `cancelled`

To mark an order as fulfilled:
1. Click the row to open it.
2. Click the **`fulfillment_status`** cell and type `fulfilled`.
3. Click **Save** (or press Enter).

---

## 4. Managing Event RSVPs

1. Click **`event_rsvps`** in the Table Editor.
2. Each row is one person who registered for your event.
3. You'll see their **name**, **email**, **number of attendees**, and any **message** they left.

**To export your RSVP list as a spreadsheet:**
1. Click the **"…" (More)** button at the top right of the table.
2. Select **"Export as CSV"**.
3. Open the downloaded file in Excel or Google Sheets.

> **To update the event date** shown on the website countdown timer, ask your developer to change the `EVENT_DATE` variable in `events.html` (one line of code). It currently reads: `const EVENT_DATE = new Date('2026-07-05T10:00:00');`

---

## 5. Managing Partner Inquiries

1. Click **`partner_inquiries`** in the Table Editor.
2. Each row is a business that submitted the partner form.
3. Key columns:
   - **`business_name`** / **`contact_name`** / **`email`** / **`phone`** — their details
   - **`org_type`** — `gym`, `cafe`, `corporate`, or `other`
   - **`weekly_volume`** — estimated bottles per week
   - **`status`** — starts as `new`; you can update to `contacted`, `active`, or `declined`

**To update a partner's status:**
1. Click the row.
2. Change the **`status`** field to `contacted` after you've emailed them.
3. Change to `active` once they're confirmed as a stockist.
4. Click **Save**.

---

## 6. Adding or Removing Products (Flavours)

Products are currently defined in the `js/main.js` source file (not in the database). To change product details without touching code, ask your developer to migrate products to the `products` table — this can be done in a future update.

**For now, to update a product name, price, or ingredients:**
1. Contact your developer and provide:
   - The product's current name
   - What you want to change (name, price, ingredients)
2. The change will be in `js/main.js` inside the `PRODUCTS` array.

> **Future improvement:** Products can be moved to Supabase so you can edit them directly here, just like orders. Ask your developer about this when you're ready.

---

## 7. Creating Discount Codes

1. Click **`discount_codes`** in the Table Editor.
2. Click **"+ Insert row"** at the top.
3. Fill in:

| Field | What to Enter |
|---|---|
| `code` | The promo code (e.g. `SUMMER20`) — must be uppercase |
| `email` | The customer's email this code is for (or `bulk@promo.com` for general codes) |
| `type` | `welcome` for new customer codes |
| `discount_percent` | e.g. `20` for 20% off (leave blank if using fixed) |
| `discount_fixed_pence` | e.g. `199` for £1.99 off (leave blank if using percent) |
| `min_order_pence` | e.g. `500` for minimum £5 order (use `0` for no minimum) |
| `used` | Leave as `false` |

4. Click **Save**.

The customer can now use this code at checkout.

---

## 8. Sending SQL Queries (Advanced)

If you ever need to search or update data in bulk:

1. In the left sidebar, click **"SQL Editor"** (the terminal icon).
2. Type your query and click **Run**.

Example — find all orders over £20:
```sql
SELECT * FROM orders WHERE total_amount > 20 ORDER BY created_at DESC;
```

Example — see all new partner inquiries this month:
```sql
SELECT * FROM partner_inquiries WHERE status = 'new' ORDER BY created_at DESC;
```

> **Caution:** Be careful with `UPDATE` and `DELETE` queries. If unsure, always ask your developer first.

---

## 9. Important Security Notes

- **Never share your Supabase login** with anyone you don't fully trust.
- **Do not delete rows from `orders`** — keep them for your records even after fulfilment.
- **Do not modify `discount_codes` that are already `used = true`** — these are historical records.
- The Supabase dashboard shows your live production data. Any change you make is **immediate and real**.

---

## 10. Getting Help

If something looks wrong or you need a change that isn't covered here, contact your developer and describe:
1. Which table or page is affected
2. What you expected to see vs. what you're seeing
3. Any error messages shown

---

*Last updated: June 2026 — On The Go Juice*
