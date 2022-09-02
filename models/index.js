const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const Webhookdata = require('./webhook')

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Webhookdata = Webhookdata;


Webhookdata.init(sequelize);

Webhookdata.associate(db);


module.exports = db;
