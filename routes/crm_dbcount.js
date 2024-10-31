const express = require('express');
const { chkRateMaster } = require('./middlewares');
const sql_con = require('../db_lib');
const router = express.Router();

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use('/', chkRateMaster, async (req, res, next) => {

    let site_list = [];
    const site_count_info_list = [];

    const query = req.query
    console.log(query);

    const startSearchDate = query.sd;
    const endSearchDate = query.ed;

    let addFormQuery = ""
    if (startSearchDate && endSearchDate) {
        addFormQuery = ` AND af_created_at BETWEEN '${startSearchDate} 00:00:00' AND '${endSearchDate} 23:59:59'`;
    }

    const searchStr = query.search;
    let addSearchQuery = ""
    if (searchStr) {
        addSearchQuery = addSearchQuery + ` WHERE sl_site_name LIKE '%${searchStr}%'`
    }





    let minDate = undefined;
    let maxDate = undefined;
    try {
        const getSiteListQuery = `SELECT * FROM site_list ${addSearchQuery} ORDER BY sl_id DESC LIMIT 0, 30;`
        const [rows] = await sql_con.promise().query(getSiteListQuery);
        site_list = rows;

        for (let i = 0; i < site_list.length; i++) {
            const siteInfo = site_list[i];
            const getSiteDbQuery = `SELECT * FROM application_form WHERE af_form_name = ? ${addFormQuery};`
            const [dbRows] = await sql_con.promise().query(getSiteDbQuery, [siteInfo.sl_site_name]);

            const dates = dbRows.map(entry => entry.af_created_at).filter(date => date);
            startDate = new Date(Math.min(...dates));
            endDate = new Date(Math.max(...dates));



            if (!minDate || minDate == 'Invalid Date' || startDate < minDate) minDate = startDate;
            if (!maxDate || maxDate == 'Invalid Date' || endDate > maxDate) maxDate = endDate;

            const result = {
                form_name: siteInfo['sl_site_name'],
                all_count: dbRows.length,
                db_list: []
            };

            const dateCountMap = {};

            // Count entries by date
            dbRows.forEach(entry => {
                const dateStr = entry.af_created_at.toISOString().split('T')[0];
                dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
            });

            // Generate db_list with counts
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                const dateStr = date.toISOString().split('T')[0];
                result.db_list.push({
                    date: dateStr.slice(2),
                    count: dateCountMap[dateStr] || 0
                });
            }

            site_count_info_list.push(result);
        }
    } catch (err) {
        console.error(err.message);

    }

    const dateArray = [];

    const maxEndDate = new Date(maxDate);
    maxEndDate.setDate(maxEndDate.getDate() + 1);

    // Create an array of date strings in the format 'YY-MM-DD'
    for (let date = new Date(minDate); date <= maxEndDate; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
        dateArray.push(dateString.slice(2)); // Slice to get 'YY-MM-DD'
    }


    res.render('crm/work_dbcount', { site_count_info_list, dateArray });
})

module.exports = router;