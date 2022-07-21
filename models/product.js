const { DataTypes } = require('sequelize');

const sequelize = require('../util/database');

const Product = sequelize.define('product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  orderPosition: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(1023),
    allowNull: true,
  },
  priceInPence: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  s3ImagesKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedLrgPublicURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageWmarkedMedPublicURL: {
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
