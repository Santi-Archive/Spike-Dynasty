/**
 * Data Storage - Utility functions for handling JSON data and storage operations
 *
 * This module manages all data operations for the Volleyball Manager application,
 * including loading player data, managing team information, and handling
 * data persistence operations.
 *
 * @fileoverview Data management utilities with comprehensive error handling
 * @author Volleyball Manager Team
 * @version 0.2.0
 */

// Global data storage variables
let players = [];
let transferMarketPlayers = [];

/**
 * Load players from JSON file with fallback handling
 *
 * This function attempts to load player data from the main players.json file.
 * If that fails, it falls back to the default players file. This ensures
 * the application can always start with some data.
 *
 * @returns {Promise<Array>} - Array of player objects
 * @throws {Error} - If both main and fallback files fail to load
 */
async function loadPlayers() {
  try {
    // Attempt to load main players file
    const response = await fetch("players.json");
    if (!response.ok) {
      throw new Error("Failed to load players.json");
    }
    players = await response.json();
    console.log(`Loaded ${players.length} players from players.json`);
    return players;
  } catch (error) {
    console.warn(
      "Failed to load players.json, falling back to default:",
      error
    );
    try {
      // Fallback to default players file
      const fallbackResponse = await fetch("players.default.json");
      if (!fallbackResponse.ok) {
        throw new Error("Failed to load players.default.json");
      }
      players = await fallbackResponse.json();
      console.log(`Loaded ${players.length} players from players.default.json`);
      return players;
    } catch (fallbackError) {
      console.error("Failed to load both player files:", fallbackError);
      // Initialize with empty array if both fail
      players = [];
      return players;
    }
  }
}

/**
 * Load transfer market players from JSON file with fallback handling
 *
 * This function loads available players for the transfer market.
 * Similar to loadPlayers, it includes fallback handling for reliability.
 *
 * @returns {Promise<Array>} - Array of transfer market player objects
 * @throws {Error} - If both main and fallback files fail to load
 */
async function loadTransferPlayers() {
  try {
    // Attempt to load main transfer players file
    const response = await fetch("transfer-players.json");
    if (!response.ok) {
      throw new Error("Failed to load transfer-players.json");
    }
    transferMarketPlayers = await response.json();
    console.log(
      `Loaded ${transferMarketPlayers.length} transfer players from transfer-players.json`
    );
    return transferMarketPlayers;
  } catch (error) {
    console.warn("Failed to load transfer-players.json, using default.");
    try {
      // Fallback to default transfer players file
      const fallbackResponse = await fetch("transfer-players.default.json");
      if (!fallbackResponse.ok) {
        throw new Error("Failed to load transfer-players.default.json");
      }
      transferMarketPlayers = await fallbackResponse.json();
      console.log(
        `Loaded ${transferMarketPlayers.length} transfer players from transfer-players.default.json`
      );
      return transferMarketPlayers;
    } catch (fallbackError) {
      console.error("Failed to load transfer players fallback:", fallbackError);
      // Initialize with empty array if both fail
      transferMarketPlayers = [];
      return transferMarketPlayers;
    }
  }
}

/**
 * Get all players from the current team
 *
 * @returns {Array} - Array of player objects
 */
function getPlayers() {
  return players;
}

/**
 * Get all transfer market players
 *
 * @returns {Array} - Array of transfer market player objects
 */
function getTransferPlayers() {
  return transferMarketPlayers;
}

/**
 * Get a specific player by index
 *
 * @param {number} index - Player index in the players array
 * @returns {Object|null} - Player object or null if index is invalid
 */
function getPlayer(index) {
  if (index >= 0 && index < players.length) {
    return players[index];
  }
  return null;
}

/**
 * Get a transfer player by name
 *
 * @param {string} name - Player name to search for
 * @returns {Object|undefined} - Player object or undefined if not found
 */
function getTransferPlayer(name) {
  return transferMarketPlayers.find((p) => p.name === name);
}

/**
 * Save players data to storage
 *
 * In a real application, this would save to a server or local storage.
 * Currently, it just updates the in-memory array and logs the operation.
 *
 * @param {Array} playersData - Updated players data array
 * @returns {void}
 */
function savePlayers(playersData) {
  players = playersData;
  console.log(`Players data updated: ${players.length} players`);

  // In a real app, this would save to server/localStorage
  // localStorage.setItem('volleyballManager_players', JSON.stringify(players));
}

/**
 * Add a new player to the team
 *
 * @param {Object} player - Player object to add
 * @returns {boolean} - True if player was added successfully
 */
function addPlayer(player) {
  try {
    // Validate player object has required properties
    if (!player || !player.name || !player.position) {
      console.error("Invalid player object: missing required properties");
      return false;
    }

    players.push(player);
    console.log(`Player added: ${player.name}`);
    return true;
  } catch (error) {
    console.error("Error adding player:", error);
    return false;
  }
}

/**
 * Remove a player from the team by index
 *
 * @param {number} index - Index of player to remove
 * @returns {Object|null} - Removed player object or null if index is invalid
 */
function removePlayer(index) {
  if (index >= 0 && index < players.length) {
    const removedPlayer = players.splice(index, 1)[0];
    console.log(`Player removed: ${removedPlayer.name}`);
    return removedPlayer;
  }
  console.warn(`Invalid player index: ${index}`);
  return null;
}

