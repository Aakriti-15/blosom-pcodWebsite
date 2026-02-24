const SymptomLog = require('../models/SymptomLog');

// ─────────────────────────────────────────────────
// @desc    Get all symptom logs for user
// @route   GET /api/symptoms
// @access  Private
// ─────────────────────────────────────────────────
const getSymptomLogs = async (req, res, next) => {
  try {
    const { limit = 30, page = 1, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user.id };

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await SymptomLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await SymptomLog.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get single symptom log
// @route   GET /api/symptoms/:id
// @access  Private
// ─────────────────────────────────────────────────
const getSymptomLog = async (req, res, next) => {
  try {
    const log = await SymptomLog.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!log) {
      return res.status(404).json({ 
        success: false, 
        message: 'Log not found' 
      });
    }

    res.json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Create a symptom log
// @route   POST /api/symptoms
// @access  Private
// ─────────────────────────────────────────────────
const createSymptomLog = async (req, res, next) => {
  try {
    const { 
      date, 
      symptoms, 
      mood, 
      energyLevel, 
      sleepHours, 
      waterIntake, 
      exercise, 
      notes 
    } = req.body;

    // Check if log already exists for this date
    // Only one log allowed per day
    const logDate = new Date(date || Date.now());
    logDate.setHours(0, 0, 0, 0); // Start of day

    const nextDay = new Date(logDate);
    nextDay.setDate(nextDay.getDate() + 1); // End of day

    const existingLog = await SymptomLog.findOne({
      user: req.user.id,
      date: { 
        $gte: logDate, 
        $lt: nextDay 
      },
    });

    if (existingLog) {
      return res.status(400).json({
        success: false,
        message: 'A log for this date already exists. Please update the existing log instead.',
        existingLogId: existingLog._id,
      });
    }

    // Create the log
    const log = await SymptomLog.create({
      user: req.user.id,
      date: date || Date.now(),
      symptoms,
      mood,
      energyLevel,
      sleepHours,
      waterIntake,
      exercise,
      notes,
    });

    res.status(201).json({ 
      success: true, 
      message: 'Symptoms logged successfully!',
      log 
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Update a symptom log
// @route   PUT /api/symptoms/:id
// @access  Private
// ─────────────────────────────────────────────────
const updateSymptomLog = async (req, res, next) => {
  try {
    let log = await SymptomLog.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!log) {
      return res.status(404).json({ 
        success: false, 
        message: 'Log not found' 
      });
    }

    log = await SymptomLog.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: 'Log updated successfully!',
      log 
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Delete a symptom log
// @route   DELETE /api/symptoms/:id
// @access  Private
// ─────────────────────────────────────────────────
const deleteSymptomLog = async (req, res, next) => {
  try {
    const log = await SymptomLog.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!log) {
      return res.status(404).json({ 
        success: false, 
        message: 'Log not found' 
      });
    }

    await log.deleteOne();

    res.json({ 
      success: true, 
      message: 'Log deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get symptom statistics
// @route   GET /api/symptoms/stats
// @access  Private
// ─────────────────────────────────────────────────
const getSymptomStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    // Calculate start date based on days parameter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all logs in the time period
    const logs = await SymptomLog.find({
      user: req.user.id,
      date: { $gte: startDate },
    });

    if (logs.length === 0) {
      return res.json({ 
        success: true, 
        stats: null,
        message: 'No logs found in this period'
      });
    }

    // ─── Count symptom frequency ───────────────
    const symptomFrequency = {};
    const moodCounts = {};
    let totalEnergy = 0;
    let totalSleep = 0;
    let sleepCount = 0;

    logs.forEach((log) => {
      // Count each symptom
      log.symptoms.forEach((symptom) => {
        if (!symptomFrequency[symptom.name]) {
          symptomFrequency[symptom.name] = { 
            count: 0, 
            totalSeverity: 0 
          };
        }
        symptomFrequency[symptom.name].count++;
        symptomFrequency[symptom.name].totalSeverity += symptom.severity;
      });

      // Count moods
      if (log.mood) {
        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
      }

      // Sum energy and sleep
      if (log.energyLevel) totalEnergy += log.energyLevel;
      if (log.sleepHours) {
        totalSleep += log.sleepHours;
        sleepCount++;
      }
    });

    // ─── Sort symptoms by frequency ────────────
    const topSymptoms = Object.entries(symptomFrequency)
      .map(([name, data]) => ({
        name,
        count: data.count,
        averageSeverity: Math.round(
          (data.totalSeverity / data.count) * 10
        ) / 10,
        // What % of days this symptom appeared
        frequency: Math.round((data.count / logs.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 symptoms

    res.json({
      success: true,
      stats: {
        totalLogsInPeriod: logs.length,
        topSymptoms,
        moodDistribution: moodCounts,
        averageEnergyLevel: logs.length
          ? Math.round((totalEnergy / logs.length) * 10) / 10
          : null,
        averageSleepHours: sleepCount
          ? Math.round((totalSleep / sleepCount) * 10) / 10
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSymptomLogs,
  getSymptomLog,
  createSymptomLog,
  updateSymptomLog,
  deleteSymptomLog,
  getSymptomStats,
};