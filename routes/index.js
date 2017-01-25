var express = require('express');
var router = express.Router();

var line = require('../lib/line');
var ranker = require('../lib/ranker');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/debug', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/linewebhook', function(req, res, next) {
  console.log(req.headers);
  console.log(JSON.stringify(req.body));
  res.render('index', { title: 'Express' });
});

router.get('/ranker', function(req, res, next) {
  ranker.sendToLine();
  res.render('index', { title: 'Express' });
});


var sendRankingToLine = function(sortedUser) {
  if(!sortedUser) return;

  var msg = ``;
  msg += `\u{100069}\u{100069} RANKING \u{100069}\u{100069}\r\n`;
  var i=0;
  for(var i=0; i<Math.min(10, sortedUser.length); i++) {
    msg += `[${i+1}]  **${sortedUser[i].name}**\r\n`;
    msg += `         ${sortedUser[i].point}pt (-${sortedUser[i].penaltyPoint}pt) \r\n`;
  }

  line.send(msg);
}

var ranking = function (req, res, next) {
  var userKeys = db.keys();

  var users = userKeys.map(function (name) {
    var user = db.get(name);
    user.name = name;
    user.point = user.prPoint + user.reviewPoint - user.penaltyPoint;
    return user;
  });

  var sortedUser = users.sort(function(a, b) {
    if(a.point > b.point) return -1;
    if(a.point < b.point) return 1;
    return 0;
  });

  // console.log("### ranker ###");
  // sortedUser.forEach(function(user) {
  //   console.log(JSON.stringify(user));
  // });

  return sortedUser;
}

module.exports = router;
