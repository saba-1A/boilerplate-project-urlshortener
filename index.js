require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Routes
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// Schema & Model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const URLModel = mongoose.model('URL', urlSchema);

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  // Validate with DNS lookup
  const hostname = urlParser.parse(inputUrl).hostname;
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Generate short URL ID
    const shortId = Math.floor(Math.random() * 100000).toString();

    const newUrl = new URLModel({
      original_url: inputUrl,
      short_url: shortId
    });

    newUrl.save((err, data) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      res.json({
        original_url: data.original_url,
        short_url: data.short_url
      });
    });
  });
});

// GET /api/shorturl/:urlid
app.get('/api/shorturl/:urlid', (req, res) => {
  URLModel.findOne({ short_url: req.params.urlid }, (err, data) => {
    if (err || !data) {
      return res.json({ error: 'No short URL found for the given input' });
    }

    res.redirect(301, data.original_url);
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
