const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Hostel = require("../models/Hostel");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("cloudinary").v2;
const getDataUri = require("../utils/getDataUri");

// Create Hostel -- admin
exports.createHostel = catchAsyncErrors(async (req, res, next) => {
  const { name, location, distance, specification, description } = req.body;

  const hostel = await Hostel.create({
    name,
    location,
    distance,
    specification,
    description,
  });

  res.status(201).json({
    success: true,
  });
});

// upload hostel pictures -- admin
exports.uploadHostelPictures = catchAsyncErrors(async (req, res, next) => {
  const pictures = req.files;
  const id = req.params.id;

  if (pictures.length < 1) {
    return next(new ErrorHandler("Please upload hostel pictures", 400));
  }

  const hostel = await Hostel.findById(id);

  if (!hostel) {
    return next(new ErrorHandler("Hostel not found", 404));
  }

  const picturePath = await Promise.all(
    pictures.map(async (picture) => {
      const pictureUri = getDataUri(picture);

      const myCloud = await cloudinary.uploader.upload(pictureUri.content, {
        folder: "/Hostelites/hostels",
        crop: "scale",
      });

      return {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    })
  );

  // destroy previous pictures
  if (hostel.pictures.length > 0) {
    await Promise.all(
      hostel.pictures.map(async (picture) => {
        await cloudinary.uploader.destroy(picture.public_id);
        return;
      })
    );
  }

  hostel.pictures = picturePath;
  await hostel.save();

  res.status(200).json({
    success: true,
    hostel,
  });
});

// update hostel details -- admin
exports.updateHostel = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  const { name, location, distance, specification, description } = req.body;

  const hostel = await Hostel.findByIdAndUpdate(
    id,
    {
      $set: {
        name,
        location,
        distance,
        description,
        specification,
      },
    },
    { new: true }
  );

  if (!hostel) {
    return next(new ErrorHandler("Hostel not found", 404));
  }

  res.status(200).json({
    success: true,
    hostel,
  });
});

// delete hostel -- admin
exports.deleteHostel = catchAsyncErrors(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id);

  if (!hostel) {
    return next(new ErrorHandler("Hostel not found", 404));
  }

  // delete hostel rooms
  await Promise.all(
    hostel.rooms.map(async (roomId) => {
      const room = await Room.findById(roomId);

      room && (await room.delete());

      return;
    })
  );

  if (hostel.pictures.length > 0) {
    await Promise.all(
      hostel.pictures.map(async (picture) => {
        await cloudinary.uploader.destroy(picture.public_id);
      })
    );
  }

  // delete hostel's booking details
  const bookings = await Booking.find({
    hostel: hostel.id,
  });

  if (bookings.length > 0) {
    await Promise.all(bookings.map(async (booking) => await booking.delete()));
  }

  await hostel.delete();
  const hostels = await Hostel.find();

  res.status(200).json({
    success: true,
    hostels,
    message: "Hostel deleted successfully",
  });
});

// get hostel details
exports.getHostelDetails = catchAsyncErrors(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id).populate("rooms");

  if (!hostel) {
    return next(new ErrorHandler("Hostel not found", 404));
  }

  res.status(200).json({
    success: true,
    hostel,
  });
});

// get all hostels
exports.getAllHostels = catchAsyncErrors(async (req, res, next) => {
  const keyword = req.query.location;
  const roomCount = Number(req.query.room);
  const personCount = Number(req.query.person);
  const dates = [];

  //   for search query
  if (req.query.person && personCount < 1)
    return next(new ErrorHandler("At least one person required", 400));
  if (req.query.room && roomCount < 1)
    return next(new ErrorHandler("At least one room required", 400));
  if (req.query.d1 && req.query.d2) {
    let startDate = req.query.d1;
    let endDate = req.query.d2;

    if (startDate > endDate)
      return next(new ErrorHandler("Please check start and end date", 400));

    while (new Date(startDate) <= new Date(endDate)) {
      dates.push(Date.parse(new Date(startDate)));

      startDate = new Date(
        new Date(startDate).setDate(new Date(startDate).getDate() + 1)
      );
    }
  }

  let hostels = await Hostel.find({
    location: {
      $regex: keyword ? keyword : "",
      $options: "i",
    },
    $expr: { $gte: [{ $size: "$rooms" }, req.query.room ? roomCount : 0] },
  }).populate("rooms");

  if (req.query.person) {
    hostels = hostels.filter((hostel) => {
      return hostel.rooms.some((room) => {
        return personCount > 1 ? room.type === "Double" : true;
      });
    });
  }

  if (dates.length > 0) {
    hostels = hostels.filter((hostel) => {
      return hostel.rooms.some((room) => {
        return room.notAvailable.every((date) => {
          return !dates.includes(Date.parse(date));
        });
      });
    });
  }

  res.status(200).json({
    success: true,
    hostels,
  });
});
