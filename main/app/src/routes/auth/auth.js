"use strict";

const express = require("express");
const router = express.Router();

const ctrl = require("./auth.ctrl");

router.get("/login", ctrl.output.login);
router.get("/register", ctrl.output.register);

router.get("/mypage", ctrl.process.confirmLogin);
router.get("/mypage", ctrl.output.mypage);

router.post("/login", ctrl.process.login);
router.post("/logout", ctrl.process.logout);
router.post("/register", ctrl.process.register);
router.post("/mypage", ctrl.process.newPassword);

router.post("/deleteAccount", ctrl.process.deleteAccont);

module.exports = router;
