require("dotenv").config();
const https = require("https");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const express = require("express");
const request = require("request");
const path = require("path");
const ejs = require("ejs");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
const Corp = require("./models/corp");

var app = express();
const uri = process.env.MONGO_URL;
console.log(uri);
mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to the database ");
  })
  .catch((err) => {
    console.error(`Error connecting to the database. n${err}`);
  });

app.use("/", express.static(path.join(__dirname, "/public/static")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  require("express-session")({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Corp.authenticate()));
passport.serializeUser(Corp.serializeUser());
passport.deserializeUser(Corp.deserializeUser());
passport.use(new LocalStrategy(Corp.authenticate()));

app.get("/", function (req, res) {
  res.render("index");
});
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.render("dashboard", { corp: req.corp });
});

app.get("/register", function (req, res) {
  res.render("register");
});
app.post("/register", function (req, res) {
  var password = req.body.password;

  Corp.register(
    new Corp({
      username: req.body.name,
      email: req.body.email,
      stateCode: req.body.stateCode
    }),
    password,
    function (err, corp) {
      if (err) {
        console.log(err);
        res.render("register");
      }
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    }
  );
});
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.sendFile(__dirname + "/dashboard.html");
});
app.post("/dashboard", isLoggedIn, (req, res) => {
  var _id = req.user.id;
  var loginCount = req.corp.timesLogin;
  Corp.findByIdAndUpdate(
    { _id },
    { timesLogin: loginCount },
    { new: true },
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("/dashboard");
      }
    }
  );
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login"
  }),
  function (req, res) {}
);
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_NAME,
    pass: process.env.USER_PASS
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    //
    console.log(req.corp.username);
    let mailOptions = {
      from: "technokraftdev@gmail.com",
      to: "oshojoseph2@gmail.com",
      subject: "Corper Login",
      text:
        "Corper " +
        req.corp.username +
        " with State code LA/21A/" +
        req.corp.stateCode +
        " just logged into the Nysc dashboard"
    };

    transporter.sendMail(mailOptions, function (err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        console.log("Email was sent successfully");
      }
    });
    return next();
  }
  res.redirect("/login");
}
app.listen(8080, function () {
  console.log("server running on 8080");
}); //the server object listens on port 8080
