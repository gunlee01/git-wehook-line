var express = require('express');
var router = express.Router();

/* GET githook listing. */
router.post('/', function(req, res, next) {
  console.log("[GitHook]" + req.originalUrl + "--> body below --> ");
  console.log(req.body);
  res.send('ok');
});

module.exports = router;
