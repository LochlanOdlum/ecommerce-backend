const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const PasswordReset = require('../models/password-reset');
const mailer = require('../util/mailer');

//This salt is superfluous/redundant. bcryptjs just requires some sort of salt so predefining one meaning hashing resetToken is deterministic.
const RESET_PASSWORD_SALT = '$2a$10$Q01Zap2TvXmJrRA7NIO.EO';

const genRandomString = (length) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (err, buffer) => {
      if (err) {
        return reject(err);
      }

      resolve(buffer.toString('hex'));
    });
  });
};

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
      phoneNumber: existingUser.phoneNumber,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getMyDetails = async (req, res, next) => {
  const user = req.user;

  res.send({
    userDetails: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      phoneNumber: user.phoneNumber,
    },
  });
};

exports.updateMyDetails = async (req, res, next) => {
  const { updatedEmail, updatedName, updatedPhoneNumber } = req.body?.updatedFields;
  console.log({ email: updatedEmail, name: updatedName, phoneNumber: updatedPhoneNumber });

  await User.update(
    { email: updatedEmail, name: updatedName, phoneNumber: updatedPhoneNumber },
    { where: { id: req.userId } }
  );

  res.status(200).json({ message: 'Successfully updated user details' });
};

exports.changeMyPassword = async (req, res, next) => {
  const { password, newPassword } = req.body;

  const doPasswordsMatch = await bcrypt.compare(password, req.user.passwordHash);

  if (!doPasswordsMatch) {
    const error = new Error('Current password incorrect');
    error.statusCode = 401;
    return next(error);
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  await User.update({ passwordHash: newPasswordHash }, { where: { id: req.userId } });

  res.status(200).json({ message: 'Successfully updated user password' });
};

exports.sendResetPasswordLink = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });

  if (user) {
    const token = await genRandomString(24);
    const tokenHash = await bcrypt.hash(token, RESET_PASSWORD_SALT);
    const resetURL = `https://skylightphotography.co.uk/resetPassword?token=${token}`;

    PasswordReset.create({ tokenHash, userId: user.id });

    mailer.sendResetPasswordEmail(email, user.name, resetURL);
  }

  res.status(200).json({ message: 'Email sent if a user with this email exists!' });
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = await bcrypt.hash(token, RESET_PASSWORD_SALT);

    const passwordReset = await PasswordReset.findOne({ where: { tokenHash } });
    if (!passwordReset) {
      const error = new Error('Token has expired');
      error.statusCode = 401;
      return next(error);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await User.update({ passwordHash: newPasswordHash }, { where: { id: passwordReset.userId } });

    res.status(200).json({ message: 'Successfuly updated password' });
  } catch (e) {
    const error = new Error('Failed to rest password');
    error.statusCode = 401;
    next(error);
  }
};

// temp();
