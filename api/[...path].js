export default async function handler(req, res) {
  // req.url will be something like /api/v1/Account/login
  // We want to forward to https://unistay.tryasp.net/api/v1/Account/login
  const targetUrl = `https://unistay.tryasp.net${req.url}`;

  const headers = {
    'Content-Type': req.headers['content-type'] || 'application/json',
  };

  if (req.headers['authorization']) {
    headers['Authorization'] = req.headers['authorization'];
  }

  const options = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(targetUrl, options);
    const contentType = backendRes.headers.get('content-type') || '';
    const data = await backendRes.text();

    res.setHeader('Content-Type', contentType || 'application/json');
    res.status(backendRes.status).send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ message: 'Proxy error: ' + error.message });
  }
}
