const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/user');
const sql_con = require('../db_lib');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'userid',
    passwordField: 'password',
  }, async (userid, password, done) => {

    try {
      let getUserSql = `SELECT * FROM users WHERE userid = '${userid}';`;
      const getUser = await sql_con.promise().query(getUserSql)
      let exUser = getUser[0]
      if (exUser[0]) {
        const result = await bcrypt.compare(password, exUser[0].password);
        if (result) {
          done(null, exUser[0]);
        } else {
          done(null, false, { message: 'noMatchPwd' });
        }
      } else {
        done(null, false, { message: 'nosub' });
      }

    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};