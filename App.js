import express from 'express';
import cors from 'cors';
import env from './Config/env.js';
import authRoutes from './Routes/auth.route.js';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

export default app;
