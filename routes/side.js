const express = require('express');
const sql_con = require('../db_lib');
const { executeQuery } = require('../db_lib/dbset.js');
const router = express.Router();
const path = require('path');
const fs = require('fs')
var url = require('url');
const { mailSender } = require('../db_lib/back_lib.js');

const { setDbData, getDbData, getExLength, aligoKakaoNotification_formanager } = require('../db_lib/back_lib.js');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.use('/:name', async (req, res, next) => {

    console.log('이게 여기로 와야 정상인데 맞는거지?!??!?!?!?!');

    if (req.method == "POST") {

        var setPhone = `${req.body.phnum_1}${req.body.phnum_2}${req.body.phnum_3}`
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        const inserSiteDbSql = `INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_created_at) VALUES (?,?,?,?,?,?)`;
        await sql_con.promise().query(inserSiteDbSql, [req.body.hy_set_site, '분양', 'SITE', req.body.af_mb_name, setPhone, now]);


        try {

            console.log('등록된 현장 명은?!?!?!? ', req.body.hy_set_site);
            if (req.body.hy_set_site) {
                const userFindSql = `SELECT * FROM users W HERE manage_estate LIKE '%${req.body.hy_set_site}%';`;

                const findUserData = await sql_con.promise().query(userFindSql);
                const findUser = findUserData[0];

                const mailSubject = `${req.body.hy_set_site} 고객명 ${req.body.af_mb_name} 접수되었습니다.`;
                const mailContent = `현장: ${req.body.hy_set_site} / 이름 : ${req.body.af_mb_name} / 전화번호 : ${setPhone}`;
                mailSender.sendEmail('adpeak@naver.com', mailSubject, mailContent);
                mailSender.sendEmail('changyong112@naver.com', mailSubject, mailContent);

                console.log(findUser);
                for (let p = 0; p < findUser.length; p++) {
                    console.log('Email Send GO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    const mailSubjectManager = `${req.body.af_mb_name} 고객 DB 접수되었습니다.`;
                    const mailContentManager = `이름 : ${req.body.af_mb_name} / 전화번호 : ${setPhone}`;
                    mailSender.sendEmail(findUser[p].user_email, mailSubjectManager, mailContentManager);

                    const receiverStr = `${setPhone}`

                    var customerInfo = { ciName: req.body.af_mb_name, ciCompany: '탑분양정보', ciSite: req.body.hy_set_site, ciPhone: findUser[p].user_phone, ciReceiver: receiverStr }
                    aligoKakaoNotification_formanager(req, customerInfo)
                }
            }



        } catch (error) {

        }





        res.send(`<script type="text/javascript">alert("등록이 완료 되었습니다. 전문 상담원이 빠른 시간 내에 연락 드리도록 하겠습니다."); window.location = document.referrer; </script>`);
        return
    }

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    try {
        const nameChkSql = `SELECT * FROM hy_site WHERE hy_num = ?`;
        const nameChk = await sql_con.promise().query(nameChkSql, [req.params.name]);
        if (nameChk[0][0]) {
            const setData = nameChk[0][0];
            if (setData.hy_image_list) {
                setData.hy_image_list_arr = setData.hy_image_list.split(',');
            }

            const updateCounerPage = `UPDATE hy_site SET hy_counter = ? WHERE hy_num = ?`;
            if(!setData.hy_counter && !req.user){
                await sql_con.promise().query(updateCounerPage, [1, req.params.name]);
            }else if(setData.hy_counter && !req.user){
                const getCount = Number(setData.hy_counter) + 1;
                await sql_con.promise().query(updateCounerPage, [getCount, req.params.name]);
            }

            res.render('side/hynjang', { setData })
        } else {
            const err = new Error('존재하지 않는 url 입니다');
            err.status = 404;
            next(err);
        }
    } catch (error) {
        console.log(error.message);
    }


})



module.exports = router;