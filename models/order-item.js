const { DataTypes } = require('sequelize');

const sequelize = require('../util/database');

const orderItem = sequelize.define('orderItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rawImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = orderItem;
