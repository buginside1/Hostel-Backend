const express = require('express');
const cookieParser = require('cookie-parser');
const morgan=require("morgan");
const path = require('path');

const app = express();

// config
require('dotenv').config()

// Routes import
const userRoute = require('./routes/userRoute');
const hotelRoute = require('./routes/hotelRoute');
const roomRoute = require('./routes/roomRoute');
const bookingRoute = require('./routes/bookingRoute');
const errorMiddleware = require('./middlewares/errorMiddleware');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan("dev"));
// cors cofiguration

    app.use(require('cors')({
        origin: process.env.FRONTEND_URL,
        optionsSuccessStatus: 200,
    }))

app.use('/api/v1', userRoute);
app.use('/api/v1', hotelRoute);
app.use('/api/v1', roomRoute);
app.use('/api/v1', bookingRoute);


// error middileware
app.use(errorMiddleware)






module.exports = app;
