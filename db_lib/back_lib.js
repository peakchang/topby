
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


/*
allCount, setDbSql, pnum, est, eslist, alignBase
allCount : 전체 카운트값 - 구할 쿼리문의 전체 값을 구해서 넣어준다.
setDbSql : 전체값과 카운트가 같은 전체를 구할 쿼리문
pnum : 현재 페이지 값 (req.query.pnum)
est : 추가로 구할 조건 값 (req.query.est) (현장명)
eslist : 분양사에게 할당시, 현장이 2개 이상일때
alignBase : 구한 쿼리문은 역순으로 정렬해야 한다. 즉, 해당 테이블을 역순으로 정렬할 해당 테이블의 ID값

startCount : 페이지 별로 나눠야 하니, DB를 찾는 시작 숫자 (숫자 부터 15개, 30개 이런식으로 찾으니까)
nowCount : 현재 페이지를 나타냄, 화면에 다른 색상으로 표시하기 위함
pagingStartCount : 페이지를 시작하는 숫자, nunjucks for문을 사용하기 위함
pagingEndCount : 페이지가 끝나는 숫자, nunjucks for문을 사용하기 위함
maxPagingEndCount : 전체 페이지 숫자, 전체 DB 카운트 / 보여질 페이지 카운트의 몫

시작점이 없을경우? (페이지 최초 로딩 되었을 경우
startCount : 0
nowCount (현재 숫자) : 1
pagingStartCount (페이지 시작 숫자) : 1
pagingEndCount (페이지 끝나는 숫자) : maxPagingEndCount이 6보다 작을경우 maxPagingEndCount, 클경우 6


시작점이 있을경우? (페이지가 선택 되었을 경우)

** 전체 보여질 페이지가 5페이지니까, 선택된 페이지 값이 3보다 같거나 작을 경우
startCount : pnum - 1 * 30
nowCount : 선택된 페이지 (pnum)
pagingStartCount : 1
pagingEndCount (페이지 끝나는 숫자) : maxPagingEndCount이 6보다 작을경우 maxPagingEndCount, 클경우 6

** 그 외의 경우 (선택된 페이지 값이 3보다 클 경우)

startCount : pnum - 1 * 30
nowCount : 선택된 페이지 (pnum)
pagingStartCount : pnum - 2 (전체 5페이지가 보여야 하니 시작은 선택된 값의 - 2)
pagingEndCount : pagingStartCount + 5

만약 pagingEndCount가 maxPagingEndCount 보다 크거나 같을 경우?
pagingEndCount = maxPagingEndCount
pagingStartCount = maxPagingEndCount - 5

*/
exports.getDbData = async (allCount, setDbSql, pnum, pageCount) => {

  const getFormStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
  const getFormStatus = await sql_con.promise().query(getFormStatusSql)
  const getStatusList = getFormStatus[0][0].fs_estate_status.split(',')
  const getStatusColor = getFormStatus[0][0].fs_estate_status_color.split(',')

  let all_data = {};
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
  } else if (pnum <= 3) {
    var startCount = (pnum - 1) * pageCount;
    var nowCount = pnum;
    var pagingStartCount = 1;
    if (maxPagingEndCount < 6) {
      var pagingEndCount = maxPagingEndCount + 1
    } else {
      var pagingEndCount = 6
    }
  } else {
    var startCount = (pnum - 1) * pageCount;
    var nowCount = pnum;
    var pagingStartCount = pnum - 2;
    var pagingEndCount = pagingStartCount + 5

    if (pagingEndCount > maxPagingEndCount) {
      var pagingEndCount = maxPagingEndCount + 1;
      var pagingStartCount = pagingEndCount - 5;
      if (pagingStartCount == 0) {
        var pagingStartCount = 1
      }
    }
  }

  var setDbSql = `${setDbSql} LIMIT ${startCount}, ${pageCount};`;

  const tempData = await sql_con.promise().query(setDbSql)
  var wData = tempData[0];
  var pageChkCount = allCount - (pageCount * (nowCount - 1));
  for await (const data of wData) {
    if (getStatusList.indexOf(data.af_mb_status)) {
      data.status_color = getStatusColor[getStatusList.indexOf(data.af_mb_status)]
    }
    data.chkCount = pageChkCount;
    data.af_mb_phone_chk = phNumBar(data.af_mb_phone);
    // data.created_at.setHours(data.created_at.getHours()+9);
    pageChkCount--
  }
  all_data.wdata = wData;
  all_data.pagingStartCount = pagingStartCount;
  all_data.pagingEndCount = pagingEndCount;
  all_data.nowCount = nowCount;
  all_data.status_list = getStatusList


  return all_data
}


exports.getExLength = (worksheet) => {
  var chkCount = 0;
  var getVal = 'ready!'
  while (getVal) {
    chkCount++
    var getVal = worksheet[`A${chkCount}`]
  }
  return chkCount - 1
}


function phNumBar(value) {
  value = value.replace(/[^0-9]/g, "");
  return value.replace(
    /(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,
    "$1-$2-$3"
  );
}