const { now } = require('moment');
const nodemon = require('nodemon');
const sql_con = require('./index');


exports.tableSetting = async () => {
    console.log('테이블 셋팅 안하는거니~~~~~~~~~~~~~~');

    var chkSql = 'ALTER TABLE form_status DROP COLUMN renty_status;';
    await sql_con.promise().query(chkSql)

    
    var chkSql = 'ALTER TABLE users ADD COLUMN manage_estate VARCHAR(255) AFTER rate;';
    await sql_con.promise().query(chkSql)

    let make_memos_form = `CREATE TABLE IF NOT EXISTS memos(
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        mo_phone VARCHAR(50),
        mo_manager VARCHAR(50),
        mo_memo VARCHAR(255),
        created_at DATETIME DEFAULT NOW()
    );`;
    try {
        sql_con.query(make_memos_form, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    var chkSql = 'ALTER TABLE application_form ADD COLUMN mb_price integer AFTER mb_status;';
    await sql_con.promise().query(chkSql)
    
    

    

    const delArray = ['itn_item', 'tv_item', 'item_other', 'mb_phone_cpn', 'mb_regnum', 'mb_email', 'mb_address', 'mb_pay_type', 'mb_bank_cpn', 'mb_bank_accountnum', 'mb_bank_name', 'mb_bank_regnum', 'mb_card_cpn', 'mb_card_cardnum', 'mb_card_name', 'mb_card_validity', 'mb_gift_bankname', 'mb_gift_accountnum', 'mb_gift_name', 'form_memo_1', 'form_memo_2', 'form_memo_3', 'form_memo_4', 'form_memo_5', 'form_memo_6', 'form_memo_7', 'form_memo_8', 'form_memo_9', 'form_memo_10'];

    for (let j = 0; j < delArray.length; j++) {
        console.log(delArray[j]);
        let setSql = `ALTER TABLE application_form DROP COLUMN ${delArray[j]};`;
        try {
            await sql_con.promise().query(setSql)
        } catch (err) {
            console.error(err);
        }
    }


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
        mb_name VARCHAR(50) NOT NULL,
        mb_phone VARCHAR(50) NOT NULL,
        mb_status VARCHAR(20),
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
            estate_status VARCHAR(50),
            estate_list VARCHAR(50)
        );`
    try {
        sql_con.query(makeFormTypesTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }
};