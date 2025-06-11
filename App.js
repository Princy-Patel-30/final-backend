import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './Config/env.js';
import authRoutes from './Routes/auth.route.js';
import profileRoutes from './Routes/profile.route.js';
import postRoutes from './Routes/post.route.js';
import chatRoutes from './Routes/chat.route.js';
const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/post',postRoutes);
app.use('/api/user', profileRoutes)
app.use('/api/chat', chatRoutes);

export default app;
