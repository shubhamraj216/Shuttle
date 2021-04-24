var mongoose = window.require("mongoose");

var runningSchema= new mongoose.Schema({
  topic: String,
  key: String,
  pid: Number,
  start: String
});

var stoppedSchema= new mongoose.Schema({
    topic: String,
    key: String,
    pid: Number,
    start: String,
    stop: String
});

module.exports = {
    Running: mongoose.model("Running", runningSchema),
    Stopped: mongoose.model("Stopped", stoppedSchema)
};