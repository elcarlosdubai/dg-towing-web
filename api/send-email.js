const nodemailer = require('nodemailer');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailHtml({ type, job, reviewLink }) {
  const name = escapeHtml(job.customer_name || 'Valued Customer');
  const service = escapeHtml(job.service_type || 'Towing / Grúa');
  const vehicle = escapeHtml(job.vehicle || '');
  const pickup = escapeHtml(job.pickup || '');
  const destination = escapeHtml(job.destination || 'N/A');
  const total = Number(job.total_price || 0).toFixed(2);
  const payment = escapeHtml(job.payment_method || 'Pending');
  const safeReviewLink = escapeHtml(reviewLink || 'https://dgtowingllc.com');

  const isQuote = type === 'quote';
  const headerTitle = isQuote ? 'Your DG Towing LLC Quote' : 'Thank You for Choosing DG Towing LLC';
  const introText = isQuote
    ? 'Thank you for contacting <strong>DG Towing LLC</strong>. Here is your upfront price estimate for your vehicle:'
    : 'Thank you for trusting <strong>DG Towing LLC</strong> with your vehicle. Here is your completed service receipt:';
  const priceLabel = isQuote ? 'Quoted Price' : 'Total Paid';

  const ctaBlock = isQuote
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;text-align:center;">
        <tr>
          <td style="padding:22px 20px;">
            <h2 style="margin:0 0 8px;font-size:16px;font-weight:800;color:#07101F;">Ready to dispatch a truck?</h2>
            <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#475569;">Call or WhatsApp us to confirm your pickup right away. Accepted: Apple Cash, Cash, Zelle &amp; PayPal.</p>
            <a href="tel:+13473233895" style="display:inline-block;background-color:#1D4ED8;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">Call Dispatch: (347) 323-3895</a>
          </td>
        </tr>
      </table>`
    : `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;text-align:center;">
        <tr>
          <td style="padding:24px 20px;">
            <div style="font-size:20px;color:#FBBC05;margin-bottom:6px;">★★★★★</div>
            <h2 style="margin:0 0 8px;font-size:17px;font-weight:800;color:#07101F;">How did we do today?</h2>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:#475569;">Your 10-second review on Google helps local drivers in Connecticut find fast, reliable help.</p>
            <a href="${safeReviewLink}" target="_blank" style="display:inline-block;background-color:#1D4ED8;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 26px;border-radius:999px;">Leave a 5-Star Google Review →</a>
          </td>
        </tr>
      </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#F1F5FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#07101F;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F1F5FB;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;">
        <tr>
          <td style="background-color:#07101F;padding:28px 32px;text-align:center;">
            <div style="display:inline-block;background-color:#ffffff;padding:8px 14px;border-radius:14px;margin-bottom:14px;">
              <img src="https://dgtowingllc.com/logo.jpeg" alt="DG Towing LLC" style="height:48px;width:auto;display:block;" />
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">${headerTitle}</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#93C5FD;">24/7 Local &amp; Long Distance • Waterbury, CT</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hello <strong>${name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">${introText}</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;margin-bottom:26px;">
              <tr><td style="padding:20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;color:#334155;">
                  <tr><td style="padding:6px 0;color:#64748B;">Service Type</td><td align="right" style="padding:6px 0;font-weight:700;color:#07101F;">${service}</td></tr>
                  <tr><td style="padding:6px 0;color:#64748B;">Vehicle</td><td align="right" style="padding:6px 0;font-weight:700;color:#07101F;">${vehicle}</td></tr>
                  <tr><td style="padding:6px 0;color:#64748B;">Pickup</td><td align="right" style="padding:6px 0;font-weight:600;color:#07101F;">${pickup}</td></tr>
                  <tr><td style="padding:6px 0;color:#64748B;">Drop-off</td><td align="right" style="padding:6px 0;font-weight:600;color:#07101F;">${destination}</td></tr>
                  ${!isQuote ? `<tr><td style="padding:6px 0;color:#64748B;">Payment Method</td><td align="right" style="padding:6px 0;font-weight:600;color:#07101F;">${payment}</td></tr>` : ''}
                  <tr><td style="padding:12px 0 0;border-top:1px solid #E2E8F0;font-size:15px;font-weight:800;color:#07101F;">${priceLabel}</td><td align="right" style="padding:12px 0 0;border-top:1px solid #E2E8F0;font-size:18px;font-weight:800;color:#1D4ED8;">$${total}</td></tr>
                </table>
              </td></tr>
            </table>
            ${ctaBlock}
          </td>
        </tr>
        <tr>
          <td style="background-color:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;font-size:12px;color:#64748B;">
            <strong style="color:#07101F;">DG Towing LLC</strong> • Waterbury, CT (CT • NY • NJ • MA • PA)<br/>
            24/7 Dispatch: <a href="tel:+13473233895" style="color:#1D4ED8;text-decoration:none;font-weight:600;">+1 (347) 323-3895</a> •
            <a href="mailto:info@dgtowingllc.com" style="color:#1D4ED8;text-decoration:none;">info@dgtowingllc.com</a><br/>
            <a href="https://dgtowingllc.com" style="color:#1D4ED8;text-decoration:none;font-weight:600;">https://dgtowingllc.com</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const smtpPass = process.env.SMTP_PASS;
  if (!smtpPass) {
    return res.status(500).json({ error: 'Falta configurar SMTP_PASS en Vercel Environment Variables.' });
  }

  const { to, bcc, type, job, reviewLink } = req.body || {};
  const targetTo = to || process.env.NOTIFY_EMAIL || 'info@dgtowingllc.com';
  if (!job) {
    return res.status(400).json({ error: 'Faltan los datos del servicio.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'premium293.web-hosting.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'info@dgtowingllc.com',
      pass: smtpPass,
    },
  });

  let subject = `Thank You for Choosing DG Towing LLC — Service Receipt`;
  if (type === 'quote') {
    subject = `Your DG Towing LLC Quote — ${job.vehicle || 'Vehicle Transport'}`;
  } else if (type === 'web_lead') {
    subject = `🚨 Nuevo Lead Web: ${job.customer_name || 'Cliente'} (${job.pickup} → ${job.destination})`;
  }

  const textFallback = type === 'web_lead'
    ? `Nuevo Lead desde dgtowingllc.com:\nCliente: ${job.customer_name || 'Web Lead'}\nTel: ${job.customer_phone || 'N/A'}\nEmail: ${job.customer_email || 'N/A'}\nVehículo: ${job.vehicle}\nPickup: ${job.pickup}\nDestino: ${job.destination}\nEstimado: ${job.estimated_range || 'N/A'}`
    : type === 'quote'
    ? `Hello ${job.customer_name || ''},\n\nHere is your DG Towing LLC quote:\nService: ${job.service_type || 'Towing'}\nVehicle: ${job.vehicle}\nPickup: ${job.pickup}\nDrop-off: ${job.destination}\nQuoted Price: $${Number(job.total_price || 0).toFixed(2)}\n\nCall/WhatsApp 24/7: +1 (347) 323-3895\nhttps://dgtowingllc.com`
    : `Hello ${job.customer_name || ''},\n\nThank you for choosing DG Towing LLC!\nService: ${job.service_type || 'Towing'}\nVehicle: ${job.vehicle}\nPickup: ${job.pickup}\nDrop-off: ${job.destination}\nTotal Paid: $${Number(job.total_price || 0).toFixed(2)} (${job.payment_method || 'Paid'})\n\nLeave a 5-star review on Google: ${reviewLink || 'https://dgtowingllc.com'}\n\n24/7 Dispatch: +1 (347) 323-3895`;

  const mailOptions = {
    from: `"DG Towing LLC" <${process.env.SMTP_USER || 'info@dgtowingllc.com'}>`,
    replyTo: process.env.SMTP_USER || 'info@dgtowingllc.com',
    to: targetTo,
    subject,
    text: textFallback,
    html: type === 'web_lead' ? `<div style="font-family:sans-serif;padding:20px;background:#F1F5FB;"><div style="max-width:520px;margin:auto;background:#fff;padding:24px;border-radius:16px;border:1px solid #E2E8F0;"><h2 style="margin-top:0;color:#1D4ED8;">🚨 Nuevo Lead desde la Web</h2><p><strong>Cliente:</strong> ${escapeHtml(job.customer_name)}</p><p><strong>Teléfono:</strong> ${escapeHtml(job.customer_phone || 'N/A')}</p><p><strong>Email:</strong> ${escapeHtml(job.customer_email || 'N/A')}</p><p><strong>Vehículo:</strong> ${escapeHtml(job.vehicle)}</p><p><strong>Pickup:</strong> ${escapeHtml(job.pickup)}</p><p><strong>Destino:</strong> ${escapeHtml(job.destination)}</p><p><strong>Estimado:</strong> ${escapeHtml(job.estimated_range || 'N/A')}</p><hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;"/><a href="https://www.dgtowingllc.com/admin" style="display:inline-block;background:#1D4ED8;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:13px;">Abrir en DG Towing CRM →</a></div></div>` : buildEmailHtml({ type, job, reviewLink }),
  };
  if (bcc && String(bcc).includes('@')) {
    mailOptions.bcc = String(bcc).trim();
  }

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
