const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { extractAndWriteData } = require('./logic');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.post('/extract', async (req, res) => {
  const { serpapiKey, sheetId, location, niche } = req.body;

  if (!serpapiKey || !sheetId || !location || !niche) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const count = await extractAndWriteData(serpapiKey, sheetId, location, niche);
    res.status(200).json({ message: `✅ ${count} entries written to Google Sheet.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
