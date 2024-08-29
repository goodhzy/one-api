const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://192.168.1.180:3000/api',
      // target: 'https://chatgpt.prompts666.com/api',
      // target: 'http://localhost:3000/api',
      // target: 'https://api.robbanaititle.com/api',
      changeOrigin: true,
    })
  );

  app.use(
    '/v1',
    createProxyMiddleware({
      target: 'http://192.168.1.180:3000/v1',
      // target: 'https://chatgpt.prompts666.com/v1',
      // target: 'http://localhost:3000/v1',
      // target: 'https://api.robbanaititle.com/api',
      changeOrigin: true,
    })
  );
};