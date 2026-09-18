const express = require('express');

const {
  createTruck,
  getTrucks,
  updateTruck,
  deleteTruck,
  assignDriver,
  unassignDriver,
} = require('../controllers/truckController');

const protect = require('../middleware/authMiddleware');

const router = express.Router();


// CREATE TRUCK
router.post(
  '/',
  protect,
  createTruck
);


// GET ALL TRUCKS
router.get(
  '/',
  protect,
  getTrucks
);


// UPDATE TRUCK
router.patch(
  '/:id',
  protect,
  updateTruck
);


// DELETE TRUCK
router.delete(
  '/:id',
  protect,
  deleteTruck
);


// ASSIGN DRIVER
router.patch(
  '/:id/driver',
  protect,
  assignDriver
);


// REMOVE DRIVER
router.delete(
  '/:id/driver',
  protect,
  unassignDriver
);


module.exports = router;