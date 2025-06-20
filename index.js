require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
})

let URLModel = mongoose.model('URL', urlSchema)

app.post('/api/shorturl/', (req, res) => {
  console.log(req.body.url)
  if (req.body.url.slice(0,4) === 'http') {
    const randId = Math.floor(Math.random() * 99999999999999)
    const reqUrl = new URLModel({
        original_url: req.body.url, 
        short_url: randId
    })
    reqUrl.save((err, data) => {
      if (err) return console.error(err);
    });
    
    res.send({original_url: req.body.url, short_url: randId})
  } else {
    res.send({ error: 'invalid url' })
  }
})

app.get('/api/shorturl/:urlid?', (req, res) => {
  console.log(req.params.urlid)
    URLModel.findOne({short_url: req.params.urlid}, (err, data) => {
      if (err) return console.error(err)
      res.writeHead(301, {
        Location: data.original_url
      }).end()
    })
})
