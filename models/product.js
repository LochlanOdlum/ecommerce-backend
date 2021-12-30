const { DataTypes } = require('sequelize');

const sequelize = require('../util/database');

const Product = sequelize.define('product', {
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  rawImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  watermarkedImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  watermarkedImagePublicURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isAvaliableForPurchase: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  isPurchased: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = Product;
