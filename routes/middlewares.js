exports.isLoggedIn = (req, res, next) => {
    console.log('미들웨어에는 들어오는것인가????');
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
    const movePath = req._parsedOriginalUrl.pathname
    try {
        if (req.isAuthenticated() && parseInt(req.user.rate) > 1) {
            next();
        } else {
            const message = encodeURIComponent(movePath);
            res.redirect(`/auth/login?move=${message}`);
        }
    } catch (error) {
        const message = encodeURIComponent(movePath);
        res.redirect(`/auth/login?move=${message}`);
    }


};