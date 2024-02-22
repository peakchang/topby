const express = require('express');
const moment = require('moment');
const fs = require('fs')
const multer = require('multer');
const sql_con = require('../../db_lib');
const { getQueryStr } = require('../../db_lib/back_lib.js');
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


router.post('/subview', async (req, res, next) => {
    console.log('여기는 들어와??');
    let status = true;
    const subDomainName = req.body.subDomainName
    let subView = "";
    console.log(subDomainName);
    try {
        const getSubDomainQuery = "SELECT * FROM land WHERE ld_domain = ?";
        console.log(getSubDomainQuery);
        const getSubDomainCon = await sql_con.promise().query(getSubDomainQuery, [subDomainName]);
        console.log(getSubDomainCon);
        subView = getSubDomainCon[0][0]
    } catch (error) {

    }

    console.log(subView);

    console.log(subView);

    res.json({ status, subDomainName, subView })
})



router.post('/load_land_modify', async (req, res, next) => {
    let status = true;
    const getId = req.body.getId;
    console.log(getId);
    console.log('서브도메인 여기는 들어오는거지?!?!?!');
    let land_modify_val = {}
    try {
        const loadLandModifyQuery = "SELECT * FROM land WHERE ld_domain = ?"
        const loadLandModify = await sql_con.promise().query(loadLandModifyQuery, [getId]);
        land_modify_val = loadLandModify[0][0]
        console.log(land_modify_val);
    } catch (err) {
        console.error(err.message);
        status = false;
    }

    res.json({ status, land_modify_val })
})


router.post('/upload_data', async (req, res, next) => {
    let status = true;
    let body = req.body.allData;
    console.log(body);

    const ld_domain = body['ld_domain'];
    delete body['ld_domain'];
    delete body['ld_created_at'];

    try {
        const queryData = getQueryStr(body, 'update');
        console.log(queryData);
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
    console.log('여기 들어오는지만 먼저 보자아~~~~~~~~~~~~~~');
    let baseUrl
    let saveUrl

    try {
        console.log(req.file);
        const lastFolderArr = req.file.destination.split('/');
        const lastFolder = lastFolderArr[lastFolderArr.length - 1];
        var origin = req.get('host');
        baseUrl = 'http://' + origin + '/subimg/' + lastFolder + '/' + req.file.filename;
        saveUrl = req.file.path

        console.log(baseUrl);
        console.log(saveUrl);

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
            console.log(err);
        })
        const deleteLogoQuery = "UPDATE land SET ld_logo = '' WHERE ld_id = ?";
        await sql_con.promise().query(deleteLogoQuery, [ldId]);
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
    console.log(delPath);
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