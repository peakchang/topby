const express = require('express');
const moment = require('moment');
const fs = require('fs')
const multer = require('multer');
const sql_con = require('../../db_lib');
const { getQueryStr, aligoKakaoNotification_formanager, aligoKakaoNotification_detail } = require('../../db_lib/back_lib.js');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


const router = express.Router();

let img_upload = multer({
    storage: multer.diskStorage({
        // 경로를 설정
        destination(req, file, cb) {
            const setFolder = imgFolderChk();
            cb(null, setFolder);
        },
        filename(req, file, cb) {
            //파일명 설정
            cb(null, file.originalname);
        },
    }),
    // limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/get_menu', async (req, res, next) => {
    let status = true;
    const subDomainName = req.body.subDomainName
    let menuList = "";
    try {
        const getSubDomainQuery = "SELECT ld_menu FROM land WHERE ld_domain = ?";
        const getSubDomainCon = await sql_con.promise().query(getSubDomainQuery, [subDomainName]);
        menuList = getSubDomainCon[0][0]['ld_menu']
    } catch (error) {

    }
    res.json({ status, menuList })
})

router.post('/subview', async (req, res, next) => {
    let status = true;
    const subDomainName = req.body.subDomainName
    let subView = "";
    try {
        const getSubDomainQuery = "SELECT * FROM land WHERE ld_domain = ?";
        const getSubDomainCon = await sql_con.promise().query(getSubDomainQuery, [subDomainName]);
        subView = getSubDomainCon[0][0]
    } catch (error) {

    }

    res.json({ status, subDomainName, subView })
})


