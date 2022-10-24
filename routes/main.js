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



router.use('/test', (req, res, next) => {
    var AuthData = {
        apikey: '2wyw9p9g4zzqoruwmhewiz0grwhu2w7v',
        // 이곳에 발급받으신 api key를 입력하세요
        userid: 'adpeak',
        // 이곳에 userid를 입력하세요
        token: "b571d9af620dc7bf170b02530779e36b9b23f883fde9b760db29ebd9bca30df421531fb2bbdb560e2255ff0329df9ae18482a04b6c882a13f1c37b12483519cd8r3lz4ymzuIOfwoqH+FovKtonlhICUwFxRfBU3C/dTcZJAci1N8iZFcR3Lk4v9ZcCLWbZ6j9ks0YFDszmUUZww=="
        // 이곳에 token api로 발급받은 토큰을 입력하세요
    }


    // aligoapi.token(req, AuthData).then((r) => {
    //     res.send(r)
    // }).catch((e) => {
    //     res.send(e)
    // })

    sendObject = {
        senderkey: '8fbcc05384b65a270432da1eb8b54acd596316ee',
        tpl_code: 'TK_3802',
        sender: '01021902197',
        receiver_1: '01044781127',
        subject_1: '테스트 메세지 입니다.',
        message_1: `안녕하세요. #{고객명}님! #{업체명} 입니다 !
        #{현장명} 관심고객으로 등록해 주셔서 감사드립니다.
        
        하단에 링크를 클릭하시면 현장에 대한 내용 확인이 가능합니다.
        
        문의 : #{연락처}
        링크 : #{현장링크}
        
        * 해당 알림톡은 탑분양정보 에서 현장정보에 대한 알람을 받기 위해 신청자에게만 발송되는 메시지입니다.`,
    }

    aligoapi.alimtalkSend(sendObject, AuthData).then((r) => {
        console.log('어떻게 되었니???');
    }).catch((e) => {
        console.log(e);
    })




    // console.log(testToken);
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