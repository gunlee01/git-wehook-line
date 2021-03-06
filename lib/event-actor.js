var line = require('../lib/line');
var ranker = require('../lib/ranker');
var flat = require('flat-file-db');
var db = flat.sync('db/my.db');

var eventActor = {actors: {}};
eventActor.on = function(eventName, eventFunction) {
  this.actors[eventName] = eventFunction;
};

/**
 * handle issue_comment
 */
eventActor.on('issue_comment', function (headers, data) {
  console.log("[on a issue_comment actor]");

  if(!data.issue.pull_request) return;
  if(!data.comment) return;

  var repoName = data.repository.full_name;
  var sender = data.sender.login;

  var action = data.action;

  var comment = data.comment.body;

  var pattern = /\B@[a-z0-9_-]+/gi;
  var mentions = comment.match(pattern);

  if(comment & comment.length > 30) comment = comment.substring(0, 30) + "...";

  var htmlUrl = data.comment.html_url;
  var commentUser = data.comment.user.login;

  var prTitle = data.issue.title;
  var prNo = data.issue.number;

  ranker.addPoint(commentUser, 0, 1, 0);

  var msg = ``;
  msg += `**${commentUser}** issue comment ${action} for PR#${prNo}\r\n`;
  msg += `@[ ${repoName} ]\r\n`;
  msg += `\u{1000A9}\u{100033}\r\n`;
  msg += `\u{1000B3} [PR#${prNo}] ${prTitle}\r\n`;
  if(mentions) {
    msg += `\u{10002F} [mentions] ${mentions.join(', ')}\r\n`;
  }
  msg += `\u{10003B} ${htmlUrl} \r\n`;
  msg += `\u{100041} [Comment] ${comment}`;

  line.send(msg);
});


/**
 * handle pull_request_review_comment
 */
eventActor.on('pull_request_review_comment', function (headers, data) {
  console.log("[on a pull_request_review_comment actor]");

  var repoName = data.repository.full_name;
  var sender = data.sender.login;

  var action = data.action;

  var comment = data.comment.body;

  var pattern = /\B@[a-z0-9_-]+/gi;
  var mentions = comment.match(pattern);

  if(comment & comment.length > 30) comment = comment.substring(0, 30) + "...";

  var htmlUrl = data.comment.html_url;
  var commentUser = data.comment.user.login;

  var prTitle = data.pull_request.title;
  var prNo = data.pull_request.number;
  var prUser = data.pull_request.user.login;
  var prHeadRef = data.pull_request.head ? data.pull_request.head.ref : undefined;

  ranker.addPoint(commentUser, 0, 1, 0);

  var msg = ``;
  msg += `**${commentUser}** review ${action} for PR#${prNo}(**${prUser}**)\r\n`;
  msg += `@[ ${repoName} ]\r\n`;
  msg += `\u{1000A9}\u{100033}\r\n`;
  msg += `\u{1000B3} [PR#${prNo}] ${prTitle}\r\n`;
  msg += `        (Branch) ${prHeadRef}\r\n`;
  if(mentions) {
    msg += `\u{10002F} [mentions] ${mentions.join(', ')}\r\n`;
  }
  msg += `\u{10003B} ${htmlUrl} \r\n`;
  msg += `\u{100041} [Comment] ${comment}`;

  line.send(msg);
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
      var msg = ``;
      msg += `**${pusher}** pushed to *develop*\r\n`;
      msg += `@[ ${repoName} ]`;
      msg += `\u{10007E}\u{100027}\u{1000A6}\r\n`;
      msg += `(여기 바로 푸쉬하면 나뿐사람~~~)\r\n`;
      msg += `\u{10009E} [PUSH] **${data.ref}** branch\r\n`;
      msg += `\u{100083}[WHO] ${pusher}\r\n`;
      msg += `\u{10003B} ${link}`;

      ranker.addPoint(pusher, 0, 0, 5);

      line.send(msg);
    }
  } else if(data.ref === 'refs/heads/master') {
    if (headCommiter !== 'GitHub Enterprise') {
      var msg = ``;
      msg += `**${pusher}** pushed to *master*\r\n`;
      msg += `@[ ${repoName} ]`;
      msg += `[PUSH] **${data.ref}** branch\r\n`;
      msg += `[By] ${pusher}\r\n`;
      msg += `\u{10003B} ${link}`;

      line.send(msg);
    }
  }
});

/**
 * handle pull request event
 */
eventActor.on('pull_request', function(headers, data) {
  var action = data.action;

  console.log("[on a pull_request actor]" + action);

  if(!['opened', 'reopened', 'closed', 'edited', 'assigned'].includes(action)) {
    return;
  }

  //assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", or "reopened
  //synchronize --> 파일이 추가된 경우 ??

  var prNumber = data.number;

  var repoName = data.repository.full_name;
  var sender = data.sender.login;

  var htmlUrl = data.pull_request.html_url;
  var title = data.pull_request.title;
  var body = data.pull_request.body;
  var subBody = body;
  if(body & body.length > 30) subBody = body.substring(0, 30) + "...";

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
    if(action === 'opened') {
      ranker.addPoint(prUser, 3, 0, 0);
    }

    msg += `@[ ${repoName} ]\r\n`;
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
    msg += `@[ ${repoName} ]`;
    msg += `\u{1000A9}\u{100097}\r\n`;
    msg += `\u{10002E} (${assignee}) is assigned to (PR#${prNumber}) BY ${sender}\r\n`;
    msg += `        [PR Title] ${title}\r\n`;
    msg += `\u{10003B} ${htmlUrl}\r\n`;

    //close
  } else if(action === 'closed') {
    ranker.addPoint(sender, 1, 0, 0);

    msg += `@[ ${repoName} ]\r\n`;
    if(merged) {
      msg += `\u{1000A9}\u{10008B}\r\n`;
    } else {
      msg += `\u{1000AA}\u{100038}\r\n`;
    }
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
