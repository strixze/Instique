import connectDB from './config/db.js';
import { httpServer } from './server.js';
import env from './config/env.js';

connectDB().then(() => {
  httpServer.listen(env.PORT, () => {
    console.log(`Instique server running on port ${env.PORT}`);
  });
});
