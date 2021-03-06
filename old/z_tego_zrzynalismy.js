var http = require("http");
var path = require("path");
var express = require("express");
var logger = require("morgan");
var bodyParser = require("body-parser");
var md5 = require('md5');
var users = require('./Data/users.json');
var config = require('./Data/config.json');
var fs = require('fs');
var session = require("express-session");

var app = express();

app.locals.users = [];
app.locals.flag = true;

app.use(logger("dev"));

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "pug");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: 'secret'}));

function checkRole(role, page) {

    var table = config[role];
    if(!table)
        return false;

    for(i=0; i < table.length; i++){
        if(table[i] == page)
            return true;
    }

    return false;
}

app.use(function (req, res, next) {

    sess = req.session;
    if(!sess.role)sess.role= "unauthorized";

    if(checkRole("all_paths",req.path.substr(1, req.path.length))){

        if (req.path != "/" && req.path != "/401" && req.path != "/403" && req.path != "/404" && req.method == "GET") {
            if (checkRole(sess.role, req.path.substr(1, req.path.length))) {
                next();
                return;
            }
            else {
                if (sess.role == "unauthorized") {
                    res.redirect("/401");
                    return;
                }
                else {
                    res.redirect("/403");
                    return;
                }
            }


        }
    }
    next();


});


app.get("/", function(req, res) {
    sess = req.session;
    if(sess.role = "unauthorized")
        res.redirect("/login");
    else
        res.redirect("/main");
});

app.get("/main", function (req, res) {
    res.render("main");
});

app.get("/login", function(req, res) {
    res.render("login");
    app.locals.flag = true;
});

app.get("/admin", function(req, res) {
    sess = req.session;

    app.locals.users = [];
    for (var i in users) {
        var person = i;
        var role = users[i].role;
        var string = person + " role: " + role;

        app.locals.users.push(string);
    }

    var roleA = checkRole(sess.role, "admin");
    res.render("admin");
});

app.get("/accountCreated", function (req, res) {
    res.render("accountCreated")
});

app.get("/user", function(req, res) {
    res.render("user");
});

app.get("/register", function (req, res) {
    res.render("register")
});

app.get("/403", function(req, res) {
    res.render("403");
});

app.get("/401", function(req, res) {
    res.render("401");
});

app.post("/login", function (req, res) {

    sess = req.session;

    var login = req.body.login;
    var passwd = req.body.password;
    var hashpasswd = md5(passwd);

    if(users[login]){
        if(users[login].password === hashpasswd) {
            sess.login = login;
            sess.password = hashpasswd;
            sess.role = users[login].role;
            app.locals.role = sess.role;
            res.redirect("/main");
        }
        else {
            app.locals.flag = false;
            res.redirect("/login");
        }
    }
    else {
        app.locals.flag = false;
        res.redirect("/login");
    }
});


app.post("/register", function (req, res) {
    var login = req.body.login;
    var passwd = req.body.password;
    var rpasswd = req.body.rpassword;
    var isAdmin = req.body.admin;
    var role;
    if(!isAdmin)
        role = "user";
    else
        role = "admin";

    if(users[login])
        res.render("register", {"message": "Login already taken"});
    else if(passwd !== rpasswd)
        res.render("register", {"message": "Passwords don't match"});
    else {
        var json = '{"password": "' + md5(passwd) + '", "role": "' + role + '"}';

        users[login] = JSON.parse(json);

        fs.writeFile("./Data/users.json", JSON.stringify(users), function (err) {
            if (err) return console.log(err);
        });

        res.redirect("/accountCreated");
    }
});

app.post("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});


app.use(function(req, res) {
    res.status(404).render("404");
});

http.createServer(app).listen(3000, function() {
    console.log("Server started on port 3000");
});
/**
 * Created by AwangardowyKaloryfer on 10.05.2017.
 */
