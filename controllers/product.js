exports.getProducts = (req, res, next) => {
  //Dummy data for now,
  res.json([
    { title: 'Amazing photo', price: '18.99' },
    { title: 'Sky Scenes', price: '20.00' },
    { title: 'Spooky spider photo', price: '27.99' },
  ]);
};
