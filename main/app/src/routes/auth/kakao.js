"use strict";

const express = require("express");
const router = express.Router();
const axios = require("axios");
const qs = require("qs");
let db = require("../../../src/config/db");

const kakao = {
  clientID: "10e161ee589ebfb98cc9d69c8de7a96b",
  clientSecret: "ffSHboCrf1NJLyNkx5rVtHSq6GuOEFd2",
  redirectUri: "http://localhost:3000/auth/kakao/callback",
};

// Kakao 인증 요청
router.get("/", (req, res) => {
  const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${kakao.clientID}&redirect_uri=${kakao.redirectUri}&response_type=code&scope=profile_nickname`;
  res.redirect(kakaoAuthURL);
});

// Kakao 콜백 핸들링
router.get("/callback", async (req, res) => {
  let token;
  try {
    // 액세스 토큰 받기
    token = await axios({
      method: "POST",
      url: "https://kauth.kakao.com/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      data: qs.stringify({
        grant_type: "authorization_code",
        client_id: kakao.clientID,
        client_secret: kakao.clientSecret,
        redirectUri: kakao.redirectUri,
        code: req.query.code,
      }),
    });
  } catch (err) {
    return res.json(err.data);
  }

  let user;
  try {
    // 사용자 정보 요청
    user = await axios({
      method: "get",
      url: "https://kapi.kakao.com/v2/user/me",
      headers: {
        Authorization: `Bearer ${token.data.access_token}`,
      },
    });
  } catch (e) {
    return res.json(e.data);
  }

  req.session.kakao = user.data; //kakao 로그인 관련 모든 정보
  // req.session.nickname = user.data.properties.nickname;
  req.session.nickname = user.data.id;

  const kakao_id = user.data.id;
  const selectQuery = `SELECT * FROM users WHERE id = ${kakao_id}`;
  db.mysql.query(selectQuery, (selectErr, selectResult) => {
    if (selectErr) {
      console.error("SELECT 쿼리 실행 실패: ", selectErr);
      return;
    }

    if (selectResult.length > 0) {
      return;
    }

    const insertQuery = `INSERT INTO users (id) VALUES (${kakao_id})`;
    db.mysql.query(insertQuery, (insertErr) => {
      if (insertErr) {
        console.error("INSERT 쿼리 실행 실패: ", insertErr);
      } else {
        console.log("레코드 추가 완료!");
      }
    });
  });
  req.session.is_logined = true;
  req.session.save(function () {
    res.redirect(`/`);
  });
});

module.exports = router;