// 카운트로 쓰려고 했는데 걍 안씀
router.post('/update_visit_count', async (req, res, next) => {
    let status = true;

    const body = req.body;
    console.log(body);



    if (ipAddress != process.env.SERVER_IP) {
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log('going to chkeck~~~~~~~~~~~~~~~~~~~~~~!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('방문자의 IP 주소:', ipAddress);
        const userAgent = req.get('user-agent');
        console.log(userAgent);
        
        const ldVisitCount = body.ld_visit_count + 1;
        try {
            const now = moment().format('YYYY-MM-DD HH:mm:ss');
            const insertVisitList = "INSERT INTO subdomain_visit (sv_domain, sv_ip, sv_ua, sv_referrer, sv_created_at) VALUES (?,?,?,?,?)";
            await sql_con.promise().query(insertVisitList, [body.ld_domain, ipAddress, userAgent, body.referrer, now]);

            const getVisitCountQuery = "UPDATE land SET ld_visit_count = ? WHERE ld_id = ?";
            await sql_con.promise().query(getVisitCountQuery, [ldVisitCount, body.ld_id]);
        } catch (error) {
            status = false;
        }

    }






    res.json({ status })
})


router.post('/load_land_modify', async (req, res, next) => {
    let status = true;
    const getId = req.body.getId;
    let land_modify_val = {}
    try {
        const loadLandModifyQuery = "SELECT * FROM land WHERE ld_domain = ?"
        const loadLandModify = await sql_con.promise().query(loadLandModifyQuery, [getId]);
        land_modify_val = loadLandModify[0][0]
    } catch (err) {
        console.error(err.message);
        status = false;
    }

    res.json({ status, land_modify_val })
})


router.post('/upload_data', async (req, res, next) => {
    let status = true;
    let body = req.body.allData;

    const ld_domain = body['ld_domain'];
    delete body['ld_domain'];
    delete body['ld_created_at'];

    try {
        const queryData = getQueryStr(body, 'update');
        queryData.values.push(ld_domain);;
        const updateLandQuery = `UPDATE land SET ${queryData.str} WHERE ld_domain = ?`;
        await sql_con.promise().query(updateLandQuery, queryData.values);
    } catch (err) {
        console.error(err.message);
        status = false;
    }

    res.json({ status })
})

router.post('/img_upload', img_upload.single('onimg'), (req, res, next) => {
    let status = true;
    let baseUrl
    let saveUrl

    try {
        const lastFolderArr = req.file.destination.split('/');
        const lastFolder = lastFolderArr[lastFolderArr.length - 1];
        var origin = req.get('host');
        baseUrl = req.protocol + '://' + origin + '/subimg/' + lastFolder + '/' + req.file.filename;
        saveUrl = req.file.path

    } catch (error) {
        status = false;
    }

    res.json({ status, baseUrl, saveUrl })
})
router.post('/delete_logo', async (req, res, next) => {

    let status = true;
    const delPath = req.body.logoUrlPath;
    const ldId = req.body.ld_id;
    try {
        await fs.unlink(delPath, (err) => {
        })
        const deleteLogoQuery = "UPDATE land SET ld_logo = '' WHERE ld_id = ?";
        await sql_con.promise().query(deleteLogoQuery, [ldId]);
    } catch (error) {
        status = false
        console.error(error);
    }
    res.json({ status })
})

router.post('/delete_phimg', async (req, res, next) => {

    let status = true;
    const delPath = req.body.phimgUrlPath;
    const ldId = req.body.ld_id;
    try {
        await fs.unlink(delPath, (err) => {
        })
        const deletePhimgQuery = "UPDATE land SET ld_ph_img = '' WHERE ld_id = ?";
        await sql_con.promise().query(deletePhimgQuery, [ldId]);
    } catch (error) {
        status = false
        console.error(error);
    }
    res.json({ status })
})

router.post('/delete_popupimg', async (req, res, next) => {

    let status = true;
    const delPath = req.body.phimgUrlPath;
    const ldId = req.body.ld_id;
    try {
        await fs.unlink(delPath, (err) => {
        })
        const deletePopupimgQuery = "UPDATE land SET ld_popup_img = '' WHERE ld_id = ?";
        await sql_con.promise().query(deletePopupimgQuery, [ldId]);
    } catch (error) {
        status = false
        console.error(error);
    }
    res.json({ status })
})


router.post('/delete_img', async (req, res, next) => {
    let status = true;
    const body = req.body;
    const delPath = `subuploads/img/${body.getFolder}/${body.getImgName}`
    try {
        await fs.unlink(delPath, (err) => {
            console.error(err.message);
        })
    } catch (error) {
        status = false
        console.error(error);
    }
    res.json({ status })
})

router.post('/update_customer', async (req, res, next) => {
    let status = true;
    console.log('update_customer!!!!!!!!!!!!!!!!!');
    const body = req.body;
    console.log(body);
    const now = moment().format('YY/MM/DD HH:mm:ss');
    try {
        // DB 입력하기~~~
        const insertCustomerQuery = "INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_created_at) VALUES (?,?,?,?,?,?)";
        await sql_con.promise().query(insertCustomerQuery, [body.siteName, "분양", "DB", body.name, body.phone, now]);

    } catch (error) {
        status = false;
    }

    try {
        // 매니저들에게 카톡 발송~~
        const getManagerListQuery = `SELECT * FROM users WHERE manage_estate LIKE "%${body.siteName}%"`;
        const getManagerList = await sql_con.promise().query(getManagerListQuery);
        const manager_list = getManagerList[0];
        if (manager_list && manager_list.length > 0) {
            for (let i = 0; i < manager_list.length; i++) {
                const manager = manager_list[i];
                let customerInfo = {
                    ciPhone: manager['user_phone'],
                    ciSite: body.siteName,
                    ciName: body.name,
                    ciReceiver: body.phone
                }
                aligoKakaoNotification_formanager(req, customerInfo)
            }
        }

        // 고객에게 카톡 발송~~~
        const getSiteInfoQuery = "SELECT * FROM site_list WHERE sl_site_name = ?";
        const getSiteInfo = await sql_con.promise().query(getSiteInfoQuery, [body.siteName]);
        const site_info = getSiteInfo[0][0]
        console.log("get~~~~~~~~~~~ site~~~~~~~~~~ info~~~~~~~~~~~~");
        console.log(site_info);
        if (site_info) {
            let sendMessageObj = {
                receiver: body.phone,
                customerName: body.name,
                company: "탑분양",
                siteRealName: site_info['sl_site_realname'],
                smsContent: site_info['sl_sms_content'],
            }
            console.log(sendMessageObj);
            aligoKakaoNotification_detail(req, sendMessageObj)
        }
    } catch (error) {

    }
    res.json({ status })
})


router.get('/', (req, res, next) => {
    let status = true;
    res.json({ status })
})


function imgFolderChk() {
    let setFolder
    const now = moment().format('YYMMDD')

    try {
        fs.readdirSync(`subuploads`);
    } catch (error) {
        fs.mkdirSync(`subuploads`);
    }

    try {
        fs.readdirSync(`subuploads/img`);
    } catch (error) {
        fs.mkdirSync(`subuploads/img`);
    }

    try {
        fs.readdirSync(`subuploads/img/img${now}`);
    } catch (error) {
        fs.mkdirSync(`subuploads/img/img${now}`);
    }
    setFolder = `subuploads/img/img${now}`


    return setFolder;
}

module.exports = router;