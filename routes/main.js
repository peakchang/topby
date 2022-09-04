const express = require('express');

const router = express.Router();




router.get('/', (req, res, next) =>{
    res.render('topby_main');
})

router.post('/', (req, res, next) =>{
    res.render('topby_main');
})

router.get('/policy', (req, res, next) =>{
    res.render('topby_policy');
})

router.post('/policy', (req, res, next) =>{
    res.render('topby_policy');
})



module.exports = router;