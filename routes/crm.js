const express = require('express');
const { isLoggedIn, isNotLoggedIn, chkRateManager, chkRateMaster } = require('./middlewares');
const sql_con = require('../db_lib');
const { executeQuery } = require('../db_lib/dbset.js');
const bcrypt = require('bcrypt');
const router = express.Router();
const xlsx = require("xlsx");
const multer = require('multer');
const path = require('path');
const fs = require('fs')
const app_root_path = require('app-root-path').path;
var url = require('url');

const { setDbData, getDbData, getExLength, randomChracter } = require('../db_lib/back_lib.js');

const moment = require('moment');
const { Logform } = require('winston');
const { IGComment } = require('facebook-nodejs-business-sdk');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// router.use((req, res, next) => {
//     console.log(req.user);
//     res.locals.user = req.user;
//     next();
// });



router.get('/site', async(req,res,next) => {
    console.log('sdlkjflsjdflsjf');
    res.render('crm/work_site')
})



const upload = multer({
    storage: multer.diskStorage({
        // 경로를 설정
        destination(req, file, cb) {
            try {
                fs.readdirSync(`uploads/${req.body.hy_num}`);
            } catch (error) {

                fs.mkdirSync(`uploads/${req.body.hy_num}`);
            }
            cb(null, `uploads/${req.body.hy_num}`);
        },
        filename(req, file, cb) {
            //파일명 설정
            cb(null, file.originalname);
        },
    }),
    // limits: { fileSize: 10 * 1024 * 1024 },
});


router.post('/del_image', async (req, res, next) => {
    const updateDelListSql = `UPDATE hy_site SET hy_image_list = ? WHERE hy_num = ?`;
    await sql_con.promise().query(updateDelListSql, [req.body.getUpdateImgList, req.body.hy_num]);
    fs.unlink(`uploads/${req.body.hy_num}/${req.body.getDelTargetImg}`, err => {
    })

    fs.existsSync(`uploads/${req.body.hy_num}/${req.body.getDelTargetImg}`, function (ex) {
        if (ex) {
            fs.unlink(`uploads/${req.body.hy_num}/${req.body.getDelTargetImg}`, err => {
            })
        } else {
        }
    })
    res.send(200)
})

router.post('/arr_image', upload.array('testimg'), async (req, res, next) => {
    const hyImgListUpdateSql = `UPDATE hy_site SET hy_image_list = ? WHERE hy_num = ?`;
    await sql_con.promise().query(hyImgListUpdateSql, [req.body.fileListStr, req.body.hy_num]);
    var SetHyImgList = req.body.fileListStr.split(',')
    res.send({ SetHyImgList })
})


router.get('/side_detail/:id', chkRateMaster, async (req, res, next) => {
    const getHyInfoSql = `SELECT * FROM hy_site WHERE hy_id = ?`;
    const getHyInfo = await sql_con.promise().query(getHyInfoSql, [req.params.id]);
    var get_hy_info = getHyInfo[0][0];

    const getSiteListSql = `SELECT sl_id,sl_site_name FROM site_list`;
    const getSiteList = await sql_con.promise().query(getSiteListSql);
    var get_site_list = getSiteList[0];
    console.log(get_site_list);


    try {
        get_hy_info.hy_image_arr = get_hy_info.hy_image_list.split(',')
        if (!get_hy_info.hy_image_arr[0]) {
            get_hy_info.hy_image_arr.splice(0, 1)
        }
    } catch (error) {
        get_hy_info.hy_image_arr = []
    }
    // get_hy_info.hy_description = get_hy_info.hy_description.trim()
    // get_hy_info.hy_features = get_hy_info.hy_features.trim()


    res.render('crm/work_side_detail', { get_hy_info, get_site_list })
})


