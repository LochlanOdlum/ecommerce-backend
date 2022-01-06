const jwt = require('jsonwebtoken');
const User = require('../models/user');

const isAuth = (req, res, next) => {
  console.log(req.method);
  const authError = () => {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    return next(error);
  };

  if (!req.get('Authorization')) {
    return authError();
  }

  const token = req.get('Authorization').split(' ')[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    authError();
  }

  if (!decodedToken || !decodedToken.userId) {
    return authError();
  }

  //Dont fetch user model instance here as it's not always needed in every controller which requires authentication
  req.userId = decodedToken.userId;
  next();
};

module.exports = isAuth;
