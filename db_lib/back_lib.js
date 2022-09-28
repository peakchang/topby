
const axios = require('axios');
const nodemailer = require('nodemailer');
/** 알리고 문자 발송  **/
exports.sendSms = (receivers, message) => {
    return axios.post('https://apis.aligo.in/send/', null, {
        params: {
            key: process.env.ALIGOKEY,
            user_id: process.env.ALIGOID,
            sender: process.env.SENDER,
            // receiver: receivers.join(','),
            receiver: receivers,
            msg: message,
            // 테스트모드
            testmode_yn: 'N'
        },
    }).then((res) => res.data).catch(err => {
        console.log('err', err);
    });
}

/** length 만큼 랜덤 문자열 만들어줌 **/
exports.randomChracter = (length) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let i = 0;
    while (i < length){
        i++;
        text = text + possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

exports.mailSender = {
  // 메일발송 함수
  sendEmail: function (reciever, subject, content) {
    var transporter = nodemailer.createTransport({
      service: 'naver',   // 메일 보내는 곳
      prot: 465,
      host: 'smtp.naver.com',  
      secure: false,  
      requireTLS: true ,
      auth: {
        user: process.env.N_MAIL_ID,
        pass: process.env.N_MAIL_PWD
      }
    });
    // 메일 옵션
    var mailOptions = {
      from: `${process.env.N_MAIL_ID}@naver.com`, // 보내는 메일의 주소
      to: reciever, // 수신할 이메일
      subject: subject, // 메일 제목
      text: content // 메일 내용
    };
    
    // 메일 발송    
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

  }
}