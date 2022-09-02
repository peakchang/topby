const express = require('express');


const router = express.Router();

router.get('/', (req, res, next) => {
    res.send('테스트를 해봅시다~~~~')
})

router.post('/', (req, res, next) => {
    console.log(req.body);
    let receive_json = req.body;
    let string_json = JSON.stringify(receive_json);
    console.log(string_json);
    
    console.log('--------------------------');
    res.send('테스트를 해봅시다~~~~')
})


module.exports = router;