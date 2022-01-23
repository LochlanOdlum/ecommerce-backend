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
  priceInPounds: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  priceInPence: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rawImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediumSquareImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullWatermarkedImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullWatermarkedImagePublicURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediumWatermarkedImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediumWatermarkedImagePublicURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediumCroppedSquareWatermarkedImageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediumCroppedSquareWatermarkedImagePublicURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isAvaliableForPurchase: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  // isPurchased: {
  //   type: DataTypes.BOOLEAN,
  //   allowNull: false,
  //   defaultValue: false,
  // },
});

module.exports = Product;
