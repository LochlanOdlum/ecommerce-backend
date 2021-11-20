const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.get('Authorization').split(' ')[1];
  let decodedToken;

  try {
    decodedToken = jtw.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    err.statusCode = 500;
    next(err);
  }

  if (!decodedToken) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    next(error);
  }

  //Could get sequelize user model instance and assign to req.user or something, but may not always need user model instance
  req.userId = decodedToken.userId;
  next();
};
