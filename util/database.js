const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_STRING,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'mysql',
    host: process.env.DATABASE_HOST,
    dialectOptions: {
      ssl: {
        require: true,
      },
    },
  }
);

module.exports = sequelize;
