var express = require('express');
var router = express.Router();

/* GET githook listing. */
router.get('/', function(req, res, next) {
  log.debug("[GitHook]" + req.originalUrl "--> body below --> ");
  log.debug(req.body);
  res.send('ok');
});

module.exports = router;
