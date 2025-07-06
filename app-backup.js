const axios = require('axios');
const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

(async () => {
  try {
    const LOCATION = await ask("📍 Enter location: ");
    const NICHE = await ask("🏷️  Enter niche: ");
    rl.close();

    const QUERY = `${NICHE} in ${LOCATION}`;

    async function fetchBusinesses() {
      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(QUERY)}&type=search&api_key=${SERPAPI_KEY}`;
      const response = await axios.get(url);
      return response.data.local_results || [];
    }

    function processBusinesses(data) {
      return data.map(biz => {
        const name = biz.title || '';
        const phone = biz.phone || '';
        const website = biz.website || 'No Website';
        const status = biz.website ? 'Red' : 'Green';
        return [name, phone, '', website, status];
      });
    }

    async function writeToGoogleSheet(rows) {
      const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
      const spreadsheetId = process.env.SHEET_ID;

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: {
          values: [
            ['Name', 'Phone', 'Email', 'Website', 'Website Status'],
            ...rows
          ]
        }
      });

      console.log(`✅ Successfully added ${rows.length} businesses to Google Sheet for "${QUERY}".`);
    }

    const rawData = await fetchBusinesses();

    if (rawData.length === 0) {
      console.log("⚠️  No results found for that query.");
      return;
    }

    const rows = processBusinesses(rawData);
    await writeToGoogleSheet(rows);

  } catch (err) {
    console.error("❌ Error:", err.message);
    rl.close();
  }
})();
