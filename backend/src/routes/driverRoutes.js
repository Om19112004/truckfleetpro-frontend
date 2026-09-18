const express = require('express');

const {
  createDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create driver
router.post(
  '/',
  authMiddleware,
  createDriver
);

// Get logged-in user's drivers
router.get(
  '/',
  authMiddleware,
  getDrivers
);

// Update driver
router.patch(
  '/:id',
  authMiddleware,
  updateDriver
);

// Delete driver
router.delete(
  '/:id',
  authMiddleware,
  deleteDriver
);

module.exports = router;