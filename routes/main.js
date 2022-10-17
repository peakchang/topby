const express = require('express');

const sql_con = require('../db_lib');
const router = express.Router();


router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});


router.get('/', (req, res, next) => {
    console.log('*************************************************************************************************');

    // console.log(req.session);
    // console.log(req.cookies);
    // console.log(req.user);
    // console.log(req.isAuthenticated());
    try {
        console.log(req.user.nick);
        userInfo = { 'user': req.user, 'req': req };
    } catch {
        userInfo = {}
    }

    res.render('topby/topby_main', { userInfo });
})

router.post('/', (req, res, next) => {
    console.log('진짜 여기로 오는걸까나~~~~~~~~~????????? 궁금하다요~~~~~~~');
    console.log(req.body);
    res.send(200);
})

router.get('/policy', (req, res, next) => {
    res.render('topby/topby_policy');
})

router.post('/policy', (req, res, next) => {
    res.render('topby/topby_policy');
})


router.use('/test', async (req, res, next) => {

    
    // // const testSql = `UPDATE users SET rate = 5 WHERE userid = 'master';`;
    // const testSql = `SELECT * FROM users;`;
    // const results = await sql_con.promise().query(testSql)
    // // console.log(results[0]);

    // var testChk = '안성라포르테';

    // var mailPushArr = []
    // for (const user of results[0]) {
    //     if (user.manage_estate) {
    //         var userEstates = user.manage_estate.split(',')
    //         for (let i = 0; i < userEstates.length; i++) {
    //             if (testChk.includes(userEstates[i])) {
    //                 mailPushArr.push(user.user_email);
    //             }
    //         }
    //     }
    // }

    // console.log(mailPushArr);


    res.send('sldjfaldsjfliajsdlfjasdf')
})

module.exports = router;