/**
 * Search players by name, position, or nationality
 *
 * @param {string} searchTerm - Search term to match against player properties
 * @returns {Array} - Array of matching player objects
 */
function searchPlayers(searchTerm) {
  if (!searchTerm || searchTerm.trim() === "") {
    return players;
  }

  const searchLower = searchTerm.toLowerCase();
  return players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchLower) ||
      player.position.toLowerCase().includes(searchLower) ||
      player.nationality.toLowerCase().includes(searchLower)
  );
}

/**
 * Filter players by position
 *
 * @param {string} position - Position to filter by (empty string shows all)
 * @returns {Array} - Array of filtered player objects
 */
function filterPlayersByPosition(position) {
  if (!position || position === "all") {
    return players;
  }
  return players.filter((player) => player.position === position);
}

/**
 * Sort players by a specific attribute
 *
 * @param {string} attribute - Attribute to sort by (overall, name, age, etc.)
 * @param {boolean} ascending - Sort direction (true for ascending, false for descending)
 * @returns {Array} - Sorted array of player objects
 */
function sortPlayers(attribute, ascending = true) {
  const sortedPlayers = [...players].sort((a, b) => {
    let valueA = a[attribute];
    let valueB = b[attribute];

    // Handle string comparison for names
    if (typeof valueA === "string") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (ascending) {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  return sortedPlayers;
}

// Teams data for standings and team information
const teamsData = {
  "Your Team": {
    name: "Your Team",
    league: "VB League",
    founded: "2020",
    stadium: "Victory Arena",
    capacity: 15000,
    played: 12,
    won: 10,
    lost: 2,
    points: 30,
    goalDiff: 8,
    winRate: 83,
  },
  "Thunder Bolts": {
    name: "Thunder Bolts",
    league: "VB League",
    founded: "2018",
    stadium: "Lightning Stadium",
    capacity: 12000,
    played: 12,
    won: 9,
    lost: 3,
    points: 27,
    goalDiff: 5,
    winRate: 75,
  },
  "Storm Riders": {
    name: "Storm Riders",
    league: "VB League",
    founded: "2019",
    stadium: "Tempest Hall",
    capacity: 10000,
    played: 12,
    won: 8,
    lost: 4,
    points: 24,
    goalDiff: 2,
    winRate: 67,
  },
  "Wave Crushers": {
    name: "Wave Crushers",
    league: "VB League",
    founded: "2017",
    stadium: "Ocean Dome",
    capacity: 8000,
    played: 12,
    won: 7,
    lost: 5,
    points: 21,
    goalDiff: -1,
    winRate: 58,
  },
  "Rising Stars": {
    name: "Rising Stars",
    league: "VBL Division 2",
    founded: "2021",
    stadium: "Star Center",
    capacity: 6000,
    played: 10,
    won: 8,
    lost: 2,
    points: 24,
    goalDiff: 6,
    winRate: 80,
  },
  "Fire Hawks": {
    name: "Fire Hawks",
    league: "VBL Division 2",
    founded: "2020",
    stadium: "Phoenix Arena",
    capacity: 5000,
    played: 10,
    won: 7,
    lost: 3,
    points: 21,
    goalDiff: 3,
    winRate: 70,
  },
  "Ice Breakers": {
    name: "Ice Breakers",
    league: "VBL Division 2",
    founded: "2019",
    stadium: "Frost Center",
    capacity: 4000,
    played: 10,
    won: 6,
    lost: 4,
    points: 18,
    goalDiff: 0,
    winRate: 60,
  },
};

/**
 * Get all teams data
 *
 * @returns {Object} - Teams data object with all team information
 */
function getTeamsData() {
  return teamsData;
}

/**
 * Get a specific team by name
 *
 * @param {string} teamName - Name of the team to retrieve
 * @returns {Object|undefined} - Team object or undefined if not found
 */
function getTeam(teamName) {
  return teamsData[teamName];
}

/**
 * Get teams filtered by league
 *
 * @param {string} league - League name to filter by
 * @returns {Array} - Array of team objects in the specified league
 */
function getTeamsByLeague(league) {
  return Object.values(teamsData).filter((team) => team.league === league);
}

/**
 * Calculate team statistics
 *
 * @param {Object} team - Team object to calculate stats for
 * @returns {Object} - Team object with calculated statistics
 */
function calculateTeamStats(team) {
  const winRate =
    team.played > 0 ? Math.round((team.won / team.played) * 100) : 0;
  const pointsPerGame =
    team.played > 0 ? (team.points / team.played).toFixed(2) : 0;

  return {
    ...team,
    winRate,
    pointsPerGame,
    lossRate: 100 - winRate,
  };
}

/**
 * Get application data summary
 *
 * @returns {Object} - Summary of all application data
 */
function getDataSummary() {
  return {
    playerCount: players.length,
    transferPlayerCount: transferMarketPlayers.length,
    teamCount: Object.keys(teamsData).length,
    lastUpdated: new Date().toISOString(),
  };
}

// Export functions to global scope for use throughout the application
window.DataStorage = {
  loadPlayers,
  loadTransferPlayers,
  getPlayers,
  getTransferPlayers,
  getPlayer,
  getTransferPlayer,
  savePlayers,
  addPlayer,
  removePlayer,
  searchPlayers,
  filterPlayersByPosition,
  sortPlayers,
  getTeamsData,
  getTeam,
  getTeamsByLeague,
  calculateTeamStats,
  getDataSummary,
};
