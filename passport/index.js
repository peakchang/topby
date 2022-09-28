const passport = require('passport');
const local = require('./localStrategy');
const User = require('../models/user');
const sql_con = require('../db_lib');

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id); // 세션에 유저의 id만 저장
  });
  passport.deserializeUser((id, done) => {
    let getUserSql = `SELECT * FROM users WHERE id = '?'`;
    sql_con.query(getUserSql, [id], (err, result) => {
      if (err) console.log('mysql 에러');
      var json = JSON.stringify(result[0]);
      userinfo = JSON.parse(json);
      done(null, userinfo);
    })
  });

  local();
};