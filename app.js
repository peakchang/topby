const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const helmet = require('helmet');
const hpp = require('hpp');


dotenv.config();

const crmRouter = require('./routes/crm');
const mainRouter = require('./routes/main');
const authRouter = require('./routes/auth');
const webhookRouter = require('./routes/webhook');
const { sequelize } = require('./models');
const passportConfig = require('./passport');


const app = express();
var xhub = require('express-x-hub');

passportConfig(); // 패스포트 설정

console.log(process.env.PORT);
app.set('port', process.env.PORT || 3030);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });


if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    // app.use(helmet());
    // app.use(hpp());
} else {
    app.use(morgan('dev'));
}



app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const sessionOption = {
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
};

if (process.env.NODE_ENV === 'production') {
    sessionOption.proxy = true;
    sessionOption.cookie.secure = true;
}

app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());


app.use('/', mainRouter);
app.use('/crm', crmRouter);
app.use('/auth', authRouter);
app.use('/webhook', webhookRouter);

app.use((req, res, next) => {
    const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
  });
  
  app.use((err, req, res, next) => {
    console.error(err);
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    errData = {err_chk : 'noPage'}
    res.render('error', { errData });
  });

  module.exports = app;