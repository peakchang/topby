const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const Webhookdata = require('./webhook')
const User = require('./user')
const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Webhookdata = Webhookdata;
db.User = User;

Webhookdata.init(sequelize);
User.init(sequelize);

Webhookdata.associate(db);
User.associate(db);

module.exports = db;
