const express = require('express');

const adminController = require('..controllers/admin');
const upload = require('../util/multer');

const router = express.Router();

router.post('/photo', upload.single('image'), adminController.postPhoto);

module.exports = router;
