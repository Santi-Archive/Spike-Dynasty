/**
 * Team Management Component - Handles team roster display and player management
 *
 * This component manages the team roster display, player information,
 * and various team management operations like filtering, sorting, and searching.
 *
 * @fileoverview Team management component with player roster functionality
 * @author Spike Dynasty Team
 * @version 0.2.0
 */

/**
 * TeamManagement component object
 *
 * This object contains all functionality for managing the team roster,
 * including displaying players, filtering, sorting, and player interactions.
 */
const TeamManagement = {
  // Component state
  currentFilter: "all",
  currentSort: "overall",
  currentSortDirection: "desc",
  searchTerm: "",
  isInitialized: false,
  isGeneratingGrid: false,

  /**
   * Initialize the team management component
   *
   * This function sets up the team management page by generating
   * the player grid and setting up any necessary event listeners.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Prevent double initialization
      if (this.isInitialized) {
        console.log(
          "Team Management component already initialized, skipping..."
        );
        return;
      }

      console.log("Initializing Team Management component...");

      // Generate the team grid with all players
      await this.generateTeamGrid();

      // Set up any additional team management features
      this.setupTeamManagementFeatures();

      this.isInitialized = true;
      console.log("Team Management component initialized successfully");
    } catch (error) {
      console.error("Error initializing Team Management:", error);
      throw error;
    }
  },

  /**
   * Setup additional team management features
   *
   * This function sets up any additional features specific to team management
   * that aren't part of the core player grid functionality.
   *
   * @returns {void}
   */
  setupTeamManagementFeatures() {
    // Add any additional team management setup here
    // For example, setting up search, filter, or sort controls
    console.log("Team Management features setup complete");
  },

  /**
   * Generate and display the team grid with player cards
   *
   * This function creates the player grid display by fetching all players
   * from the database service and creating individual player cards for each one.
   *
   * @returns {Promise<void>}
   */
  async generateTeamGrid() {
    // Prevent multiple simultaneous calls
    if (this.isGeneratingGrid) {
      console.log("DEBUG: generateTeamGrid already in progress, skipping...");
      return;
    }

    this.isGeneratingGrid = true;
    console.log("DEBUG: Starting generateTeamGrid()");

    const teamGrid = document.getElementById("teamGrid");
    if (!teamGrid) {
      console.error("Team grid element not found");
      this.isGeneratingGrid = false;
      return;
    }

    try {
      // Show loading state for team grid
      window.DOMHelpers.showComponentLoading("Team Roster", 0);

      // Clear existing content
      teamGrid.innerHTML = "";

      // Get all players from database service
      window.DOMHelpers.updateLoadingMessage("Fetching player data...");
      const players = await window.DatabaseService.getPlayers();

      console.log("DEBUG: Raw players from database:", players);
      console.log("DEBUG: Number of players from database:", players.length);

      if (players.length === 0) {
        teamGrid.innerHTML =
          '<div class="no-players">No players found in the team.</div>';
        window.DOMHelpers.hideLoadingScreen();
        return;
      }

      // Update loading progress
      window.DOMHelpers.updateLoadingMessage("Creating player cards...");
      window.DOMHelpers.updateLoadingProgress(50);

      // Create player cards for each player
      players.forEach((player, index) => {
        console.log(
          `DEBUG: Creating card ${index} for player:`,
          player.player_name,
          "ID:",
          player.id
        );
        const playerCard = this.createPlayerCard(player, index);
        teamGrid.appendChild(playerCard);
      });

      // Update loading progress
      window.DOMHelpers.updateLoadingMessage("Finalizing team roster...");
      window.DOMHelpers.updateLoadingProgress(100);

      console.log(`Generated ${players.length} player cards`);
      console.log(
        "DEBUG: Final teamGrid children count:",
        teamGrid.children.length
      );

      // Hide loading screen after a brief delay
      setTimeout(() => {
        window.DOMHelpers.hideLoadingScreen();
      }, 500);
    } catch (error) {
      console.error("Error generating team grid:", error);
      teamGrid.innerHTML =
        '<div class="error-message">Error loading players. Please try again.</div>';
      window.DOMHelpers.hideLoadingScreen();
    } finally {
      this.isGeneratingGrid = false;
      console.log("DEBUG: Finished generateTeamGrid()");
    }
  },

  /**
   * Create a single player card element
   *
   * This function creates the HTML element for a single player card
   * with all necessary information and event listeners.
   *
   * @param {Object} player - Player object
   * @param {number} index - Player index in the array
   * @returns {HTMLElement} - Player card element
   */
  createPlayerCard(player, index) {
    const playerCard = document.createElement("div");
    playerCard.className = "player-card";

    // Set up player card HTML structure
    playerCard.innerHTML = `
            <div class="player-card__header">
                <div class="player-card__info">
                    <div class="player-card__face">👤</div>
                    <div class="player-card__details">
                        <div class="player-card__name">${
                          player.player_name || "Unknown Player"
                        }</div>
                        <div class="player-card__position" data-position="${
                          player.position || "Unknown"
                        }">${player.position || "Unknown Position"}</div>
                    </div>
                </div>
                <div class="player-card__overall player-card__overall--large">${
                  player.overall || "N/A"
                }</div>
            </div>
            <div class="player-card__stats">
                <div class="player-card__stat">
                    <div class="player-card__stat-value">${
                      player.attack || "N/A"
                    }</div>
                    <div class="player-card__stat-label">ATT</div>
                </div>
                <div class="player-card__stat">
                    <div class="player-card__stat-value">${
                      player.defense || "N/A"
                    }</div>
                    <div class="player-card__stat-label">DEF</div>
                </div>
                <div class="player-card__stat">
                    <div class="player-card__stat-value">${
                      player.serve || "N/A"
                    }</div>
                    <div class="player-card__stat-label">SRV</div>
                </div>
                <div class="player-card__stat">
                    <div class="player-card__stat-value">${
                      player.block || "N/A"
                    }</div>
                    <div class="player-card__stat-label">BLK</div>
                </div>
                <div class="player-card__stat">
                    <div class="player-card__stat-value">${
                      player.receive || "N/A"
                    }</div>
                    <div class="player-card__stat-label">RCV</div>
                </div>
                <div class="player-card__stat">
                    <div class="player-card__stat-value">${
                      player.setting || "N/A"
                    }</div>
                    <div class="player-card__stat-label">SET</div>
                </div>
            </div>
        `;

    // Add click event listener to show player details
    playerCard.addEventListener("click", () => {
      this.showPlayerDetails(player);
    });

    return playerCard;
  },

  /**
   * Show player details modal
   *
   * This function displays the detailed player information in a modal dialog.
   *
   * @param {Object} player - Player object to display
   * @returns {void}
   */
  showPlayerDetails(player) {
    try {
      window.ModalHelpers.showPlayerModal(player);
    } catch (error) {
      console.error("Error showing player details:", error);
      window.DOMHelpers.showNotification(
        "Error showing player details",
        "error"
      );
    }
  },

  /**
   * Filter players by position
   *
   * This function filters the displayed players based on their position
   * and updates the team grid accordingly.
   *
   * @param {string} position - Position to filter by (empty string shows all)
   * @returns {Promise<void>}
   */
  async filterByPosition(position) {
    try {
      this.currentFilter = position;

      // Get filtered players from database service
      const filteredPlayers =
        await window.DatabaseService.filterPlayersByPosition(position);

      // Display filtered players
      this.displayFilteredPlayers(filteredPlayers);

      console.log(
        `Filtered players by position: ${position}, found ${filteredPlayers.length} players`
      );
    } catch (error) {
      console.error("Error filtering players by position:", error);
      window.DOMHelpers.showNotification("Error filtering players", "error");
    }
  },

  /**
   * Display filtered players in the team grid
   *
   * This function updates the team grid to show only the filtered players.
   *
   * @param {Array} filteredPlayers - Array of filtered player objects
   * @returns {void}
   */
  displayFilteredPlayers(filteredPlayers) {
    const teamGrid = document.getElementById("teamGrid");
    if (!teamGrid) {
      console.error("Team grid element not found");
      return;
    }

    try {
      // Clear existing content
      teamGrid.innerHTML = "";

      if (filteredPlayers.length === 0) {
        teamGrid.innerHTML =
          '<div class="no-players">No players found for this filter.</div>';
        return;
      }

      // Create player cards for filtered players
      filteredPlayers.forEach((player, index) => {
        const playerCard = this.createPlayerCard(player, index);
        teamGrid.appendChild(playerCard);
      });
    } catch (error) {
      console.error("Error displaying filtered players:", error);
      teamGrid.innerHTML =
        '<div class="error-message">Error displaying filtered players.</div>';
    }
  },

  /**
   * Sort players by a specific attribute
   *
   * This function sorts the displayed players based on the specified attribute
   * and direction, then updates the display.
   *
   * @param {string} attribute - Attribute to sort by (overall, name, age, etc.)
   * @param {boolean} ascending - Sort direction (true for ascending, false for descending)
   * @returns {Promise<void>}
   */
  async sortPlayers(attribute, ascending = true) {
    try {
      this.currentSort = attribute;
      this.currentSortDirection = ascending ? "asc" : "desc";

      // Get sorted players from database service
      const sortedPlayers = await window.DatabaseService.sortPlayers(
        attribute,
        ascending
      );

      // Display sorted players
      this.displayFilteredPlayers(sortedPlayers);

      console.log(
        `Sorted players by ${attribute} (${
          ascending ? "ascending" : "descending"
        })`
      );
    } catch (error) {
      console.error("Error sorting players:", error);
      window.DOMHelpers.showNotification("Error sorting players", "error");
    }
  },

  /**
   * Search players by name, position, or nationality
   *
   * This function searches through all players based on the provided search term
   * and updates the display to show only matching players.
   *
   * @param {string} searchTerm - Search term to filter players
   * @returns {Promise<void>}
   */
  async searchPlayers(searchTerm) {
    try {
      this.searchTerm = searchTerm;

      // Get search results from database service
      const searchResults = await window.DatabaseService.searchPlayers(
        searchTerm
      );

      // Display search results
      this.displayFilteredPlayers(searchResults);

      console.log(
        `Searched players with term: "${searchTerm}", found ${searchResults.length} results`
      );
    } catch (error) {
      console.error("Error searching players:", error);
      window.DOMHelpers.showNotification("Error searching players", "error");
    }
  },

  /**
   * Get current filter and sort state
   *
   * This function returns the current state of filters and sorting
   * for debugging and state management purposes.
   *
   * @returns {Object} - Current filter and sort state
   */
  getCurrentState() {
    return {
      currentFilter: this.currentFilter,
      currentSort: this.currentSort,
      currentSortDirection: this.currentSortDirection,
      searchTerm: this.searchTerm,
      playerCount: 0, // Will be updated by database service
    };
  },

  /**
   * Reset all filters and sorting
   *
   * This function resets all filters and sorting to their default state
   * and refreshes the player grid.
   *
   * @returns {Promise<void>}
   */
  async resetFilters() {
    try {
      this.currentFilter = "all";
      this.currentSort = "overall";
      this.currentSortDirection = "desc";
      this.searchTerm = "";

      // Regenerate team grid with all players
      await this.generateTeamGrid();

      console.log("Filters and sorting reset");
    } catch (error) {
      console.error("Error resetting filters:", error);
      window.DOMHelpers.showNotification("Error resetting filters", "error");
    }
  },

  /**
   * Get player statistics summary
   *
   * This function calculates and returns various statistics about the team
   * for display purposes.
   *
   * @returns {Promise<Object>} - Team statistics object
   */
  async getTeamStatistics() {
    try {
      const players = await window.DatabaseService.getPlayers();

      if (players.length === 0) {
        return {
          totalPlayers: 0,
          averageOverall: 0,
          positionCounts: {},
          ageRange: { min: 0, max: 0 },
        };
      }

      // Calculate average overall rating
      const totalOverall = players.reduce(
        (sum, player) => sum + (player.overall || 0),
        0
      );
      const averageOverall = Math.round(totalOverall / players.length);

      // Count players by position
      const positionCounts = {};
      players.forEach((player) => {
        const position = player.position || "Unknown";
        positionCounts[position] = (positionCounts[position] || 0) + 1;
      });

      // Calculate age range
      const ages = players
        .map((player) => player.age || 0)
        .filter((age) => age > 0);
      const ageRange = {
        min: ages.length > 0 ? Math.min(...ages) : 0,
        max: ages.length > 0 ? Math.max(...ages) : 0,
      };

      return {
        totalPlayers: players.length,
        averageOverall,
        positionCounts,
        ageRange,
      };
    } catch (error) {
      console.error("Error calculating team statistics:", error);
      return {
        totalPlayers: 0,
        averageOverall: 0,
        positionCounts: {},
        ageRange: { min: 0, max: 0 },
      };
    }
  },
};

// Export to global scope for use throughout the application
window.TeamManagement = TeamManagement;
