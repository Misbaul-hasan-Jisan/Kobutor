import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import pigeonRoutes from './routes/pigeonRoutes.js';

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/pigeons', pigeonRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (_, res) => res.send('Kobutor backend is running'));

export default app;
