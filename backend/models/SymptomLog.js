const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema(
  {
    // Which user this log belongs to
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Date of the log
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },

    // Array of symptoms with severity
    symptoms: [
      {
        name: {
          type: String,
          required: true,
          enum: [
            // ─── Physical Symptoms ───
            'cramps',
            'bloating',
            'headache',
            'fatigue',
            'acne',
            'hair_loss',
            'weight_gain',
            'nausea',
            'back_pain',
            'breast_tenderness',

            // ─── Emotional Symptoms ───
            'mood_swings',
            'anxiety',
            'depression',
            'irritability',
            'brain_fog',

            // ─── PCOD Specific ───
            'irregular_period',
            'heavy_bleeding',
            'spotting',
            'pelvic_pain',
            'increased_hair_growth',
            'sleep_issues',
            'food_cravings',
          ],
        },
        // Severity from 1 to 5
        // 1 = barely noticeable
        // 5 = severe, can't function
        severity: {
          type: Number,
          min: 1,
          max: 5,
          default: 3,
        },
      },
    ],

    // Overall mood for the day
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'bad', 'terrible'],
      default: 'okay',
    },

    // Energy level from 1 to 10
    energyLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    // How many hours slept
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
    },

    // How many glasses of water
    waterIntake: {
      type: Number,
      default: 0,
    },

    // Exercise intensity
    exercise: {
      type: String,
      enum: ['none', 'light', 'moderate', 'intense'],
      default: 'none',
    },

    // Any extra notes
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

// Index for faster queries by user and date
symptomLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('SymptomLog', symptomLogSchema);