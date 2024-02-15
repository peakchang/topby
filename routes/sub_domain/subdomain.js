const express = require('express');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


const router = express.Router();

router.get('/', (req, res, next) => {
    let status = true;
    res.json({ status })
})


module.exports = router;