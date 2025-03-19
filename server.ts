import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ALCHEMY_API_KEY) {
  console.warn('Warning: No Alchemy API key found in environment variables');
}

if (!process.env.NEXT_PUBLIC_ETHVIS) {
  console.warn('Warning: No ETHVIS server URL found in environment variables');
}

if (!process.env.ETH_LABELS) {
  console.warn('Warning: No ETH_LABELS server URL found in environment variables');
}

import { WebSocketManager } from './lib/server/WebSocketManager';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {  
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  console.log('Initializing WebSocketManager');
  try {
    const wsManager = WebSocketManager.getInstance();
    wsManager.initialize(io);
    console.log('WebSocketManager initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WebSocketManager:', error);
  }
  
  server.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Alchemy API key length: ${process.env.ALCHEMY_API_KEY?.length || 0} characters`);
  });
});
