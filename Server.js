import env from './Config/env.js';
import app from './App.js';
import { createServer } from 'http';
import { initializeSocket } from './Config/Socket.js';
const server = createServer(app);
const PORT = env.PORT || 3000;
const io = initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running at ${env.BASE_URL}`);
});

export { io };