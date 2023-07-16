const express = require('express');
const { createHostel, uploadHostelPictures, updateHostel, deleteHostel, getHostelDetails, getAllHostels } = require('../controllers/hostelController');
const imageUpload = require('../middlewares/imageUpload');
const { isAuthenticatedUser, authorizedRole } = require('../middlewares/auth');

const router = express.Router();

router.route('/hostel/new').post(isAuthenticatedUser, authorizedRole('admin') ,createHostel);
router.route('/hostel/:id/images').put(isAuthenticatedUser, authorizedRole('admin'),imageUpload('pictures'), uploadHostelPictures);
router.route('/hostels').get(getAllHostels);
router.route('/hostel/:id').put(isAuthenticatedUser, authorizedRole('admin'),updateHostel).delete(isAuthenticatedUser, authorizedRole('admin'), deleteHostel).get(getHostelDetails);

module.exports = router;