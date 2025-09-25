/**
 * Player Stats System - Flexible and extensible player statistics management
 *
 * This module provides a flexible system for managing player statistics
 * that can be easily extended with new stats in the future.
 *
 * @fileoverview Flexible player statistics system for future extensibility
 * @author Volleyball Manager Team
 * @version 0.3.0
 */

/**
 * PlayerStatsSystem utility object
 *
 * This object provides a flexible system for managing player statistics
 * that can be easily extended with new stats without breaking existing code.
 */
const PlayerStatsSystem = {
  // Core volleyball stats (always present)
  CORE_STATS: {
    overall: { name: "Overall", min: 1, max: 100, weight: 1.0 },
    attack: { name: "Attack", min: 1, max: 100, weight: 0.8 },
    defense: { name: "Defense", min: 1, max: 100, weight: 0.8 },
    serve: { name: "Serve", min: 1, max: 100, weight: 0.7 },
    block: { name: "Block", min: 1, max: 100, weight: 0.7 },
    receive: { name: "Receive", min: 1, max: 100, weight: 0.8 },
    setting: { name: "Setting", min: 1, max: 100, weight: 0.6 },
  },

  // Extended stats (can be added dynamically)
  EXTENDED_STATS: {
    // Physical attributes
    speed: { name: "Speed", min: 1, max: 100, weight: 0.5 },
    agility: { name: "Agility", min: 1, max: 100, weight: 0.5 },
    strength: { name: "Strength", min: 1, max: 100, weight: 0.6 },
    endurance: { name: "Endurance", min: 1, max: 100, weight: 0.4 },
    height: { name: "Height (cm)", min: 150, max: 220, weight: 0.3 },

    // Mental attributes
    leadership: { name: "Leadership", min: 1, max: 100, weight: 0.3 },
    teamwork: { name: "Teamwork", min: 1, max: 100, weight: 0.4 },
    concentration: { name: "Concentration", min: 1, max: 100, weight: 0.4 },
    pressure_handling: {
      name: "Pressure Handling",
      min: 1,
      max: 100,
      weight: 0.3,
    },

    // Technical skills
    jump_serve: { name: "Jump Serve", min: 1, max: 100, weight: 0.4 },
    float_serve: { name: "Float Serve", min: 1, max: 100, weight: 0.3 },
    spike_power: { name: "Spike Power", min: 1, max: 100, weight: 0.5 },
    spike_accuracy: { name: "Spike Accuracy", min: 1, max: 100, weight: 0.5 },
    block_timing: { name: "Block Timing", min: 1, max: 100, weight: 0.4 },
    dig_technique: { name: "Dig Technique", min: 1, max: 100, weight: 0.4 },

    // Experience and development
    experience: { name: "Experience", min: 1, max: 100, weight: 0.2 },
    potential: { name: "Potential", min: 1, max: 100, weight: 0.3 },
    consistency: { name: "Consistency", min: 1, max: 100, weight: 0.4 },
  },

  // Position-specific stat weights
  POSITION_WEIGHTS: {
    "Outside Hitter": {
      attack: 1.2,
      spike_power: 1.1,
      spike_accuracy: 1.1,
      receive: 1.0,
      defense: 0.9,
      serve: 0.8,
    },
    "Middle Blocker": {
      block: 1.3,
      block_timing: 1.2,
      height: 1.1,
      attack: 1.0,
      defense: 0.8,
      speed: 0.7,
    },
    Setter: {
      setting: 1.4,
      concentration: 1.2,
      leadership: 1.1,
      teamwork: 1.0,
      defense: 0.8,
      attack: 0.6,
    },
    "Opposite Hitter": {
      attack: 1.3,
      spike_power: 1.2,
      spike_accuracy: 1.1,
      serve: 1.0,
      block: 0.9,
      receive: 0.7,
    },
    Libero: {
      receive: 1.4,
      dig_technique: 1.3,
      defense: 1.2,
      agility: 1.1,
      concentration: 1.0,
      attack: 0.3,
    },
  },

  /**
   * Get all available stats (core + extended)
   *
   * @returns {Object} - All available stats with their configurations
   */
  getAllStats() {
    return {
      ...this.CORE_STATS,
      ...this.EXTENDED_STATS,
    };
  },

  /**
   * Get core stats only
   *
   * @returns {Object} - Core stats configuration
   */
  getCoreStats() {
    return { ...this.CORE_STATS };
  },

  /**
   * Get extended stats only
   *
   * @returns {Object} - Extended stats configuration
   */
  getExtendedStats() {
    return { ...this.EXTENDED_STATS };
  },

  /**
   * Add a new stat to the system
   *
   * @param {string} statKey - Unique key for the stat
   * @param {Object} statConfig - Stat configuration object
   * @returns {boolean} - True if stat was added successfully
   */
  addStat(statKey, statConfig) {
    try {
      if (this.CORE_STATS[statKey] || this.EXTENDED_STATS[statKey]) {
        console.warn(`Stat '${statKey}' already exists`);
        return false;
      }

      // Validate stat configuration
      if (!statConfig.name || !statConfig.min || !statConfig.max) {
        console.error(
          "Invalid stat configuration: missing required properties"
        );
        return false;
      }

      this.EXTENDED_STATS[statKey] = {
        name: statConfig.name,
        min: statConfig.min,
        max: statConfig.max,
        weight: statConfig.weight || 0.5,
      };

      console.log(`Added new stat: ${statKey}`);
      return true;
    } catch (error) {
      console.error("Error adding stat:", error);
      return false;
    }
  },

  /**
   * Remove a stat from the system
   *
   * @param {string} statKey - Key of the stat to remove
   * @returns {boolean} - True if stat was removed successfully
   */
  removeStat(statKey) {
    try {
      if (this.CORE_STATS[statKey]) {
        console.warn(`Cannot remove core stat: ${statKey}`);
        return false;
      }

      if (this.EXTENDED_STATS[statKey]) {
        delete this.EXTENDED_STATS[statKey];
        console.log(`Removed stat: ${statKey}`);
        return true;
      }

      console.warn(`Stat '${statKey}' not found`);
      return false;
    } catch (error) {
      console.error("Error removing stat:", error);
      return false;
    }
  },

  /**
   * Calculate overall rating based on position and stats
   *
   * @param {Object} player - Player object with stats
   * @param {string} position - Player position
   * @returns {number} - Calculated overall rating
   */
  calculateOverallRating(player, position) {
    try {
      const positionWeights = this.POSITION_WEIGHTS[position] || {};
      const allStats = this.getAllStats();
      let weightedSum = 0;
      let totalWeight = 0;

      // Calculate weighted average of all stats
      Object.keys(allStats).forEach((statKey) => {
        const statValue = player[statKey];
        if (statValue !== undefined && statValue !== null) {
          const baseWeight = allStats[statKey].weight;
          const positionWeight = positionWeights[statKey] || 1.0;
          const finalWeight = baseWeight * positionWeight;

          weightedSum += statValue * finalWeight;
          totalWeight += finalWeight;
        }
      });

      if (totalWeight === 0) {
        return 50; // Default value if no stats available
      }

      return Math.round(weightedSum / totalWeight);
    } catch (error) {
      console.error("Error calculating overall rating:", error);
      return 50;
    }
  },

  /**
   * Generate random stats for a player
   *
   * @param {string} position - Player position
   * @param {number} overallTarget - Target overall rating
   * @param {Object} options - Generation options
   * @returns {Object} - Generated stats object
   */
  generateRandomStats(position, overallTarget = 75, options = {}) {
    try {
      const stats = {};
      const positionWeights = this.POSITION_WEIGHTS[position] || {};
      const allStats = this.getAllStats();

      // Generate core stats first
      Object.keys(this.CORE_STATS).forEach((statKey) => {
        if (statKey === "overall") return; // Skip overall, will be calculated

        const statConfig = this.CORE_STATS[statKey];
        const positionWeight = positionWeights[statKey] || 1.0;

        // Adjust target based on position weights
        const adjustedTarget = Math.min(
          100,
          overallTarget * (0.8 + positionWeight * 0.4)
        );
        const variance = options.variance || 15;

        stats[statKey] = this.generateStatValue(
          adjustedTarget,
          variance,
          statConfig.min,
          statConfig.max
        );
      });

      // Generate extended stats if requested
      if (options.includeExtended) {
        Object.keys(this.EXTENDED_STATS).forEach((statKey) => {
          const statConfig = this.EXTENDED_STATS[statKey];
          const positionWeight = positionWeights[statKey] || 1.0;

          const adjustedTarget = Math.min(
            100,
            overallTarget * (0.6 + positionWeight * 0.6)
          );
          const variance = options.variance || 20;

          stats[statKey] = this.generateStatValue(
            adjustedTarget,
            variance,
            statConfig.min,
            statConfig.max
          );
        });
      }

      // Calculate overall rating
      stats.overall = this.calculateOverallRating(stats, position);

      return stats;
    } catch (error) {
      console.error("Error generating random stats:", error);
      return {};
    }
  },

  /**
   * Generate a single stat value with normal distribution
   *
   * @param {number} target - Target value
   * @param {number} variance - Variance from target
   * @param {number} min - Minimum possible value
   * @param {number} max - Maximum possible value
   * @returns {number} - Generated stat value
   */
  generateStatValue(target, variance, min, max) {
    // Simple normal distribution approximation
    const random1 = Math.random();
    const random2 = Math.random();
    const normalRandom =
      Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);

    const value = target + normalRandom * variance;
    return Math.max(min, Math.min(max, Math.round(value)));
  },

  /**
   * Validate player stats
   *
   * @param {Object} player - Player object with stats
   * @returns {Object} - Validation result with errors and warnings
   */
  validateStats(player) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const allStats = this.getAllStats();

    Object.keys(allStats).forEach((statKey) => {
      const statValue = player[statKey];
      const statConfig = allStats[statKey];

      if (statValue !== undefined && statValue !== null) {
        if (statValue < statConfig.min || statValue > statConfig.max) {
          result.errors.push(
            `${statConfig.name} (${statValue}) is outside valid range (${statConfig.min}-${statConfig.max})`
          );
          result.isValid = false;
        }
      } else if (this.CORE_STATS[statKey]) {
        result.warnings.push(`Core stat ${statConfig.name} is missing`);
      }
    });

    return result;
  },

  /**
   * Get position-specific stat recommendations
   *
   * @param {string} position - Player position
   * @returns {Object} - Recommended stats and their importance
   */
  getPositionRecommendations(position) {
    const positionWeights = this.POSITION_WEIGHTS[position] || {};
    const recommendations = {};

    Object.keys(positionWeights).forEach((statKey) => {
      const weight = positionWeights[statKey];
      const statConfig = this.getAllStats()[statKey];

      if (statConfig) {
        recommendations[statKey] = {
          name: statConfig.name,
          importance: weight,
          priority: weight > 1.1 ? "High" : weight > 0.9 ? "Medium" : "Low",
        };
      }
    });

    return recommendations;
  },

  /**
   * Export stats configuration for database migration
   *
   * @returns {Object} - Stats configuration for database schema
   */
  exportStatsConfig() {
    return {
      coreStats: this.CORE_STATS,
      extendedStats: this.EXTENDED_STATS,
      positionWeights: this.POSITION_WEIGHTS,
      version: "0.3.0",
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Import stats configuration from external source
   *
   * @param {Object} config - Stats configuration object
   * @returns {boolean} - True if import was successful
   */
  importStatsConfig(config) {
    try {
      if (config.coreStats) {
        Object.assign(this.CORE_STATS, config.coreStats);
      }

      if (config.extendedStats) {
        Object.assign(this.EXTENDED_STATS, config.extendedStats);
      }

      if (config.positionWeights) {
        Object.assign(this.POSITION_WEIGHTS, config.positionWeights);
      }

      console.log("Stats configuration imported successfully");
      return true;
    } catch (error) {
      console.error("Error importing stats configuration:", error);
      return false;
    }
  },
};

// Export to global scope
window.PlayerStatsSystem = PlayerStatsSystem;