router.post('/side_detail/:id', chkRateMaster, upload.single('main_img'), async (req, res, next) => {
    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    try {
        var mainImgFileName = req.file.originalname
    } catch (error) {
        var mainImgFileName = req.body.main_img_file_name
    }



    const allUpdateSql = `UPDATE hy_site SET hy_title = ?, hy_description = ?, hy_keywords = ?, hy_site_name = ?, hy_businessname = ?, hy_set_site = ?,hy_type = ?, hy_scale = ?, hy_areasize = ?, hy_house_number = ?, hy_location = ?, hy_scheduled = ?, hy_builder = ?, hy_conduct = ?, hy_features = ?,hy_main_image = ?, hy_image_list = ?, hy_callnumber = ?, hy_creted_at = ? WHERE hy_id = ?;`;

    const allUpdateArr = [req.body.hy_title, req.body.hy_description, req.body.hy_keywords, req.body.hy_site_name, req.body.hy_businessname, req.body.hy_set_site, req.body.hy_type, req.body.hy_scale, req.body.hy_areasize, req.body.hy_house_number, req.body.hy_location, req.body.hy_scheduled, req.body.hy_builder, req.body.hy_conduct, req.body.hy_features, mainImgFileName, req.body.hy_image_list, req.body.hy_callnumber, now, req.body.hy_id]
    await sql_con.promise().query(allUpdateSql, allUpdateArr);



    res.send(`<script type="text/javascript">alert("수정이 완료 되었습니다."); window.location = document.referrer; </script>`);
})




router.use('/side', chkRateMaster, async (req, res, next) => {
    if (req.method == 'POST') {

        if (req.body.submit_val == 'site_update') {
            if (typeof (req.body.site_id) == 'string') {
                const updateHySql = `UPDATE hy_site SET hy_num = ? WHERE hy_id = ?`;
                await sql_con.promise().query(updateHySql, [req.body.site_num, parseInt(req.body.site_id)])
            }
        } else {
            try {
                var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                const newHySql = `INSERT INTO hy_site (hy_num,hy_title,hy_creted_at) VALUES (?,?,?)`
                await sql_con.promise().query(newHySql, [req.body.new_site_num, req.body.new_site_title, now])
            } catch (error) {

            }
        }
    }

    const getSiteListSql = `SELECT * FROM hy_site`;
    const getSiteListAll = await sql_con.promise().query(getSiteListSql)
    const get_site_list = getSiteListAll[0];
    res.render('crm/work_side', { get_site_list })
})




router.get('/down_db', chkRateMaster, async (req, res, next) => {
    var pathBasic = `${app_root_path}/public/temp/down.txt`;
    fs.writeFile(pathBasic, '', (err) => { });

    var addQuery = '';
    if (req.query.sd || req.query.ed) {
        var addQuery = `WHERE af_created_at > '${req.query.sd}' AND af_created_at < '${req.query.ed}'`;
    }

    if (req.query.sd && req.query.est != '') {
        var addQuery = addQuery + `AND af_form_name LIKE '%${req.query.est}%'`;
    } else if (req.query.est && req.query.est != '') {
        var addQuery = `WHERE af_form_name LIKE '%${req.query.est}%'`;
    }


    if (req.query.sd && req.query.status != '' || req.query.est && req.query.status != '') {
        var addQuery = addQuery + `AND af_mb_status = '${req.query.status}'`;
    } else if (req.query.status && req.query.status != '') {
        var addQuery = `WHERE af_mb_status = '${req.query.status}'`;
    }

    const downDbSql = `SELECT * FROM application_form ${addQuery} GROUP BY af_mb_phone ORDER BY af_id DESC`;
    const downDbList = await sql_con.promise().query(downDbSql)


    for (const downDb of downDbList[0]) {
        const db_name = downDb.af_mb_name
        const db_phone = downDb.af_mb_phone
        fs.appendFileSync(pathBasic, `${db_name},${db_phone}\n`, (err) => { })
    }

    var now = moment(Date.now()).format('YYYY-MM-DD');
    const downFileName = `${now}_file.txt`;
    res.setHeader('Content-Disposition', `attachment; filename=${downFileName}`); // 이게 핵심 
    res.sendFile(`${app_root_path}/public/temp/down.txt`);



})


