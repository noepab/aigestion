# Workflow: Create Cost Monitoring Dashboard in Looker Studio
# ---------------------------------------------------------------
# This workflow guides you through building a premium, dynamic cost‑monitoring dashboard
# that visualises the billing data exported to BigQuery.
# ---------------------------------------------------------------

1. **Open Looker Studio**
   - Navigate to https://lookerstudio.google.com/ and sign in with the same Google account used for the GCP project.

2. **Create a New Report**
   - Click **Blank Report** → **Create**.
   - When prompted to add data, choose **BigQuery**.

3. **Connect to the Billing Export Table**
   - Project: `aigestion`
   - Dataset: `billing_export`
   - Table: `billing_data`
   - Click **Add** → **Add to Report**.

4. **Configure Data Types**
   - Ensure the `cost` (or `costAmount`) field is set to **Currency**.
   - Set `usageStartTime` / `usageEndTime` as **Date/Time**.
   - Add any custom labels (e.g., `costCenter`) as **Dimension**.

5. **Build Visualisations**
   - **Scorecard**: Total spend for the current month.
   - **Time‑Series**: Spend over time (daily granularity).
   - **Bar Chart**: Spend by service (`service.description`).
   - **Pie Chart**: Spend by label / cost center.
   - Apply the **budget threshold** colours (e.g., red when > 90 %).

6. **Add Alerts (optional)**
   - In **Resource → Manage added data sources**, enable **Data freshness** to refresh every 12 hours.
   - Set up **Email notifications** via Looker Studio > **Report settings** > **Schedule email delivery**.

7. **Style for Premium Look**
   - Use a dark theme with a subtle gradient background.
   - Choose the **Inter** Google Font for headings and **Roboto** for body text.
   - Add micro‑animations: enable **Chart transition** under **Style**.
   - Include your logo (`aig‑brain‑logo.svg`) at the top‑right corner.

8. **Save & Share**
   - Name the report **AIGestion Cost Dashboard**.
   - Share with `noemisanalex@gmail.com` and any stakeholders (Viewer access).

---
**Result**: A dynamic, premium‑styled dashboard that updates automatically from the BigQuery export, giving you real‑time visibility into GCP spend and budget health.
