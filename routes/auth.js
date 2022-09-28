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
        return res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});


router.get('/login', isNotLoggedIn, (req, res, next) => {
    let loginErr = req.query
    res.render('auth/login', { loginErr });
});
router.post('/login', isNotLoggedIn, (req, res, next) => {
    let movePath = req.query
    passport.authenticate('local', (authError, user, info) => {
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            console.log(req.user);
            return res.redirect(`/auth/login/?loginError=${info.message}&move=${movePath.move}`)
        }
        return req.login(user, (loginError) => {
            console.log(user);
            console.log(req.session);
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            if(movePath.move){
                res.redirect(movePath.move)
            }else{
                res.redirect('/')
            }
        });
    })(req, res, next) // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
    console.log(req.user);
    req.session.destroy();
    req.logout(() => {
        res.redirect('/');
    });

});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/',
}), (req, res) => {
    res.redirect('/');
});

module.exports = router;