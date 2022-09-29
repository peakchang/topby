const { now } = require('moment');
const nodemon = require('nodemon');
const sql_con = require('./index');


exports.tableSetting = async () => {
    console.log('테이블 셋팅 안하는거니~~~~~~~~~~~~~~');
    let make_users_form = `CREATE TABLE IF NOT EXISTS users(
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        userid VARCHAR(50) UNIQUE,
        nick VARCHAR(50) NOT NULL,
        password VARCHAR(150),
        rate VARCHAR(10) NOT NULL DEFAULT '1',
        provider VARCHAR(10) NOT NULL DEFAULT 'local',
        snsId VARCHAR(50),
        created_at DATETIME DEFAULT NOW(),
        updated_at DATETIME,
        deleted_at DATETIME
    );`;
    try {
        sql_con.query(make_users_form, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }


    let make_application_form = `CREATE TABLE IF NOT EXISTS application_form(
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        form_name VARCHAR(50),
        form_type_in VARCHAR(50),
        form_location VARCHAR(50) DEFAULT '기본',



        itn_item  VARCHAR(50),
        tv_item VARCHAR(50),
        item_other VARCHAR(255),


        mb_name VARCHAR(50) NOT NULL,
        mb_phone VARCHAR(50) NOT NULL,


        mb_phone_cpn VARCHAR(50),
        mb_regnum VARCHAR(50),
        mb_email VARCHAR(50),
        mb_address VARCHAR(150),
        mb_pay_type VARCHAR(50),
        mb_bank_cpn VARCHAR(50),
        mb_bank_accountnum VARCHAR(50),
        mb_bank_name VARCHAR(50),
        mb_bank_regnum VARCHAR(50),
        mb_card_cpn VARCHAR(50),
        mb_card_cardnum VARCHAR(50),
        mb_card_name VARCHAR(50),
        mb_card_validity VARCHAR(50),
        mb_gift_bankname VARCHAR(50),
        mb_gift_accountnum VARCHAR(50),
        mb_gift_name VARCHAR(50),


        mb_status VARCHAR(20),


        form_memo_1 VARCHAR(255),
        form_memo_2 VARCHAR(255),
        form_memo_3 VARCHAR(255),
        form_memo_4 VARCHAR(255),
        form_memo_5 VARCHAR(255),
        form_memo_6 VARCHAR(255),
        form_memo_7 VARCHAR(255),
        form_memo_8 VARCHAR(255),
        form_memo_9 VARCHAR(255),
        form_memo_10 VARCHAR(255),



        created_at DATETIME
        );`
    try {
        sql_con.query(make_application_form, (err, result) => { });
    } catch (err) {
        console.error(err);
    }



    let makereviewTable = `CREATE TABLE IF NOT EXISTS reviews(
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        rv_name VARCHAR(50),
        rv_phone VARCHAR(50),
        rv_content TEXT,
        rv_created_at DATETIME DEFAULT NOW()
    );`
    try {
        sql_con.query(makereviewTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    let setSql = `ALTER TABLE reviews MODIFY rv_created_at DEFAULT ON UPDATE CURRENT_TIMESTAMP;`
    sql_con.query(setSql, (err, result) => { });

    // 여기부터 하나씩 실행
    // ALTER TABLE reviews MODIFY COLUMN rv_created_at DATETIME DEFAULT NOW(); // 성공
    // DROP TABLE if exists form_types;
    // ALTER TABLE application_form ADD COLUMN mb_status VARCHAR(20) AFTER mb_gift_name;

    let makeFormTypesTable = `CREATE TABLE IF NOT EXISTS form_status(
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            renty_status VARCHAR(50),
            estate_status VARCHAR(50),
            estate_list VARCHAR(50)
        );`
    try {
        sql_con.query(makeFormTypesTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }






















    // let makeFormTypesTable = `CREATE TABLE IF NOT EXISTS form_types(
    //     form_name VARCHAR(50),
    //     form_type VARCHAR(50)
    // );`
    // try {
    //     sql_con.query(makeFormTypesTable, async (err, result) => { });
    // } catch (err) {
    //     console.error(err);
    // }








    // ALTER TABLE reviews ADD CONRAINT rv_created_at DEFAULT ON UPDATE CURRENT_TIMESTAMP;;ST
    // let createStatusTable = `CREATE TABLE IF NOT EXISTS set_status(
    //     form_name VARCHAR(50),
    //     form_type VARCHAR(50)
    // );`
    // try {
    //     sql_con.query(makeFormTypesTable, async (err, result) => { });
    // } catch (err) {
    //     console.error(err);
    // }

    // let changeArr = ['item_other', 'form_memo_1', 'form_memo_2', 'form_memo_3', 'form_memo_4', 'form_memo_5', 'form_memo_6', 'form_memo_7', 'form_memo_8', 'form_memo_9', 'form_memo_10', 'mb_address']

    // changeArr.forEach(element => {
    //     let setSql = `ALTER TABLE application_form MODIFY COLUMN ${element} varchar(255);`
    //     sql_con.query(setSql, (err, result) => { });
    // });

    // let chaneCNname = `ALTER TABLE application_form RENAME COLUMN createdat TO created_at;`
    // try {
    //     sql_con.query(chaneCNname, (err, result) => {});
    // } catch (error) {

    // }

};