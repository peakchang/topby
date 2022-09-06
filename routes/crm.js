const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const router = express.Router();
const User = require('../models/user');

router.get('/', isLoggedIn, (req, res, next) => {
    res.render('crm/crm_main');
})

module.exports = router;