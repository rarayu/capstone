"use strict";

const express = require("express");
const router = express.Router();

const ctrl = require("./home.ctrl");

router.get("/", ctrl.output.home);
router.get("/analysis", ctrl.output.analysis);
router.get("/list", ctrl.output.list);
router.get("/info", ctrl.output.info);

router.post("/analysis", ctrl.process.confirmLogin);
router.post("/analysis", ctrl.process.runPython);

module.exports = router;
