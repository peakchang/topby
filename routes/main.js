const express = require('express');

const sql_con = require('../db_lib');
const router = express.Router();

const fs = require('fs')

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});



router.use('/test', (req, res, next) => {

    const file = "test.txt";
    const data = "테스트";


    var datas = testFunc(file, data);
    console.log('이 부분은 어떻게 동작을 할까요?????');
    // fs.unlinkSync(file, data, (err) => console.log(err));

    console.log(datas);
    res.send('aldsjflaisjdflajsdf')
})

function testFunc(file, data){
    fs.writeFile(file, '', (err) => {
        console.log('asldfjaisjdf');
        for (let i = 0; i < 10; i++) {
            fs.appendFile(file, `이정도면 ${i}\n`, (err) => {})
        }
    });
    
    return fs.readFileSync(file, 'utf8');
}


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




module.exports = router;