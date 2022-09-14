const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const router = express.Router();
const User = require('../models/user');
const Wd = require('../models/webhook');


router.get('/', isLoggedIn, async (req, res, next) => {
    console.log('아아니 씨발 넌 또 왜 지랄인데');
    console.log(Wd);

    wData = await Wd.findAll({});

    res.render('crm/crm_main', {wData});
})

module.exports = router;