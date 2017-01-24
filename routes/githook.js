var express = require('express');
var router = express.Router();
var https = require('https');
var querystring = require('querystring');
var crypto = require('crypto');
var config = require('config');

var eventActor = {actors: {}};

eventActor.on = function(eventName, eventFunction) {
  this.actors[eventName] = eventFunction;
};

/* GET githook listing. */
router.post('/', function(req, res, next) {
  console.log("[GitHook type] " + req.header('x-github-event') + " --> header below --> ");
  console.log(req.headers);
  console.log("[GitHook continue] --> body below --> ");
  //console.log(req.body);

  var eventName = req.header('x-github-event');

  if(!eventName || !eventActor.actors[eventName]) {
    res.status(200).send('unsupported');
    return;
  }

  eventActor.actors[eventName](req.headers, req.body);

  res.send('ok');
});

/**
 * handle push event
 */
eventActor.on('push', function(headers, data) {
  console.log("[on a push actor]");
  var headCommiter = data.head_commit.committer.name;
  var repoName = data.repository.full_name;
  var pusher = data.pusher.name;
  var sender = data.sender.login;
  var link = data.compare;

  if(data.ref === 'refs/heads/develop') {
    if(headCommiter !== 'GitHub Enterprise') {
      var msg = '';
      msg += '\u{100035}\u{100035} [ ' + repoName + ' ] \u{100035}\u{100035}' + '\r\n';
      msg += '(여기 바로 푸쉬하면 나뿐사람~~~)' + '\r\n';
      msg += '\u{10007E} [PUSH] **develop** branch' + '\r\n';
      msg += '\u{1000A3}[WHO] ' + pusher + '\r\n';
      msg += '\u{10003B} ' + link;

      sendToLine(msg);
    }
  }
});

/**
 * handle pull request event
 */
eventActor.on('pull_request', function(headers, data) {
  console.log("[on a pull_request actor]");
  var action = data.action;
  //assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", or "reopened
  //synchronize --> 파일이 추가된 경우 ??

  //closed and merged: false - unmerged close

  var prNumber = data.number;

  var repoName = data.repository.full_name;
  var sender = data.sender.login;

  if(!data.pull_request) {
    console.log('################## no pr object #########################');
    consol.log(data);
    console.log('##########################################################');
  }

  var htmlUrl = data.pull_request.html_url;
  var title = data.pull_request.title;
  var body = data.pull_request.body;
  var subBody = body ? body.substring(0, 30) : undefined;
  var state = data.pull_request.state;
  var prUser = data.pull_request.user.login;

  var merged = data.pull_request.merged;
  var merged_by =  data.pull_request.merged_by ? data.pull_request.merged_by.login : undefined;

  var commits = data.pull_request.commits;
  var additions = data.pull_request.additions;
  var deletions = data.pull_request.deletions;
  var changedFiles = data.pull_request.changed_files;

  var assignee = data.assignee ? data.assignee.login : undefined;

  var baseRef = data.pull_request.base ? data.pull_request.base.ref : undefined;
  var headRef = data.pull_request.head ? data.pull_request.head.ref : undefined;

  var msg = '';
  msg += '\u{1000A9}\u{1000A9} [ ' + repoName + ' ] \u{1000A9}\u{1000A9}' + '\r\n';

  // open
  if(action === 'opened' || action === 'reopened' || action === 'edited') {
    msg += '        [PR#' + prNumber + '] ' + action + ' BY ' + prUser + '\r\n';

    msg += '\u{100085} [PR Title] ' + title + '\r\n';
    msg += '        [BASE] ' + baseRef + ' <- [HEAD]' + headRef + '\r\n';

    msg += '\u{10003B} ' + htmlUrl + '\r\n';

    if(subBody) {
      msg += '        [contents] ' + subBody + '\r\n';
    }

  // assign
  } else if(action === 'assigned') {
    msg += '\u{10002E} [' + assignee + '] is assigned to [PR#' + prNumber + '] BY ' + sender + '\r\n';
    msg += '        [PR Title] ' + title + '\r\n';
    msg += '\u{10003B} ' + htmlUrl + '\r\n';

  //close
  } else if(action === 'closed') {
    msg += '        [PR#' + prNumber + '] ' + action + ' BY ' + sender + '\r\n';
    msg += '        [PR Title] ' + title + '\r\n';
    msg += '        [BASE] ' + baseRef + ' <- [HEAD]' + headRef + '\r\n';

    if(merged) {
      msg += '\u{10008B} [MERGED By] ' + merged_by + '\r\n';
    } else {
      msg += '\u{10007C} [UNMERGE CLOSED! By] ' + sender + '\r\n';
    }
    msg += '\u{10003B} ' + htmlUrl + '\r\n';
  }

  sendToLine(msg);

});


/**
 * send message to line
 * @param msg
 */
var sendToLine = function (msg) {
  console.log('[send to line] msg -> ' + msg);

  var postData = JSON.stringify({
    to: config.get('line.to'),
    messages: [
      {
        "type": "text",
        "text": msg
      }]
  });

  var options = {
    hostname: config.get('line.hostname'),
    port: 443,
    path: config.get('line.push-path'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': config.get('line.token'),
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  var postReq = https.request(options, function (postRes) {
    console.log('STATUS:' + postRes.statusCode);
    console.log('HEADERS:' + JSON.stringify(postRes.headers));

    postRes.on('data', function(chunk) {
      console.log('[RES]:' + chunk);
    })
  });

  postReq.on('error', function(e) {
    console.log('problem with request:' + e.message);
  });

  //var postData2='{"to":"C7f44d4f9cbbb1655a5d1ef63c83cc8e3","messages":[{"type":"text","text":"Hello, Git"}]}';
  postReq.write(postData);
  postReq.end();

}



module.exports = router;
