const express = require('express');

const sql_con = require('../db_lib');
const router = express.Router();

const fs = require('fs')

const aligoapi = require('aligoapi')
const { aligoKakaoNotification } = require('../db_lib/back_lib')

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});



router.use('/aligo_token', async (req, res, next) => {
    // const connection = await db.beginTransaction();
    var customerInfo = {ciName : '나야나야나', ciCompany : '탑분양정보', ciSite : '테스트정보', ciPhone : '1644-9714', ciSiteLink : '테스트 링크', ciReceiver : '010-2190-2197'}
    aligoKakaoNotification(req, customerInfo)
    res.send('alsdijflasjdfliajsdf')
})

router.use('/test_webhook', async (req, res, next) => {
    if(req.method == 'POST'){
        console.log('request is recieve!! it`s POST!!!');
        console.log(req.body);
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
    
    console.log(reFormName);
    res.send('aldsjflaisjdflajsdf')
})



const alimtalkSend = (req, res) => {

    let AuthData = {
        apikey: '2wyw9p9g4zzqoruwmhewiz0grwhu2w7v',
        // 이곳에 발급받으신 api key를 입력하세요
        userid: 'adpeak',
        // 이곳에 userid를 입력하세요
        token: '0c5b261d346d1a97d7fdfbf472167442cb118e228628af042155d32ba7478c3133da58b41696be607bf3d525b8218d23bc556ef5f2c89dad934d6831a04666051GPA0vDOjmcNvwcJ2TcgM1+PRp06Ly1fF1vlzYPKi6z/1oiRhmaXFuXdv7uCGENCTkqknDtS5H9Bku5ktKTh5Q=='
        // 이곳에 token api로 발급받은 토큰을 입력하세요
    }

    sendObject = {
        senderkey: '8fbcc05384b65a270432da1eb8b54acd596316ee',
        tpl_code: 'TK_3802',
        sender: '01044781127',
        receiver_1: '01021902197',
        subject_1: '',
        message_1: '',
    }

    // senddate: 예약일 // YYYYMMDDHHMMSS
    // recvname: 수신자 이름
    // button: 버튼 정보 // JSON string
    // failover: 실패시 대체문자 전송기능 // Y or N
    // fsubject: 실패시 대체문자 제목
    // fmessage: 실패시 대체문자 내용
    // }
    // req.body 요청값 예시입니다.
    // _로 넘버링된 최대 500개의 receiver, subject, message, button, fsubject, fmessage 값을 보내실 수 있습니다
    // failover값이 Y일때 fsubject와 fmessage값은 필수입니다.

    aligoapi.alimtalkSend(sendObject, AuthData).then((r) => {
        console.log('어떻게 되었니???');
    }).catch((e) => {
        console.log('여기는 오류인데요~~~~');
    })
}


router.get('/', (req, res, next) => {
    console.log('*************************************************************************************************');

    // console.log(req.session);
    // console.log(req.cookies);
    // console.log(req.user);
    // console.log(req.isAuthenticated());
    try {
        console.log(req.user.nick);
        userInfo = { 'user': req.user, 'req': req };
    } catch {
        userInfo = {}
    }

    res.render('topby/topby_main', { userInfo });
})

router.post('/', (req, res, next) => {
    console.log('진짜 여기로 오는걸까나~~~~~~~~~????????? 궁금하다요~~~~~~~');
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