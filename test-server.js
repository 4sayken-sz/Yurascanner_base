const http = require('http');

const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Test Admin</title>
</head>
<body>
  <h1>Admin Login</h1>
  <form action="/admin/" method="post">
    <label>Username: <input type="text" name="username" /></label><br/>
    <label>Password: <input type="password" name="password" /></label><br/>
    <input type="submit" value="Login" />
  </form>
  <p>If you submit the form, the server will respond with a success message.</p>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/admin/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.method === 'POST' && req.url === '/admin/') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Logged in (test server)</h1><p>Received: ' + body + '</p>');
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Test server listening on http://localhost:${PORT}/admin/`));
