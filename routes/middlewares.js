exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        // res.status(403).send('로그인 필요');
        console.log('***************************************');
        console.log(req._parsedOriginalUrl.pathname);
        console.log(req.baseUrl);
        errData = {err_chk : 'notLogin', move : req.baseUrl}
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