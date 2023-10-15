"use strict";

let db = require("../../config/db");
const authCheck = require("../../public/js/home/authCheck")

const output = {
  login: (req, res) => {
    res.render("home/login");
  },

  register: (req, res) => {
    res.render("home/register");
  },

  mypage: (req, res) => {
    const is_logined = req.session.is_logined;
    const is_who = req.session.is_who;
    const id = req.session.nickname;

    db.mysql.query(`SELECT * FROM users WHERE id = '${id}'`, (error, results) => {
      if (error) {
        console.error("Failed to fetch data:", error);
        res
          .status(500)
          .json({ error: "서버 오류가 발생했습니다.", detail: error });
        return;
      }
      const result = results[0];
      res.render("home/mypage", { is_logined: is_logined, is_who: is_who, result: result });
    });
  },
};

const process = {
  confirmLogin: (req, res, next) => {
    if (!authCheck.isOwner(req, res)) {
      res.send(`<script type="text/javascript">alert("로그인이 필요한 항목입니다."); 
      document.location.href="/auth/login";</script>`);
      return false;
    } else {
      next();
    }
  },

  login: (req, res) => {
    var id = req.body.id;
    var pw = req.body.pw;

    if (id && pw) {
      // id와 pw가 입력되었는지 확인
      db.mysql.query(
        "SELECT * FROM users WHERE id = ? AND pw = ?",
        [id, pw],
        function (error, results, fields) {
          if (error) throw error;
          if (results.length > 0) {
            // db에서의 반환값이 있으면 로그인 성공
            req.session.is_logined = true; // 세션 정보 갱신
            req.session.is_who = "user";
            req.session.nickname = id;
            req.session.save(function () {
              res.redirect(`/`);
            });
          } else {
            res.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
              document.location.href="/auth/login";</script>`);
          }
        }
      );
    } else {
      res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
      document.location.href="/auth/login";</script>`);
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
    var email = req.body.email;
    var name = req.body.name;
    var company = req.body.company; 

    if (id && pw && confirm_pw && email && name && company) {
      db.mysql.query(
        "SELECT * FROM users WHERE id = ?",
        [id],
        function (error, results, fields) {
          // DB에 같은 이름의 회원아이디가 있는지 확인
          if (error) throw error;
          if (results.length <= 0 && pw == confirm_pw) {
            // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우
            db.mysql.query(
              "INSERT INTO users (id, pw, email, user_name, company) VALUES(?,?,?,?,?)",
              [id, pw, email, name, company],
              function (error, data) {
                if (error) throw error2;
                res.send(`<script type="text/javascript">alert("회원가입이 완료되었습니다.");
                    document.location.href="/";</script>`);
              }
            );
          } else if (pw != confirm_pw) {
            // 비밀번호가 올바르게 입력되지 않은 경우
            res.send(`<script type="text/javascript">alert("비밀번호가 일치하지 않습니다."); 
                document.location.href="/auth/register";</script>`);
          } else {
            // DB에 같은 이름의 회원아이디가 있는 경우
            res.send(`<script type="text/javascript">alert("이미 존재하는 아이디 입니다."); 
                document.location.href="/auth/register";</script>`);
          }
        }
      );
    } else {
      // 입력되지 않은 정보가 있는 경우
      res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/auth/register";</script>`);
    }
  },

  newPassword: (req, res) => {
    var id = req.session.nickname;
    var pw = req.body.pw;
    var new_pw = req.body.new_pw;
    var confirm_pw = req.body.confirm_pw;

    if (id && pw && new_pw && confirm_pw) {
      db.mysql.query(
        "SELECT * FROM users WHERE id = ?",
        [id],
        function (error, results, fields) {
          if (error) throw error;

          if (results.length > 0) {
            var user = results[0];

            if (user.pw === pw) {
              if (new_pw === confirm_pw) {
                db.mysql.query(
                  "UPDATE users SET pw = ? WHERE id = ?",
                  [new_pw, id],
                  function (error, data) {
                    if (error) throw error;
                    res.send(`<script type="text/javascript">alert("비밀번호가 변경되었습니다.");
                      document.location.href="/";</script>`);
                  }
                );
              } else {
                res.send(`<script type="text/javascript">alert("새로운 비밀번호와 확인이 일치하지 않습니다."); 
                  document.location.href="/auth/mypage";</script>`);
              }
            } else {
              res.send(`<script type="text/javascript">alert("현재 비밀번호가 일치하지 않습니다."); 
                document.location.href="/auth/mypage";</script>`);
            }
          } else {
            res.send(`<script type="text/javascript">alert("사용자가 존재하지 않습니다."); 
              document.location.href="/auth/mypage";</script>`);
          }
        }
      );
    } else {
      res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/auth/mypage";</script>`);
    }
  },

  deleteAccont: (req, res) => {
    // 현재 로그인한 사용자의 세션 정보 가져오기
    const id = req.session.nickname;

    db.mysql.query(
      "DELETE FROM users WHERE id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.error(error);
          res.redirect("/");
        } else {
          // 로그인 데이터 파기 (세션 삭제)
          req.session.destroy((err) => {
            if (err) {
              console.error(err);
              res.redirect("/");
            } else {
              res.send(`<script type="text/javascript">alert("회원 탈퇴가 완료되었습니다."); 
                document.location.href="/";</script>`);
            }
          });
        }
      }
    );
  },
};

module.exports = {
  output,
  process,
};
