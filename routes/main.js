const express = require('express');

const xml2js = require('xml2js');
const sql_con = require('../db_lib');
const router = express.Router();
var requestIp = require('request-ip');
const fs = require('fs')

const aligoapi = require('aligoapi')
const { aligoKakaoNotification, aligoKakaoNotification_formanager_clean } = require('../db_lib/back_lib')
const app_root_path = require('app-root-path').path;

const moment = require('moment');
const { log } = require('winston');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.post('/send_kakao_and_dbinput', async (req, res, next) => {
    let status = true;

    const allData = JSON.parse(req.body.all_data_json);



    for (let i = 0; i < allData.length; i++) {
        const inData = allData[i];
        const location = inData.location;
        let userData = "\n"
        let managerPhone = ""

        for (let j = 0; j < inData.data.length; j++) {
            const userDataInfo = inData.data[j];
            let etc1Data = ""
            if (userDataInfo['etc1'] && userDataInfo['etc1'] != 'None') {
                etc1Data = ` / ${userDataInfo['etc1']}`
            }
            let etc2Data = ""
            if (userDataInfo['etc2'] && userDataInfo['etc2'] != 'None') {
                etc2Data = ` / ${userDataInfo['etc2']}`
            }
            const userDataInfoStr = `${userDataInfo['name']} / ${userDataInfo['phone']} ${etc1Data} ${etc2Data}`
            userData = userData + userDataInfoStr + '\n'

            try {
                const insertDbQuery = "INSERT INTO application_form (af_form_name,af_form_type_in,af_mb_name,af_mb_phone) VALUES (?,?,?,?)";
                await sql_con.promise().query(insertDbQuery, [location, 'fb', userDataInfo['name'], userDataInfo['phone']])
            } catch (error) {
                console.error(error.message);
            }
        }


        try {
            const getManagerPhoneQuery = `SELECT * FROM users WHERE manage_estate LIKE '%${location}%'`;
            const getManagerPhone = await sql_con.promise().query(getManagerPhoneQuery)
            managerPhone = getManagerPhone[0][0]['user_phone']

            var customerInfo = { ciPhone: managerPhone, ciSite: location, ciName: '추가DB', ciReceiver: userData }
            console.log(customerInfo);
            // aligoKakaoNotification_formanager_clean(req, customerInfo)
        } catch (error) {
            console.error(error.message);
        }

    }

    return res.json({ status })
});


router.post('/chk_ex_file', async (req, res, next) => {
    let status = true;
    let chkDbBool = true; // DB가 있으면 true, 없으면 false;
    const body = req.body;
    try {
        const chkDbQuery = `SELECT * FROM application_form WHERE af_mb_phone = ? AND af_form_name LIKE '%${body.form_name}%'`;
        const chkDb = await sql_con.promise().query(chkDbQuery, [body.ph_num])
        if (!chkDb[0][0]) {
            chkDbBool = false;
            // const insertChkDb = "INSERT INTO application_form (af_form_name,af_form_type_in,af_mb_name,af_mb_phone) VALUES (?,?,?,?)";
            // await sql_con.promise().query(insertChkDb, [body.form_name, 'fb', body.full_name, body.ph_num])
        }
    } catch (error) {
        console.error(error.message);
        status = false;
    }
    return res.json({ status, chkDbBool })
});



router.get('/testxml', (req, res, next) => {

    var obj = {
        urlset: {
            '$': {
                'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
                'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation': `http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd`
            },
            url: [
                { loc: 'https://adpeak.kr/0', lastmod: '2023-06-28T01:39:46+00:00' },
                { loc: 'https://adpeak.kr/11', lastmod: '2023-06-28T01:39:46+00:00' },
                { loc: 'https://adpeak.kr/22', lastmod: '2023-06-28T01:39:46+00:00' }
            ]
        }
    }

    var builder = new xml2js.Builder();
    var xml = builder.buildObject(obj);

    fs.writeFile('public/test.xml', xml, function (err) {
        if (err) throw err;
        console.log('It\'s saved!');
    });
    res.send('dkdkdkdkdkdk')
});


// router.get("/robots.txt", (req, res) => {
//     res.type("text/plain");
//     const data = fs.readFileSync('/robots.txt');
//     res.send(
//         "User-agent: *\nAllow: /\nDisallow: /crm/\n"
//     );
// });

// router.get("/sitemap.xml", async (req, res) => {

//     const getHysiteListSql = `SELECT * FROM hy_site`;
//     const getHySiteList = await sql_con.promise().query(getHysiteListSql)
//     console.log(getHySiteList[0]);


