const express = require('express');
const { chkRateMaster } = require('./middlewares');
const sql_con = require('../db_lib');
const router = express.Router();

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use('/', async (req, res, next) => {

    let site_list = [];
    const site_count_info_list = [];

    let minDate = undefined;
    let maxDate = undefined;
    try {
        const getSiteListQuery = "SELECT * FROM site_list ORDER BY sl_id DESC LIMIT 0, 50;"
        const [rows] = await sql_con.promise().query(getSiteListQuery);
        site_list = rows;

        for (let i = 0; i < site_list.length; i++) {
            const siteInfo = site_list[i];
            const getSiteDbQuery = "SELECT * FROM application_form WHERE af_form_name = ?;"
            const [dbRows] = await sql_con.promise().query(getSiteDbQuery, [siteInfo.sl_site_name]);
            const dates = dbRows.map(entry => entry.af_created_at).filter(date => date);
            startDate = new Date(Math.min(...dates));
            endDate = new Date(Math.max(...dates));

            if (!minDate || startDate < minDate) minDate = startDate;
            if (!maxDate || endDate > maxDate) maxDate = endDate;

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

    // Create an array of date strings in the format 'YY-MM-DD'
    for (let date = new Date(minDate); date <= maxDate; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
        dateArray.push(dateString.slice(2)); // Slice to get 'YY-MM-DD'
    }



    console.log(site_count_info_list);
    console.log(minDate);
    console.log(maxDate);
    console.log(dateArray);




    res.render('crm/work_dbcount', { site_count_info_list, dateArray });
})

module.exports = router;