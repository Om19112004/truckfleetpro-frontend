const Diesel = require('../models/Diesel');
const Truck = require('../models/Truck');

// CREATE DIESEL RECORD
const createDiesel = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const {
      truckId,
      date,
      litres,
      rate,
      totalAmount,
      odometer,
      fuelStation,
      notes,
    } = req.body;

    if (!truckId || !date || litres === undefined || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Truck, date, litres and rate are required',
      });
    }

    const truck = await Truck.findOne({
      _id: truckId,
      owner: userId,
    });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found',
      });
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diesel date',
      });
    }

    const litresNumber = Number(litres);
    const rateNumber = Number(rate);

    if (
      !Number.isFinite(litresNumber) ||
      litresNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Litres must be a valid positive number',
      });
    }

    if (
      !Number.isFinite(rateNumber) ||
      rateNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rate must be a valid positive number',
      });
    }

    const calculatedTotal =
      litresNumber * rateNumber;

    const diesel = await Diesel.create({
      owner: userId,
      truck: truckId,
      date: parsedDate,
      litres: litresNumber,
      rate: rateNumber,
      totalAmount:
        totalAmount !== undefined &&
        totalAmount !== null &&
        totalAmount !== ''
          ? Number(totalAmount)
          : calculatedTotal,
      odometer:
        odometer !== undefined &&
        odometer !== null &&
        odometer !== ''
          ? Number(odometer)
          : 0,
      fuelStation: fuelStation?.trim() || '',
      notes: notes?.trim() || '',
    });

    const populatedDiesel =
      await Diesel.findById(diesel._id).populate(
        'truck',
        'registrationNumber make model'
      );

    return res.status(201).json({
      success: true,
      message: 'Diesel record created successfully',
      record: populatedDiesel,
    });
  } catch (error) {
    console.error('Create diesel error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create diesel record',
      error: error.message,
    });
  }
};


// GET DIESEL RECORDS
const getDieselRecords = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const filter = {
      owner: userId,
    };

    if (req.query.truckId) {
      filter.truck = req.query.truckId;
    }

    const records = await Diesel.find(filter)
      .populate(
        'truck',
        'registrationNumber make model'
      )
      .sort({
        date: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Get diesel records error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch diesel records',
      error: error.message,
    });
  }
};


// GET SINGLE DIESEL RECORD
const getDieselById = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const record = await Diesel.findOne({
      _id: req.params.id,
      owner: userId,
    }).populate(
      'truck',
      'registrationNumber make model'
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Diesel record not found',
      });
    }

    return res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Get diesel record error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch diesel record',
      error: error.message,
    });
  }
};


// DELETE DIESEL RECORD
const deleteDiesel = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const record = await Diesel.findOneAndDelete({
      _id: req.params.id,
      owner: userId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Diesel record not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Diesel record deleted successfully',
    });
  } catch (error) {
    console.error('Delete diesel error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete diesel record',
      error: error.message,
    });
  }
};


module.exports = {
  createDiesel,
  getDieselRecords,
  getDieselById,
  deleteDiesel,
};