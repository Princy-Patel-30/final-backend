
import streamifier from 'streamifier';
import cloudinary from '../Config/cloudinary.js';

export const uploadBufferToCloudinary = (buffer, folder = 'avatars') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
