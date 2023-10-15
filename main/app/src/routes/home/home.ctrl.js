"use strict";

const moment = require("moment-timezone");
const { spawn } = require("child_process");
const fs = require("fs");
var authCheck = require("../../../src/public/js/home/authCheck.js");
let db = require("../../config/db");

const output = {
  home: (req, res) => {
    const is_logined = req.session.is_logined;
    const is_who = req.session.is_who;
    fs.readFile("src/scripts_info/scripts.json", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading JSON file");
        return;
      }

      const scripts = JSON.parse(data);
      res.render("home/index", { scripts: scripts, is_logined: is_logined, is_who: is_who });
    });
  },

  analysis: (req, res) => {
    const is_logined = req.session.is_logined;
    const is_who = req.session.is_who;
    res.render("home/analysis", { is_logined: is_logined, is_who: is_who  });
  },

  list: (req, res) => {
    const is_logined = req.session.is_logined;
    const is_who = req.session.is_who;
    fs.readFile("src/scripts_info/scripts.json", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading JSON file");
        return;
      }

      const scripts = JSON.parse(data);
      res.render("home/list", { scripts: scripts, is_logined: is_logined, is_who: is_who  });
    });
  },

  info: (req, res) => {
    const is_logined = req.session.is_logined;
    const is_who = req.session.is_who;
    res.render("home/info", { is_logined: is_logined, is_who: is_who  });
  },
};

const process = {
  login: (req, res) => {
    var id = req.body.id;
    var pw = req.body.pw;

    if (id && pw) {
      db.mysql.query(
        "SELECT * FROM users WHERE id = ? AND pw = ?",
        [id, pw],
        function (error, results, fields) {
          if (error) throw error;
          if (results.length > 0) {
            // db에서의 반환값이 있으면 로그인 성공
            req.session.is_logined = true; // 세션 정보 갱신
            req.session.nickname = id;
            req.session.save(function () {
              res.redirect(`/`);
            });
          } else {
            res.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
              document.location.href="/login";</script>`);
          }
        }
      );
    } else {
      res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
      document.location.href="/login";</script>`);
    }
  },

  logout: (req, res) => {
    req.session.destroy(function (err) {
      res.redirect("/");
    });
  },

  register: (req, res) => {
    var id = req.body.id;
    var pw = req.body.pw;
    var confirm_pw = req.body.confirm_pw;

    if (id && pw && confirm_pw) {
      db.mysql.query(
        "SELECT * FROM users WHERE id = ?",
        [id],
        function (error, results, fields) {
          // DB에 같은 이름의 회원아이디가 있는지 확인
          if (error) throw error;
          if (results.length <= 0 && pw == confirm_pw) {
            // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우
            db.mysql.query(
              "INSERT INTO users (id, pw) VALUES(?,?)",
              [id, pw],
              function (error, data) {
                if (error) throw error2;
                res.send(`<script type="text/javascript">alert("회원가입이 완료되었습니다.");
                    document.location.href="/";</script>`);
              }
            );
          } else if (pw != confirm_pw) {
            // 비밀번호가 올바르게 입력되지 않은 경우
            res.send(`<script type="text/javascript">alert("비밀번호가 일치하지 않습니다."); 
                document.location.href="/register";</script>`);
          } else {
            // DB에 같은 이름의 회원아이디가 있는 경우
            res.send(`<script type="text/javascript">alert("이미 존재하는 아이디 입니다."); 
                document.location.href="/register";</script>`);
          }
        }
      );
    } else {
      // 입력되지 않은 정보가 있는 경우
      res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/register";</script>`);
    }
  },

  confirmLogin: (req, res, next) => {
    if (!authCheck.isOwner(req, res)) {
      // 로그인 안되어있으면 로그인 페이지로 이동시킴
      res.send(`<script type="text/javascript">alert("로그인 후, 이용할 수 있습니다."); 
                document.location.href="/auth/login";</script>`);
      return false;
    } else {
      next();
    }
  },

  runPython: (req, res) => {
    const id = req.session.nickname;
    const { url } = req.body;
    const status1 = "work";
    const status2 = "done";
    const date = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
    const query1 = `INSERT INTO results_info (id, url, date, results, process) VALUES ('${id}', '${url}', '${date}', '{}', '${status1}')`;
    const query2 = `SELECT id, num FROM results_info WHERE id = ? ORDER BY num DESC LIMIT 1`;
    const query3 = `UPDATE results_info SET process = ? WHERE id = ?`;
    db.mysql.query(query1, (error) => {
      if (error) {
        console.error("Failed to insert data:", error);
        res
          .status(500)
          .json({ error: "서버 오류가 발생했습니다.", detail: error });
        return;
      }

      const pythonProcess = spawn("venv\\Scripts\\python", [
        "main.py",
        req.session.nickname,
        url,
      ]);

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          // Python 스크립트 실행 성공
          db.mysql.query(query2, [id], (selectError, selectResults1) => {
            if (selectError) {
              console.error('Error selecting row:', selectError);
              res.send(
                `<script type="text/javascript">alert("1 점검에 실패했습니다."); document.location.href="/analysis";</script>`
              );
            }

            if (selectResults1.length === 0) {
              console.log('No matching rows found');
              res.send(
                `<script type="text/javascript">alert("2 점검에 실패했습니다."); document.location.href="/analysis";</script>`
              );
            }

            db.mysql.query(query3, [status2, id], (updateError, updateResults) => {
              if (updateError) {
                console.error('Error updating process:', updateError);
                res.send(
                  `<script type="text/javascript">alert("3 점검에 실패했습니다."); document.location.href="/analysis";</script>`
                );
              }
              res.send(
                `<script type="text/javascript">alert("점검이 완료되었습니다."); document.location.href="/result";</script>`
              );
              if (updateResults.affectedRows > 0) {
                console.log('Process updated successfully');
              } else {
                console.log('No rows updated');
              }
            });
          });
        } else {
          // Python 스크립트 실행 실패
          res.send(
            `<script type="text/javascript">alert("점검에 실패했습니다."); document.location.href="/analysis";</script>`
          );
        }
      });
    });
  },
};

module.exports = {
  output,
  process,
};
