const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.get('/join', isNotLoggedIn, (req, res, next) => {
    res.render('auth/join');
})

router.post('/join', isNotLoggedIn, async (req, res, next) => {
    console.log('여기는 맞는거지????');
    const { userid, nick, password } = req.body;
    try {
        const exUser = await User.findOne({ where: { userid } });
        if (exUser) {
            return res.redirect('/join?error=exist');
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            userid,
            nick,
            password: hash,
        });
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});


router.get('/login', isNotLoggedIn, (req, res, next) => {
    console.log(req.user);
    res.render('auth/login');
});
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            console.log(req.user);
            return res.redirect(`/auth/login/?loginError=${info.message}`)
        }
        return req.login(user, (loginError) => {
            console.log(user);
            
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            res.redirect('/')
        });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
    console.log(req.user);
    // req.logout();
    req.session.destroy();
    res.redirect('/');
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/',
}), (req, res) => {
    res.redirect('/');
});

module.exports = router;