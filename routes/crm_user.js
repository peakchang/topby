const express = require('express');
const { isLoggedIn, isNotLoggedIn, chkRateManager, chkRateMaster } = require('./middlewares');
const { setDbData, getDbData, getExLength, randomChracter } = require('../db_lib/back_lib.js');
const sql_con = require('../db_lib');
const bcrypt = require('bcrypt');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const router = express.Router();


router.use('/set_user_site', async (req, res, next) => {
    let status = true;
    const body = req.body;
    console.log(body.checkedStr);
    console.log(body.getId);
    try {
        const updateUserSiteQuery = "UPDATE users SET manage_estate = ? WHERE id = ?";
        await sql_con.promise().query(updateUserSiteQuery, [body.checkedStr, body.userId])
    } catch (error) {
        status = false;
    }


    res.json({ status })
})

router.use('/chk_site_list', async (req, res, next) => {
    let status = true;

    let user_site = [];
    let location_list = [];

    try {
        const getSiteForUserQuery = "SELECT manage_estate FROM users WHERE id = ?";
        const getSiteForUser = await sql_con.promise().query(getSiteForUserQuery, [req.body.getId])
        const getSite = getSiteForUser[0][0]
        console.log(getSite);
        user_site = getSite.manage_estate.split(",")

        const getSiteListSql = "SELECT * FROM site_list ORDER BY sl_id DESC";
        const getSiteListResult = await sql_con.promise().query(getSiteListSql)
        for (const getSiteListFor of getSiteListResult[0]) {
            location_list.push(getSiteListFor.sl_site_name)
        }
    } catch (error) {
        status = false;
    }

    console.log(user_site);


    res.json({ status, location_list, user_site })
})


router.post('/user_manage_update', async (req, res, next) => {
    try {
        if (req.body.pwd_val) {
            const hash = await bcrypt.hash(req.body.pwd_val, 12);
            const valArr = [hash, req.body.id_val]
            const pwdUpdateSql = `UPDATE users SET password = ? WHERE id = ?;`;
            await sql_con.promise().query(pwdUpdateSql, valArr);
        } else if (req.body.rate_val) {
            const valArr = [req.body.rate_val, req.body.id_val]
            const rateUpdateSql = `UPDATE users SET rate = ? WHERE id = ?;`;
            await sql_con.promise().query(rateUpdateSql, valArr);
        } else if (req.body.location_val) {
            const valArr = [req.body.location_val, req.body.id_val]
            const locationUpdateSql = `UPDATE users SET manage_estate = ? WHERE id = ?;`;
            await sql_con.promise().query(locationUpdateSql, valArr);
        } else if (req.body.delval) {
            const valArr = [req.body.id_val]
            const locationDeleteSql = `UPDATE users SET manage_estate = '' WHERE id = ?;`;
            await sql_con.promise().query(locationDeleteSql, valArr);
        } else if (req.body.email_val) {
            const valArr = [req.body.email_val, req.body.id_val]
            const emailUpdateSql = `UPDATE users SET user_email = ? WHERE id = ?;`;
            await sql_con.promise().query(emailUpdateSql, valArr);
        } else if (req.body.phone_val) {
            var phone_val = req.body.phone_val.replace(/\-/g, '');
            const valArr = [phone_val, req.body.id_val]
            const phoneUpdateSql = `UPDATE users SET user_phone = ? WHERE id = ?;`;
            await sql_con.promise().query(phoneUpdateSql, valArr);
        } else if (req.body.chk_list) {
            for await (const i of req.body.chk_list) {
                const delUserSql = `DELETE FROM users WHERE id = ?`
                await sql_con.promise().query(delUserSql, [i]);
            }
        }
        res.send(200)
    } catch (error) {
        res.send(404)
    }

})


// chkRateMaster
router.get('/', chkRateMaster, async (req, res, next) => {

    let now_page = parseInt(req.query.nowpage)
    if (!now_page) {
        now_page = 1
    }
    const startCount = (now_page - 1) * 20

    let now_rate = req.query.rate
    if (!now_rate) {
        now_rate = 2
    }


    let search_name = req.query.search_name
    let searchNameQuery = ""
    if (search_name) {
        searchNameQuery = `AND nick LIKE '%${search_name}%'`;
    }
    console.log(searchNameQuery);


    let search_id = req.query.search_id
    let searchIdQuery = ""
    if (search_id) {
        searchIdQuery = `AND user_email LIKE '%${search_id}%'`;
    }



    const masterLoadSql = `SELECT * FROM users WHERE rate = 5`;
    const masterLoadTemp = await sql_con.promise().query(masterLoadSql);
    const master_load = masterLoadTemp[0];

    console.log(req.query.rate);

    let userLoadSql = ""
    let userCountSql = ""
    let user_list = []
    let userCount = ''

    if (!req.query.rate) {
        userLoadSql = `SELECT * FROM users WHERE rate = 2 ${searchNameQuery} ${searchIdQuery} AND type IS NULL LIMIT ${startCount}, 20;`;
        userCountSql = `SELECT COUNT(*) FROM users WHERE rate = 2 ${searchNameQuery} ${searchIdQuery} AND type IS NULL;`;
    } else if (req.query.rate == 'all') {
        userLoadSql = `SELECT * FROM users WHERE rate < 5 ${searchNameQuery} ${searchIdQuery} AND type IS NULL LIMIT ${startCount}, 20;`;
        userCountSql = `SELECT COUNT(*) FROM users WHERE rate < 5 ${searchNameQuery} ${searchIdQuery} AND type IS NULL;`;
    } else {
        userLoadSql = `SELECT * FROM users WHERE rate = ${parseInt(req.query.rate)} ${searchNameQuery} ${searchIdQuery} AND type IS NULL LIMIT ${startCount}, 20;`;
        userCountSql = `SELECT COUNT(*) FROM users WHERE rate = ${parseInt(req.query.rate)} ${searchNameQuery} ${searchIdQuery} AND type IS NULL;`;
    }

    try {
        const userCountQuery = await sql_con.promise().query(userCountSql);
        userCount = userCountQuery[0][0]['COUNT(*)']
        const userListTemp = await sql_con.promise().query(userLoadSql);
        user_list = userListTemp[0];
    } catch (error) {

    }

    console.log(userCount);

    const maxPage = Math.ceil(userCount / 20)

    console.log(maxPage);


    const pageArr = getPaginationArray(now_page, maxPage)

    console.log(pageArr);
    // console.log(user_list);
    // console.log(userCount);



    const getSiteListSql = "SELECT * FROM site_list";
    const getSiteListResult = await sql_con.promise().query(getSiteListSql)
    const location_list = [];
    for (const getSiteListFor of getSiteListResult[0]) {
        location_list.push(getSiteListFor.sl_site_name)
    }

    res.render('crm/user_manage', { master_load, user_list, location_list, now_page, pageArr, now_rate, search_name, search_id, maxPage });
})


function getPaginationArray(currentPage, totalPages) {
    const maxVisiblePages = 10;
    let startPage, endPage;

    if (currentPage <= 5) {
        // 첫 5페이지일 경우
        startPage = 1;
        endPage = Math.min(totalPages, maxVisiblePages);
    } else if (currentPage > totalPages - 5) {
        // 마지막 5페이지일 경우
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
        endPage = totalPages;
    } else {
        // 중간 페이지들
        startPage = currentPage - 4;
        endPage = currentPage + 5;
    }

    const paginationArray = [];
    for (let i = startPage; i <= endPage; i++) {
        paginationArray.push(i);
    }

    return paginationArray;
}

module.exports = router;