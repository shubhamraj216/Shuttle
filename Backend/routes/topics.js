var express    = require("express"),
    bodyParser = require("body-parser"),
    router     = express.Router();

router.use(bodyParser.json());

let topic = ['Travel', 'Movies', 'Sports', 'Art', 'Food', 'Technology', 'Music', 'Health']
router
  .route("/")
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    next();
  })
  .get((req, res, next) => {
    res.json(topic);
  })
  .post((req, res, next) => {
    topic.push(req.body.topic)
    res.end("Success");
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