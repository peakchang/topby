const express = require('express');
const moment = require('moment');
const fs = require('fs')
const multer = require('multer');
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

router.get('/', (req, res, next) => {
    let status = true;
    res.json({ status })
})


router.post('/upload_data', async (req, res, next) => {
    let status = true;
    let body = req.body.allData;
    console.log(body);

    const ld_id = body['ld_id'];
    const type = body['type'];
    delete body['ld_id'];
    delete body['type'];
    
    if (type == "upload") {
        try {
            const queryData = getQueryStr(body, 'insert', 'ld_created_at');
            const insertLandQuery = `INSERT INTO land (${queryData.str}) VALUES (${queryData.question})`
            console.log(insertLandQuery);
            console.log(queryData.values);
            await sql_con.promise().query(insertLandQuery, queryData.values);
        } catch (err) {
            console.error(err.message);
            status = false;
        }
    } else {
        delete body['ld_domain'];
        delete body['ld_created_at'];

        try {
            const queryData = getQueryStr(body, 'update', 'ld_created_at');
            console.log(queryData);
            queryData.values.push(ld_id);;
            const updateLandQuery = `UPDATE land SET ${queryData.str} WHERE ld_id = ?`;
            await sql_con.promise().query(updateLandQuery, queryData.values);
        } catch (err) {
            console.error(err.message);
            status = false;
        }
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

    } catch (error) {
        status = false;
    }

    res.json({ status, baseUrl, saveUrl })
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