require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema and model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const URLModel = mongoose.model('URL', urlSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

// Routes
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// POST: create short URL
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  let hostname;
  try {
    hostname = new URL(inputUrl).hostname;
  } catch {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortId = Math.floor(Math.random() * 100000);

    const newUrl = new URLModel({
      original_url: inputUrl,
      short_url: shortId,
    });

    newUrl.save((err, saved) => {
      if (err) return res.json({ error: 'db error' });
      res.json({
        original_url: saved.original_url,
        short_url: saved.short_url,
      });
    });
  });
});

// GET: redirect short URL to original
app.get('/api/shorturl/:urlid', (req, res) => {
  const id = Number(req.params.urlid);

  URLModel.findOne({ short_url: id }, (err, data) => {
    if (err || !data) {
      return res.json({ error: 'No short URL found for the given input' });
    }
    res.redirect(data.original_url);
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
