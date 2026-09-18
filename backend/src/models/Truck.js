const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    make: {
      type: String,
      trim: true,
      default: '',
    },

    model: {
      type: String,
      trim: true,
      default: '',
    },

    year: {
      type: Number,
    },

    truckType: {
      type: String,
      trim: true,
      default: '',
    },

    capacity: {
      type: Number,
      required: true,
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    // ================================
    // DOCUMENT EXPIRY DATES
    // ================================

    fitnessExpiry: {
      type: Date,
      default: null,
    },

    taxExpiry: {
      type: Date,
      default: null,
    },

    insuranceExpiry: {
      type: Date,
      default: null,
    },

    puccExpiry: {
      type: Date,
      default: null,
    },

    permitExpiry: {
      type: Date,
      default: null,
    },

    nationalPermitExpiry: {
      type: Date,
      default: null,
    },

    // ================================

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },

    status: {
      type: String,
      enum: ['available', 'on_trip', 'maintenance', 'inactive'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Truck', truckSchema);