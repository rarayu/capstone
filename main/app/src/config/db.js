const mySql = require("mysql");

const info = {
  host: "localhost",
  user: "root",
  password: "81092830",
  port: 3306,
  database: "dev",
};

let mysql = mySql.createConnection(info);

mysql.connect((error) => {
  if (error) {
    console.log("DB 연동 실패 : ", error);
  } else {
    console.log("DB 연동 성공!");
  }
});

module.exports = {
  mysql,
  info,
};
