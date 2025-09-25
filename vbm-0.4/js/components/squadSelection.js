/**
 * Squad Selection Component - Handles starting lineup and bench player management
 *
 * This component manages the squad selection interface for displaying
 * available players, starting positions, and bench slots.
 * It provides a comprehensive squad management system.
 *
 * @fileoverview Squad selection component for player management
 * @author Volleyball Manager Team
 * @version 0.2.0
 */

/**
 * SquadSelection component object
 *
 * This object contains all functionality for managing squad selection,
 * including position validation and squad management.
 */
const SquadSelection = {
  // Squad position requirements (7 starting positions)
  squadPositions: [
    "Outside Hitter",
    "Middle Blocker",
    "Setter",
    "Outside Hitter",
    "Middle Blocker",
    "Opposite Hitter",
    "Libero",
  ],

  // Component state
  isInitialized: false,
  isPopulatingPlayers: false,

  // Filter state
  currentFilter: "all",
  searchTerm: "",
  allPlayers: [],
  filteredPlayers: [],

  /**
   * Initialize the squad selection component
   *
   * This function sets up the squad selection interface and populates
   * the available players list.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Prevent double initialization
      if (this.isInitialized) {
        console.log(
          "Squad Selection component already initialized, skipping..."
        );
        return;
      }

      console.log("Initializing Squad Selection component...");

      // Show loading screen for squad selection
      window.DOMHelpers.showComponentLoading("Squad Selection", 0);

      // Initialize the squad selection interface
      await this.initializeSquadSelection();

      this.isInitialized = true;
      console.log("Squad Selection component initialized successfully");

      // Hide loading screen after successful initialization
      window.DOMHelpers.hideLoadingScreen();
    } catch (error) {
      console.error("Error initializing Squad Selection:", error);
      // Hide loading screen on error
      window.DOMHelpers.hideLoadingScreen();
      // Show error notification
      window.DOMHelpers.showNotification(
        "Error loading squad selection",
        "error"
      );
      throw error;
    }
  },

  /**
   * Initialize squad selection interface
   *
   * This function creates the starting positions, bench slots, and available
   * players sections.
   *
   * @returns {Promise<void>}
   */
  async initializeSquadSelection() {
    try {
      // Update loading progress - creating positions
      window.DOMHelpers.updateLoadingMessage("Setting up squad positions...");
      window.DOMHelpers.updateLoadingProgress(20);

      // Create starting positions
      this.createStartingPositions();

      // Update loading progress - creating bench slots
      window.DOMHelpers.updateLoadingMessage("Setting up bench slots...");
      window.DOMHelpers.updateLoadingProgress(40);

      // Create bench slots
      this.createBenchSlots();

      // Update loading progress - loading players
      window.DOMHelpers.updateLoadingMessage("Loading players...");
      window.DOMHelpers.updateLoadingProgress(60);

      // Populate available players
      await this.populateAvailablePlayers();

      // Update loading progress - setting up interactions
      window.DOMHelpers.updateLoadingMessage("Setting up interactions...");
      window.DOMHelpers.updateLoadingProgress(80);

      // Update loading progress - setting up filters
      window.DOMHelpers.updateLoadingMessage("Setting up player filters...");
      window.DOMHelpers.updateLoadingProgress(85);

      // Set up filter functionality
      this.setupFilterControls();

      // Update loading progress - loading saved selections
      window.DOMHelpers.updateLoadingMessage(
        "Loading saved squad selections..."
      );
      window.DOMHelpers.updateLoadingProgress(90);

      // Load saved squad selections
      await this.loadSavedSquadSelections();

      // Update loading progress - complete
      window.DOMHelpers.updateLoadingMessage("Squad selection ready!");
      window.DOMHelpers.updateLoadingProgress(100);
    } catch (error) {
      console.error("Error initializing squad selection interface:", error);
      throw error;
    }
  },

  /**
   * Create starting position slots
   *
   * This function creates the 7 starting position slots with appropriate
   * labels.
   *
   * @returns {void}
   */
  createStartingPositions() {
    const startingPositions = document.getElementById("startingPositions");
    if (!startingPositions) {
      console.error("Starting positions element not found");
      return;
    }

    // Clear existing content
    startingPositions.innerHTML = "";

    // Create position slots for each required position
    this.squadPositions.forEach((position, index) => {
      const slot = document.createElement("div");
      slot.className = "position-slot-modern";
      slot.dataset.position = index;
      slot.dataset.requiredPosition = position;
      slot.innerHTML = `
                <div class="position-slot-label-modern">${position}</div>
                <div class="position-slot-player-modern" id="starting-${index}"></div>
            `;

      // Position slots are now static (no drag and drop)

      startingPositions.appendChild(slot);
    });
  },

  /**
   * Create bench slots
   *
   * This function creates the bench slots for substitute players
   * with appropriate labels.
   *
   * @returns {void}
   */
  createBenchSlots() {
    const benchSlots = document.getElementById("benchSlots");
    if (!benchSlots) {
      console.error("Bench slots element not found");
      return;
    }

    // Clear existing content
    benchSlots.innerHTML = "";

    // Create 9 bench slots
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement("div");
      slot.className = "bench-slot-modern";
      slot.dataset.bench = i;
      slot.innerHTML = `
                <div class="bench-slot-player-modern" id="bench-${i}"></div>
            `;

      // Bench slots are now static (no drag and drop)

      benchSlots.appendChild(slot);
    }
  },

  /**
   * Populate the available players list
   *
   * This function creates player cards for all available players.
   *
   * @returns {Promise<void>}
   */
  async populateAvailablePlayers() {
    // Prevent multiple simultaneous calls
    if (this.isPopulatingPlayers) {
      console.log(
        "DEBUG SquadSelection: populateAvailablePlayers already in progress, skipping..."
      );
      return;
    }

    this.isPopulatingPlayers = true;
    console.log("DEBUG SquadSelection: Starting populateAvailablePlayers()");

    const availablePlayers = document.getElementById("availablePlayers");
    if (!availablePlayers) {
      console.error("Available players element not found");
      this.isPopulatingPlayers = false;
      return;
    }

    try {
      // Show loading state in the available players section
      availablePlayers.innerHTML =
        '<div class="loading-placeholder">Loading players...</div>';

      // Get players from the user's team
      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        throw new Error("No user team found");
      }

      const players = await window.DatabaseService.getPlayersByTeam(
        userTeam.id
      );

      console.log(
        "DEBUG SquadSelection: Available players from database:",
        players
      );
      console.log(
        "DEBUG SquadSelection: Number of available players from database:",
        players.length
      );

      // Store players for filtering
      this.allPlayers = players || [];
      this.filteredPlayers = [...this.allPlayers];

      // Clear loading state
      availablePlayers.innerHTML = "";

      if (!players || players.length === 0) {
        availablePlayers.innerHTML =
          '<div class="no-players">No players available</div>';
        this.isPopulatingPlayers = false;
        return;
      }

      // Create player cards
      this.renderFilteredPlayers();

      console.log(
        "DEBUG SquadSelection: Final availablePlayers children count:",
        availablePlayers.children.length
      );
    } catch (error) {
      console.error("Error populating available players:", error);
      availablePlayers.innerHTML =
        '<div class="error-message">Error loading players. Please try again.</div>';
    } finally {
      this.isPopulatingPlayers = false;
      console.log("DEBUG SquadSelection: Finished populateAvailablePlayers()");
    }
  },

  /**
   * Create a player card
   *
   * This function creates a player card for display in the available players section.
   *
   * @param {Object} player - Player object
   * @param {number} index - Player index
   * @returns {HTMLElement} - Player card element
   */
  createPlayerCard(player, index) {
    const playerCard = document.createElement("div");
    playerCard.className = "available-player-card-modern";
    playerCard.dataset.playerId = player.id;
    playerCard.dataset.playerPosition = player.position;

    const initials = this.getPlayerInitials(
      player.player_name || "Unknown Player"
    );

    playerCard.innerHTML = `
            <div class="available-player-avatar-modern">${initials}</div>
            <div class="available-player-info-modern">
                <div class="available-player-name-modern">${
                  player.player_name || "Unknown Player"
                }</div>
                <div class="available-player-position-modern" data-position="${
                  player.position || "Unknown"
                }">${player.position || "Unknown Position"}</div>
            </div>
            <div class="available-player-overall-modern">${
              player.overall || "N/A"
            }</div>
        `;

    // Add click event listener to show action buttons (only if not already added)
    if (!playerCard.hasAttribute("data-click-listener-added")) {
      playerCard.addEventListener("click", () => {
        this.showPlayerActionButtons(playerCard, player);
      });
      playerCard.setAttribute("data-click-listener-added", "true");
    }

    return playerCard;
  },

  /**
   * Get player initials for avatar
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
   * Show action buttons for player card
   *
   * @param {HTMLElement} playerCard - The player card element
   * @param {Object} player - Player object
   * @returns {void}
   */
  showPlayerActionButtons(playerCard, player) {
    // Check if buttons are already shown
    if (playerCard.querySelector(".player-action-buttons")) {
      return;
    }

    // Store original content if not already stored
    if (!playerCard.dataset.originalContent) {
      playerCard.dataset.originalContent = playerCard.innerHTML;
    }

    // Create action buttons using document fragments for better performance
    const fragment = document.createDocumentFragment();
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "player-action-buttons";

    const starterBtn = document.createElement("button");
    starterBtn.className = "player-action-btn player-action-btn--starter";
    starterBtn.textContent = "STARTER";
    starterBtn.dataset.action = "starter";
    starterBtn.dataset.playerId = player.id;

    const benchBtn = document.createElement("button");
    benchBtn.className = "player-action-btn player-action-btn--bench";
    benchBtn.textContent = "BENCH";
    benchBtn.dataset.action = "bench";
    benchBtn.dataset.playerId = player.id;

    buttonContainer.appendChild(starterBtn);
    buttonContainer.appendChild(benchBtn);
    fragment.appendChild(buttonContainer);

    // Use event delegation for better performance
    const handleButtonClick = (e) => {
      e.stopPropagation();
      const target = e.target;
      if (target.classList.contains("player-action-btn--starter")) {
        this.addPlayerToStarter(player);
      } else if (target.classList.contains("player-action-btn--bench")) {
        this.addPlayerToBench(player);
      }
    };

    const handleCardClick = (e) => {
      // Only restore if clicking on the card container itself, not on buttons
      if (
        e.target === playerCard ||
        e.target.classList.contains("player-action-buttons")
      ) {
        this.restorePlayerCard(playerCard, player);
      }
    };

    // Store event handlers for cleanup
    playerCard._buttonClickHandler = handleButtonClick;
    playerCard._cardClickHandler = handleCardClick;

    // Add event listeners
    buttonContainer.addEventListener("click", handleButtonClick);
    playerCard.addEventListener("click", handleCardClick);

    // Replace content efficiently
    playerCard.innerHTML = "";
    playerCard.appendChild(fragment);
  },

  restorePlayerCard(playerCard, player) {
    // Restore original content
    playerCard.innerHTML = playerCard.dataset.originalContent;

    // Clean up event listeners
    if (playerCard._buttonClickHandler) {
      playerCard.removeEventListener("click", playerCard._buttonClickHandler);
      delete playerCard._buttonClickHandler;
    }
    if (playerCard._cardClickHandler) {
      playerCard.removeEventListener("click", playerCard._cardClickHandler);
      delete playerCard._cardClickHandler;
    }

    // Re-add the original click listener (only if not already added)
    if (!playerCard.hasAttribute("data-click-listener-added")) {
      playerCard.addEventListener("click", () => {
        this.showPlayerActionButtons(playerCard, player);
      });
      playerCard.setAttribute("data-click-listener-added", "true");
    }
  },

  /**
   * Add player to starting 7
   *
   * @param {Object} player - Player object
   * @returns {void}
   */
  addPlayerToStarter(player) {
    // Find the first available starting position that matches the player's position
    let targetSlot = null;
    let targetIndex = -1;

    for (let i = 0; i < this.squadPositions.length; i++) {
      const slot = document.getElementById(`starting-${i}`);
      const isOccupied = slot?.classList.contains(
        "position-slot-modern--occupied"
      );

      // Check if this position matches the player's position and is not occupied
      if (!isOccupied && this.squadPositions[i] === player.position) {
        targetSlot = slot;
        targetIndex = i;
        break;
      }
    }

    // If no matching position found, find any empty slot
    if (!targetSlot) {
      for (let i = 0; i < this.squadPositions.length; i++) {
        const slot = document.getElementById(`starting-${i}`);
        const isOccupied = slot?.classList.contains(
          "position-slot-modern--occupied"
        );

        if (!isOccupied) {
          targetSlot = slot;
          targetIndex = i;
          break;
        }
      }
    }

    if (targetSlot) {
      this.placePlayerInStartingPosition(
        targetSlot,
        player,
        player.id,
        this.squadPositions[targetIndex]
      );
      this.updateAvailablePlayerVisibility(player.id, false);
      this.saveSquadSelections();
    } else {
      alert("No available starting positions!");
    }
  },

  /**
   * Add player to bench
   *
   * @param {Object} player - Player object
   * @returns {void}
   */
  addPlayerToBench(player) {
    // Find the first available bench slot
    let targetSlot = null;
    let targetIndex = -1;

    for (let i = 0; i < 9; i++) {
      const slot = document.getElementById(`bench-${i}`);
      const isOccupied = slot?.classList.contains(
        "bench-slot-modern--occupied"
      );

      if (!isOccupied) {
        targetSlot = slot;
        targetIndex = i;
        break;
      }
    }

    if (targetSlot) {
      this.placePlayerOnBench(targetSlot, player, player.id, player.position);
      this.updateAvailablePlayerVisibility(player.id, false);
      this.saveSquadSelections();
    } else {
      alert("No available bench slots!");
    }
  },

  /**
   * Place a player in a starting position slot
   *
   * @param {HTMLElement} slot - Position slot element
   * @param {Object} player - Player object
   * @param {number} playerId - Player ID
   * @param {string} position - Player position
   * @returns {void}
   */
  placePlayerInStartingPosition(slot, player, playerId, position) {
    const playerSlot = slot.querySelector(".position-slot-player-modern");
    if (!playerSlot) return;

    const initials = this.getPlayerInitials(
      player.player_name || "Unknown Player"
    );

    playerSlot.innerHTML = `
      <div class="placed-player">
        <div class="position-slot-player-avatar-modern">${initials}</div>
        <div class="position-slot-player-info-modern">
          <div class="position-slot-player-name-modern">${
            player.player_name || "Unknown Player"
          }</div>
          <div class="position-slot-player-position-modern" data-position="${
            position || "Unknown"
          }">${position || "Unknown"}</div>
        </div>
        <div class="position-slot-player-overall-modern">${
          player.overall || "N/A"
        }</div>
      </div>
    `;

    playerSlot.dataset.playerId = playerId;
    slot.classList.add("position-slot-modern--occupied");
  },

  /**
   * Place a player on a bench slot
   *
   * @param {HTMLElement} slot - Bench slot element
   * @param {Object} player - Player object
   * @param {number} playerId - Player ID
   * @param {string} position - Player position
   * @returns {void}
   */
  placePlayerOnBench(slot, player, playerId, position) {
    const playerSlot = slot.querySelector(".bench-slot-player-modern");
    if (!playerSlot) return;

    const initials = this.getPlayerInitials(
      player.player_name || "Unknown Player"
    );

    playerSlot.innerHTML = `
      <div class="placed-player">
        <div class="bench-slot-player-avatar-modern">${initials}</div>
        <div class="bench-slot-player-info-modern">
          <div class="bench-slot-player-name-modern">${
            player.player_name || "Unknown Player"
          }</div>
          <div class="bench-slot-player-position-modern" data-position="${
            position || "Unknown"
          }">${position || "Unknown"}</div>
        </div>
        <div class="bench-slot-player-overall-modern">${
          player.overall || "N/A"
        }</div>
      </div>
    `;

    playerSlot.dataset.playerId = playerId;
    slot.classList.add("bench-slot-modern--occupied");
  },

  /**
   * Update visibility of a player in the available players list
   *
   * @param {number} playerId - Player ID
   * @param {boolean} isVisible - Whether the player should be visible
   * @returns {void}
   */
  updateAvailablePlayerVisibility(playerId, isVisible) {
    const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
    if (playerCard) {
      playerCard.style.display = isVisible ? "block" : "none";
    }
  },

  /**
   * Update visibility of all available players based on current squad
   *
   * @returns {void}
   */
  updateAllAvailablePlayerVisibility() {
    // Get all players currently in starting positions
    const startingPlayers = [];
    for (let i = 0; i < this.squadPositions.length; i++) {
      const slot = document.getElementById(`starting-${i}`);
      const playerElement = slot?.querySelector(".placed-player");
      if (playerElement) {
        startingPlayers.push(parseInt(playerElement.dataset.playerId));
      }
    }

    // Get all players currently on bench
    const benchPlayers = [];
    for (let i = 0; i < 9; i++) {
      const slot = document.getElementById(`bench-${i}`);
      const playerElement = slot?.querySelector(".placed-player");
      if (playerElement) {
        benchPlayers.push(parseInt(playerElement.dataset.playerId));
      }
    }

    // Hide players that are already in the squad
    const allSquadPlayers = [...startingPlayers, ...benchPlayers];
    this.allPlayers.forEach((player) => {
      const isInSquad = allSquadPlayers.includes(player.id);
      this.updateAvailablePlayerVisibility(player.id, !isInSquad);
    });
  },

  /**
   * Save current squad selections to database
   *
   * This function saves the current squad configuration to the database.
   * Since position_status columns have been removed, this now just logs
   * the current squad configuration for debugging purposes.
   *
   * @returns {Promise<void>}
   */
  async saveSquadSelections() {
    try {
      const squad = await this.getCurrentSquad();

      // Log the current squad configuration
      console.log("Current squad configuration:", squad);

      // TODO: Implement squad saving logic when database structure is finalized
      // For now, we'll just store the configuration in local storage as a backup
      localStorage.setItem("squadSelection", JSON.stringify(squad));

      console.log("Squad selections saved successfully");
    } catch (error) {
      console.error("Error saving squad selections:", error);
    }
  },

  /**
   * Load saved squad selections from local storage
   *
   * This function loads previously saved squad selections from local storage
   * since position_status columns have been removed from the database.
   *
   * @returns {Promise<void>}
   */
  async loadSavedSquadSelections() {
    try {
      console.log("Loading squad selections from local storage...");

      // Try to load from local storage
      const savedSquad = localStorage.getItem("squadSelection");
      if (!savedSquad) {
        console.log("No saved squad selections found");
        return;
      }

      const squad = JSON.parse(savedSquad);
      console.log("Loaded squad from local storage:", squad);

      // Restore starting players to their positions
      for (let i = 0; i < squad.starting.length; i++) {
        const pos = squad.starting[i];
        if (pos.playerId) {
          await this.restorePlayerToStartingPositionByIndex(i, pos.playerId);
        }
      }

      // Restore bench players to their slots
      for (let i = 0; i < squad.bench.length; i++) {
        const bench = squad.bench[i];
        if (bench.playerId) {
          await this.restorePlayerToBenchByIndex(i, bench.playerId);
        }
      }

      console.log("Squad selections loaded successfully from local storage");
    } catch (error) {
      console.error("Error loading saved squad selections:", error);
    }
  },

  /**
   * Restore a player to a starting position by position index
   *
   * @param {number} positionIndex - Position index (0-6)
   * @param {number} playerId - Player ID
   * @returns {Promise<void>}
   */
  async restorePlayerToStartingPositionByIndex(positionIndex, playerId) {
    try {
      const slot = document.querySelector(`[data-position="${positionIndex}"]`);
      if (!slot) {
        console.error("Position slot not found:", positionIndex);
        return;
      }

      // Get player data
      const player = await window.DatabaseService.getPlayerById(playerId);
      if (!player) {
        console.error("Player not found:", playerId);
        return;
      }

      // Place player in starting position
      this.placePlayerInStartingPosition(
        slot,
        player,
        playerId,
        player.position
      );

      // Hide player from available list
      this.updateAvailablePlayerVisibility(playerId, false);
    } catch (error) {
      console.error("Error restoring player to starting position:", error);
    }
  },

  /**
   * Restore a player to a starting position by position name (legacy method)
   *
   * @param {string} position - Position name
   * @param {number} playerId - Player ID
   * @returns {Promise<void>}
   */
  async restorePlayerToStartingPosition(position, playerId) {
    try {
      // Find the position slot
      const positionIndex = this.squadPositions.indexOf(position);
      if (positionIndex === -1) {
        console.error("Invalid position:", position);
        return;
      }

      await this.restorePlayerToStartingPositionByIndex(
        positionIndex,
        playerId
      );
    } catch (error) {
      console.error("Error restoring player to starting position:", error);
    }
  },

  /**
   * Restore a player to a bench slot by bench index
   *
   * @param {number} benchIndex - Bench slot index (0-8)
   * @param {number} playerId - Player ID
   * @returns {Promise<void>}
   */
  async restorePlayerToBenchByIndex(benchIndex, playerId) {
    try {
      const slot = document.querySelector(`[data-bench="${benchIndex}"]`);
      if (!slot) {
        console.error("Bench slot not found:", benchIndex);
        return;
      }

      // Get player data
      const player = await window.DatabaseService.getPlayerById(playerId);
      if (!player) {
        console.error("Player not found:", playerId);
        return;
      }

      // Place player on bench
      this.placePlayerOnBench(slot, player, playerId, player.position);

      // Hide player from available list
      this.updateAvailablePlayerVisibility(playerId, false);
    } catch (error) {
      console.error("Error restoring player to bench:", error);
    }
  },

  /**
   * Restore a player to a bench slot (legacy method)
   *
   * @param {number} benchIndex - Bench slot index
   * @param {number} playerId - Player ID
   * @returns {Promise<void>}
   */
  async restorePlayerToBench(benchIndex, playerId) {
    try {
      await this.restorePlayerToBenchByIndex(benchIndex, playerId);
    } catch (error) {
      console.error("Error restoring player to bench:", error);
    }
  },

  /**
   * Get current squad configuration
   *
   * This function returns the current state of the squad selection,
   * including starting players and bench players.
   *
   * @returns {Object} - Current squad configuration
   */
  async getCurrentSquad() {
    const starting = [];
    const bench = [];

    // Get starting players
    for (let i = 0; i < this.squadPositions.length; i++) {
      const slot = document.getElementById(`starting-${i}`);
      const playerElement = slot?.querySelector(".placed-player");
      if (playerElement) {
        const playerId = playerElement.dataset.playerId;
        const player = await window.DatabaseService.getPlayerById(
          parseInt(playerId)
        );
        starting.push({
          position: this.squadPositions[i],
          playerId: parseInt(playerId),
          player: player,
        });
      } else {
        starting.push({
          position: this.squadPositions[i],
          playerId: null,
          player: null,
        });
      }
    }

    // Get bench players
    for (let i = 0; i < 9; i++) {
      const slot = document.getElementById(`bench-${i}`);
      const playerElement = slot?.querySelector(".placed-player");
      if (playerElement) {
        const playerId = playerElement.dataset.playerId;
        const player = await window.DatabaseService.getPlayerById(
          parseInt(playerId)
        );
        bench.push({
          playerId: parseInt(playerId),
          player: player,
        });
      }
    }

    return { starting, bench };
  },

  /**
   * Validate current squad setup
   *
   * This function checks if the current squad setup is valid and complete.
   *
   * @returns {Promise<Object>} - Validation result with errors if any
   */
  async validateSquad() {
    const squad = await this.getCurrentSquad();
    const errors = [];

    // Check if all starting positions are filled
    squad.starting.forEach((pos, index) => {
      if (!pos.player) {
        errors.push(`${pos.position} position is empty`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Clear all squad selections
   *
   * This function removes all players from the squad and clears local storage.
   *
   * @returns {Promise<void>}
   */
  async clearSquad() {
    try {
      // Clear local storage
      localStorage.removeItem("squadSelection");

      // Clear all starting positions
      for (let i = 0; i < this.squadPositions.length; i++) {
        const slot = document.querySelector(`[data-position="${i}"]`);
        if (slot) {
          const playerSlot = slot.querySelector(".position-slot-player-modern");
          if (playerSlot) {
            playerSlot.innerHTML = "";
          }
          slot.classList.remove("position-slot-modern--occupied");
        }
      }

      // Clear all bench slots
      for (let i = 0; i < 9; i++) {
        const slot = document.querySelector(`[data-bench="${i}"]`);
        if (slot) {
          const playerSlot = slot.querySelector(".bench-slot-player-modern");
          if (playerSlot) {
            playerSlot.innerHTML = "";
          }
          slot.classList.remove("bench-slot-modern--occupied");
        }
      }

      // Refresh available players to show all players
      await this.populateAvailablePlayers();

      console.log("Squad cleared successfully");
    } catch (error) {
      console.error("Error clearing squad:", error);
      window.DOMHelpers.showNotification("Error clearing squad", "error");
    }
  },

  /**
   * Setup filter controls
   *
   * This function sets up the search and filter functionality
   * for the available players section.
   *
   * @returns {void}
   */
  setupFilterControls() {
    // Search input
    const searchInput = document.getElementById("squadPlayerSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value;
        this.applyFiltersAndSearch();
      });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll(".squad-filter-button");
    filterButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        // Remove active class from all buttons
        filterButtons.forEach((btn) =>
          btn.classList.remove("squad-filter-button--active")
        );
        // Add active class to clicked button
        e.target.classList.add("squad-filter-button--active");

        this.currentFilter = e.target.dataset.position;
        this.applyFiltersAndSearch();
      });
    });

    console.log("Squad filter controls setup complete");
  },

  /**
   * Apply filters and search to available players
   *
   * This function filters the available players based on the current
   * search term and position filter.
   *
   * @returns {void}
   */
  applyFiltersAndSearch() {
    let filtered = [...this.allPlayers];

    // Apply position filter
    if (this.currentFilter !== "all") {
      filtered = filtered.filter(
        (player) => player.position === this.currentFilter
      );
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (player) =>
          (player.player_name || "").toLowerCase().includes(searchLower) ||
          (player.position || "").toLowerCase().includes(searchLower)
      );
    }

    this.filteredPlayers = filtered;
    this.renderFilteredPlayers();
  },

  /**
   * Render filtered players to the available players grid
   *
   * This function renders the filtered players to the available players
   * section and updates visibility of players that are already in the squad.
   *
   * @returns {void}
   */
  renderFilteredPlayers() {
    const availablePlayers = document.getElementById("availablePlayers");
    if (!availablePlayers) return;

    // Clear existing content
    availablePlayers.innerHTML = "";

    if (this.filteredPlayers.length === 0) {
      availablePlayers.innerHTML =
        '<div class="no-players">No players match your current filters.</div>';
      return;
    }

    // Create player cards
    this.filteredPlayers.forEach((player, index) => {
      console.log(
        `DEBUG SquadSelection: Creating card ${index} for player:`,
        player.player_name,
        "ID:",
        player.id
      );
      const playerCard = this.createPlayerCard(player, index);
      availablePlayers.appendChild(playerCard);
    });

    // Player cards are now static

    console.log(
      "DEBUG SquadSelection: Final availablePlayers children count:",
      availablePlayers.children.length
    );
  },
};

// Export to global scope for use throughout the application
window.SquadSelection = SquadSelection;
