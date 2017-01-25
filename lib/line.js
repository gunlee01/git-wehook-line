var https = require('https');
var config = require('config');

var line = {};

/**
 * send message to line
 * @param msg
 */
line.send = function (msg) {
  console.log(`[send to line] msg -> ${msg}`);

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

  postReq.write(postData);
  postReq.end();
}


module.exports = line;
