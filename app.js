var http = require("http");
var path = require("path");
var express = require("express");
var logger = require("morgan");
var bodyParser = require("body-parser");
// var md5 = require('md5');
// var users = require('./Data/users.json');
// var config = require('./Data/config.json');
var fs = require('fs');
var session = require("express-session");

var app = express();
app.use(logger("dev"));
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "pug");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: 'secret'}));

app.get("/", function (req, res) {
    res.send("dasjdas");
});



http.createServer(app).listen(3000, function() {
    console.log("Server started on port 3000");
});