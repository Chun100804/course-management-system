import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

await connectDatabase(env.MONGODB_URI);
app.listen(env.PORT, '0.0.0.0', () => {
  console.info(`API listening on 0.0.0.0:${env.PORT}`);
});