//     res.type("text/xml");
//     const data = `
//     <?xml version="1.0" encoding="UTF-8"?>
//     <urlset
//       xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
//       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
//       xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
//             http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
//     <!-- created with Free Online Sitemap Generator www.xml-sitemaps.com -->
//     <url>
//         <loc>https://adpeak.kr/</loc>
//         <lastmod>2023-06-28T01:39:46+00:00</lastmod>
//     </url>
//     </urlset>
//     `


//     res.send();
// });



router.use('/testpp', async (req, res, next) => {
    var pathBasic = `${app_root_path}/public/temp/down.txt`;

    const downDbSql = `SELECT * FROM application_form GROUP BY af_mb_phone ORDER BY af_id DESC`;
    const downDbList = await sql_con.promise().query(downDbSql)


    const result = await new Promise((resolve, reject) => {
        var dbContent = ''
        for (const downDb of downDbList[0]) {
            const db_name = downDb.af_mb_name
            const db_phone = downDb.af_mb_phone
            var dbContent = dbContent + `${db_name},${db_phone}\n`;
        }
        resolve(dbContent)
    })

    fs.appendFileSync(pathBasic, result, (err) => { })


    var now = moment(Date.now()).format('YYYY-MM-DD');
    const downFileName = `${now}_file.txt`;
    res.setHeader('Content-Disposition', `attachment; filename=${downFileName}`) // 이게 핵심 
    res.sendFile(`${app_root_path}/public/temp/down.txt`)

    // res.send('didididididididididi')
})

router.use('/testmain', (req, res, next) => {
    console.log(';lasjfdliajsdlifjalisjdf');
    res.render('renewal/topby_main')
})

router.use('/jschk', async (req, res, next) => {
    const chkjishoSql = `SELECT * FROM chkjisho ORDER BY cj_id DESC;`;
    const chk_jisho_data = await sql_con.promise().query(chkjishoSql)
    const chk_jisho = chk_jisho_data[0];

    res.render('jschk', { chk_jisho })
})

router.use('/chk_jisho', async (req, res, next) => {

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    if (req.method == 'POST') {
        const jishoSql = `INSERT INTO chkjisho (cj_get_time, cj_created_at) VALUES (?, ?);`;
        await sql_con.promise().query(jishoSql, [req.body.on_time, now])

    }
    res.sendStatus(200)
})



router.use('/test', (req, res, next) => {


    var get_form_name = '안성라포르테(분양)-투자-copy'

    var get_form_name = '양주옥정H'
    var get_form_name = '별내자이더스타(분양)-copy'


    var get_form_name = get_form_name.replace('분양', '')
    var get_form_name = get_form_name.replace('투자', '')
    var reFormName = get_form_name.replace(/[a-zA-Z\(\)\-\s]/g, '')

    res.send('aldsjflaisjdflajsdf')
})


router.use('/load_footer', async (req, res, next) => {
    let status = true;
    console.log(status);
    res.json({ status })
})



router.get('/', async (req, res, next) => {

    let footer_info = {}


    if (req.get('Referrer')) {
        var prePath = req.get('Referrer')
    } else {
        var prePath = ''
    }
    console.log(requestIp.getClientIp(req));

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    var nowDate = moment(Date.now()).format('YYYY-MM-DD');

    const visitSearchSql = `SELECT * FROM visit_chk WHERE DATE(vc_created_at) = ?`;
    const visitSearchToday = await sql_con.promise().query(visitSearchSql, [nowDate])
    const getVisitList = visitSearchToday[0]
    for await (const getVisit of getVisitList) {
        if (getVisit.vc_ip == requestIp.getClientIp(req)) {
            var addVisitChk = 'ON';
        }
    }
    if (!addVisitChk) {
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const visitChkSql = `INSERT INTO visit_chk (vc_ip,vc_path,vc_browser,vc_created_at) VALUES (?,?,?,?);`;
        const visitChkArr = [requestIp.getClientIp(req), prePath, req.headers['user-agent'], now]
        await sql_con.promise().query(visitChkSql, visitChkArr)
    }

    try {
        userInfo = { 'user': req.user, 'req': req };
    } catch {
        userInfo = {}
    }

    try {
        const getFooterInfoQuery = "SELECT * FROM form_status WHERE fs_id = 1";
        const getFooterInfo = await sql_con.promise().query(getFooterInfoQuery)
        footer_info = getFooterInfo[0][0];
        console.log(footer_info);
    } catch (error) {

    }

    res.render('renewal/topby_main', { userInfo, footer_info });
})







router.post('/', (req, res, next) => {
    console.log(req.body);
    res.send(200);
})

router.get('/policy', (req, res, next) => {
    res.render('topby/topby_policy');
})

router.post('/policy', (req, res, next) => {
    res.render('topby/topby_policy');
})




module.exports = router;