
const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        webhookdata:{
            type: Sequelize.STRING(255),
            allowNull: false
        }
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Webhookdata',
      tableName: 'webhookdatas',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {}
};
