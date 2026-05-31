import nodemailer from 'nodemailer';

const GREEN  = '#1d6c00';
const ORANGE = '#ff6b00';
const FROM_NAME = 'On The Go Juice';
const FROM = `"${FROM_NAME}" <onthegojuiceadmin@gmail.com>`;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: 'onthegojuiceadmin@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
});

async function sendMail({ to, subject, html, text }) {
  await transporter.sendMail({
    from: FROM, to, subject, html, text,
    headers: { 'X-Priority': '3', 'X-Mailer': FROM_NAME },
  });
}

// ── HTML wrapper ─────────────────────────────────────────────────────
function wrap(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr><td align="center" style="padding:40px 16px">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr>
        <td style="background:${GREEN};padding:28px 32px;text-align:center">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.02em">${FROM_NAME}</p>
          <p style="margin:5px 0 0;color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:0.18em;text-transform:uppercase">Fresh &bull; Natural &bull; On The Go</p>
        </td>
      </tr>
      <tr><td style="padding:36px 36px 28px">${body}</td></tr>
      <tr>
        <td style="background:#f9f6f1;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">${FROM_NAME} &bull; Birmingham, UK</p>
          <p style="margin:5px 0 0;font-size:12px">
            <a href="mailto:onthegojuiceadmin@gmail.com" style="color:${ORANGE};text-decoration:none">onthegojuiceadmin@gmail.com</a>
          </p>
          <p style="margin:5px 0 0;font-size:11px;color:#d1d5db">Can't find our emails? Please check your spam folder and mark us as safe.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ── Emails ───────────────────────────────────────────────────────────

export async function sendWelcomeDiscount(to, code) {
  const html = wrap(`
    <h2 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#111;letter-spacing:-0.03em">
      Here's your 20% off code
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65">
      Thanks for joining us! Use the code below at checkout to get
      <strong style="color:${GREEN}">20% off your first order</strong>
      (minimum spend £10).
    </p>

    <div style="background:#f9f6f1;border:2px dashed ${GREEN};border-radius:12px;padding:22px;text-align:center;margin:0 0 28px">
      <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.18em">Your discount code</p>
      <p style="margin:0;font-size:34px;font-weight:900;color:${GREEN};letter-spacing:0.14em;font-family:'Courier New',monospace">${code}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%">
      <tr><td style="font-size:13px;color:#6b7280;line-height:2">
        ✓ &nbsp;20% off your entire order<br>
        ✓ &nbsp;Minimum spend of £10<br>
        ✓ &nbsp;Single use — just for you
      </td></tr>
    </table>

    <a href="https://onthegojuice.vercel.app/#products"
       style="display:inline-block;background:${ORANGE};color:#fff;padding:14px 32px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:0.01em">
      Shop Now &rarr;
    </a>
  `);

  const text = `Here's your 20% off code: ${code}\n\nUse it at checkout on orders over £10.\nShop now: https://onthegojuice.vercel.app/#products\n\nSingle use. On The Go Juice, Birmingham.`;

  await sendMail({ to, subject: `Your discount code from ${FROM_NAME}`, html, text });
}

export async function sendFreeBottleReward(to, code) {
  const html = wrap(`
    <h2 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#111;letter-spacing:-0.03em">
      Free bottle unlocked!
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65">
      You've bought 7 bottles — so your next one is <strong style="color:${GREEN}">completely free</strong>!
      Use the code below at checkout.
    </p>

    <div style="background:#f9f6f1;border:2px dashed ${ORANGE};border-radius:12px;padding:22px;text-align:center;margin:0 0 28px">
      <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.18em">Your free bottle code</p>
      <p style="margin:0;font-size:34px;font-weight:900;color:${ORANGE};letter-spacing:0.14em;font-family:'Courier New',monospace">${code}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%">
      <tr><td style="font-size:13px;color:#6b7280;line-height:2">
        ✓ &nbsp;£1.99 off your next order<br>
        ✓ &nbsp;No minimum spend<br>
        ✓ &nbsp;Single use
      </td></tr>
    </table>

    <a href="https://onthegojuice.vercel.app/#products"
       style="display:inline-block;background:${GREEN};color:#fff;padding:14px 32px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:0.01em">
      Claim Your Free Bottle &rarr;
    </a>
  `);

  const text = `Your free bottle code: ${code}\n\nYou've bought 7 bottles so your next one is free. No minimum spend.\nShop now: https://onthegojuice.vercel.app/#products\n\nOn The Go Juice, Birmingham.`;

  await sendMail({ to, subject: `Your free bottle from ${FROM_NAME}`, html, text });
}

export async function sendOrderConfirmation(to, { name, orderId, items, deliveryMethod, shippingAddress, totalPence, discountPence }) {
  const isDelivery = deliveryMethod === 'local_delivery';
  const firstName = (name || 'there').split(' ')[0];
  const orderRef = `#${orderId.slice(-8).toUpperCase()}`;

  const subtotalPence = items.reduce((s, i) => s + (i.p || 0) * (i.q || 0), 0);
  const deliveryPence = totalPence + (discountPence || 0) - subtotalPence;

  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:0.9rem;color:#374151">
        ${i.n || 'Item'} &times; ${i.q}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:0.9rem;color:#374151;text-align:right;white-space:nowrap">
        £${((i.p || 0) * (i.q || 0) / 100).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const discountRow = discountPence > 0 ? `
    <tr>
      <td style="padding:6px 0;font-size:0.88rem;color:#1d6c00">Discount applied</td>
      <td style="padding:6px 0;font-size:0.88rem;color:#1d6c00;text-align:right;font-weight:600">–£${(discountPence / 100).toFixed(2)}</td>
    </tr>
  ` : '';

  const deliveryRow = deliveryPence > 0 ? `
    <tr>
      <td style="padding:6px 0;font-size:0.88rem;color:#6b7280">Delivery</td>
      <td style="padding:6px 0;font-size:0.88rem;color:#6b7280;text-align:right">£${(deliveryPence / 100).toFixed(2)}</td>
    </tr>
  ` : `
    <tr>
      <td style="padding:6px 0;font-size:0.88rem;color:#6b7280">Delivery</td>
      <td style="padding:6px 0;font-size:0.88rem;color:#6b7280;text-align:right">Free</td>
    </tr>
  `;

  const deliveryInfo = isDelivery
    ? `<p style="margin:0;font-size:0.88rem;color:#374151;line-height:1.7">
        Your order will be personally delivered by David to:<br/>
        <strong>${shippingAddress || 'your address'}</strong><br/>
        We'll confirm your delivery slot by email shortly.
       </p>`
    : `<p style="margin:0;font-size:0.88rem;color:#374151;line-height:1.7">
        Your order is ready for <strong>local pickup</strong> from our Birmingham pickup point.<br/>
        We'll email you to confirm the exact location and available times.
       </p>`;

  const html = wrap(`
    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:${GREEN};border-radius:50%;margin-bottom:14px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 style="margin:0 0 6px;font-size:24px;font-weight:900;color:#111;letter-spacing:-0.03em">Order Confirmed!</h2>
      <p style="margin:0;font-size:14px;color:#9ca3af">Thanks ${firstName}, your fresh juices are on their way.</p>
    </div>

    <div style="background:#f9f6f1;border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:0.8rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em">Order reference</span>
      <span style="font-size:1rem;font-weight:800;color:${GREEN};font-family:'Courier New',monospace;letter-spacing:0.1em">${orderRef}</span>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <thead>
        <tr>
          <th style="text-align:left;font-size:0.75rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em;padding-bottom:8px;border-bottom:2px solid #e5e7eb">Item</th>
          <th style="text-align:right;font-size:0.75rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em;padding-bottom:8px;border-bottom:2px solid #e5e7eb">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tbody>
        ${discountRow}
        ${deliveryRow}
        <tr>
          <td style="padding:10px 0 0;font-size:1rem;font-weight:800;color:#111;border-top:2px solid #e5e7eb">Total Paid</td>
          <td style="padding:10px 0 0;font-size:1rem;font-weight:800;color:#111;text-align:right;border-top:2px solid #e5e7eb">£${(totalPence / 100).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="background:#f9f6f1;border-radius:10px;padding:16px 18px;margin-bottom:28px">
      <p style="margin:0 0 8px;font-size:0.75rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em">${isDelivery ? 'Delivery details' : 'Pickup details'}</p>
      ${deliveryInfo}
    </div>

    <p style="margin:0 0 20px;font-size:0.88rem;color:#6b7280;line-height:1.65">
      Questions? Just reply to this email or contact us at
      <a href="mailto:onthegojuiceadmin@gmail.com" style="color:${ORANGE}">onthegojuiceadmin@gmail.com</a>.
    </p>

    <a href="https://onthegojuice.vercel.app"
       style="display:inline-block;background:${GREEN};color:#fff;padding:13px 28px;border-radius:999px;font-weight:700;font-size:14px;text-decoration:none">
      Visit Our Store &rarr;
    </a>
  `);

  const itemsText = items.map(i => `  ${i.n} x${i.q} — £${((i.p || 0) * (i.q || 0) / 100).toFixed(2)}`).join('\n');
  const text = `Order confirmed ${orderRef}\n\nThanks ${firstName}!\n\nOrder summary:\n${itemsText}\nTotal: £${(totalPence / 100).toFixed(2)}\n\n${isDelivery ? `Delivering to: ${shippingAddress}` : 'Pickup from Birmingham — we\'ll confirm location by email.'}\n\nQuestions? Email onthegojuiceadmin@gmail.com\n\nOn The Go Juice, Birmingham.`;

  await sendMail({ to, subject: `Order confirmed ${orderRef} — ${FROM_NAME}`, html, text });
}

export async function sendOrderCancelled(to, { name, orderId }) {
  const firstName = (name || 'there').split(' ')[0];
  const orderRef = `#OTGJ-${orderId.slice(-8).toUpperCase()}`;

  const html = wrap(`
    <h2 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#111;letter-spacing:-0.03em">
      Your order has been cancelled
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.65">
      Hi ${firstName}, we're sorry to let you know that your order
      <strong style="color:#111">${orderRef}</strong> has been cancelled.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65">
      If you paid for this order, your refund will be returned to your original
      payment method within <strong style="color:#111">3–5 working days</strong> depending on your bank.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65">
      We'd love to have you back — feel free to place a new order any time, or
      get in touch if you have any questions.
    </p>
    <a href="mailto:onthegojuiceadmin@gmail.com"
       style="display:inline-block;background:#111;color:#fff;padding:13px 28px;border-radius:999px;font-weight:700;font-size:14px;text-decoration:none;margin-right:12px">
      Contact Us
    </a>
    <a href="https://onthegojuice.vercel.app/#products"
       style="display:inline-block;background:${GREEN};color:#fff;padding:13px 28px;border-radius:999px;font-weight:700;font-size:14px;text-decoration:none">
      Shop Again &rarr;
    </a>
  `);

  const text = `Hi ${firstName},\n\nYour order ${orderRef} has been cancelled.\n\nIf you paid, your refund will arrive within 3–5 working days.\n\nAny questions? Email onthegojuiceadmin@gmail.com\n\nOn The Go Juice, Birmingham.`;

  await sendMail({ to, subject: `Your order ${orderRef} has been cancelled`, html, text });
}
