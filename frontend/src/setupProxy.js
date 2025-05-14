// This setupProxy.js file configures a proxy middleware for the React development server.
// Its main purpose is to forward any API requests made from the React frontend to the backend server.
// This helps avoid CORS issues during development by making the frontend and backend appear as if they are served from the same origin.

console.log('🚧 setupProxy.js loaded!');

const { createProxyMiddleware } = require('http-proxy-middleware');

// The createProxyMiddleware function is used to create a middleware that intercepts requests
// and forwards them to a specified target server. This allows the React dev server to act as a proxy,
// forwarding API calls to the backend server seamlessly.

// Choose the API URL based on the environment:
// - If the app is running inside a Docker container, the backend URL is provided via the REACT_APP_API_URL environment variable.
// - If running locally (outside Docker), it falls back to 'http://localhost:8000' as the backend server URL.
const target =
  process.env.REACT_APP_API_URL ||
  'http://localhost:8000';
console.log('›› proxy target:', target);

module.exports = function(app) {
  // This function is called by the React development server to set up middleware.
  // Here, we use createProxyMiddleware to forward any requests starting with '/api' to the backend server.
  // Using '/api' as the path to proxy helps differentiate API calls from other frontend routes.
  app.use(
    createProxyMiddleware('/api', {
      target,           // The backend server URL to which the requests will be forwarded.
      changeOrigin: true, // Changes the origin of the host header to the target URL.
                         // This is useful when the backend server expects requests from its own origin.
      logLevel: 'debug',  // Enables detailed logging for proxy operations, useful for debugging proxy issues.
    })
  );
};