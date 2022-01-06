//Must be used after is-auth and fetch-user so user object is avaliable
const isAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    return next();
  }

  const error = new Error('This user is not an admin');
  error.statusCode = 403;
  next(error);
};

module.exports = isAdmin;
