const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const sql_con = require('../db_lib/');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


const router = express.Router();

router.get('/join', isNotLoggedIn, (req, res, next) => {
    res.render('auth/join');
})

router.post('/join', isNotLoggedIn, async (req, res, next) => {

    var { userid_inp, nick, password, user_email } = req.body;
    console.log(userid_inp);
    console.log(nick);
    console.log(password);
    console.log(user_email);
    try {
        let getUserSql = `SELECT * FROM users WHERE userid = '${userid_inp}'`;
        let getUser = await sql_con.promise().query(getUserSql)

        const exUser = getUser[0]
        if (exUser == []) {
            return res.redirect('/auth/join?error=user_exist');
        }

        let getEmailSql = `SELECT * FROM users WHERE user_email = '${user_email}'`;
        let getEmail = await sql_con.promise().query(getEmailSql)

        const exEmail = getEmail[0]
        if (exEmail == []) {
            return res.redirect('/auth/join?error=email_exist');
        }

        const hash = await bcrypt.hash(password, 12);
        let nowTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        let makeUserQuery = `INSERT INTO users (userid, user_email, nick, password, created_at) VALUES(?,?,?,?,?);`;
        let valArr = [userid_inp, user_email, nick, hash, nowTime]
        await sql_con.promise().query(makeUserQuery, valArr)

        return res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});



router.get('/authjoin', isNotLoggedIn, (req, res, next) => {
    res.render('auth/join');
})

router.post('/authjoin', isNotLoggedIn, async (req, res, next) => {

    var { userid_inp, nick, password, user_email } = req.body;
    try {
        let getUserSql = `SELECT * FROM users WHERE userid = '${userid_inp}'`;
        let getUser = await sql_con.promise().query(getUserSql)

        const exUser = getUser[0]
        if (exUser == []) {
            return res.redirect('/auth/join?error=user_exist');
        }

        let getEmailSql = `SELECT * FROM users WHERE user_email = '${user_email}'`;
        let getEmail = await sql_con.promise().query(getEmailSql)

        const exEmail = getEmail[0]
        if (exEmail == []) {
            return res.redirect('/auth/join?error=email_exist');
        }

        const hash = await bcrypt.hash(password, 12);
        let nowTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        console.log(nowTime);
        let makeUserQuery = `INSERT INTO users (userid, user_email, nick, password, type, created_at) VALUES(?,?,?,?,?,?);`;
        let valArr = [userid_inp, user_email, nick, hash, 'tele', nowTime]
        await sql_con.promise().query(makeUserQuery, valArr)

        return res.redirect('/auth/authlogin');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

// router.post('/join', isNotLoggedIn, async (req, res, next) => {
//     const { userid, nick, password } = req.body;
//     try {
//         const exUser = await User.findOne({ where: { userid } });
//         if (exUser) {
//             return res.redirect('/join?error=exist');
//         }
//         const hash = await bcrypt.hash(password, 12);
//         await User.create({
//             userid,
//             nick,
//             password: hash,
//         });
//         return res.redirect('/auth/login');
//     } catch (error) {
//         console.error(error);
//         return next(error);
//     }
// });


router.get('/login', isNotLoggedIn, (req, res, next) => {
    let loginErr = req.query
    res.render('auth/login', { loginErr });
});

router.post('/login', isNotLoggedIn, (req, res, next) => {

    if (req.query.move == '/auth') {
        var movePath = '/crm/estate_manager'
    } else if (req.query.move) {
        var movePath = req.query.move
    } else {
        var movePath = '/crm/estate_manager'
    }

    passport.authenticate('local', (authError, user, info) => {
        console.log('순서체크 1111111111');
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            return res.redirect(`/auth/login/?loginError=${info.message}&move=${movePath}`)
        }
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }

            if (movePath) {
                res.redirect(movePath)
            } else {
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




router.get('/authlogin', isNotLoggedIn, (req, res, next) => {
    let loginErr = req.query;
    const type = 'tele'
    res.render('auth/login', { loginErr, type });
});


router.post('/authlogin', isNotLoggedIn, (req, res, next) => {

    if (req.query.move == '/auth') {
        var movePath = '/telework'
    } else if (req.query.move) {
        var movePath = req.query.move
    } else {
        var movePath = '/telework'
    }

    passport.authenticate('local', (authError, user, info) => {
        console.log('순서체크 1111111111');
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            return res.redirect(`/auth/login/?loginError=${info.message}&move=${movePath}`)
        }
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }

            if (movePath) {
                res.redirect(movePath)
            } else {
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