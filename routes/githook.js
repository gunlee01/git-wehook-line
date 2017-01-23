var express = require('express');
var router = express.Router();

/* GET githook listing. */
router.post('/', function(req, res, next) {
  console.log("[GitHook] " + req.originalUrl);
  console.log("[GitHook type] " + req.header('x-github-event') + " --> header below --> ");

  console.log(req.headers);
  console.log("[GitHook continue] --> body below --> ");
  console.log(req.body);
  res.send('ok');
});

module.exports = router;
