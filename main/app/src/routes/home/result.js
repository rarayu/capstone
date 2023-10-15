"use strict";
const express = require("express");
const router = express.Router();
const fs = require("fs");
const db = require("../../config/db");
const moment = require("moment-timezone");

// url에 대한 페이지 처리 로직을 담당하는 핸들러 함수
const urlHandler = (req, res, url) => {
  const is_logined = req.session.is_logined;
  const is_who = req.session.is_who;
  const url_address = url;

  // url에 해당하는 페이지 처리 로직
  const query = `SELECT results, DATE_FORMAT(date, "%Y-%m-%d %H:%i:%s") AS formattedDate
  FROM results_info 
  WHERE id = '${req.session.nickname}' 
  AND url = '${url}' 
  ORDER BY num DESC 
  LIMIT 2`;

  db.mysql.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (results.length === 0) {
      // 해당하는 결과가 없는 경우 처리
      res.status(404).send("Results not found");
      return;
    }

    // 첫 번째 행의 결과
    const formattedDate1 = moment(results[0].formattedDate).format(
      "YYYY-MM-DD"
    );
    const jsonData1 = JSON.parse(results[0].results);
    const {
      AE: AE1,
      BA: BA1,
      BF: BF1,
      BS: BS1,
      DL: DL1,
      SF: SF1,
      SM: SM1,
      DOR: DOR1,
      RFA: RFA1,
      XSS: XSS1,
      Base: Base1,
      CSRF: CSRF1,
      LDAP: LDAP1,
      Cookie: Cookie1,
      PHP_CI: PHP_CI1,
      Redirect: Redirect1,
      SI_Login: SI_Login1,
      SI_Search: SI_Search1,
      XML_XPATH: XML_XPATH1,
      XSS_Stored: XSS_Stored1,
    } = jsonData1;

    const riskKeys = Object.keys(jsonData1).filter(
      (key) => jsonData1[key] === "risk"
    );

    // 두 번째 행의 결과
    let formattedDate2 = null;
    let jsonData2 = null;
    let AE2,
      BA2,
      BF2,
      BS2,
      DL2,
      SF2,
      SM2,
      DOR2,
      RFA2,
      XSS2,
      Base2,
      CSRF2,
      LDAP2,
      Cookie2,
      PHP_CI2,
      Redirect2,
      SI_Login2,
      SI_Search2,
      XML_XPATH2,
      XSS_Stored2;
    if (results.length > 1) {
      jsonData2 = JSON.parse(results[1].results);
      ({
        AE: AE2,
        BA: BA2,
        BF: BF2,
        BS: BS2,
        DL: DL2,
        SF: SF2,
        SM: SM2,
        DOR: DOR2,
        RFA: RFA2,
        XSS: XSS2,
        Base: Base2,
        CSRF: CSRF2,
        LDAP: LDAP2,
        Cookie: Cookie2,
        PHP_CI: PHP_CI2,
        Redirect: Redirect2,
        SI_Login: SI_Login2,
        SI_Search: SI_Search2,
        XML_XPATH: XML_XPATH2,
        XSS_Stored: XSS_Stored2,
      } = jsonData2);
      formattedDate2 = moment(results[1].formattedDate).format("YYYY-MM-DD");
    }

    // 파일에서 점검항목 info 가져오기
    fs.readFile("src/scripts_info/scripts.json", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading JSON file");
        return;
      }

      const scripts = JSON.parse(data);

      res.render("home/result2", {
        is_logined: is_logined,
        is_who: is_who,
        url_address,
        formattedDate1,
        scripts: scripts,
        riskKeys,
        AE1,
        BA1,
        BF1,
        BS1,
        DL1,
        SF1,
        SM1,
        DOR1,
        RFA1,
        XSS1,
        Base1,
        CSRF1,
        LDAP1,
        Cookie1,
        PHP_CI1,
        Redirect1,
        SI_Login1,
        SI_Search1,
        XML_XPATH1,
        XSS_Stored1,
        AE2,
        BA2,
        BF2,
        BS2,
        DL2,
        SF2,
        SM2,
        DOR2,
        RFA2,
        XSS2,
        Base2,
        CSRF2,
        LDAP2,
        Cookie2,
        PHP_CI2,
        Redirect2,
        SI_Login2,
        SI_Search2,
        XML_XPATH2,
        XSS_Stored2,
      });
    });
  });
};

router.get("/", (req, res) => {
  const is_logined = req.session.is_logined;
  const is_who = req.session.is_who;
  const nickname = req.session.nickname;

  // 데이터베이스 쿼리를 실행하여 해당 세션의 nickname과 일치하는 행을 조회합니다.
  const query = `SELECT DISTINCT url FROM results_info WHERE id = '${nickname}'`;

  db.mysql.query(query, (error, results) => {
    if (error) {
      console.error("Failed to fetch data:", error);
      res
        .status(500)
        .json({ error: "서버 오류가 발생했습니다.", detail: error });
      return;
    }

    // 결과에서 고유한 url 값들을 추출합니다.
    const urls = results.map((row) => row.url);

    // 고유한 url 값들을 기반으로 페이지를 렌더링합니다.
    urls.forEach((url) => {
      router.get(`/${url}`, (req, res) => {
        urlHandler(req, res, url);
      });
    });

    res.render("home/result", {
      is_logined: is_logined,
      is_who: is_who,
      urls: urls,
    });
  });
});

module.exports = router;
