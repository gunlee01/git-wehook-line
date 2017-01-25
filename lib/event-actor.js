var line = require('../lib/line');
var flat = require('flat-file-db');
var db = flat.sync('db/my.db');

var eventActor = {actors: {}};
eventActor.on = function(eventName, eventFunction) {
  this.actors[eventName] = eventFunction;
};

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

  if(data.ref === 'refs/heads/develop' || data.ref === 'refs/heads/master') {
    if(headCommiter !== 'GitHub Enterprise') {
      var msg = ``;
      msg += `**${pusher}** pushed\r\n`;
      msg += `[${repoName}]`;
      msg += `\u{10007E}\u{100027}\u{1000A6}\r\n`;
      msg += `(여기 바로 푸쉬하면 나뿐사람~~~)\r\n`;
      msg += `\u{10009E} [PUSH] **${data.ref}** branch\r\n`;
      msg += `\u{100083}[WHO] ${pusher}\r\n`;
      msg += `\u{10003B} ${link}`;

      var savedUser = db.get(pusher);
      if(!savedUser) {
        savedUser = {prPoint: 0, reviewPoint: 0, penaltyPoint: 0};
      }
      savedUser.penaltyPoint -= 1;
      db.put(pusher, savedUser);

      line.send(msg);
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

  var prNumber = data.number;

  var repoName = data.repository.full_name;
  var sender = data.sender.login;

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

  // open
  if(action === 'opened' || action === 'reopened' || action === 'edited') {
    var savedUser = db.get(prUser);
    if(!savedUser) {
      savedUser = {prPoint: 0, reviewPoint: 0, penaltyPoint: 0};
    }
    savedUser.prPoint += 1;
    db.put(prUser, savedUser);

    msg += `[${repoName}]\r\n`;
    msg += `\u{1000A9}\u{100077}\r\n`;
    msg += `\u{1000B3} [PR#${prNumber}] ${action} BY ${prUser}\r\n`;

    msg += `        [PR Title] ${title}\r\n`;
    msg += `        (BASE) ${baseRef} <- (HEAD) ${headRef}\r\n`;
    msg += `\u{10003B} ${htmlUrl} \r\n`;

    if(subBody) {
      msg += `        [contents] ${subBody} \r\n`;
    }

    // assign
  } else if(action === 'assigned') {
    msg += `**${assignee}** ${action}\r\n`;
    msg += `[${repoName}]`;
    msg += `\u{1000A9}\u{100097}\r\n`;
    msg += `\u{10002E} (${assignee}) is assigned to (PR#${prNumber}) BY ${sender}\r\n`;
    msg += `        [PR Title] ${title}\r\n`;
    msg += `\u{10003B} ${htmlUrl}\r\n`;

    //close
  } else if(action === 'closed') {
    var savedUser = db.get(sender);
    if(!savedUser) {
      savedUser = {prPoint: 0, reviewPoint: 0, penaltyPoint: 0};
    }
    savedUser.prPoint += 1;
    db.put(sender, savedUser);

    msg += `[${repoName}]\r\n`;
    msg += `\u{1000A9}\u{10008B}\r\n`;
    msg += `\u{1000B3} [PR#${prNumber}] ${action} BY ${sender}\r\n`;
    msg += `        [PR Title] ${title}\r\n`;
    msg += `        (BASE) ${baseRef} <- (HEAD)${headRef}\r\n`;

    if(merged) {
      msg += `\u{10008B} [MERGED By] ${merged_by}\r\n`;
    } else {
      msg += `\u{10007C} [UNMERGE CLOSED! By] ${sender}\r\n`;
    }
    msg += `\u{10003B} ${htmlUrl}\r\n`;
  }

  line.send(msg);

});

module.exports = eventActor;
