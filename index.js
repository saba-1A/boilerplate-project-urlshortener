require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const URLModel = mongoose.model('URL', urlSchema);

// Middleware
const port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST /api/shorturl
app.post('/api/shorturl', async (req, res) => {
  const inputUrl = req.body.url;

  let hostname;
  try {
    hostname = new URL(inputUrl).hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: 'invalid url' });

    // Check if already exists
    const existing = await URLModel.findOne({ original_url: inputUrl });
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url,
      });
    }

    // Get count for new short URL
    const count = await URLModel.estimatedDocumentCount();
    const newEntry = new URLModel({
      original_url: inputUrl,
      short_url: count + 1,
    });

    await newEntry.save();
    res.json({
      original_url: newEntry.original_url,
      short_url: newEntry.short_url,
    });
  });
});

// GET /api/shorturl/:urlid
app.get('/api/shorturl/:urlid', async (req, res) => {
  const id = parseInt(req.params.urlid);

  const found = await URLModel.findOne({ short_url: id });
  if (!found) {
    return res.json({ error: 'No short URL found for the given input' });
  }
  res.redirect(found.original_url);
});

// Start server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
