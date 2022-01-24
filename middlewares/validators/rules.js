const { body, param } = require('express-validator');

const User = require('../../models/user');

exports.postSignup = () => {
  return [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .bail()
      .normalizeEmail()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ where: { email: value } });
        if (user) {
          return Promise.reject('User with this email already exists!');
        }
      }),

    body('password').trim().isLength({ min: 8, max: 64 }).withMessage('Password must be between 8 and 64 characters'),
    body('name').trim().not().isEmpty().withMessage('Must include a name'),
  ];
};

exports.login = () => {
  return [body('email').normalizeEmail()];
};

exports.getMyOrder = () => {
  return [
    param('id')
      .not()
      .isEmpty()
      .withMessage('Must include an order id as url param')
      .custom((value) => {
        if (!Number.isInteger(Number(value))) {
          throw new Error('Order id must be an integer');
        }
        return true;
      }),
  ];
};

exports.postCollection = () => {
  return [body('collectionName').not().isEmpty().withMessage('Must include a collectionName')];
};

// exports.getMyOrders = () => {
//   return [
//     body('orderIds')
//       // .not()
//       // .isEmpty()
//       // .withMessage('Must have orderIds propery with an array of order ids')
//       .custom((value) => {
//         if (!Array.isArray(value)) {
//           throw new Error('Order ids must be an array of integers');
//         }

//         value.forEach((id) => {
//           if (!Number.isInteger(id)) {
//             throw new Error('Each order id must be an integer!');
//           }
//         });

//         return true;
//       }),
//   ];
// };