router.use('/upload_db', chkRateMaster, async (req, res, next) => {

    if (req.method == 'POST') {
        const getDbList = req.body.dblist_text.split('\r\n');
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        var formName = req.body.set_estate
        if (req.body.set_estate_memo) {
            var formName = formName + ' ' + req.body.set_estate_memo;
        }

        for await (const getDb of getDbList) {
            const spliceDb = getDb.split(',');
            const insertDbSql = `INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_mb_status, af_created_at) VALUES (?,?,?,?,?,?,?)`;
            const insertDbArr = [formName, '분양', req.body.set_marketer, spliceDb[0], spliceDb[1], '', now]
            await sql_con.promise().query(insertDbSql, insertDbArr)
        }
    }

    const getFormStatusSql = `SELECT * FROM form_status WHERE fs_id=1`;
    const getFormStatus = await sql_con.promise().query(getFormStatusSql)
    const getForm = getFormStatus[0][0];
    // const estate_list = getForm.fs_estate_list.split(',');

    const getSiteListSql = "SELECT * FROM site_list";
    const getSiteListResult = await sql_con.promise().query(getSiteListSql)
    const estate_list = [];
    for (const getSiteListFor of getSiteListResult[0]) {
        estate_list.push(getSiteListFor.sl_site_name)
    }
    const marketer_list = getForm.fs_marketer_list.split(',');
    // const marketer_list = "";


    res.render('crm/upload_db', { estate_list, marketer_list })
})

router.use('/testdb_set', async (req, res, next) => {
    if (req.method == 'POST') {
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        testSql = `INSERT INTO application_form (af_mb_name, af_mb_phone, af_mb_status, af_form_name, af_form_type_in, af_created_at) VALUES (?,?,?,?,?,?)`;
        testValList = [req.body.af_mb_name, req.body.af_mb_phone, '접수완료', '강남현대삼성', '분양', now]
        await sql_con.promise().query(testSql, testValList)
    }
    res.render('crm/testdb', {});
})


router.get('/wh_datas', async (req, res, next) => {
    try {
        let allSearchSql = `SELECT * FROM audit_webhook ORDER BY aw_id DESC;`;
        let alldatas = await sql_con.promise().query(allSearchSql)
        let alldata = alldatas[0]
        res.render('crm/wh_alldata', { alldata });
    } catch (error) {
        next(error)
    }
})


router.get('/all_data', chkRateMaster, async (req, res, next) => {
    try {
        let allSearchSql = `SELECT * FROM webhookdatas ORDER BY wh_id DESC;`;
        let alldatas = await sql_con.promise().query(allSearchSql)
        let alldata = alldatas[0]
        res.render('crm/work_alldata', { alldata });
    } catch (error) {
        next(error)
    }
})


router.post('/estate_work/update', chkRateMaster, async (req, res, next) => {
    const set_db_list = req.body['set_db_list[]'];
    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)
    const estate_status_list = getStatusText[0][0].fs_estate_status.split(',')
    const estate_status = estate_status_list[0];
    if (typeof (set_db_list) == 'string') {
        let updateSql = `UPDATE application_form SET af_mb_status = '${estate_status}' WHERE af_id=${set_db_list}`;
        await sql_con.promise().query(updateSql)
    } else {
        for await (const on_db_id of set_db_list) {
            let updateSql = `UPDATE application_form SET af_mb_status = '${estate_status}' WHERE af_id=${on_db_id}`;
            await sql_con.promise().query(updateSql)
        }
    }

    res.send(200);
})


router.post('/estate_work/delete', chkRateMaster, async (req, res, next) => {
    var delArr = [req.body.set_db_list]
    for await (const delOn of delArr[0]) {
        const delSql = `DELETE FROM application_form WHERE af_id = ?`;
        await sql_con.promise().query(delSql, [delOn])
    }
    res.send(200);
})

router.use('/estate_detail/:id', async (req, res, next) => {

    if (req.user.rate == 5) {
        var LoadInfoSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.af_mb_phone = m.mo_phone WHERE a.af_id = ? ORDER BY m.mo_id DESC`;
    } else {
        var LoadInfoSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.af_id = m.mo_depend_id WHERE a.af_id = ? ORDER BY m.mo_id DESC`;
    }



    var LoadInfoTemp = await sql_con.promise().query(LoadInfoSql, [req.params.id])
    var load_info = LoadInfoTemp[0];

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');


    if (req.method == 'POST') {
        if (req.body.add_memo) {
            const addMemoSql = `INSERT INTO memos (mo_depend_id, mo_estate, mo_phone, mo_manager, mo_memo, mo_created_at) VALUES (?,?,?,?,?,?)`;
            const addMemoArr = [load_info[0].af_id, load_info[0].af_form_name, load_info[0].af_mb_phone, req.user.nick, req.body.write_memo, now];

            await sql_con.promise().query(addMemoSql, addMemoArr)
        } else if (req.body.change_status) {
            const updateStatusSql = `UPDATE application_form SET af_mb_status = ? WHERE af_id = ?`;
            await sql_con.promise().query(updateStatusSql, [req.body.write_memo, req.params.id])
        }

    }

    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)

    const estate_status_list = getStatusText[0][0].fs_estate_status.split(',')

    res.render('crm/work_estate_detail', { load_info, estate_status_list });
})





