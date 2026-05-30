import http from 'http';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: Number(process.env.PORT || 3000),
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const paths = [
  '/api/health',
  '/api/workforce/os/performance-hub',
  '/api/workforce/os/top-bottom',
  '/api/workforce/os/leakage-ownership',
  '/api/workforce/os/org-health',
];

const login = await request('POST', '/api/auth/login', {
  email: process.env.TEST_EMAIL || 'admin@akumentis.com',
  password: process.env.TEST_PASSWORD || 'admin123',
});
let token = '';
try {
  token = JSON.parse(login.body).token;
} catch {
  console.error('Login failed:', login.status, login.body);
  process.exit(1);
}

for (const path of paths) {
  const r = await request('GET', path, null, path.startsWith('/api/workforce') ? token : null);
  const ok = r.status === 200 ? 'OK' : 'FAIL';
  console.log(`${ok} ${r.status} ${path}`);
  if (r.status !== 200) console.log('  ', r.body.slice(0, 120));
}
