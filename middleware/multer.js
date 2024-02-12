const multer = require("multer");

// +++++++++++++++++++++++++++++++++++++++++++++++++++         MULTER               ++++++++++++++++++++++++++++++++++++++++++++++++++

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // Specifying the destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique filename
  },
});
const upload = multer({ storage: storage });
  
module.exports = { upload };