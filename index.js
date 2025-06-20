require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Schema and model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});
const URLModel = mongoose.model('URL', urlSchema);

// Generate short URL counter (basic in-memory counter, better to use DB in real projects)
let counter = 1;

// POST endpoint to shorten a URL
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  let hostname;
  try {
    hostname = new URL(inputUrl).hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, (err) => {
    if (err) return res.json({ error: 'invalid url' });

    // Save the URL
    const newUrl = new URLModel({
      original_url: inputUrl,
      short_url: counter,
    });

    newUrl.save((err, data) => {
      if (err) return res.json({ error: 'db error' });
      res.json({
        original_url: data.original_url,
        short_url: data.short_url,
      });
      counter++; // increment counter for next URL
    });
  });
});

// GET endpoint to redirect
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
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
