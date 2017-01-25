var line = require('../lib/line');
var flat = require('flat-file-db');
var db = flat.sync('db/my.db');

var ranker = {};

ranker.sendToLine = function() {
  var sortedUser = this.getRankedUsers();
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

ranker.getRankedUsers = function () {
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

ranker.addPoint = function(userName, prPoint, reviewPoint, penaltyPoint) {
  var savedUser = db.get(userName);
  if(!userName) {
    savedUser = {prPoint: 0, reviewPoint: 0, penaltyPoint: 0};
  }

  var preUser = JSON.parse(JSON.stringify(savedUser));

  savedUser.prPoint += prPoint;
  savedUser.reviewPoint += reviewPoint;
  savedUser.penaltyPoint += penaltyPoint;

  db.put(userName, savedUser);

  this.award(preUser, savedUser);
};

ranker.award = function(u1, u2) {
  var msg = ``;
  msg += `\u{1000AE}\u{1000AE}\u{1000AE}\u{1000AE}\u{1000AE}\u{1000AE}\u{1000AE}\r\n`;
  msg += `축하드립니다~~~ *${u2.name}* 님 \r\n`;

  if(u2.prPoint>=10 && u1.prPoint<10) {
    msg += `PR 포인트 10점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.prPoint>=50 && u1.prPoint<50) {
    msg += `PR 포인트 50점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.prPoint>=100 && u1.prPoint<100) {
    msg += `PR 포인트 100점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.prPoint>=500 && u1.prPoint<500) {
    msg += `PR 포인트 500점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.prPoint>=1000 && u1.prPoint<1000) {
    msg += `PR 포인트 1000점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.reviewPoint>=10 && u1.reviewPoint<10) {
    msg += `리뷰 포인트 10점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.reviewPoint>=50 && u1.reviewPoint<50) {
    msg += `리뷰 포인트 50점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.prPoint>=100 && u1.prPoint<100) {
    msg += `리뷰 포인트 100점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.reviewPoint>=500 && u1.reviewPoint<500) {
    msg += `리뷰 포인트 500점을 달성 하셨습니다~~~ \r\n`;
  } else if(u2.reviewPoint>=1000 && u1.reviewPoint<1000) {
    msg += `리뷰 포인트 1000점을 달성 하셨습니다~~~ \r\n`;
  } else {
    return;
  }

  msg += `\u{100075}\u{100075}\u{100075}\u{100075}\u{100075}\u{100075}\u{100075}\r\n`;
  msg += `  - PR point : ${u2.prPoint}pt\r\n`;
  msg += `  - Review point : ${u2.reviewPoint}pt\r\n`;
  msg += `  - Penalty : -${u2.penaltyPoint}pt\r\n`;
  msg += `\u{100075}\u{100075}\u{100075}\u{100075}\u{100075}\u{100075}\u{100075}\r\n`;

  line.send(msg);
}

module.exports = ranker;
