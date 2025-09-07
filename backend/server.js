import http from "http";
import app from "./src/app.js"; // your Express app
import { initIO } from "./src/sockets/socket.js";

const server = http.createServer(app);

// Initialize Socket.IO
initIO(server);

server.listen(3000, () => console.log("Server running on port 3000"));
