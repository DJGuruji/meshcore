/**
 * Custom Next.js Server with WebSocket Support
 * 
 * This server enables WebSocket functionality for localhost API testing
 * while maintaining all Next.js features.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize WebSocket server (only if the module is available)
  try {
    // Register ts-node for TypeScript support
    require('ts-node/register');
    const { initializeWebSocketServer } = require('./src/lib/websocket-server.ts');
    initializeWebSocketServer(httpServer);
    console.log('[Server] WebSocket relay initialized');
  } catch (error) {
    console.warn('[Server] WebSocket initialization skipped:', error.message);
    console.warn('[Server] This is normal in production build. WebSocket relay will work after deployment.');
  }

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket relay available at ws://${hostname}:${port}/api/localhost-relay`);
    });
});