router.use('/modify', chkRateManager, async (req, res, next) => {
    const userInfo = req.user
    var { user_nick, user_pwd, user_email } = req.body;
    if (req.method == 'POST') {
        const re_nick = user_nick ? user_nick : userInfo.nick
        if (user_pwd) {
            var re_pwd = await bcrypt.hash(user_pwd, 12);
        } else {
            var re_pwd = userInfo.password
        }
        const re_email = user_email ? user_email : userInfo.user_email
        const userUpdateSql = `UPDATE users SET nick = ?, password = ?, user_email = ? WHERE id = ?`;
        await sql_con.promise().query(userUpdateSql, [re_nick, re_pwd, re_email, userInfo.id])
        res.redirect('/crm/modify')
        return
    }

    res.render('crm/crm_modify', { userInfo })
})

// chkRateMaster
router.use('/estate_work', chkRateMaster, async (req, res, next) => {
    try {

        var pageCount = req.query.sc ? parseInt(req.query.sc) : 30;

        var dateOn = new Date();
        var mDays = dateOn.getDate() - 1;
        var startDay = req.query.sd ? req.query.sd : moment(Date.now()).subtract(mDays, 'days').format('YYYY-MM-DD');
        var endDay = req.query.ed ? req.query.ed : moment(Date.now()).format('YYYY-MM-DD');
        var endDayRe = moment(endDay).add(1, 'day').format('YYYY-MM-DD');


        var sdCountQ = `WHERE af_created_at > '${startDay}' AND af_created_at < '${endDayRe}'`;
        var sdSearchQ = `AND a.af_created_at > '${startDay}' AND a.af_created_at < '${endDayRe}'`;

        var getEst = req.query.est ? `AND af_form_name LIKE '%${req.query.est}%'` : '';
        var getStatus = req.query.status ? `AND af_mb_status = '${req.query.status}'` : '';

        const allCountSql = `SELECT COUNT(DISTINCT af_mb_phone) FROM application_form  ${sdCountQ} ${getEst} ${getStatus};`;

        // WHERE af_form_type_in='분양'

        const allCountQuery = await sql_con.promise().query(allCountSql)
        const allCount = Object.values(allCountQuery[0][0])[0]

        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_mb_phone = m.mo_phone WHERE a.af_form_type_in = '분양' AND a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) ${sdSearchQ} ${getEst} ${getStatus} ORDER BY a.af_id DESC`
        var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_mb_phone = m.mo_phone WHERE a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) ${sdSearchQ} ${getEst} ${getStatus} ORDER BY a.af_id DESC`

        // AND af_form_type_in='분양'

        const all_data = await getDbData(allCount, setDbSql, req.query.pnum, pageCount)

        const getSiteListSql = "SELECT * FROM site_list";
        const getSiteListResult = await sql_con.promise().query(getSiteListSql)
        const siteList = [];
        for (const getSiteListFor of getSiteListResult[0]) {
            siteList.push(getSiteListFor.sl_site_name)
        }



        all_data.estate_list = siteList;
        all_data.est = req.query.est
        all_data.status = req.query.status
        all_data.sc = req.query.sc
        all_data.sd = startDay
        all_data.ed = endDay
        add_query = req.url;

        res.render('crm/work_estate', { all_data, add_query });
    } catch (error) {
        res.send('일단 에러')
    }

})








