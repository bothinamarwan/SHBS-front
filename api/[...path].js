export default async function handler(req, res) {
  // Extract the path from the request URL
  // e.g. /api/v1/Account/login -> v1/Account/login
  const path = req.url.replace(/^\/api/, '');
  const targetUrl = `https://unistay.tryasp.net/api${path}`;

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      }
    };

    if (req.headers['authorization']) {
      options.headers['Authorization'] = req.headers['authorization'];
    }

    // Pass body if not GET/HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Vercel parses application/json automatically into req.body
      // We need to stringify it back to send it to the backend
      options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const backendRes = await fetch(targetUrl, options);
    const data = await backendRes.text();

    res.status(backendRes.status).send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ message: 'Internal Server Error while proxying' });
  }
}
