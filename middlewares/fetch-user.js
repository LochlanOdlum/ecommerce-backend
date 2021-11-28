const User = require('../models/user');

//Must be used after is-auth so thhe userId is added to the request object.
const fetchUser = async (req, res, next) => {
  const userId = req.userId;

  const user = await User.findOne({ where: { id: userId } });

  req.user = user;

  next();
};

module.exports = fetchUser;
