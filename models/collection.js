const { DataTypes } = require('sequelize');

const sequelize = require('../util/database');

const Collection = sequelize.define('collection', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Collection;
