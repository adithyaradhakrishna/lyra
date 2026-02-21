// LYRA API Endpoint for Vercel
// This provides a simple API interface for the LYRA extension

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'LYRA API is running',
      version: '0.0.1',
      endpoints: {
        '/': 'Health check',
        '/api/help': 'Get help content',
        '/api/encourage': 'Get encouragement message'
      }
    }));
  } else if (req.url === '/api/help' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      title: 'LYRA Help',
      content: 'Welcome to LYRA - Your AI Mentor',
      tips: [
        'Use Ctrl+Shift+P to open the command palette',
        'Run "LYRA: Open Help Sidebar" for assistance',
        'LYRA learns from your coding patterns'
      ]
    }));
  } else if (req.url === '/api/encourage' && req.method === 'GET') {
    const encouragements = [
      'You\'re doing great! Keep coding!',
      'Every error is a learning opportunity.',
      'Progress over perfection - you\'ve got this!',
      'Struggling is part of learning. You\'re on the right track!',
      'Your curiosity is your superpower.'
    ];
    const random = encouragements[Math.floor(Math.random() * encouragements.length)];
    res.writeHead(200);
    res.end(JSON.stringify({
      message: random
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      message: 'The requested endpoint does not exist'
    }));
  }
});

server.listen(PORT, () => {
  console.log(`LYRA API server running on port ${PORT}`);
});

module.exports = server;
