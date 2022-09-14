const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const router = express.Router();
const User = require('../models/user');
const Webhookdata = require('../models/webhook');


router.get('/', isLoggedIn, (req, res, next) => {
    wData = Webhookdata.findAll({});
    console.log('********************************');
    for (let i = 0; i < wData.length; i++) {
        const element = array[i];
        console.log(element);        
    }
    console.log(wData);
    res.render('crm/crm_main');
})

module.exports = router;