router.use('/estate_manager', chkRateManager, async (req, res, next) => {

    console.log('check now page!!!!! on load page ok~~~~~~~~~~~~~~~~~~~~!!!!!');

    try {
        console.log(req.user.rate);

        if (req.user.rate < 5) {
            const getUserEstateSql = `SELECT * FROM users WHERE id= ?;`;
            const getUserEstateTemp = await sql_con.promise().query(getUserEstateSql, [req.user.id]);

            // 여기서 null 에러 난다 체크 한번 하자!!!
            var getUserEstateList = getUserEstateTemp[0][0].manage_estate.split(',');
        } else if (req.user.rate == 5) {
            // const getUserEstateSql = `SELECT * FROM form_status WHERE fs_id= 1;`;
            // const getUserEstateTemp = await sql_con.promise().query(getUserEstateSql);
            // var getUserEstateList = getUserEstateTemp[0][0].fs_estate_list.split(',');

            const getSiteListSql = "SELECT * FROM site_list";
            const getSiteListResult = await sql_con.promise().query(getSiteListSql)
            var getUserEstateList = [];
            for (const getSiteListFor of getSiteListResult[0]) {
                getUserEstateList.push(getSiteListFor.sl_site_name)
            }
        }

        console.log('error check~~~~~~~~~~~~~~~~~~~~~~~ 11111');

        if (req.query.sc) {
            var pageCount = parseInt(req.query.sc);
        } else {
            var pageCount = 30;
        }

        var startDay = req.query.sd ? req.query.sd : "";
        var endDay = req.query.ed ? req.query.ed : moment(Date.now()).format('YYYY-MM-DD');
        var endDayRe = moment(endDay).add(1, 'day').format('YYYY-MM-DD');

        if (startDay && endDay) {
            var sdCountQ = `WHERE af_created_at > '${startDay}' AND af_created_at < '${endDayRe}'`;
            var sdSearchQ = `WHERE a.af_created_at > '${startDay}' AND a.af_created_at < '${endDayRe}'`;
        } else {
            var sdCountQ = ``;
            var sdSearchQ = ``;
        }

        console.log('error check~~~~~~~~~~~~~~~~~~~~~~~ 22222');




        var getEst = '';


        if (req.user.rate == 5) {
            if (req.query.est && !startDay) {
                var getEst = `WHERE af_form_name LIKE '%${req.query.est}%'`;
            } else if (req.query.est && startDay) {
                var getEst = `AND af_form_name LIKE '%${req.query.est}%'`;
            } else {
                var getEst = "";
            }
        } else {
            // 절대 지우면 안됨!! 각 현장 담당자별로 해당 DB만 확인 가능하게 하는 추가 쿼리문!!
            if (getUserEstateList[0]) {
                for (let i = 0; i < getUserEstateList.length; i++) {
                    if (i == 0) {
                        var setJull = 'WHERE'
                        getEst = `${setJull} af_form_name LIKE '%${getUserEstateList[i]}%'`;
                    } else {
                        var setJull = 'OR'
                        getEst = `${getEst} ${setJull} af_form_name LIKE '%${getUserEstateList[i]}%'`;
                    }
                }
            } else {
                res.redirect('/')
                return
            }
        }

        console.log('error check~~~~~~~~~~~~~~~~~~~~~~~ 33333');

        if (req.query.status) {
            if (getEst || startDay) {
                var getStatus = `AND af_mb_status = '${req.query.status}'`;
            } else {
                var getStatus = `WHERE af_mb_status = '${req.query.status}'`;
            }
        } else {
            var getStatus = '';
        }

        if (req.query.nm) {
            if (getEst || startDay || getStatus) {
                var getName = `AND af_mb_name LIKE '%${req.query.nm}%'`;
            } else {
                var getName = `WHERE af_mb_name LIKE '%${req.query.nm}%'`;
            }
        } else {
            var getName = '';
        }

        if (req.query.ph) {
            if (getEst || startDay || getStatus || getName) {
                var getPhone = `AND af_mb_phone LIKE '%${req.query.ph}%'`;
            } else {
                var getPhone = `WHERE af_mb_phone LIKE '%${req.query.ph}%'`;
            }
        } else {
            var getPhone = '';
        }

        console.log('error check~~~~~~~~~~~~~~~~~~~~~~~ 44444');



        // const allCountSql = `SELECT COUNT(DISTINCT af_mb_phone) FROM application_form WHERE af_form_type_in='분양' ${getEst} ${getStatus};`;
        // const allCountSql = `SELECT COUNT(*) FROM application_form WHERE af_form_type_in='분양' ${getEst} ${getStatus};`;
        const allCountSql = `SELECT COUNT(*) FROM application_form ${sdCountQ} ${getEst} ${getStatus} ${getName} ${getPhone};`;
        console.log(allCountSql);
        const allCountQuery = await sql_con.promise().query(allCountSql)
        const allCount = Object.values(allCountQuery[0][0])[0]

        console.log('error check~~~~~~~~~~~~~~~~~~~~~~~ 55555');



        if (req.user.rate < 5) {
            if (req.query.est) {
                var getEst = `WHERE a.af_form_name LIKE '%${req.query.est}%'`;
            } else {
                for (let i = 0; i < getUserEstateList.length; i++) {
                    if (i == 0) {
                        var setJull = 'WHERE'
                        getEst = `${setJull} a.af_form_name LIKE '%${getUserEstateList[i]}%'`;
                    } else {
                        var setJull = 'OR'
                        getEst = `${getEst} ${setJull} a.af_form_name LIKE '%${getUserEstateList[i]}%'`;
                    }
                }
            }
        }
        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_id = m.mo_depend_id WHERE a.af_form_type_in = '분양' AND a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) ${getEst} ${getStatus} ORDER BY a.af_id DESC`;

        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_id = m.mo_depend_id WHERE a.af_form_type_in = '분양' ${getEst} ${getStatus} ORDER BY a.af_id DESC`;

        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.af_id = m.mo_depend_id ${getEst} ${getStatus} ORDER BY a.af_id DESC`;

        var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_id = m.mo_depend_id ${sdSearchQ}  ${getEst} ${getStatus} ${getName} ${getPhone} ORDER BY a.af_id DESC`;

        console.log(setDbSql);
        var all_data = await getDbData(allCount, setDbSql, req.query.pnum, pageCount, getUserEstateList)

        // console.log(all_data['wdata']);
        for await (const data of all_data.wdata) {
            const addMemoSql = `SELECT * FROM memos WHERE mo_depend_id = ? ORDER BY mo_created_at DESC LIMIT 3;`
            const addMemo = await sql_con.promise().query(addMemoSql, [data.af_id])
            if (addMemo[0][0]) {
                data['main_memo'] = []
                for (let i = 0; i < addMemo[0].length; i++) {
                    data['main_memo'].push(addMemo[0][i].mo_memo)
                }
            }
        }

        all_data.estate_list = getUserEstateList;
        all_data.est = req.query.est
        all_data.status = req.query.status
        all_data.sc = req.query.sc
        all_data.sd = req.query.sd
        all_data.ed = endDay
        all_data.nm = req.query.nm
        all_data.ph = req.query.ph
    } catch (error) {
        console.log('발생한 에러를 표시합니다.');
        console.log(error);
        all_data = []
    }






    res.render('crm/work_estate_manager', { all_data });
})


