const express = require('express');

const router = express.Router();

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const multer = require('multer');
const path = require('path');
const fs = require('fs')


const upload = multer({
    storage: multer.diskStorage({
        // 경로를 설정
        destination(req, file, cb) {
            console.log('여기까지는 왔고?!?!?!?');
            const setFolder = fonderChk();
            cb(null, setFolder);
        },
        filename(req, file, cb) {
            //파일명 설정
            cb(null, file.originalname);
        },
    }),
    // limits: { fileSize: 10 * 1024 * 1024 },
});



router.post('/img_upload', upload.single('editorimg'), async (req, res, next) => {

    console.log('이미지 업로드는 들어왔뉘???');

    let baseUrl
    let saveUrl

    const lastFolderArr = req.file.destination.split('/');
    const lastFolder = lastFolderArr[lastFolderArr.length - 1];
    var origin = req.get('origin');
    baseUrl = origin + '/editor/' + lastFolder + '/' + req.file.filename;
    saveUrl = req.file.path

    res.json({ baseUrl, saveUrl })
})

router.post('/video_upload', upload.single('videofile'), async (req, res, next) => {
    let baseUrl
    let saveUrl

    const lastFolderArr = req.file.destination.split('/');
    const lastFolder = lastFolderArr[lastFolderArr.length - 1];
    var origin = req.get('origin');
    baseUrl = origin + '/editor/' + lastFolder + '/' + req.file.filename;
    saveUrl = req.file.path
    console.log(saveUrl);

    res.json({ baseUrl, saveUrl })
})

router.post('/nosave_del', async (req, res, next) => {
    const data = req.body
    const deleteArr = data.deleteArr;

    for (let i = 0; i < deleteArr.length; i++) {
        const delPath = deleteArr[i];
        try {
            fs.unlinkSync(delPath)
        } catch (error) {
            console.error(error);
        }
    }
    res.json({})
})


function fonderChk() {
    let setFolder
    const now = moment().format('YYMMDD')


    try {
        fs.readdirSync(`public`);
    } catch (error) {
        console.error(error.message);
        fs.mkdirSync(`public`);
    }

    try {
        fs.readdirSync(`public/uploads`);
    } catch (error) {
        fs.mkdirSync(`public/uploads`);
    }

    try {
        fs.readdirSync(`public/uploads/editor`);
    } catch (error) {
        fs.mkdirSync(`public/uploads/editor`);
    }

    try {
        fs.readdirSync(`public/uploads/editor/editor${now}`);
    } catch (error) {
        fs.mkdirSync(`public/uploads/editor/editor${now}`);
    }
    setFolder = `public/uploads/editor/editor${now}`


    return setFolder;
}

module.exports = router;