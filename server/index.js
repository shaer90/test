const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/network',       require('./routes/network'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/verifications', require('./routes/verifications'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve React frontend (whenever dist/ exists)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Allsence server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
