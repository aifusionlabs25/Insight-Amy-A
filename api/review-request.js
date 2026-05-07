function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { name, email, company, useCase, notes } = req.body || {};

    if (!name || !email || !company || !useCase) {
      return res.status(400).json({ error: 'All required fields must be completed.' });
    }

    const source = 'Insight Amy private Anam screening room';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #332a27; max-width: 660px;">
        <div style="border-bottom: 3px solid #d50057; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #d50057; margin: 0;">New Amy Insight Review Request</h2>
          <p style="color: #665a55; margin: 8px 0 0;">${source}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #554944; width: 150px;">Name</td>
            <td style="padding: 8px 12px;">${escapeHtml(name)}</td>
          </tr>
          <tr style="background: #faf7f6;">
            <td style="padding: 8px 12px; font-weight: bold; color: #554944;">Email</td>
            <td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(email)}" style="color: #d50057;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #554944;">Company / Role</td>
            <td style="padding: 8px 12px;">${escapeHtml(company)}</td>
          </tr>
          <tr style="background: #faf7f6;">
            <td style="padding: 8px 12px; font-weight: bold; color: #554944;">Use Case</td>
            <td style="padding: 8px 12px;">${escapeHtml(useCase)}</td>
          </tr>
        </table>
        <div style="margin-top: 20px;">
          <h3 style="font-size: 15px; color: #221b18; margin: 0 0 8px;">Notes</h3>
          <div style="background: #faf7f6; border: 1px solid #eee7e4; border-radius: 8px; padding: 14px; white-space: pre-line;">${escapeHtml(notes || 'No notes provided.')}</div>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee7e4; margin: 20px 0;">
        <p style="color: #817771; font-size: 0.85em;">This request came from https://insight-amy-a.vercel.app/</p>
      </div>
    `;

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not defined. Forwarding to primary X Agents signup API.');
      const forwarded = await fetch('https://xagent.aifusionlabs.app/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          useCase: `${useCase}${notes ? ` | Notes: ${notes}` : ''} | Source: ${source}`,
        }),
      });

      if (!forwarded.ok) {
        const errorText = await forwarded.text();
        console.error('Primary signup API error:', errorText);
        return res.status(502).json({ error: 'Email delivery failed.' });
      }

      return res.status(200).json({ success: true, forwarded: true });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AI Fusion Labs <alerts@aifusionlabs.app>',
        to: ['aifusionlabs@gmail.com'],
        reply_to: email,
        subject: `[AMY INSIGHT REVIEW] ${name} - ${company}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend error:', errorText);
      return res.status(502).json({ error: 'Email delivery failed.' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Amy review request error:', error);
    return res.status(500).json({ error: 'Failed to submit.' });
  }
};
