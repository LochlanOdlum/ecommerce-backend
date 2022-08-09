const { DataTypes } = require('sequelize');

const sequelize = require('../util/database');

const PasswordReset = sequelize.define('passwordReset', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  tokenHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = PasswordReset;
