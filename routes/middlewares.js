exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        // res.status(403).send('로그인 필요');
        errData = { err_chk: 'notLogin', move: req.baseUrl }
        res.status(403).render('error', { errData })
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        const message = encodeURIComponent('isLogged');
        res.redirect(`/?error=${message}`);
    }
};

exports.chkRateManager = (req, res, next) => {
    var movePath = req._parsedOriginalUrl.pathname
    try {
        if (req.isAuthenticated() && parseInt(req.user.rate) == 2 || req.isAuthenticated() && parseInt(req.user.rate) == 5) {
            next();
        } else {
            res.send(`
            <script>
            alert('등급이 낮거나 로그인이 되지 않은 상태입니다. 관리자에게 문의 해주세요');
            location.href = '/auth/login?move=/crm/estate_manager';
            </script>
            `)
            // res.redirect(`/auth/login?move=/crm/estate_manager`);
            // res.redirect(`/`);
        }
    } catch (error) {
        const message = encodeURIComponent(movePath);

        // res.redirect(`/auth/login?move=${message}`);
        res.redirect(`/crm/estate_manager`);
    }
};

exports.chkRateManagerTele = (req, res, next) => {
    var movePath = req._parsedOriginalUrl.pathname
    try {
        if (req.isAuthenticated() && parseInt(req.user.rate) == 3 || req.isAuthenticated() && parseInt(req.user.rate) == 5) {
            next();
        } else {
            res.send(`
            <script>
            alert('등급이 낮거나 로그인이 되지 않은 상태입니다. 관리자에게 문의 해주세요');
            location.href = '/auth/authlogin?move=/telework';
            </script>
            `)
            // res.redirect(`/auth/login?move=/crm/estate_manager`);
            // res.redirect(`/`);
        }
    } catch (error) {
        const message = encodeURIComponent(movePath);

        // res.redirect(`/auth/login?move=${message}`);
        res.redirect(`/telework`);
    }
};


exports.chkRateMaster = (req, res, next) => {
    const movePath = req._parsedOriginalUrl.pathname
    try {
        if (req.isAuthenticated() && parseInt(req.user.rate) == 5) {
            next();
        } else {
            // res.send(`
            // <script>
            // alert('관리자만 이용 가능한 메뉴입니다.');
            // location.href = '/';
            // </script>
            // `)

            res.redirect(`/crm/estate_manager`);
        }
    } catch (error) {
        // const message = encodeURIComponent(movePath);
        // res.redirect(`/auth/login?move=${message}`);
        res.redirect(`/auth/login?move=/crm/estate_manager`);
    }
};