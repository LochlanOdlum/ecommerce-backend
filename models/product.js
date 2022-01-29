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
    type: DataTypes.STRING(1023),
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
  imageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageMedKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageMedCropped2to1Key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedLrgKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedLrgPublicURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedMedKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedMedPublicURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedMedSquareKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedMedSquarePublicURL: {
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
