import express from 'express';
import cors from 'cors';
import { createCorsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { notFound } from './common/middleware/notFound.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(express.json());
app.use(cors(createCorsOptions(env.WEB_ORIGIN)));
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);
