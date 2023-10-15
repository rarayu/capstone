"use strict";

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const session = require("express-session");

const home = require("./src/routes/home");
const result = require("./src/routes/home/result");
const auth = require("./src/routes/auth/auth");
const kakao = require("./src/routes/auth/kakao");
const admin = require("./src/routes/admin");

app.set("views", "./src/views");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(`${__dirname}/src/public`));
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/", home);
app.use("/result", result);
app.use("/auth", auth);
app.use("/auth/kakao", kakao);
app.use("/admin", admin);

module.exports = app;
