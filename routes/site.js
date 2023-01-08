const express = require('express');
const sql_con = require('../db_lib');
const router = express.Router();




router.use('/pg1', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/pg1')
})

router.use('/pg2', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/pg2')
})

router.use('/pg3', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/pg3')
})

router.use('/pg4', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/pg4')
})

router.use('/pg5', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/pg5')
})

router.use('/pg6', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/pg6')
})

router.use('/:id', async(req, res, next) => {
    console.log('jsadfjalisdjfilajsdfl');
    res.render('mini_site/main')
})


module.exports = router;