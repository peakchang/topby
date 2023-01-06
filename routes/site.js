const express = require('express');
const sql_con = require('../db_lib');
const router = express.Router();

router.use('/', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/main')
})

module.exports = router;