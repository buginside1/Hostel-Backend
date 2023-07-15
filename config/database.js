const mongoose = require('mongoose');

const databaseConnect = () => {
  mongoose.set("strictQuery", false);

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  };
  mongoose.connect(process.env.DB_URI, options)
  .then(() => {
    console.log(`Database connected`);
  })
  .catch((err) => {
      console.error(`Error connecting to the database: ${err}`);
    });
};

module.exports = databaseConnect;
