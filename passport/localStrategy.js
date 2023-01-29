const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const sql_con = require('../db_lib');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'userid',
    passwordField: 'password',
  }, async (userid, password, done) => {

    try {
      console.log('순서체크 22222222');

      let getUserSql = `SELECT * FROM users WHERE userid = '${userid}';`;
      const getUser = await sql_con.promise().query(getUserSql)
      let exUser = getUser[0]
      if (exUser[0]) {
        const result = await bcrypt.compare(password, exUser[0].password);
        if (result) {
          console.log(`성공 했을때!!!`);
          done(null, exUser[0]);
        } else {
          console.log(`비밀번호가 틀릴때!!!`);
          done(null, false, { message: 'noMatchPwd' });
        }
      } else {
        console.log(`아이디가 없을때!!!`);
        done(null, false, { message: 'nosub' });
      }

    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};