/**
 * Team Management Component - Enhanced UI with Vercel-inspired design
 *
 * This component manages the team roster display with improved UX,
 * modern styling, and enhanced filtering/search capabilities.
 *
 * @fileoverview Enhanced team management component
 * @author Spike Dynasty Team
 * @version 0.3.0
 */

const TeamManagement = {
  // Component state
  currentFilter: "all",
  currentSort: "overall",
  currentSortDirection: "desc",
  searchTerm: "",
  isInitialized: false,
  isGeneratingGrid: false,
  allPlayers: [],
  filteredPlayers: [],

  /**
   * Initialize the team management component
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        console.log(
          "Team Management component already initialized, skipping..."
        );
        return;
      }

      console.log("Initializing Enhanced Team Management component...");

      // Generate the team grid with all players
      await this.generateTeamGrid();

      // Set up enhanced team management features
      this.setupEnhancedFeatures();

      this.isInitialized = true;
      console.log(
        "Enhanced Team Management component initialized successfully"
      );
    } catch (error) {
      console.error("Error initializing Team Management:", error);
      throw error;
    }
  },

  /**
   * Setup enhanced team management features
   */
  setupEnhancedFeatures() {
    const searchInput = document.getElementById("playerSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value;
        this.applyFiltersAndSearch();
      });
    }

    const filterButtons = document.querySelectorAll(".filter-button");
    filterButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        // Remove active class from all buttons
        filterButtons.forEach((btn) =>
          btn.classList.remove("filter-button--active")
        );
        // Add active class to clicked button
        e.target.classList.add("filter-button--active");

        this.currentFilter = e.target.dataset.position;
        this.applyFiltersAndSearch();
      });
    });

    const sortButton = document.getElementById("sortButton");
    if (sortButton) {
      sortButton.addEventListener("click", () => {
        this.toggleSort();
      });
    }

    console.log("Enhanced Team Management features setup complete");
  },

  /**
   * Generate and display the team grid with enhanced player cards
   */
  async generateTeamGrid() {
    if (this.isGeneratingGrid) {
      console.log("DEBUG: generateTeamGrid already in progress, skipping...");
      return;
    }

    this.isGeneratingGrid = true;
    console.log("DEBUG: Starting enhanced generateTeamGrid()");

    const teamGrid = document.getElementById("teamGrid");
    if (!teamGrid) {
      console.error("Team grid element not found");
      this.isGeneratingGrid = false;
      return;
    }

    try {
      // Show loading state
      window.DOMHelpers.showComponentLoading("Team Roster", 0);

      // Clear existing content
      teamGrid.innerHTML = "";

      // Get all players from database service
      window.DOMHelpers.updateLoadingMessage("Fetching player data...");
      const players = await window.DatabaseService.getPlayers();

      console.log("DEBUG: Raw players from database:", players);
      console.log("DEBUG: Number of players from database:", players.length);

      // Store all players for filtering
      this.allPlayers = players;
      this.filteredPlayers = [...players];

      if (players.length === 0) {
        teamGrid.innerHTML =
          '<div class="no-players">No players found in the team roster.</div>';
        window.DOMHelpers.hideLoadingScreen();
        return;
      }

      this.updateStatsDisplay();

      // Update loading progress
      window.DOMHelpers.updateLoadingMessage(
        "Creating enhanced player cards..."
      );
      window.DOMHelpers.updateLoadingProgress(50);

      // Create enhanced player cards
      this.renderPlayerCards(players);

      // Update loading progress
      window.DOMHelpers.updateLoadingMessage("Finalizing team roster...");
      window.DOMHelpers.updateLoadingProgress(100);

      console.log(`Generated ${players.length} enhanced player cards`);

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
      console.log("DEBUG: Finished enhanced generateTeamGrid()");
    }
  },

  /**
   * Create enhanced player card element
   */
  createEnhancedPlayerCard(player, index) {
    const playerCard = document.createElement("div");
    playerCard.className = "player-card";

    // Create country flag avatar
    const avatarElement = this.createCountryFlagAvatar(
      player.country,
      player.player_name || "Unknown Player"
    );

    playerCard.innerHTML = `
      <div class="player-card__header">
        <div class="player-card__info">
          <div class="player-card__avatar"></div>
          <div class="player-card__details">
            <div class="player-card__name">${
              player.player_name || "Unknown Player"
            }</div>
            <div class="player-card__position" data-position="${
              player.position || "Unknown"
            }">${player.position || "Unknown Position"}</div>
          </div>
        </div>
        <div class="player-card__overall">${player.overall || "N/A"}</div>
      </div>
      <div class="player-card__stats">
        <div class="player-card__stat">
          <div class="player-card__stat-value">${player.attack || "N/A"}</div>
          <div class="player-card__stat-label">ATT</div>
        </div>
        <div class="player-card__stat">
          <div class="player-card__stat-value">${player.defense || "N/A"}</div>
          <div class="player-card__stat-label">DEF</div>
        </div>
        <div class="player-card__stat">
          <div class="player-card__stat-value">${player.serve || "N/A"}</div>
          <div class="player-card__stat-label">SRV</div>
        </div>
        <div class="player-card__stat">
          <div class="player-card__stat-value">${player.block || "N/A"}</div>
          <div class="player-card__stat-label">BLK</div>
        </div>
        <div class="player-card__stat">
          <div class="player-card__stat-value">${player.receive || "N/A"}</div>
          <div class="player-card__stat-label">RCV</div>
        </div>
        <div class="player-card__stat">
          <div class="player-card__stat-value">${player.setting || "N/A"}</div>
          <div class="player-card__stat-label">SET</div>
        </div>
      </div>
    `;

    // Insert the avatar element into the avatar container
    const avatarContainer = playerCard.querySelector(".player-card__avatar");
    avatarContainer.appendChild(avatarElement);

    // Add click event listener to show player details
    playerCard.addEventListener("click", () => {
      this.showPlayerDetails(player);
    });

    return playerCard;
  },

  /**
   * Get player initials for avatar (fallback)
   */
  getPlayerInitials(name) {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  },

  /**
   * Get country flag image path for player avatar
   */
  getCountryFlagPath(country) {
    if (!country) {
      return null;
    }

    // Clean country name to match file naming convention
    const cleanCountry = country.trim();

    // Check if flag file exists by attempting to construct the path
    const flagPath = `database/flags/${cleanCountry}.png`;

    return flagPath;
  },

  /**
   * Create country flag avatar element
   */
  createCountryFlagAvatar(country, playerName) {
    const flagPath = this.getCountryFlagPath(country);

    if (flagPath) {
      const img = document.createElement("img");
      img.src = flagPath;
      img.alt = `${country} flag`;
      img.className = "player-card__flag-avatar";
      img.onerror = () => {
        // Fallback to initials if flag fails to load
        img.style.display = "none";
        const fallbackDiv = document.createElement("div");
        fallbackDiv.className = "player-card__avatar-fallback";
        fallbackDiv.textContent = this.getPlayerInitials(playerName);
        img.parentNode.appendChild(fallbackDiv);
      };
      return img;
    }

    // Fallback to initials if no country
    const fallbackDiv = document.createElement("div");
    fallbackDiv.className = "player-card__avatar-fallback";
    fallbackDiv.textContent = this.getPlayerInitials(playerName);
    return fallbackDiv;
  },

  /**
   * Render player cards to the grid
   */
  renderPlayerCards(players) {
    const teamGrid = document.getElementById("teamGrid");
    if (!teamGrid) return;

    // Clear existing content
    teamGrid.innerHTML = "";

    if (players.length === 0) {
      teamGrid.innerHTML =
        '<div class="no-players">No players match your current filters.</div>';
      return;
    }

    // Create enhanced player cards
    players.forEach((player, index) => {
      const playerCard = this.createEnhancedPlayerCard(player, index);
      teamGrid.appendChild(playerCard);
    });
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
   * Apply filters and search
   */
  applyFiltersAndSearch() {
    let filtered = [...this.allPlayers];

    if (this.currentFilter !== "all") {
      filtered = filtered.filter(
        (player) => player.position === this.currentFilter
      );
    }

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (player) =>
          (player.player_name || "").toLowerCase().includes(searchLower) ||
          (player.position || "").toLowerCase().includes(searchLower)
      );
    }

    filtered = this.sortPlayers(
      filtered,
      this.currentSort,
      this.currentSortDirection === "desc"
    );

    this.filteredPlayers = filtered;
    this.renderPlayerCards(filtered);
    this.updateStatsDisplay();
  },

  /**
   * Sort players array
   */
  sortPlayers(players, attribute, descending = true) {
    return [...players].sort((a, b) => {
      let aVal = a[attribute] || 0;
      let bVal = b[attribute] || 0;

      if (attribute === "player_name") {
        aVal = (a.player_name || "").toLowerCase();
        bVal = (b.player_name || "").toLowerCase();
        return descending ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }

      // Numeric sorting
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return descending ? bVal - aVal : aVal - bVal;
    });
  },

  /**
   * Toggle sort direction
   */
  toggleSort() {
    this.currentSortDirection =
      this.currentSortDirection === "desc" ? "asc" : "desc";
    const sortButton = document.getElementById("sortButton");
    if (sortButton) {
      const arrow = sortButton.querySelector("span:last-child");
      arrow.textContent = this.currentSortDirection === "desc" ? "↓" : "↑";
    }
    this.applyFiltersAndSearch();
  },

  /**
   * Update stats display
   */
  updateStatsDisplay() {
    const totalPlayersEl = document.getElementById("totalPlayers");
    const averageRatingEl = document.getElementById("averageRating");
    const activeFiltersEl = document.getElementById("activeFilters");

    if (totalPlayersEl) {
      totalPlayersEl.textContent = this.filteredPlayers.length;
    }

    if (averageRatingEl && this.filteredPlayers.length > 0) {
      const avgRating =
        this.filteredPlayers.reduce(
          (sum, player) => sum + (Number(player.overall) || 0),
          0
        ) / this.filteredPlayers.length;
      averageRatingEl.textContent = Math.round(avgRating);
    }

    if (activeFiltersEl) {
      let filterText =
        this.currentFilter === "all" ? "All Players" : this.currentFilter;
      if (this.searchTerm.trim()) {
        filterText += ` (Search: "${this.searchTerm}")`;
      }
      activeFiltersEl.textContent = filterText;
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
   * Reset all filters and search
   */
  async resetFilters() {
    try {
      this.currentFilter = "all";
      this.currentSort = "overall";
      this.currentSortDirection = "desc";
      this.searchTerm = "";

      // Reset UI elements
      const searchInput = document.getElementById("playerSearch");
      if (searchInput) searchInput.value = "";

      const filterButtons = document.querySelectorAll(".filter-button");
      filterButtons.forEach((btn) =>
        btn.classList.remove("filter-button--active")
      );
      const allButton = document.querySelector(
        '.filter-button[data-position="all"]'
      );
      if (allButton) allButton.classList.add("filter-button--active");

      // Regenerate team grid
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
