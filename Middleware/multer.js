// import multer from 'multer';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import cloudinary from '../config/cloudinary.js';

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'uploads',  // Cloudinary folder
//     allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Optional
//     transformation: [{ width: 800, height: 800, crop: 'limit' }],
//   },
// });

// const upload = multer({ storage });

// export default upload;



import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;