const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      // target: 'http://192.168.1.72:3000/api',
      target: 'https://chatgpt.prompts666.com/api',
      // target: 'http://localhost:3000/api',
      // target: 'https://api.robbanaititle.com/api',
      changeOrigin: true
    })
  );
};