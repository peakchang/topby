const express = require('express');
const sql_con = require('../db_lib');
const router = express.Router();
const { mailSender } = require('../db_lib/back_lib.js');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use((req, res, next) => {
    res.locals.cookies = req.cookies;
    next();
});


router.use('/pg1', async(req, res, next) => {
    console.log(res.cookies);

    res.render('mini_site/pg1')
})

router.use('/pg2', async(req, res, next) => {
    console.log(res.cookies);
    res.render('mini_site/pg2')
})

router.use('/pg3', async(req, res, next) => {
    console.log(res.cookies);
    res.render('mini_site/pg3')
})

router.use('/pg4', async(req, res, next) => {
    console.log(res.cookies);
    res.render('mini_site/pg4')
})

router.use('/pg5', async(req, res, next) => {
    console.log(res.cookies);
    res.render('mini_site/pg5')
})

router.use('/pg6', async(req, res, next) => {
    console.log(res.cookies);
    res.render('mini_site/pg6')
})

router.use('/:id', async(req, res, next) => {
    if(req.method == 'POST'){
        console.log(req.body);
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        addCustomerSql = `INSERT INTO application_form (af_form_name,af_form_type_in,af_mb_name,af_mb_phone,af_created_at) VALUES (?,?,?,?,?)`;
        await sql_con.promise().query(addCustomerSql, ['내포메타피아','분양(파워링크)',req.body.by_name, req.body.by_phnum, now]);

        const mailSubject = `내포메타피아 고객명 ${req.body.by_name} 접수되었습니다. (파워링크)`;
        const mailContent = `현장: 내포메타피아 / 이름 : ${req.body.by_name} / 전화번호 : ${req.body.by_phnum}`;
        mailSender.sendEmail('adpeak@naver.com', mailSubject, mailContent);
        mailSender.sendEmail('changyong112@naver.com', mailSubject, mailContent);
    }
    
    res.render('mini_site/main',)
})

module.exports = router;