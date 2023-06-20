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
const { Logform, log } = require('winston');
const { IGComment } = require('facebook-nodejs-business-sdk');
const { type } = require('os');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

const ncp = require('ncp').ncp;
ncp.limit = 16;



// chkRateMaster
router.get('/detail/:id', async (req, res, next) => {
    const getHyInfoSql = `SELECT * FROM hy_site WHERE hy_id = ?`;
    const getHyInfo = await sql_con.promise().query(getHyInfoSql, [req.params.id]);
    console.log('111111111111111111111111111111');
    var get_hy_info = getHyInfo[0][0];
    console.log(get_hy_info);
    res.render('crm/work_side_detail_test', { get_hy_info })
})
// router.get('/detail/:id', async (req, res, next) => {
//     const getHyInfoSql = `SELECT * FROM hy_site WHERE hy_id = ?`;
//     const getHyInfo = await sql_con.promise().query(getHyInfoSql, [req.params.id]);
//     var get_hy_info = getHyInfo[0][0];
//     console.log(get_hy_info);
//     // console.log(get_hy_info.hy_title);


//     // get_hy_info.hy_image_arr = get_hy_info.hy_image_list.split(',')
//     // console.log(get_hy_info.hy_image_arr);

//     // const getSiteListSql = `SELECT sl_id,sl_site_name FROM site_list`;
//     // const getSiteList = await sql_con.promise().query(getSiteListSql);
//     // var get_site_list = getSiteList[0];

//     // try {
//         // get_hy_info.hy_image_arr = get_hy_info.hy_image_list.split(',')
//     //     if (!get_hy_info.hy_image_arr.length === 0) {
//     //         get_hy_info.hy_image_arr.splice(0, 1)
//     //     }
//     // } catch (error) {
//     //     get_hy_info.hy_image_arr = []
//     // }


//     // get_hy_info.hy_description = get_hy_info.hy_description.trim()
//     // get_hy_info.hy_features = get_hy_info.hy_features.trim()

//     console.log('수정 메인!!!!');
//     // var get_hy_info = ''


//     console.log('아니 씨발 왜 두번이 된느거지??!?!?!?!');
//     res.render('crm/work_side_detail_test', { get_hy_info })
// })

