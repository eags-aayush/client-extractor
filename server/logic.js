const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');

async function extractAndWriteData(serpapiKey, sheetId, location, niche) {
  const query = `${niche} in ${location}`;
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&type=search&api_key=${serpapiKey}`;

  const response = await axios.get(url);
  const data = response.data.local_results || [];

  if (data.length === 0) throw new Error('No businesses found.');

  const rows = data.map(biz => [
    biz.title || '',
    biz.phone || '',
    '', // email (not available in SerpAPI)
    biz.website || 'No Website',
    biz.website ? 'Red' : 'Green'
  ]);

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    resource: {
      values: [
        ['Name', 'Phone', 'Email', 'Website', 'Website Status'],
        ...rows
      ]
    }
  });

  return rows.length;
}

module.exports = { extractAndWriteData };
