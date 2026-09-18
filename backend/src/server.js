const dns = require('dns');


dns.setServers(['1.1.1.1', '1.0.0.1']);



const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const authRoutes = require('./routes/authRoutes');
const truckRoutes = require('./routes/truckRoutes');
const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const dieselRoutes = require('./routes/dieselRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/diesel', dieselRoutes);
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TruckFleet Pro API is running',
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`TruckFleet Pro API running on port ${PORT}`);
  });
};

startServer();