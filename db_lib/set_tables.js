const { now } = require('moment');
const nodemon = require('nodemon');
const sql_con = require('./index');
const nsql_con = require('./sub_db');

exports.tableSetting = async () => {
    console.log('테이블 셋팅 안하는거니~~~~~~~~~~~~~~');

    let makeNblogTable = `CREATE TABLE IF NOT EXISTS nblog_ab(
        b_idx INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
        keyword VARCHAR(100),
        subject VARCHAR(255),
        link VARCHAR(255),
        target_num INT(10),
        work_num INT(10)
    );`;
    try {
        nsql_con.query(makeNblogTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    let makeNworkTable = `CREATE TABLE IF NOT EXISTS nwork(
        n_idx INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
        n_ua varchar(10),
        n_id varchar(100),
        n_pwd varchar(100),
        n_update DATETIME,
        n_status varchar(100),
        n_temp1 varchar(255),
        n_temp2 varchar(255),
        n_info varchar(255),
        n_profile varchar(20) NULL
    );`;
    try {
        nsql_con.query(makeNworkTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }


    let makeHiddenLinkTable = `CREATE TABLE IF NOT EXISTS hidden_link(
        hidden_chk varchar(10),
        hidden_link varchar(255)
    );`
    try {
        sql_con.query(makeHiddenLinkTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }


    // ALTER TABLE nwork MODIFY COLUMN n_update DATE NULL;
    // ALTER TABLE nwork MODIFY COLUMN n_id varchar(100) NOT NULL UNIQUE;

    let makeMiniSiteTable = `CREATE TABLE IF NOT EXISTS hy_site(
        hy_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
        hy_num varchar(10) NOT NULL UNIQUE,
        hy_title VARCHAR(255) ,
        hy_description TEXT ,
        hy_keywords TEXT ,
        hy_site_name VARCHAR(255) ,
        hy_businessname VARCHAR(100) ,
        hy_set_site VARCHAR(100) ,
        hy_type VARCHAR(100) ,
        hy_scale VARCHAR(100) ,
        hy_areasize VARCHAR(100) ,
        hy_house_number VARCHAR(100) ,
        hy_location VARCHAR(100) ,
        hy_scheduled VARCHAR(100) ,
        hy_builder VARCHAR(100) ,
        hy_conduct VARCHAR(100) ,
        hy_features TEXT ,
        hy_card_image VARCHAR(100),
        hy_main_image VARCHAR(100),
        hy_image_list TEXT ,
        hy_callnumber VARCHAR(100) ,
        hy_sms VARCHAR(100),
        hy_add_script TEXT,
        hy_font_size INT DEFAULT 16,
        hy_creted_at DATETIME
    );`;
    try {
        sql_con.query(makeMiniSiteTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    // ALTER TABLE hy_site ADD COLUMN hy_counter INT(255) AFTER hy_callnumber;
    // ALTER TABLE hy_site ADD COLUMN hy_card_image VARCHAR(100) AFTER hy_features;

    // ALTER TABLE hy_site ADD COLUMN hy_add_script TEXT AFTER hy_callnumber;
    // ALTER TABLE hy_site ADD COLUMN hy_font_size INT DEFAULT 16 AFTER hy_add_script;
    // ALTER TABLE hy_site ADD COLUMN hy_sms VARCHAR(100) AFTER hy_callnumber;


    let makeVisitChkTable = `CREATE TABLE IF NOT EXISTS visit_chk(
        vc_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        vc_ip VARCHAR(100),
        vc_path TEXT,
        vc_browser TEXT,
        vc_created_at DATETIME
    );`;
    try {
        sql_con.query(makeVisitChkTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }


    let makeAuditTable = `CREATE TABLE IF NOT EXISTS audit_webhook(
        aw_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        audit_webhookdata TEXT
    );`
    try {
        sql_con.query(makeAuditTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }




    let makeChkJishoTable = `CREATE TABLE IF NOT EXISTS chkjisho(
        cj_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        cj_get_time VARCHAR(100),
        cj_created_at DATETIME
    );`
    try {
        sql_con.query(makeChkJishoTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }


    let makeSiteListTable = `CREATE TABLE IF NOT EXISTS site_list(
        sl_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        sl_site_name VARCHAR(100),
        sl_site_link VARCHAR(255),
        sl_sms_content TEXT,
        sl_created_at DATETIME
    );`
    try {
        sql_con.query(makeSiteListTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    // ALTER TABLE site_list ADD COLUMN sl_sms_content TEXT AFTER sl_site_link;
    // ALTER TABLE site_list ADD COLUMN sl_site_realname VARCHAR(100) AFTER sl_site_name;


    let makeAlldataTable = `CREATE TABLE IF NOT EXISTS webhookdatas(
        wh_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        webhookdata TEXT
    );`
    try {
        sql_con.query(makeAlldataTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    let make_memos_form = `CREATE TABLE IF NOT EXISTS memos(
        mo_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        mo_depend_id VARCHAR(10),
        mo_estate VARCHAR(100),
        mo_phone VARCHAR(50),
        mo_manager VARCHAR(50),
        mo_memo VARCHAR(255),
        mo_created_at DATETIME DEFAULT NOW()
    );`;
    try {
        sql_con.query(make_memos_form, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    let make_users_form = `CREATE TABLE IF NOT EXISTS users(
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        userid VARCHAR(50) UNIQUE,
        user_email VARCHAR(50) UNIQUE,
        user_phone VARCHAR(50),
        nick VARCHAR(50) NOT NULL,
        password VARCHAR(150),
        rate VARCHAR(10) NOT NULL DEFAULT '1',
        // status VARCHAR(5),
        manage_estate VARCHAR(50),
        // type VARCHAR(10),
        // authvalue VARCHAR(120),
        // macvalue VARCHAR(120),
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
        af_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        af_form_name VARCHAR(50),
        af_form_type_in VARCHAR(50),
        af_form_location VARCHAR(50) DEFAULT '기본',
        af_mb_name VARCHAR(50) NOT NULL,
        af_mb_phone VARCHAR(50) NOT NULL,
        af_mb_status VARCHAR(20),
        af_mb_sensitive VARCHAR(50),
        af_mb_reserve_time DATETIME,
        af_mb_visit_status VARCHAR(50),
        af_mb_price INT(11),
        af_lead_id VARCHAR(50),
        af_created_at DATETIME
        );`
    try {
        sql_con.query(make_application_form, (err, result) => { });
    } catch (err) {
        console.error(err);
    }

    let makereviewTable = `CREATE TABLE IF NOT EXISTS reviews(
        rv_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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

    let makeFormTypesTable = `CREATE TABLE IF NOT EXISTS form_status(
            fs_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            fs_estate_status VARCHAR(255),
            fs_estate_status_color VARCHAR(255),
            fs_estate_list TEXT,
            fs_marketer_list VARCHAR(255)
        );`
    try {
        sql_con.query(makeFormTypesTable, async (err, result) => { });
    } catch (err) {
        console.error(err);
    }


    // ALTER TABLE users ADD COLUMN status VARCHAR(255) AFTER rate;
    // ALTER TABLE users ADD COLUMN authvalue VARCHAR(120) AFTER manage_estate;
    // ALTER TABLE users ADD COLUMN macvalue VARCHAR(120) AFTER manage_estate;
    // ALTER TABLE users ADD COLUMN type VARCHAR(10) AFTER manage_estate;





    // ALTER TABLE hy_site ADD COLUMN hy_kakao_link VARCHAR(255) AFTER hy_callnumber;
    // ALTER TABLE users ADD COLUMN status VARCHAR(5) AFTER rate;
    // ALTER TABLE users ADD COLUMN type VARCHAR(10) AFTER manage_estate;
    // ALTER TABLE users ADD COLUMN authvalue VARCHAR(120) AFTER type;
    // ALTER TABLE users ADD COLUMN macvalue VARCHAR(120) AFTER authvalue;
    // INSERT INTO hidden_link (hidden_chk) VALUES ('main');


    // ALTER TABLE memos CHANGE id mo_id INT;
    // ALTER TABLE form_status CHANGE id fs_id INT;
    // ALTER TABLE application_form CHANGE id af_id INT;
    // ALTER TABLE application_form CHANGE created_at af_created_at DATETIME;
    // ALTER TABLE memos CHANGE created_at me_created_at;
    // ALTER TABLE memos CHANGE id mo_id INT;
    // ALTER TABLE memos CHANGE id mo_id INT;
    // ALTER TABLE memos ADD COLUMN me_created_at ON UPDATE CURRENT_TIMESTAMP;
    // ALTER TABLE memos DROP COLUMN created_at;
    // alter table memos rename {column} created_at to me_created_at;
    // ALTER TABLE memos RENAME {COLUMN} memo_created_at TO mo_created_at;
    // ALTER TABLE memos RENAME (COLUMN id TO mo_id);
    // ALTER TABLE memos CHANGE `id` `mo_id`;
    // ALTER TABLE memos CHANGE id mo_id INT;
    // DROP TABLE memos;
    // ALTER TABLE memos CHANGE 'created_at' 'me_created_at';
    // UPDATE users SET rate = 5 WHERE userid = 'master';
    // var chkSql = 'ALTER TABLE application_form ADD COLUMN mb_visit_status VARCHAR(50) AFTER mb_status;';
    // await sql_con.promise().query(chkSql)
    // var chkSql = 'ALTER TABLE application_form ADD COLUMN mb_reserve_time DATETIME AFTER mb_status;';
    // await sql_con.promise().query(chkSql)
    // var chkSql = 'ALTER TABLE application_form ADD COLUMN mb_sensitive VARCHAR(50) AFTER mb_status;';
    // await sql_con.promise().query(chkSql)
    // var chkSql = 'ALTER TABLE form_status DROP COLUMN renty_status;';
    // await sql_con.promise().query(chkSql)
    // var chkSql = 'ALTER TABLE users ADD COLUMN manage_estate VARCHAR(255) AFTER rate;';
    // await sql_con.promise().query(chkSql)
    // var chkSql = 'ALTER TABLE application_form ADD COLUMN mb_price integer AFTER mb_status;';
    // await sql_con.promise().query(chkSql)
    // const delArray = ['itn_item', 'tv_item', 'item_other', 'mb_phone_cpn', 'mb_regnum', 'mb_email', 'mb_address', 'mb_pay_type', 'mb_bank_cpn', 'mb_bank_accountnum', 'mb_bank_name', 'mb_bank_regnum', 'mb_card_cpn', 'mb_card_cardnum', 'mb_card_name', 'mb_card_validity', 'mb_gift_bankname', 'mb_gift_accountnum', 'mb_gift_name', 'form_memo_1', 'form_memo_2', 'form_memo_3', 'form_memo_4', 'form_memo_5', 'form_memo_6', 'form_memo_7', 'form_memo_8', 'form_memo_9', 'form_memo_10'];

    // for (let j = 0; j < delArray.length; j++) {
    //     console.log(delArray[j]);
    //     let setSql = `ALTER TABLE application_form DROP COLUMN ${delArray[j]};`;
    //     try {
    //         await sql_con.promise().query(setSql)
    //     } catch (err) {
    //         console.error(err);
    //     }
    // }
    // ALTER TABLE form_status CHANGE id fs_id INT;
    // let setSql = `ALTER TABLE reviews MODIFY rv_created_at DEFAULT ON UPDATE CURRENT_TIMESTAMP;`
    // sql_con.query(setSql, (err, result) => { });

    // 여기부터 하나씩 실행
    // ALTER TABLE reviews MODIFY COLUMN rv_created_at DATETIME DEFAULT NOW(); // 성공
    // DROP TABLE if exists form_types;
    // ALTER TABLE application_form ADD COLUMN mb_status VARCHAR(20) AFTER mb_gift_name;
    // ALTER TABLE application_form CHANGE id af_id INT;
    // ALTER TABLE application_form CHANGE created_at af_created_at DATETIME;
};