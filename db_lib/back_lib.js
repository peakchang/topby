
const axios = require('axios');
const nodemailer = require('nodemailer');
const sql_con = require('../db_lib');

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
  while (i < length) {
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
      requireTLS: true,
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


exports.setDbData = async (pnum, est, eslist) => {
  let all_data = {};
  var pageCount = 15;


  if (est) {
    var getEst = `AND form_name LIKE '%${est}%'`;
    all_data.est = est
  } else {
    var getEst = "";
  }

  var setLocation = "";
  var setManagerLocation = "";
  if (eslist && !est) {
    for (let i = 0; i < eslist.length; i++) {
      if (i == 0) {
        var setJull = 'AND'
      } else {
        var setJull = 'OR'
      }
      setLocation = setLocation + `${setJull} form_name LIKE '%${eslist[i]}%'`;
      setManagerLocation = setManagerLocation + `${setJull} a.form_name LIKE '%${eslist[i]}%'`;
    }
  }

  const allCountSql = `SELECT COUNT(*) FROM application_form WHERE form_type_in='분양' ${setLocation} ${getEst} GROUP BY mb_phone;`;
  const allCountQuery = await sql_con.promise().query(allCountSql)
  const allCount = allCountQuery[0].length
  // const allCount = Object.values(allCountQuery[0][0])[0]
  // console.log("전체 갯수는?" + allCount);


  var maxPagingEndCount = Math.ceil(allCount / pageCount);

  if (!pnum) {
    var startCount = 0;
    var nowCount = 1;
    var pagingStartCount = 1;
    if (maxPagingEndCount < 6) {
      var pagingEndCount = maxPagingEndCount + 1;
    } else {
      var pagingEndCount = 6;
    }
  } else {
    var startCount = (pnum - 1) * pageCount;
    var nowCount = pnum
    if (pnum <= 3) {
      var pagingStartCount = 1;
      if (maxPagingEndCount < 6) {
        var pagingEndCount = maxPagingEndCount + 1;
      } else {
        var pagingEndCount = 6;
      }
    } else if (parseInt(pnum) + 2 >= maxPagingEndCount) {

      var pagingEndCount = maxPagingEndCount + 1;
      var pagingStartCount = pagingEndCount - 5;
    } else {
      var pagingStartCount = pnum - 2;
      var pagingEndCount = pagingStartCount + 5;
    }
  }

  // console.log(`DB검색 카운트는 ${startCount} / 페이지 시작 카운트는 ${pagingStartCount} / 페이지 끝 카운트는 ${pagingEndCount} / 최대 페이지 카운트는 ${maxPagingEndCount}`);

  if (eslist) {
    var setDbSql = `SELECT * FROM application_form AS a LEFT JOIN memos AS m  ON a.mb_phone = m.mo_phone WHERE a.form_type_in = '분양' ${setManagerLocation} ${getEst} GROUP BY a.mb_phone ORDER BY a.af_id DESC LIMIT ${startCount}, ${pageCount};`;
  } else {
    var setDbSql = `SELECT * FROM application_form WHERE form_type_in='분양' ${setLocation} ${getEst} GROUP BY mb_phone ORDER BY af_id DESC LIMIT ${startCount}, ${pageCount};`;
  }
  console.log(setDbSql);

  const tempData = await sql_con.promise().query(setDbSql)
  var wData = tempData[0];
  var pageChkCount = allCount - (pageCount * (nowCount - 1));
  for await (const data of wData) {
    data.chkCount = pageChkCount;
    data.mb_phone_chk = phNumBar(data.mb_phone);
    // data.created_at.setHours(data.created_at.getHours()+9);
    pageChkCount--
  }
  all_data.wdata = wData;
  all_data.pagingStartCount = pagingStartCount;
  all_data.pagingEndCount = pagingEndCount;
  all_data.nowCount = nowCount;

  return all_data
}

function phNumBar(value) {
  value = value.replace(/[^0-9]/g, "");
  return value.replace(
    /(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,
    "$1-$2-$3"
  );
}