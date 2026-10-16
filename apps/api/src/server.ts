import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

await connectDatabase(env.MONGODB_URI);
app.listen(env.API_PORT, () => {
  console.info(`API listening on port ${env.API_PORT}`);
});