router.get('/user_manage', chkRateMaster, async (req, res, next) => {

    const masterLoadSql = `SELECT * FROM users WHERE rate = 5;`;
    const masterLoadTemp = await sql_con.promise().query(masterLoadSql);
    const master_load = masterLoadTemp[0];

    console.log(req.query.rate);

    if (!req.query.rate) {
        var userLoadSql = `SELECT * FROM users WHERE rate = 2 AND type IS NULL;`;
    } else if (req.query.rate == 'all') {
        var userLoadSql = `SELECT * FROM users WHERE rate < 5 AND type IS NULL;`;
    } else {
        var userLoadSql = `SELECT * FROM users WHERE rate = ${parseInt(req.query.rate)} AND type IS NULL;`;
    }

    const userListTemp = await sql_con.promise().query(userLoadSql);
    const user_list = userListTemp[0];



    // const locationListSql = `SELECT fs_estate_list FROM form_status WHERE fs_id = 1;`;
    // const locationListTemp = await sql_con.promise().query(locationListSql);
    // const location_list = locationListTemp[0][0].fs_estate_list.split(',')

    const getSiteListSql = "SELECT * FROM site_list";
    const getSiteListResult = await sql_con.promise().query(getSiteListSql)
    const location_list = [];
    for (const getSiteListFor of getSiteListResult[0]) {
        location_list.push(getSiteListFor.sl_site_name)
    }

    res.render('crm/user_manage', { master_load, user_list, location_list });
})

