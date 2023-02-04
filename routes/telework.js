const express = require('express');
const router = express.Router();
const sql_con = require('../db_lib');
const { chkRateManagerTele } = require('./middlewares')
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { mailSender } = require('../db_lib/back_lib.js');


router.post('/updatework', async (req, res, next) => {
    if (req.body.pwd_val) {
        const hash = await bcrypt.hash(req.body.pwd_val, 12);
        const updatePwdSql = `UPDATE users SET password = ? WHERE id = ?`;
        await sql_con.promise().query(updatePwdSql, [hash, req.body.id_val]);
    } else if (req.body.update_work == 'on') {
        const getUid = uuidv4();
        // const newUpdateUidSql = `INSERT INTO users (authvalue) VALUES (?) WHERE id = ?`;
        const newUpdateUidSql = `UPDATE users SET authvalue = ? WHERE id = ?`;
        await sql_con.promise().query(newUpdateUidSql, [getUid, req.body.id_val]);
    } else if (req.body.work_type == 'delete') {
        const newUpdateUidSql = `UPDATE users SET authvalue = NULL WHERE id = ?`;
        await sql_con.promise().query(newUpdateUidSql, [req.body.id_val]);
    } else if (req.body.rate_val) {
        console.log('등급 작업 여기서!!!');
        const rateUpdateUidSql = `UPDATE users SET rate = ? WHERE id = ?`;
        await sql_con.promise().query(rateUpdateUidSql, [req.body.rate_val, req.body.id_val]);
    } else if (req.body.link_val) {
        const linkUpdateUidSql = `UPDATE hidden_link SET hidden_link = ? WHERE hidden_chk = ?`;
        await sql_con.promise().query(linkUpdateUidSql, [req.body.link_val, 'main']);
    }

    res.send('어떻게 되었니?!?!?!?!?')
})


router.post('/erremail', async(req,res,next) => {
    const errLog = req.body.err_log;
    const addrCount = req.body.now_add_addr_count;
    const mailContent = `
    <table style='width:100%; border: 1px solid grey; border-collapse: collapse;'>
    <tr>
    <th style='border: 1px solid grey;'>에러 로그</th>
    <td style='border: 1px solid grey;'>${errLog}</td>
    </tr>
    <tr>
    <th style='border: 1px solid grey;'>현재 카운트</th>
    <td style='border: 1px solid grey;'>${addrCount}</td>
    </tr>
    </table>
    `

    
    mailSender.sendEmail(goUser.user_email, '프로그램 에러 확인 요망', mailContent);
    res.send('200')
})

router.post('/gethook', async (req, res, next) => {
    console.log(req.body);

    
    try {
        var get_status = 'no'
        const getUserSql = `SELECT * FROM users WHERE authvalue = ?`;
        const getUser = await sql_con.promise().query(getUserSql, [req.body.get_auth]);
        const get_user = getUser[0][0];
        var get_nick = get_user.nick;
        if(!get_user.macvalue){
            const updateUserMacAddrSql = `UPDATE users SET macvalue = ? WHERE id = ?`;
            await sql_con.promise().query(updateUserMacAddrSql, [req.body.get_mac, get_user.id]);
            var get_status = 'retry'
        }else if(get_user.macvalue == req.body.get_mac){

            const getHiddenLinkSql = `SELECT * FROM hidden_link WHERE hidden_chk = ?`;
            const getHiddenLink = await sql_con.promise().query(getHiddenLinkSql, ['main']);
            var hidden_link = getHiddenLink[0][0].hidden_link;
            var get_status = 'ok'
        }

    } catch (error) {
        var get_status = 'no'
        var hidden_link = ''
    }
    res.json({ get_status, hidden_link, get_nick })
})

router.get('/hiddenlink', async (req, res, next) => {
    console.log(req.body);
    const getLinkSql = `SELECT * FROM hidden_link WHERE hidden_chk = ?`;
    const getLink = await sql_con.promise().query(getLinkSql, ['main']);
    const get_link = getLink[0][0];
    res.render('tele/hidden_link', { get_link })
})

router.use('/', chkRateManagerTele, async (req, res, next) => {
    console.log(req.user);
    console.log('-------------------------------------------');
    const user_info = req.user;
    if (req.user.rate == 5) {
        const userListSql = `SELECT * FROM users WHERE type = 'tele'`;
        const userList = await sql_con.promise().query(userListSql);
        var user_list = userList[0];
        console.log(user_list);
    } else if (req.user.rate == 3) {
        const userListSql = `SELECT * FROM users WHERE userid = ?`;
        const userList = await sql_con.promise().query(userListSql, [req.user.userid]);
        var user_list = userList[0];
        console.log(user_list);
    }
    res.render('tele/telework', { user_info, user_list })
})








module.exports = router;