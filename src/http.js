const express = require('express');
const { getHosts } = require('./hosts');
const { dnsServer } = require('./dns');

const app = express();

const http_port = 8023;
const subnet = '192.168.2';
const blockList = {};
const timers = {};
const timerStop = {};

dnsServer(subnet, blockList);

app.set('view engine', 'ejs');
app.set('views', __dirname + '/../views');

app.get('/', (req, res) => {
  getHosts().then(hosts => {
    res.render('home', { blockList, hosts, timerStop });
  })
});

app.get('/block', (req, res) => {
  const ip = req.query.ip;
  clearTimeout(timers[ip])
  delete timerStop[ip];
  blockList[ip] = [''];
  res.sendStatus(200);
});

app.get('/unblock', (req, res) => {
  const ip = req.query.ip;
  const duration = req.query.duration;
  clearTimeout(timers[ip]);
  delete timerStop[ip];
  delete blockList[ip];

  if (duration) {
    const durationMillis = duration * 60 * 1000;
    timerStop[ip] = Date.now() + durationMillis;
    timers[ip] = setTimeout(() => {
      blockList[ip] = [''];
      delete timerStop[ip];
    }, durationMillis);
  } else {
    delete timerStop[ip];
  }
  res.sendStatus(200);
});

app.listen(http_port, () => {
  console.log(`HTTP listening on port ${http_port}`)
});
