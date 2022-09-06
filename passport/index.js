const passport = require('passport');
const local = require('./localStrategy');
const User = require('../models/user');

module.exports = () => {
  passport.serializeUser((user, done) => {
    // console.log(`네번째 관문 ${user.id}`);
    done(null, user.id); // 세션에 유저의 id만 저장
  });

  // {id: 3, 'connect.sid' : s%23412324234234}
  passport.deserializeUser((id, done) => {
    console.log("5번째 관문은?");
    User.findOne({
      where: { id },
    })
      .then(user => done(null, user)) // req.user, req.authenticated()
      .catch(err => done(err));
  });

  local();
};