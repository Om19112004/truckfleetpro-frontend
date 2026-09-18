const express = require('express');

const {
  createDiesel,
  getDieselRecords,
  getDieselById,
  deleteDiesel,
} = require('../controllers/dieselController');

const protect = require('../middleware/authMiddleware');

const router = express.Router();


// CREATE DIESEL RECORD
router.post(
  '/',
  protect,
  createDiesel
);


// GET DIESEL RECORDS
// Optional: ?truckId=TRUCK_ID
router.get(
  '/',
  protect,
  getDieselRecords
);


// GET SINGLE DIESEL RECORD
router.get(
  '/:id',
  protect,
  getDieselById
);


// DELETE DIESEL RECORD
router.delete(
  '/:id',
  protect,
  deleteDiesel
);


module.exports = router;