router.post('/user_manage', chkRateManager, async (req, res, next) => {
    console.log(req.body);
    res.redirect('/crm/user_manage');
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


router.post('/memo_manage', async (req, res, next) => {
    if (req.body.memo_val) {

        let nowTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const memoArr = [req.body.id_val, req.body.estate_val, req.body.ph_val, req.user.nick, req.body.memo_val, nowTime];
        const memoInsertSql = `INSERT INTO memos (mo_depend_id, mo_estate, mo_phone, mo_manager, mo_memo, mo_created_at) VALUES (?,?,?,?,?,?);`;
        await sql_con.promise().query(memoInsertSql, memoArr);
        res.send(200)
    } else if (req.body.load_memo) {
        const memoLoadSql = `SELECT * FROM memos WHERE mo_depend_id = ? ORDER BY mo_id DESC`;
        const memoLoadTemp = await sql_con.promise().query(memoLoadSql, [req.body.id_val]);
        const memoLoad = memoLoadTemp[0]
        res.send(memoLoad)
    }
})

router.post('/use_axios', async (req, res, next) => {

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    if (req.body.statusSelVal) {
        const updateStatusSql = `UPDATE application_form SET af_mb_status = ? WHERE af_id = ?`;
        await sql_con.promise().query(updateStatusSql, [req.body.statusSelVal, req.body.idVal]);
    } else if (req.body.siteVal) {
        const insertSiteSql = `INSERT INTO site_list (sl_site_name, sl_site_link, sl_created_at) VALUES (?,?,?);`;
        await sql_con.promise().query(insertSiteSql, [req.body.siteVal, req.body.siteLinkVal, now]);
    } else if (req.body.btnVal) {

        if (req.body.btnVal == "site_update") {
            for (let i = 0; i < req.body.siteUpdateList.length; i++) {
                const updateStatusSql = `UPDATE site_list SET sl_site_name = ?, sl_site_link = ? WHERE sl_id = ?`;
                await sql_con.promise().query(updateStatusSql, [req.body.siteNameList[i], req.body.siteLinkList[i], req.body.siteUpdateList[i]]);
            }
        } else {
            for (let i = 0; i < req.body.siteUpdateList.length; i++) {
                const deleteStatusSql = `DELETE FROM site_list WHERE sl_id = ?`;
                await sql_con.promise().query(deleteStatusSql, [req.body.siteUpdateList[i]]);
            }
        }
    }


    res.send(200)
})


router.use('/test_axios', async (req, res, next) => {
    const setSql = `SELECT * FROM application_form`
    res.send('니미 개 병신같은 엑시오스 씹새끼가')
})




router.use('/', chkRateMaster, async (req, res, next) => {
    if (req.method == 'POST') {
        // 검증
        const chkSql = `SELECT * FROM form_status WHERE fs_id=1;`;
        const chkData = await sql_con.promise().query(chkSql)
        if (chkData[0] == '') {
            const marketerList = 'FB,' + req.body.marketer_list
            let insertArr = [req.body.estate_status, req.body.estate_status_color, marketerList];
            let insertSql = `INSERT INTO form_status (fs_estate_status,fs_estate_status_color, fs_marketer_list) VALUES (?,?,?);`;
            await sql_con.promise().query(insertSql, insertArr);
        } else {
            const marketerList = 'FB,' + req.body.marketer_list
            let updatetArr = [req.body.estate_status, req.body.estate_status_color, marketerList];
            let updateSql = `UPDATE form_status SET fs_estate_status=?,fs_estate_status_color=?, fs_marketer_list=? WHERE fs_id=1`;
            await sql_con.promise().query(updateSql, updatetArr);
        }
    }
    const resultSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const resultData = await sql_con.promise().query(resultSql)
    const result = resultData[0][0];

    const siteListSql = `SELECT * FROM site_list`;
    const siteListData = await sql_con.promise().query(siteListSql)
    const site_list = siteListData[0];

    if (result.fs_marketer_list) {
        result.fs_marketer_list = result.fs_marketer_list.replace('FB,', '')
    }

    res.render('crm/crm_main', { result, site_list });
})







function phNumBar(value) {
    value = value.replace(/[^0-9]/g, "");
    return value.replace(
        /(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,
        "$1-$2-$3"
    );
}





module.exports = router;