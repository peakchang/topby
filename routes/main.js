const express = require('express');

const sql_con = require('../db_lib');
const router = express.Router();

const fs = require('fs')

const aligoapi = require('aligoapi')
const { aligoKakaoNotification } = require('../db_lib/back_lib')
const app_root_path = require('app-root-path').path;

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});






router.use('/testpp', async (req, res, next) => {
    var pathBasic = `${app_root_path}/public/temp/down.txt`;

    const downDbSql = `SELECT * FROM application_form GROUP BY af_mb_phone ORDER BY af_id DESC`;
    const downDbList = await sql_con.promise().query(downDbSql)

    console.log(downDbList[0]);

    const result = await new Promise((resolve, reject) => {
        var dbContent = ''
        for (const downDb of downDbList[0]) {
            const db_name = downDb.af_mb_name
            const db_phone = downDb.af_mb_phone
            var dbContent = dbContent + `${db_name},${db_phone}\n`;
        }
        resolve(dbContent)
    })
    
    fs.appendFileSync(pathBasic, result, (err) => { })


    var now = moment(Date.now()).format('YYYY-MM-DD');
    const downFileName = `${now}_file.txt`;
    console.log(result);
    res.setHeader('Content-Disposition', `attachment; filename=${downFileName}`) // 이게 핵심 
    res.sendFile(`${app_root_path}/public/temp/down.txt`)

    // res.send('didididididididididi')
})

router.use('/testmain', (req, res, next) => {
    console.log('alsdjfiasjdfiajsdf');
    res.render('topby/top_main_test')
})

router.use('/jschk', async (req, res, next) => {
    const chkjishoSql = `SELECT * FROM chkjisho ORDER BY cj_id DESC;`;
    const chk_jisho_data = await sql_con.promise().query(chkjishoSql)
    const chk_jisho = chk_jisho_data[0];

    res.render('jschk', { chk_jisho })
})

router.use('/chk_jisho', async (req, res, next) => {

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    if (req.method == 'POST') {
        const jishoSql = `INSERT INTO chkjisho (cj_get_time, cj_created_at) VALUES (?, ?);`;
        await sql_con.promise().query(jishoSql, [req.body.on_time, now])
        console.log('request is recieve!! it`s POST!!!');
    }
    res.sendStatus(200)
})



router.use('/test', (req, res, next) => {


    var get_form_name = '안성라포르테(분양)-투자-copy'

    var get_form_name = '양주옥정H'
    var get_form_name = '별내자이더스타(분양)-copy'


    var get_form_name = get_form_name.replace('분양', '')
    var get_form_name = get_form_name.replace('투자', '')
    var reFormName = get_form_name.replace(/[a-zA-Z\(\)\-\s]/g, '')

    console.log(reFormName);
    res.send('aldsjflaisjdflajsdf')
})



router.get('/', (req, res, next) => {
    try {
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