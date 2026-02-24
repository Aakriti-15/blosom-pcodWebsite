const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema(
  {
    // Which user this cycle belongs to
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // When period started
    startDate: {
      type: Date,
      required: [true, 'Period start date is required'],
    },

    // When period ended (optional, can add later)
    endDate: {
      type: Date,
      default: null,
    },

    // Days between this cycle start and previous cycle start
    // Auto-calculated by backend, user doesn't enter this
    cycleLength: {
      type: Number,
      default: null,
    },

    // How many days the period lasted
    // Auto-calculated from startDate and endDate
    periodLength: {
      type: Number,
      default: null,
    },

    // How heavy the flow was
    flowIntensity: {
      type: String,
      enum: ['light', 'moderate', 'heavy', 'spotting'],
      default: 'moderate',
    },

    // Any extra notes
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Is this a predicted cycle or actual logged one?
    isPredicted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
// When we query by user and sort by date, this makes it fast
cycleSchema.index({ user: 1, startDate: -1 });

module.exports = mongoose.model('Cycle', cycleSchema);