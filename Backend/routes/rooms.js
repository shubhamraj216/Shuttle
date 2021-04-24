var express    = require("express"),
    bodyParser = require("body-parser"),
    router     = express.Router();

router.use(bodyParser.json());

router
  .route("/")
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    next();
  })
  .get((req, res, next) => {
    res.json(req.config.room);
  })
  .post((req, res, next) => {
    res.statusCode = 403;
    res.end("POST operation not supported on /");
  })
  .put((req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /");
  })
  .delete((req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported on /");
  });


module.exports = router;