const upload = multer({
    storage: multer.diskStorage({
        // 경로를 설정
        destination(req, file, cb) {

            console.log('멀터야 멀터야 씨부랄 멀터야~~~~~~~~~~~~~~~~');
            console.log(req.body);
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


const uploadSimple = multer();

router.use('/testiii', async (req, res, next) => {
    const getFolder = `uploads/hy123`;
    const setFolder = `uploads/testfolder`;

    try {
        fs.mkdirSync(setFolder)
    } catch (error) {
        console.log('folder is already!!');
    }

    fs.readdir(getFolder, function (error, filelist) {

        for (let i = 0; i < filelist.length; i++) {
            const source = `${getFolder}/${filelist[i]}`;
            const destination = `uploads/testfolder/${filelist[i]}`;
            const options = {
                clobber: true
            };

            ncp(source, destination, options, function (err) {
                if (err) {
                    return console.error(err);
                }
                console.log('done!');
            });
        }
    });


    res.send('gogogogogogo');
})


router.post('/upload_img', uploadSimple.single('onimg'), async (req, res, next) => {
    console.log('히리히리히리힐히리');
    // const hyImgListUpdateSql = `UPDATE hy_site SET hy_image_list = ? WHERE hy_num = ?`;
    // await sql_con.promise().query(hyImgListUpdateSql, [req.body.fileListStr, req.body.hy_num]);
    // var SetHyImgList = req.body.fileListStr.split(',')
    // res.send({ SetHyImgList })

    console.log('여기 들어옴!!!!');

    try {
        fs.readdirSync(`uploads/${req.body.hy_num}`);
    } catch (error) {
        fs.mkdirSync(`uploads/${req.body.hy_num}`);
    }

    console.log(`uploads/${req.body.hy_num}/${req.file.originalname}`);

    fs.writeFile(`uploads/${req.body.hy_num}/${req.file.originalname}`, req.file.buffer, function (err) {
        if (err) {
            console.log('error incoming!!!!');
            console.log(err);
        } else {
            console.log('normal~~~~');
        }
    });

    const getUploadImgUrl = `/img/${req.body.hy_num}/${req.file.originalname}`;
    res.json({ getUploadImgUrl })
})





router.post('/duplicate_mini', async (req, res, next) => {

    console.log('여기로는 오는거니?');

    const chkArr = req.body['chkIdListVal[]'];
    for (let i = 0; i < chkArr.length; i++) {
        const columnStr = 'hy_title,hy_description,hy_keywords,hy_site_name,hy_businessname,hy_set_site,hy_type,hy_scale,hy_areasize,hy_house_number,hy_location,hy_scheduled,hy_builder,hy_conduct,hy_features,hy_main_image,hy_image_list,hy_callnumber';

        const copyFromHyNum = req.body['hyIdList[]'][Number(chkArr[i])]

        if (typeof (req.body['duplicateSiteIdValList[]']) == 'string') {
            copyHyNum = req.body['duplicateSiteIdValList[]'];
        } else {
            copyHyNum = req.body['duplicateSiteIdValList[]'][i];
        }

        console.log('첫번째 여긴 어디? ' + copyFromHyNum);
        console.log('두번째 여긴 어디? ' + copyHyNum);

        const getFolder = `uploads/${copyFromHyNum}`;
        const setFolder = `uploads/${copyHyNum}`;

        try {
            fs.mkdirSync(setFolder)
        } catch (error) {
            console.log('folder is already!!');
        }

        fs.readdir(getFolder, function (error, filelist) {

            for (let i = 0; i < filelist.length; i++) {
                const source = `${getFolder}/${filelist[i]}`;
                const destination = `${setFolder}/${filelist[i]}`;
                const options = {
                    clobber: true
                };

                ncp(source, destination, options, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log('done!');
                });
            }
        });


        const duplicateSql = `INSERT INTO hy_site (hy_num,${columnStr}) SELECT ?,${columnStr}  FROM hy_site WHERE hy_num = ?;`;

        await sql_con.promise().query(duplicateSql, [copyHyNum, copyFromHyNum]);
    }

    res.json({ status: 'success!' })
})






// chkRateMaster
// router.post('/detail/:id', async (req, res, next) => {

//     console.log('sd9fj0134jf09j32409fj0394jf11111111111111111111111111111');
//     console.log(req.body);

//     var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');



//     const allUpdateSql = `UPDATE hy_site SET hy_title = ?, hy_description = ?, hy_keywords = ?, hy_site_name = ?, hy_businessname = ?, hy_set_site = ?,hy_type = ?, hy_scale = ?, hy_areasize = ?, hy_house_number = ?, hy_location = ?, hy_scheduled = ?, hy_builder = ?, hy_conduct = ?, hy_features = ?,hy_main_image = ?, hy_image_list = ?, hy_callnumber = ?, hy_creted_at = ? WHERE hy_id = ?;`;

//     const allUpdateArr = [req.body.hy_title, req.body.hy_description, req.body.hy_keywords, req.body.hy_site_name, req.body.hy_businessname, req.body.hy_set_site, req.body.hy_type, req.body.hy_scale, req.body.hy_areasize, req.body.hy_house_number, req.body.hy_location, req.body.hy_scheduled, req.body.hy_builder, req.body.hy_conduct, req.body.hy_features, req.body.main_img_file_name, req.body.hy_image_list, req.body.hy_callnumber, now, req.body.hy_id]
//     await sql_con.promise().query(allUpdateSql, allUpdateArr);



//     res.send(`<script type="text/javascript">alert("수정이 완료 되었습니다."); window.location = document.referrer; </script>`);
// })






router.post('/del_image', async (req, res, next) => {
    const updateDelListSql = `UPDATE hy_site SET hy_image_list = ? WHERE hy_num = ?`;
    await sql_con.promise().query(updateDelListSql, [req.body.getUpdateImgList, req.body.hy_num]);
    fs.unlink(`uploads/${req.body.hy_num}/${req.body.getDelTargetImg}`, err => {
    })

    fs.existsSync(`uploads/${req.body.hy_num}/${req.body.getDelTargetImg}`, function (ex) {
        if (ex) {
            fs.unlink(`uploads/${req.body.hy_num}/${req.body.getDelTargetImg}`, err => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('normal~~~~~');
                }
            })
        } else {
        }
    })
    res.send(200)
})






router.use('/new_change_ready', async (req, res, next) => {
    console.log(req.body.hyNum);
    const newChangeSql = `SELECT * FROM hy_site WHERE hy_num = ?`;
    console.log(newChangeSql);
    const newChangeResult = await sql_con.promise().query(newChangeSql, [req.body.hyNum]);
    const new_change_result = newChangeResult[0][0];

    console.log(new_change_result);
    // const imgList = new_change_result.hy_image_list.split(',').filter(e => e.includes('img'));
    const imgList = new_change_result.hy_image_list.split(',');
    imgList.push(new_change_result.hy_main_image);
    console.log(imgList);
    res.json({ imgList })
})


router.use('/new_change', uploadSimple.single('change_img'), async (req, res, next) => {
    // console.log(req.file);

    const searchImgSiteSql = 'SELECT hy_main_image, hy_image_list FROM hy_site WHERE hy_num = ?';
    // console.log(searchImgSiteSql);
    // console.log(req.body.hy_num);
    // console.log(req.body.hy_main_image);
    // console.log('000000000000000000000000------------------0000000000000000000000');
    const searchImgSite = await sql_con.promise().query(searchImgSiteSql, [req.body.hy_num]);
    const search_img_site = searchImgSite[0][0];
    // console.log(search_img_site);
    // console.log(search_img_site.hy_main_image);
    // console.log(req.body.original_name);
    if (search_img_site.hy_main_image == req.body.original_name) {
        console.log('메인이미지 중복이 들어왔다!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

        const mainImgUpdateSql = `UPDATE hy_site SET hy_main_image = ? WHERE hy_num = ?`;
        await sql_con.promise().query(mainImgUpdateSql, [req.file.originalname, req.body.hy_num]);
    }


    try {
        fs.readdirSync(`uploads/${req.body.hy_num}_temp`);
    } catch (error) {
        fs.mkdirSync(`uploads/${req.body.hy_num}_temp`);
    }

    // console.log(`uploads/${req.body.hy_num}_temp/${req.file.originalname}`);

    fs.writeFile(`uploads/${req.body.hy_num}_temp/${req.file.originalname}`, req.file.buffer, function (err) {
        if (err) {
            console.log('error incoming!!!!');
            console.log(err);
        } else {
            console.log('normal~~~~');
        }
    });

    const getUploadImgUrl = `/img/${req.body.hy_num}/${req.file.originalname}`;
    res.json({ getUploadImgUrl })
})


router.use('/new_change_end', async (req, res, next) => {
    console.log('마지막으로 폴더 이름 변경할거야!!!!!!');
    console.log(req.body.hyNum);

    const originalFolder = `/uploads/${req.body.hy_num}_temp`;

    fs.readdir(originalFolder, function (error, filelist) {
        console.log(filelist);
    });
})









// chkRateMaster
router.use('/', async (req, res, next) => {

    console.log('메인으로 오는건 아니지??!!');

    let errorMessage = '';
    if (req.method == 'POST') {

        console.log(req.body);

        try {
            if (req.body.submit_val == 'site_update') {
                const tableNum = req.body.table_num;
                for (let i = 0; i < tableNum.length; i++) {
                    const setSideIdSql = `SELECT hy_num FROM hy_site WHERE hy_id = ?`;
                    const setSideId = await sql_con.promise().query(setSideIdSql, [req.body.site_id[tableNum[i]]]);
                    const set_side_id = setSideId[0][0];
                    console.log(set_side_id.hy_num);

                    try {
                        fs.rename(`uploads/${set_side_id.hy_num}`, `uploads/${req.body.site_num[tableNum[i]]}`, (err) => {
                            console.log('success!');
                        });
                    } catch (err) {
                        console.log(err.message);
                    }

                    const updateHySql = `UPDATE hy_site SET hy_num = ? WHERE hy_id = ?`;
                    await sql_con.promise().query(updateHySql, [req.body.site_num[tableNum[i]], req.body.site_id[tableNum[i]]]);
                }
            } else if (req.body.submit_val == 'site_delete') {
                console.log('딜리트 내가 했어?!?!');

                let delArr = req.body.table_num

                if (typeof (delArr) == 'string') {
                    delArr = [Number(delArr)];
                }

                console.log(delArr);
                console.log(req.body.site_num);

                for await (const getIdx of delArr) {
                    console.log(getIdx);

                    try {
                        fs.rmdirSync(`uploads/${req.body.site_num[Number(getIdx)]}`, { recursive: true });
                    } catch (error) {
                        console.log(error.message);
                    }

                    const deleteHySql = `DELETE FROM hy_site WHERE hy_id = ?`;
                    await sql_con.promise().query(deleteHySql, [req.body.site_id[getIdx]]);
                }

            } else if (req.body.submit_val == 'site_duplicate') {
                console.log('복사복사복사~~~');

            } else {
                try {
                    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                    const newHySql = `INSERT INTO hy_site (hy_num,hy_title,hy_creted_at) VALUES (?,?,?)`
                    await sql_con.promise().query(newHySql, [req.body.new_site_num, req.body.new_site_title, now])
                } catch (error) {

                }
            }
        } catch (error) {
            console.log(error.message);
            if (error.message.includes('Duplicate')) {
                errorMessage = '아이디가 중복됩니다. 다시 시도해주세요.'
            }
        }
    }



    // 현재 페이지 쿼리값 구해서 LIMIT 설정
    const getPage = req.query.page;
    let pageQuery = '';
    if (getPage) {
        pageQuery = `LIMIT ${(Number(getPage) - 1) * 10}, ${Number(getPage) * 10}`;
    } else {
        pageQuery = 'LIMIT 0, 10';
    }

    // 검색어 쿼리값 구해서 LIKE 설정
    const getSearch = req.query.search;

    console.log('힝~~~~~~~~~~~~~~~~~~~');

    let searchQuery = '';
    if (getSearch) {
        searchQuery = `WHERE hy_title LIKE '%${getSearch}%'`;
    }

    // 리스트 구하기
    const getSiteListSql = `SELECT * FROM hy_site ${searchQuery} ORDER BY hy_id DESC ${pageQuery} `;
    const getSiteListAll = await sql_con.promise().query(getSiteListSql)
    const get_site_list = getSiteListAll[0];

    // 
    const getSiteListCountSql = `SELECT COUNT(*) FROM hy_site ${searchQuery};`;
    const getSiteListCount = await sql_con.promise().query(getSiteListCountSql)
    const getCount = getSiteListCount[0][0]['COUNT(*)'];

    // console.log(get_site_list);
    res.render('crm/work_side', { get_site_list, getCount, errorMessage })
})




module.exports = router;