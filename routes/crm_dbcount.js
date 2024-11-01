const express = require('express');
const { chkRateMaster } = require('./middlewares');
const sql_con = require('../db_lib');
const router = express.Router();

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// chkRateMaster
router.use('/', chkRateMaster, async (req, res, next) => {

    let site_list = [];
    const site_count_info_list = [];
    let page_list = [];
    let allPageCount = 0

    const query = req.query

    const nowPage = Number(query.page) || 1;

    // 기본 시작 날짜 구하기 (받은 sd 쿼리값 없으면)
    const today = new Date();
    const formattedTodayDate = `${today.getFullYear().toString()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 기본 끝 날짜 구하기 (받은 ed 쿼리값 없으면)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);
    const formattedthreeDaysAgoDate = `${threeDaysAgo.getFullYear().toString()}-${String(threeDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(threeDaysAgo.getDate()).padStart(2, '0')}`;

    // 구하기 구하기!!!

    const startSearchDate = query.sd || formattedthreeDaysAgoDate;
    const endSearchDate = query.ed || formattedTodayDate;

    let addFormQuery = ""
    if (startSearchDate && endSearchDate) {
        addFormQuery = ` AND af_created_at BETWEEN '${startSearchDate} 00:00:00' AND '${endSearchDate} 23:59:59'`;
    }

    const searchStr = query.search;
    let addSearchQuery = ""
    if (searchStr) {
        addSearchQuery = addSearchQuery + ` WHERE sl_site_name LIKE '%${searchStr}%'`
    }

    try {

        const getSiteCountQuery = `SELECT COUNT(*) AS site_count FROM site_list ${addSearchQuery}`
        const [all_count] = await sql_con.promise().query(getSiteCountQuery);

        const allCount = all_count[0]['site_count']
        allPageCount = Math.ceil(allCount / 30);
        const startNum = (nowPage - 1) * 30;

        const getSiteListQuery = `SELECT * FROM site_list ${addSearchQuery} ORDER BY sl_id DESC LIMIT ${startNum}, 30;`
        const [rows] = await sql_con.promise().query(getSiteListQuery);

        site_list = rows;
        page_list = getPaginationArray(nowPage, allPageCount)




        for (let i = 0; i < site_list.length; i++) {
            const siteInfo = site_list[i];
            const getSiteDbQuery = `SELECT * FROM application_form WHERE af_form_name = ? ${addFormQuery};`

            const [dbRows] = await sql_con.promise().query(getSiteDbQuery, [siteInfo.sl_site_name]);
            const result = {
                form_name: siteInfo['sl_site_name'],
                all_count: dbRows.length,
                db_list: []
            };

            result.db_list = processDateCounts(dbRows)
            site_count_info_list.push(result);
        }
    } catch (err) {
        console.error(err.message);

    }



    const dateArray = getDateRangeArray(startSearchDate, endSearchDate);



    res.render('crm/work_dbcount', { site_count_info_list, dateArray, page_list, nowPage, allPageCount });
})


// 시작 일자와 끝 일자 기준으로 날짜 배열 만들어주는 함수
function getDateRangeArray(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArray = [];

    while (start <= end) {
        const formattedDate = `${start.getFullYear().toString().slice(2)}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        dateArray.push(formattedDate);

        // 다음 날로 이동
        start.setDate(start.getDate() + 1);
    }

    return dateArray;
}

// 가져온 DB 를 날짜와 갯수를 key로 가진 객체 배열로 만들어주는 함수
function processDateCounts(data) {
    const result = {};

    data.forEach(item => {
        // af_created_at에 9시간을 추가
        const date = new Date(item.af_created_at);
        date.setHours(date.getHours());
        // 날짜를 'YY-MM-DD' 형식으로 변환
        const formattedDate = `${date.getFullYear().toString().slice(2)}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        // 날짜별로 카운트 계산
        if (result[formattedDate]) {
            result[formattedDate]++;
        } else {
            result[formattedDate] = 1;
        }
    });

    // 결과를 원하는 배열 형식으로 변환
    return Object.entries(result).map(([date, count]) => ({ date, count }));
}


// 페이징 배열 구하는 함수

function getPaginationArray(currentPage, totalPages) {
    const maxVisiblePages = 10;
    let startPage, endPage;

    if (currentPage <= 5) {
        // 첫 5페이지일 경우
        startPage = 1;
        endPage = Math.min(totalPages, maxVisiblePages);
    } else if (currentPage > totalPages - 5) {
        // 마지막 5페이지일 경우
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
        endPage = totalPages;
    } else {
        // 중간 페이지들
        startPage = currentPage - 4;
        endPage = currentPage + 5;
    }

    const paginationArray = [];
    for (let i = startPage; i <= endPage; i++) {
        paginationArray.push(i);
    }

    return paginationArray;
}
module.exports = router;