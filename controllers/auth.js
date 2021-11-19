const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
  const { email, password, firstName, surname } = req.body;

  //Validation already done to ensure all data is valid

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({ email, passwordHash, firstName, surname });

  res.status(201).json({ message: 'User created' });
};
