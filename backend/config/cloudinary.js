const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadImage = async (imageBuffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto", 
      },
      (error, result) => {
        if (error) {
          return reject(new Error("Cloudinary upload failed: " + error.message));
        }
        resolve(result.secure_url); 
      }
    ).end(imageBuffer); 
  });
};

module.exports = { uploadImage };
