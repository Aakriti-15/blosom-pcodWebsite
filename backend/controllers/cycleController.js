const Cycle = require('../models/Cycle');

// ─────────────────────────────────────────────────
// PREDICTION ALGORITHM
// Uses average of last 3 cycles to predict next one
// ─────────────────────────────────────────────────
const predictNextCycle = (cycles) => {
  if (!cycles || cycles.length === 0) return null;

  // Only use actual cycles (not predicted ones)
  const actualCycles = cycles.filter(
    (c) => c.cycleLength && !c.isPredicted
  );

  // Default cycle length if not enough data
  let avgCycleLength = 28;

  if (actualCycles.length >= 1) {
    // Take last 3 cycles maximum
    const recentCycles = actualCycles.slice(0, 3);
    
    // Calculate average
    const total = recentCycles.reduce(
      (sum, c) => sum + c.cycleLength, 0
    );
    avgCycleLength = Math.round(total / recentCycles.length);
  }

  // Get the most recent actual cycle
  const lastCycle = cycles.find((c) => !c.isPredicted);
  if (!lastCycle) return null;

  // Predict next start date
  const nextStart = new Date(lastCycle.startDate);
  nextStart.setDate(nextStart.getDate() + avgCycleLength);

  // Confidence based on how many cycles logged
  let confidence;
  if (actualCycles.length >= 3) confidence = 'high';
  else if (actualCycles.length >= 2) confidence = 'medium';
  else confidence = 'low';

  return {
    predictedStartDate: nextStart,
    predictedCycleLength: avgCycleLength,
    confidence,
    basedOnCycles: actualCycles.length,
  };
};

// ─────────────────────────────────────────────────
// @desc    Get all cycles for logged in user
// @route   GET /api/cycles
// @access  Private
// ─────────────────────────────────────────────────
const getCycles = async (req, res, next) => {
  try {
    const { limit = 12, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Get cycles sorted by most recent first
    const cycles = await Cycle.find({ user: req.user.id })
      .sort({ startDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Total count for pagination
    const total = await Cycle.countDocuments({ 
      user: req.user.id 
    });

    // Get last 6 actual cycles for prediction
    const actualCycles = await Cycle.find({
      user: req.user.id,
      isPredicted: false,
    })
      .sort({ startDate: -1 })
      .limit(6);

    // Generate prediction
    const prediction = predictNextCycle(actualCycles);

    res.json({
      success: true,
      count: cycles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      prediction,
      cycles,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Log a new cycle
// @route   POST /api/cycles
// @access  Private
// ─────────────────────────────────────────────────
const logCycle = async (req, res, next) => {
  try {
    const { startDate, endDate, flowIntensity, notes } = req.body;

    // Find previous cycle to calculate cycle length
    const previousCycle = await Cycle.findOne({
      user: req.user.id,
      isPredicted: false,
    }).sort({ startDate: -1 });

    // Auto calculate cycle length
    let cycleLength = null;
    if (previousCycle) {
      const currentStart = new Date(startDate);
      const prevStart = new Date(previousCycle.startDate);
      const diffTime = currentStart - prevStart;
      cycleLength = Math.round(diffTime / (1000 * 60 * 60 * 24));
    }

    // Auto calculate period length if end date given
    let periodLength = null;
    if (endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      periodLength = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Create the cycle
    const cycle = await Cycle.create({
      user: req.user.id,
      startDate,
      endDate,
      cycleLength,
      periodLength,
      flowIntensity,
      notes,
    });

    res.status(201).json({ 
      success: true, 
      message: 'Cycle logged successfully!',
      cycle 
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Update a cycle
// @route   PUT /api/cycles/:id
// @access  Private
// ─────────────────────────────────────────────────
const updateCycle = async (req, res, next) => {
  try {
    // Find cycle and make sure it belongs to this user
    let cycle = await Cycle.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!cycle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cycle not found' 
      });
    }

    // Recalculate period length if end date updated
    if (req.body.endDate) {
      const start = new Date(cycle.startDate);
      const end = new Date(req.body.endDate);
      req.body.periodLength = 
        Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Update the cycle
    cycle = await Cycle.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: 'Cycle updated successfully!',
      cycle 
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Delete a cycle
// @route   DELETE /api/cycles/:id
// @access  Private
// ─────────────────────────────────────────────────
const deleteCycle = async (req, res, next) => {
  try {
    const cycle = await Cycle.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!cycle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cycle not found' 
      });
    }

    await cycle.deleteOne();

    res.json({ 
      success: true, 
      message: 'Cycle deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get cycle statistics
// @route   GET /api/cycles/stats
// @access  Private
// ─────────────────────────────────────────────────
const getCycleStats = async (req, res, next) => {
  try {
    // Get last 12 cycles for stats
    const cycles = await Cycle.find({ 
      user: req.user.id, 
      isPredicted: false 
    })
      .sort({ startDate: -1 })
      .limit(12);

    if (cycles.length === 0) {
      return res.json({ 
        success: true, 
        stats: null,
        message: 'No cycles logged yet'
      });
    }

    // Get all cycle lengths
    const cycleLengths = cycles
      .filter((c) => c.cycleLength)
      .map((c) => c.cycleLength);

    // Get all period lengths
    const periodLengths = cycles
      .filter((c) => c.periodLength)
      .map((c) => c.periodLength);

    const stats = {
      totalCyclesLogged: cycles.length,

      averageCycleLength: cycleLengths.length
        ? Math.round(
            cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
          )
        : null,

      shortestCycle: cycleLengths.length
        ? Math.min(...cycleLengths)
        : null,

      longestCycle: cycleLengths.length
        ? Math.max(...cycleLengths)
        : null,

      averagePeriodLength: periodLengths.length
        ? Math.round(
            periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
          )
        : null,

      // Cycles outside normal range (21-35 days)
      irregularCycles: cycleLengths.filter(
        (l) => l < 21 || l > 35
      ).length,

      lastCycleDate: cycles[0]?.startDate,
    };

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getCycles, 
  logCycle, 
  updateCycle, 
  deleteCycle, 
  getCycleStats 
};