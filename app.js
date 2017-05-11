var http = require("http");
var path = require("path");
var express = require("express");
var logger = require("morgan");
var bodyParser = require("body-parser");
var multer = require("multer")
var upload = multer({dest : 'uploads/'})
var  md5 = require('md5');
var users = require('./Data/users.json');
var config = require('./Data/config.json');
var files = require('./Data/files.json');
var bans = require('./Data/bans.json');

var fs = require('fs');
var session = require("express-session");

var app = express();
app.use(logger("dev"));
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "pug");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: 'secret'}));

app.locals.users = [];
app.locals.flag = true;

function writeUser() {
    fs.writeFile("./Data/users.json", JSON.stringify(users), function (err) {
        if (err) return console.log(err);
    });
}

function writeFiles() {
    fs.writeFile("./Data/files.json", JSON.stringify(files), function (err) {
        if (err) return console.log(err);
    });
}

function writeBans() {
    fs.writeFile("./Data/bans.json", JSON.stringify(bans), function (err) {
        if (err) return console.log(err);
    });
}

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

app.get("/login", function(req, res) {
    res.render("login");
    app.locals.flag = true;
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

app.get("/main", function (req, res) {
    res.render("main");
});

app.get("/403", function(req, res) {
    res.render("403");
});

app.get("/401", function(req, res) {
    res.render("401");
});

app.get("/upload", function (req, res) {
    res.render("upload");
});

app.get("/ban", function (req, res) {
    res.render("ban");
});

app.get("/uploadedFile", function (req, res) {
    res.render("uploadedFile");
});

app.get("/AccountBanned", function (req, res) {
    res.render("AccountBanned");
});

app.get("/wrongFormat", function (req, res) {
    res.render("wrongFormat");
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
    res.render("admin");
});

app.post("/login", function (req, res) {

    sess = req.session;

    var login = req.body.login;
    var passwd = req.body.password;
    var hashpasswd = md5(passwd);

    if(users[login]){
        if(users[login].password === hashpasswd) {
            if(bans[login]>Date.now()){res.redirect("/AccountBanned");return;}
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
        //var json = '{"password": "' + md5(passwd) + '", "role": "' + role + '"}';
        var json = {}
        json.password = md5(passwd)
        json.role = role
        json.file_list = []
        users[login] = json;

        writeUser();


        res.redirect("/accountCreated");
    }
});

app.post("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});



app.post("/",upload.single("myFile"), function (req, res) {
    var myFile = req.file;

    if(myFile.originalname.indexOf("jpeg") < 0  &&myFile.originalname.indexOf("jpg") < 0) {
        res.redirect("/wrongFormat")
        var filePath = 'uploads/'+myFile.filename;
        fs.unlinkSync(filePath);
        return;

    }

    var arr = users[req.session.login].file_list
    arr.push(myFile.filename)
    users[req.session.login].file_list = arr;

    var json = {}

    json.entities = [];
    json.name = myFile.originalname;
    json.upload_time = Date.now();
    files[myFile.filename] = json;

    writeUser();
    writeFiles();

    res.redirect("/uploadedFile")
});


app.post("/ban", function (req, res) {
    var login = req.body.login;
    var time = req.body.time;

    bans[login] = Date.now() + time;
    writeBans();

    res.render("ban")
});





app.use(function(req, res) {
    res.status(404).render("404");
});






http.createServer(app).listen(3000, function() {
    console.log("Server started on port 3000");
});