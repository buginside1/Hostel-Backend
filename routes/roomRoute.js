const express = require('express');
const { createRoom, uploadRoomPictures, updateRoom, deleteRoom, getRoomDetails, getHostelRooms } = require('../controllers/roomController');
const imageUpload = require('../middlewares/imageUpload');
const { isAuthenticatedUser, authorizedRole } = require('../middlewares/auth');

const router = express.Router();

router.route('/hostel/:id/room/new').post(isAuthenticatedUser, authorizedRole('admin'), createRoom);
router.route('/room/:id/images').put(isAuthenticatedUser, authorizedRole('admin'),imageUpload('pictures'), uploadRoomPictures);
router.route('/hostel/:id/rooms').get(getHostelRooms);
router.route('/room/:id').put(isAuthenticatedUser, authorizedRole('admin'),updateRoom).delete(isAuthenticatedUser, authorizedRole('admin'),deleteRoom).get(getRoomDetails);



module.exports = router;