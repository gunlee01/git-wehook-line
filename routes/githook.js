var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var line = require('../lib/line');
var eventActor = require('../lib/event-actor');
var flat = require('flat-file-db');

var db = flat.sync('db/my.db');

/* GET githook listing. */
router.post('/', function(req, res, next) {
  console.log(`## head ########################################################################`);
  console.log(`[GitHook type] ${req.header('x-github-event')} --> header below --> `);
  console.log(req.headers);
  console.log(`## body ########################################################################`);
  console.log(JSON.stringify(req.body));
  console.log(`## end ########################################################################`);

  var eventName = req.header('x-github-event');

  if(!eventName || !eventActor.actors[eventName]) {
    res.status(200).send('unsupported');
    return;
  }
  eventActor.actors[eventName](req.headers, req.body);

  res.send('ok');
});


module.exports = router;
