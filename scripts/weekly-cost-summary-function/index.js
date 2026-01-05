/**
 * Cloud Function – Weekly GCP Cost Summary
 * -------------------------------------------------
 * 1️⃣ Queries the billing_export.billing_data table for the previous week.
 * 2️⃣ Sends a premium‑styled HTML email via SendGrid.
 * -------------------------------------------------
 */
const {BigQuery} = require('@google-cloud/bigquery');
const sgMail = require('@sendgrid/mail');

const bigquery = new BigQuery();
const PROJECT_ID = process.env.GCP_PROJECT; // injected by Cloud Functions
const DATASET_ID = 'billing_export';
const TABLE_ID   = 'billing_data';
const RECIPIENT   = 'noemisanalex@gmail.com'; // change if needed

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/** Returns ISO strings for the Monday‑Sunday range of the previous week */
function getPreviousWeekRange() {
  const now = new Date();
  // Find last Monday (UTC) relative to today
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const diffToMonday = (day + 6) % 7 + 7; // days back to previous Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  monday.setUTCHours(0,0,0,0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23,59,59,999);
  return {start: monday.toISOString(), end: sunday.toISOString()};
}

/** Build premium HTML email */
function buildHtml(rows, total) {
  const rowsHtml = rows.map(r => `<tr><td>${r.service}</td><td>$${Number(r.total_cost).toFixed(2)}</td></tr>`).join('');
  return `
    <html>
      <head>
        <style>
          body {font-family: 'Inter', sans-serif; background:#1e1e1e; color:#e0e0e0; padding:20px;}
          h1 {color:#ff9800;}
          table {width:100%; border-collapse:collapse; margin-top:20px;}
          th {background:#2c2c2c; color:#ff9800; padding:12px;}
          td {padding:12px;}
          tr:nth-child(even) {background:#2a2a2a;}
        </style>
      </head>
      <body>
        <h1>📊 Weekly GCP Cost Summary (USD)</h1>
        <p><strong>Period:</strong> ${rows[0]?.usageStartTime?.slice(0,10) || ''} → ${rows[0]?.usageEndTime?.slice(0,10) || ''}</p>
        <p><strong>Total Spend:</strong> $${total.toFixed(2)}</p>
        <table>
          <thead>
            <tr><th>Service</th><th>Total Cost (USD)</th></tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <p style="margin-top:20px; font-size:0.9em;">Generated automatically by the <strong>weekly‑cost‑summary</strong> Cloud Function.</p>
      </body>
    </html>`;
}

/** Cloud Function entry point */
exports.weeklyCostSummary = async (req, res) => {
  try {
    const {start, end} = getPreviousWeekRange();
    const query = `
      SELECT
        service.description AS service,
        SUM(cost) AS total_cost,
        MIN(usage_start_time) AS usageStartTime,
        MAX(usage_end_time) AS usageEndTime
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      WHERE usage_start_time BETWEEN @start AND @end
      GROUP BY service
      ORDER BY total_cost DESC
      LIMIT 20`;

    const options = {query, params: {start, end}, location: 'US'};
    const [rows] = await bigquery.query(options);
    const total = rows.reduce((sum, r) => sum + Number(r.total_cost), 0);

    const html = buildHtml(rows, total);
    const msg = {
      to: RECIPIENT,
      from: 'no-reply@aigestion.com',
      subject: `Weekly GCP Cost Summary – ${new Date(start).toLocaleDateString()}`,
      html,
    };
    await sgMail.send(msg);
    console.log('✅ Email sent to', RECIPIENT);
    res.status(200).send('Weekly cost summary email sent.');
  } catch (err) {
    console.error('❌ Error in weeklyCostSummary:', err);
    res.status(500).send(err.message);
  }
};
