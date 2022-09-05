const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'userid',
    passwordField: 'password',
  }, async (userid, password, done) => {
    console.log('첫번째 관문');
    try {
      const exUser = await User.findOne({ where: { userid } });
      console.log(`두번째 관문 exUser는? : ${exUser}`);
      if (exUser) {
        const result = await bcrypt.compare(password, exUser.password);
        if (result) {
          console.log('세번째 관문 통과함??');
          done(null, exUser);
        } else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
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
