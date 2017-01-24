var express = require('express');
var router = express.Router();
var flat = require('flat-file-db');

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

module.exports = router;
