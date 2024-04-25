const express = require('express');

const router = express.Router();

const moment = require('moment-timezone');
const timezone = 'Asia/Seoul';
const sql_con = require('../db_lib');

router.post('/content_upload', async (req, res, next) => {
    console.log('컨텐츠를 업로드 합시당!!!!!!!!');
    console.log(req.body);

    let status = true;
    let message = ''

    try {
        const subject = req.body.subject;
        const content = req.body.content;

        const now = moment.tz(timezone).format('YYYY-MM-DD hh:mm:ss');

        console.log(subject);
        console.log(content);
        console.log(now);

        const blogInsertQuery = "INSERT INTO blog (bl_subject,bl_content,bl_created_at) VALUES (?,?,?)";
        await sql_con.promise().query(blogInsertQuery, [subject, content, now]);

        console.log('여기까지 오는거면 문제 없는건디?!?!?');
    } catch (error) {
        console.log('에러남!!!');
        console.error(error.message);
        status = false;
        message = error.message;
    }

    res.json({ status, message })
})

router.get('/write', async (req, res, next) => {
    let on_site_list = 'asldjfaljflasijf'
    res.render('blog/write/main', { on_site_list })
});

router.get('/:id', async (req, res, next) => {

    let status = true;
    let view_data = {}
    let getId = req.params.id
    let user_data = req.user
    let post_list = []

    let footer_info = {}

    const siteUrl = 'https://' + req.get('host') + req.originalUrl;
    const siteUrlOrigin = 'https://' + req.get('host')

    const regex = /<img[^>]+src="([^">]+)"/;

    console.log(req.user);

    try {


        const getViewDataQuery = "SELECT * FROM blog WHERE bl_id = ?";
        const getViewData = await sql_con.promise().query(getViewDataQuery, [getId]);
        view_data = getViewData[0][0];

        const setData = view_data.bl_bl_updated_at ? view_data.bl_bl_updated_at : view_data.bl_created_at
        console.log(setData);

        view_data['date_str'] = moment(setData).format("YY-MM-DD");
        view_data['date_time_str'] = moment(setData).format("YYYY-MM-DDTHH:mm:ss+00:00");

        const viewMainImgFilter = view_data['bl_content'].match(regex);
        if (viewMainImgFilter) {
            view_data['main_img'] = viewMainImgFilter[1];
        }

        const viewTextOnly = view_data['bl_content'].replace(/<[^>]+>/g, ' ');
        const viewTextOnlyFilter = viewTextOnly.replace(/\s+/g, ' ').trim();
        view_data['description'] = truncateTextTo100Chars(viewTextOnlyFilter);

        console.log(view_data);


        // 포스팅 하단에 넣을 게시글 리스트 만들기

        const getPostListQuery = "SELECT * FROM blog WHERE bl_id != ? ORDER BY bl_id DESC LIMIT 10";
        const getPostList = await sql_con.promise().query(getPostListQuery, [getId]);
        post_list = getPostList[0];

        for (let i = 0; i < post_list.length; i++) {
            const setOnData = post_list[i].bl_bl_updated_at ? post_list[i].bl_bl_updated_at : post_list[i].bl_created_at
            post_list[i]['date_str'] = moment(setOnData).format("YY-MM-DD HH:mm");
            const match = post_list[i]['bl_content'].match(regex);
            if (match) {
                post_list[i]['main_img'] = match[1];
            }

            const textOnly = post_list[i]['bl_content'].replace(/<[^>]+>/g, ' ');
            post_list[i]['content_txt'] = textOnly.replace(/\s+/g, ' ');
        }

        const getFooterInfoQuery = "SELECT * FROM form_status WHERE fs_id = 1";
        const getFooterInfo = await sql_con.promise().query(getFooterInfoQuery)
        footer_info = getFooterInfo[0][0];
        console.log('에러 없어~');
    } catch (error) {
        console.log('에러 있어?');
        console.error(error.message);
        status = false;
        message = '에러가 발생했습니다.'
    }



    res.render('blog/view/main', { view_data, user_data, post_list, siteUrl, siteUrlOrigin, footer_info })
});

router.get('/', async (req, res, next) => {

    // console.log(res.origin);
    const siteUrlOrigin = 'https://' + req.get('host');
    const siteUrl = 'https://' + req.get('host') + req.originalUrl;

    let status = true;
    let message = ""
    let post_list = []
    let footer_info = {}

    let user_data = req.user

    const regex = /<img[^>]+src="([^">]+)"/;

    try {
        const getPostListQuery = "SELECT * FROM blog ORDER BY bl_id DESC LIMIT 20";
        const getPostList = await sql_con.promise().query(getPostListQuery);
        post_list = getPostList[0];

        for (let i = 0; i < post_list.length; i++) {
            setData = post_list[i].bl_bl_updated_at ? post_list[i].bl_bl_updated_at : post_list[i].bl_created_at
            post_list[i]['date_str'] = moment(setData).format("YY-MM-DD HH:mm");
            const match = post_list[i]['bl_content'].match(regex);
            if (match) {
                post_list[i]['main_img'] = match[1];
            }

            const textOnly = post_list[i]['bl_content'].replace(/<[^>]+>/g, ' ');
            post_list[i]['content_txt'] = textOnly.replace(/\s+/g, ' ');
        }

        const getFooterInfoQuery = "SELECT * FROM form_status WHERE fs_id = 1";
        const getFooterInfo = await sql_con.promise().query(getFooterInfoQuery)
        footer_info = getFooterInfo[0][0];
        console.log(post_list);
    } catch (error) {
        console.error(error.message);
        status = false;
        message = '에러가 발생했습니다.'
    }



    res.render('blog/main/main', { post_list, user_data, siteUrl, siteUrlOrigin, footer_info })
});


function truncateTextTo100Chars(text) {
    if (text.length <= 100) {
        return text;
    }

    // 100자 뒤의 가장 가까운 띄어쓰기를 찾음
    const truncatedText = text.substr(0, 200);
    const lastSpaceIndex = truncatedText.lastIndexOf(' ');

    if (lastSpaceIndex === -1) {
        // 띄어쓰기를 찾지 못한 경우, 그냥 100자까지 자름
        return truncatedText;
    }

    // 가장 가까운 띄어쓰기까지 잘라서 반환
    return truncatedText.substr(0, lastSpaceIndex);
}

module.exports = router;