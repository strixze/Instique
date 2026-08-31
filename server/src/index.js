import connectDB from './config/db.js';
import { httpServer } from './server.js';

connectDB().then(() => {
  httpServer.listen(process.env.PORT, () => {
    console.log(`Instique server running on port ${process.env.PORT}`);
  });
});
