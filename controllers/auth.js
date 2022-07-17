const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
  const { email, password, name } = req.body;

  //Validation already done to ensure all data is valid

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({ email, passwordHash, name, isAdmin: false });

  res.status(201).json({ message: 'User created' });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });

    const throwValidationError = () => {
      const error = new Error('Email and password do not match');
      error.statusCode = 401;
      throw error;
    };
    if (!existingUser) {
      throwValidationError();
    }
    const doPasswordsMatch = await bcrypt.compare(password, existingUser.passwordHash);

    if (!doPasswordsMatch) {
      throwValidationError();
    }

    const token = jwt.sign(
      {
        userId: existingUser.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      isUserAdmin: existingUser.isAdmin,
      UsersName: existingUser.name,
      UsersEmail: existingUser.email,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
