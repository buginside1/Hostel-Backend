const Room = require("../models/Room");
const Hostel = require("../models/Hostel");
const Booking = require("../models/Booking");
const cloudinary = require("cloudinary").v2;
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const getDataUri = require("../utils/getDataUri");

// create room -- admin
exports.createRoom = catchAsyncErrors(async (req, res, next) => {
  const hostelId = req.params.id;
  const { number, name, type, specification, PricePerDay } = req.body;

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return next(new ErrorHandler("Hostel not found", 404));
  }

  const isDuplicate = await Room.findOne({
    hostel: hostel.id,
    number,
  });

  if (isDuplicate) {
    return next(new ErrorHandler("Duplicate room number", 400));
  }

  const room = await Room.create({
    number,
    name,
    type,
    specification,
    PricePerDay,
    hostel: hostel.id,
  });

  hostel.rooms.push(room.id);
  await hostel.save();

  res.status(201).json({
    success: true,
    room,
  });
});

// upload room pictures -- admin
exports.uploadRoomPictures = catchAsyncErrors(async (req, res, next) => {
  const pictures = req.files;
  const id = req.params.id;

  if (pictures.length < 1) {
    return next(new ErrorHandler("Please upload room pictures", 400));
  }

  const room = await Room.findById(id);

  if (!room) {
    return next(new ErrorHandler("Room not found", 404));
  }

  const picturePath = await Promise.all(
    pictures.map(async (picture) => {
      const pictureUri = getDataUri(picture);

      const myCloud = await cloudinary.uploader.upload(pictureUri.content, {
        folder: "/Hostelites/rooms",
        crop: "scale",
      });

      return {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    })
  );

  // destroy previous pictures
  if (room.pictures.length > 0) {
    await Promise.all(
      room.pictures.map(async (picture) => {
        await cloudinary.uploader.destroy(picture.public_id);
        return;
      })
    );
  }

  room.pictures = picturePath;
  await room.save();

  res.status(200).json({
    success: true,
    room,
  });
});

// update room details
exports.updateRoom = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  const { number, name, type, bedCount, specification, PricePerDay } = req.body;

  if (number) {
    return next(new ErrorHandler("Room number can't be changed", 400));
  }

  const room = await Room.findByIdAndUpdate(
    id,
    {
      $set: {
        name,
        type,
        bedCount,
        specification,
        PricePerDay,
      },
    },
    { new: true }
  );

  if (!room) {
    return next(new ErrorHandler("Room not found", 404));
  }

  res.status(200).json({
    success: true,
    room,
  });
});

// delete room -- admin
exports.deleteRoom = catchAsyncErrors(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ErrorHandler("Room not found", 404));
  }

  // delete room from hostel
  const roomsHostel = await Hostel.findById(room.hostel);
  roomsHostel.rooms = roomsHostel.rooms.filter(
    (room) => room.toString() !== req.params.id
  );

  if (room.pictures.length > 0) {
    await Promise.all(
      room.pictures.map(async (picture) => {
        await cloudinary.uploader.destroy(picture.public_id);
      })
    );
  }

  // delete room's booking details
  const bookings = await Booking.find({
    room: room.id,
  });

  if (bookings.length > 0) {
    await Promise.all(bookings.map(async (booking) => await booking.delete()));
  }

  await roomsHostel.save();
  await room.delete();
  const hostel = await Hostel.findById(roomsHostel.id).populate("rooms");

  res.status(200).json({
    success: true,
    hostel,
    message: "room deleted successfully",
  });
});

// get room details
exports.getRoomDetails = catchAsyncErrors(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate("hostel");

  if (!room) {
    return next(new ErrorHandler("Room not found", 404));
  }

  res.status(200).json({
    success: true,
    room,
  });
});

// get all rooms
exports.getHostelRooms = catchAsyncErrors(async (req, res, next) => {
  const hostelId = req.params.id;

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return next(new ErrorHandler("Hostel not found.", 404));
  }

  const rooms = await Room.find({
    hostel: hostelId,
  });

  res.status(200).json({
    success: true,
    rooms,
  });
});
