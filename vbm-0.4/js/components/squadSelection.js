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

  // Enhanced state management following recommended pattern
  state: {
    // All players from database
    allPlayers: [],
    // Players available for selection (not in squad)
    availablePlayers: [],
    // Starting lineup (7 positions)
    starters: new Array(7).fill(null),
    // Bench players (9 slots)
    bench: new Array(9).fill(null),
    // Filter state
    currentFilter: "all",
    searchTerm: "",
  },

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

      // Show loading screen for squad selection with timeout
      window.DOMHelpers.showComponentLoading("Squad Selection", 0);

      // Set up a timeout to force hide loading screen if it gets stuck
      const loadingTimeout = setTimeout(() => {
        console.warn(
          "Squad Selection initialization timeout, force hiding loading screen"
        );
        window.DOMHelpers.forceHideLoadingScreen();
        window.DOMHelpers.showNotification(
          "Squad selection loading timed out. Please try again.",
          "error"
        );
      }, 25000); // 25 second timeout

      try {
        // Initialize the squad selection interface
        await this.initializeSquadSelection();

        this.isInitialized = true;
        console.log("Squad Selection component initialized successfully");

        // Clear timeout and hide loading screen after successful initialization
        clearTimeout(loadingTimeout);
        window.DOMHelpers.hideLoadingScreen();
      } catch (error) {
        clearTimeout(loadingTimeout);
        throw error;
      }
    } catch (error) {
      console.error("Error initializing Squad Selection:", error);
      // Hide loading screen on error
      window.DOMHelpers.forceHideLoadingScreen();
      // Show error notification
      window.DOMHelpers.showNotification(
        "Error loading squad selection. Please try again.",
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
   * labels and drag and drop functionality.
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

      // Only show label for libero position (index 2)
      const labelHtml =
        position === "Libero"
          ? `<div class="position-slot-label-modern position-slot-label-modern--libero">${position}</div>`
          : "";

      slot.innerHTML = `
                ${labelHtml}
                <div class="position-slot-player-modern" id="starting-${index}"></div>
            `;

      // Add drag and drop functionality
      this.setupDragAndDropForSlot(slot, "starter", index);

      startingPositions.appendChild(slot);
    });
  },

  /**
   * Create bench slots
   *
   * This function creates the bench slots for substitute players
   * with appropriate labels and drag and drop functionality.
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

      // Add drag and drop functionality
      this.setupDragAndDropForSlot(slot, "bench", i);

      benchSlots.appendChild(slot);
    }
  },

  /**
   * Load all players from database and initialize state
   */
  async loadPlayers() {
    try {
      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        throw new Error("No user team found");
      }

      const players = await window.DatabaseService.getPlayersByTeam(
        userTeam.id
      );
      console.log("Loaded players from database:", players);

      // Initialize state with all players
      this.state.allPlayers = players || [];
      this.state.availablePlayers = [...this.state.allPlayers];

      // Initialize empty starters and bench arrays
      this.state.starters = new Array(7).fill(null);
      this.state.bench = new Array(9).fill(null);

      this.renderAvailablePlayers();
    } catch (error) {
      console.error("Error loading players:", error);
      throw error;
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

      // Load players and initialize state
      await this.loadPlayers();

      // Clear loading state
      availablePlayers.innerHTML = "";

      if (!this.state.allPlayers || this.state.allPlayers.length === 0) {
        availablePlayers.innerHTML =
          '<div class="no-players">No players available</div>';
        this.isPopulatingPlayers = false;
        return;
      }

      // Create player cards
      this.renderAvailablePlayers();

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

    // Create country flag avatar
    const avatarElement = this.createCountryFlagAvatar(
      player.country,
      player.player_name || "Unknown Player"
    );

    playerCard.innerHTML = `
            <div class="available-player-avatar-modern"></div>
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

    // Insert the avatar element into the avatar container
    const avatarContainer = playerCard.querySelector(
      ".available-player-avatar-modern"
    );
    avatarContainer.appendChild(avatarElement);

    // Add drag and drop functionality
    this.setupDragAndDropForPlayerCard(playerCard, player);

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
   * Create country flag avatar element for squad selection
   */
  createCountryFlagAvatar(country, playerName) {
    const flagPath = this.getCountryFlagPath(country);

    if (flagPath) {
      const img = document.createElement("img");
      img.src = flagPath;
      img.alt = `${country} flag`;
      img.className = "available-player-flag-avatar";
      img.onerror = () => {
        // Fallback to initials if flag fails to load
        img.style.display = "none";
        const fallbackDiv = document.createElement("div");
        fallbackDiv.className = "available-player-avatar-fallback";
        fallbackDiv.textContent = this.getPlayerInitials(playerName);
        img.parentNode.appendChild(fallbackDiv);
      };
      return img;
    }

    // Fallback to initials if no country
    const fallbackDiv = document.createElement("div");
    fallbackDiv.className = "available-player-avatar-fallback";
    fallbackDiv.textContent = this.getPlayerInitials(playerName);
    return fallbackDiv;
  },

  /**
   * Get position display name from abbreviation
   * @param {string} position - Position abbreviation
   * @returns {string} - Full position name
   */
  getPositionDisplayName(position) {
    const positionMap = {
      OH: "Outside Hitter",
      MB: "Middle Blocker",
      L: "Libero",
      OP: "Opposite Hitter",
      S: "Setter",
    };
    return positionMap[position] || position;
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
   * Move player to starting position
   * @param {Object} player - Player object
   * @param {number} positionIndex - Position index (0-6)
   */
  moveToStarter(player, positionIndex = null) {
    console.log(
      "Moving player to starter:",
      player.player_name,
      "at position:",
      positionIndex
    );

    // Find best position if not specified
    if (positionIndex === null) {
      positionIndex = this.findBestStartingPosition(player);
    }

    if (positionIndex === -1) {
      alert("No available starting positions!");
      return;
    }

    console.log("Selected position index:", positionIndex);

    // Remove from available players
    this.state.availablePlayers = this.state.availablePlayers.filter(
      (p) => p.id !== player.id
    );

    // Add to starters
    this.state.starters[positionIndex] = player;

    console.log("Updated state - starters:", this.state.starters);

    // Update UI
    this.updateStartingPositionUI(positionIndex, player);
    this.renderAvailablePlayers();
    this.saveSquadSelections();
  },

  /**
   * Add player to starting 7 (legacy method for compatibility)
   *
   * @param {Object} player - Player object
   * @returns {void}
   */
  addPlayerToStarter(player) {
    this.moveToStarter(player);
  },

  /**
   * Move player to bench
   * @param {Object} player - Player object
   * @param {number} benchIndex - Bench index (0-8)
   */
  moveToBench(player, benchIndex = null) {
    console.log(
      "Moving player to bench:",
      player.player_name,
      "at index:",
      benchIndex
    );

    // Find first available bench slot if not specified
    if (benchIndex === null) {
      benchIndex = this.state.bench.findIndex((slot) => slot === null);
    }

    if (benchIndex === -1) {
      alert("No available bench slots!");
      return;
    }

    console.log("Selected bench index:", benchIndex);

    // Remove from available players
    this.state.availablePlayers = this.state.availablePlayers.filter(
      (p) => p.id !== player.id
    );

    // Add to bench
    this.state.bench[benchIndex] = player;

    console.log("Updated state - bench:", this.state.bench);

    // Update UI
    this.updateBenchUI(benchIndex, player);
    this.renderAvailablePlayers();
    this.saveSquadSelections();
  },

  /**
   * Add player to bench (legacy method for compatibility)
   *
   * @param {Object} player - Player object
   * @returns {void}
   */
  addPlayerToBench(player) {
    this.moveToBench(player);
  },

  /**
   * Remove player from squad and return to available
   * @param {string} type - 'starter' or 'bench'
   * @param {number} index - Position or bench index
   */
  removeFromSquad(type, index) {
    let player = null;

    if (type === "starter") {
      player = this.state.starters[index];
      this.state.starters[index] = null;
    } else if (type === "bench") {
      player = this.state.bench[index];
      this.state.bench[index] = null;
    }

    if (player) {
      // Add back to available players
      this.state.availablePlayers.push(player);

      // Update UI
      if (type === "starter") {
        this.clearStartingPositionUI(index);
      } else {
        this.clearBenchUI(index);
      }

      this.renderAvailablePlayers();
      this.saveSquadSelections();
    }
  },

  /**
   * Find best starting position for a player
   * @param {Object} player - Player object
   * @returns {number} - Position index or -1 if none available
   */
  findBestStartingPosition(player) {
    // First try to find matching position
    for (let i = 0; i < this.squadPositions.length; i++) {
      if (
        this.state.starters[i] === null &&
        this.squadPositions[i] === player.position
      ) {
        return i;
      }
    }

    // Then find any empty position
    for (let i = 0; i < this.squadPositions.length; i++) {
      if (this.state.starters[i] === null) {
        return i;
      }
    }

    return -1;
  },

  /**
   * Update starting position UI
   * @param {number} positionIndex - Position index
   * @param {Object} player - Player object
   */
  updateStartingPositionUI(positionIndex, player) {
    console.log(
      "Updating starting position UI for index:",
      positionIndex,
      "player:",
      player.player_name
    );

    const slot = document.querySelector(`[data-position="${positionIndex}"]`);
    if (!slot) {
      console.error(
        "Starting position slot not found for index:",
        positionIndex
      );
      return;
    }

    console.log("Found slot, updating UI...");

    const initials = this.getPlayerInitials(
      player.player_name || "Unknown Player"
    );

    // Format player name for display
    const playerName = player.player_name || "Unknown Player";
    const nameParts = playerName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Clear the entire slot content and replace with player
    slot.innerHTML = `
      <div class="placed-player">
        <div class="player-card-header">
          <div class="player-overall-rating">${player.overall || "N/A"}</div>
          <div class="player-name-section">
            <div class="player-first-name">${firstName}</div>
            <div class="player-last-name">${lastName}</div>
          </div>
        </div>
        <div class="player-stats-grid">
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.attack || 0}</div>
            <div class="player-stat-label">ATK</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.defense || 0}</div>
            <div class="player-stat-label">DEF</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.serve || 0}</div>
            <div class="player-stat-label">SRV</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.block || 0}</div>
            <div class="player-stat-label">BLK</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.receive || 0}</div>
            <div class="player-stat-label">RCV</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.setting || 0}</div>
            <div class="player-stat-label">SET</div>
          </div>
        </div>
        <div class="player-card-footer">
          <div class="player-position-footer" data-position="${this.getPositionDisplayName(
            player.position || "Unknown"
          )}">
            <div class="player-position-text">${this.getPositionDisplayName(
              player.position || "Unknown"
            )}</div>
          </div>
          <div class="player-flag-container"></div>
        </div>
        <button class="remove-player-btn" onclick="SquadSelection.removeFromSquad('starter', ${positionIndex})">×</button>
      </div>
    `;

    // Insert country flag avatar into the flag container
    const flagContainer = slot.querySelector(".player-flag-container");
    if (flagContainer) {
      const flagElement = this.createCountryFlagAvatar(
        player.country,
        player.player_name || "Unknown Player"
      );
      flagContainer.appendChild(flagElement);
    }

    slot.dataset.playerId = player.id;
    slot.classList.add("position-slot-modern--occupied");

    // Add drag and drop functionality to the placed player
    const placedPlayer = slot.querySelector(".placed-player");
    this.setupDragAndDropForPlacedPlayer(
      placedPlayer,
      "starter",
      positionIndex
    );
  },

  /**
   * Clear starting position UI
   * @param {number} positionIndex - Position index
   */
  clearStartingPositionUI(positionIndex) {
    const slot = document.querySelector(`[data-position="${positionIndex}"]`);
    if (!slot) return;

    // Restore the original slot content with position label
    const position = this.squadPositions[positionIndex];
    slot.innerHTML = `
      <div class="position-slot-label-modern">${position}</div>
      <div class="position-slot-player-modern" id="starting-${positionIndex}"></div>
    `;

    slot.removeAttribute("data-player-id");
    slot.classList.remove("position-slot-modern--occupied");
  },

  /**
   * Place a player in a starting position slot (legacy method)
   *
   * @param {HTMLElement} slot - Position slot element
   * @param {Object} player - Player object
   * @param {number} playerId - Player ID
   * @param {string} position - Player position
   * @returns {void}
   */
  placePlayerInStartingPosition(slot, player, playerId, position) {
    const positionIndex = parseInt(slot.dataset.position);
    this.updateStartingPositionUI(positionIndex, player);
  },

  /**
   * Update bench UI
   * @param {number} benchIndex - Bench index
   * @param {Object} player - Player object
   */
  updateBenchUI(benchIndex, player) {
    console.log(
      "Updating bench UI for index:",
      benchIndex,
      "player:",
      player.player_name
    );

    const slot = document.querySelector(`[data-bench="${benchIndex}"]`);
    if (!slot) {
      console.error("Bench slot not found for index:", benchIndex);
      return;
    }

    console.log("Found bench slot, updating UI...");

    const initials = this.getPlayerInitials(
      player.player_name || "Unknown Player"
    );

    // Format player name for display
    const playerName = player.player_name || "Unknown Player";
    const nameParts = playerName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Clear the entire slot content and replace with player
    slot.innerHTML = `
      <div class="placed-player">
        <div class="player-card-header">
          <div class="player-overall-rating">${player.overall || "N/A"}</div>
          <div class="player-name-section">
            <div class="player-first-name">${firstName}</div>
            <div class="player-last-name">${lastName}</div>
          </div>
        </div>
        <div class="player-stats-grid">
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.attack || 0}</div>
            <div class="player-stat-label">ATK</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.defense || 0}</div>
            <div class="player-stat-label">DEF</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.serve || 0}</div>
            <div class="player-stat-label">SRV</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.block || 0}</div>
            <div class="player-stat-label">BLK</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.receive || 0}</div>
            <div class="player-stat-label">RCV</div>
          </div>
          <div class="player-stat-badge">
            <div class="player-stat-value">${player.setting || 0}</div>
            <div class="player-stat-label">SET</div>
          </div>
        </div>
        <div class="player-card-footer">
          <div class="player-position-footer" data-position="${this.getPositionDisplayName(
            player.position || "Unknown"
          )}">
            <div class="player-position-text">${this.getPositionDisplayName(
              player.position || "Unknown"
            )}</div>
          </div>
          <div class="player-flag-container"></div>
        </div>
        <button class="remove-player-btn" onclick="SquadSelection.removeFromSquad('bench', ${benchIndex})">×</button>
      </div>
    `;

    // Insert country flag avatar into the flag container
    const flagContainer = slot.querySelector(".player-flag-container");
    if (flagContainer) {
      const flagElement = this.createCountryFlagAvatar(
        player.country,
        player.player_name || "Unknown Player"
      );
      flagContainer.appendChild(flagElement);
    }

    slot.dataset.playerId = player.id;
    slot.classList.add("bench-slot-modern--occupied");

    // Add drag and drop functionality to the placed player
    const placedPlayer = slot.querySelector(".placed-player");
    this.setupDragAndDropForPlacedPlayer(placedPlayer, "bench", benchIndex);
  },

  /**
   * Clear bench UI
   * @param {number} benchIndex - Bench index
   */
  clearBenchUI(benchIndex) {
    const slot = document.querySelector(`[data-bench="${benchIndex}"]`);
    if (!slot) return;

    // Restore the original slot content
    slot.innerHTML = `
      <div class="bench-slot-player-modern" id="bench-${benchIndex}"></div>
    `;

    slot.removeAttribute("data-player-id");
    slot.classList.remove("bench-slot-modern--occupied");
  },

  /**
   * Place a player on a bench slot (legacy method)
   *
   * @param {HTMLElement} slot - Bench slot element
   * @param {Object} player - Player object
   * @param {number} playerId - Player ID
   * @param {string} position - Player position
   * @returns {void}
   */
  placePlayerOnBench(slot, player, playerId, position) {
    const benchIndex = parseInt(slot.dataset.bench);
    this.updateBenchUI(benchIndex, player);
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
      const slot = document.querySelector(`[data-position="${i}"]`);
      if (slot?.dataset.playerId) {
        startingPlayers.push(parseInt(slot.dataset.playerId));
      }
    }

    // Get all players currently on bench
    const benchPlayers = [];
    for (let i = 0; i < 9; i++) {
      const slot = document.querySelector(`[data-bench="${i}"]`);
      if (slot?.dataset.playerId) {
        benchPlayers.push(parseInt(slot.dataset.playerId));
      }
    }

    // Hide players that are already in the squad
    const allSquadPlayers = [...startingPlayers, ...benchPlayers];
    this.state.allPlayers.forEach((player) => {
      const isInSquad = allSquadPlayers.includes(player.id);
      this.updateAvailablePlayerVisibility(player.id, !isInSquad);
    });
  },

  /**
   * Save squad selections to local storage
   */
  async saveSquadSelections() {
    try {
      const squad = this.getCurrentSquad();
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

      // Restore starters
      for (let i = 0; i < squad.starting.length; i++) {
        const starter = squad.starting[i];
        if (starter.playerId) {
          const player = this.state.allPlayers.find(
            (p) => p.id === starter.playerId
          );
          if (player) {
            this.state.starters[i] = player;
            this.state.availablePlayers = this.state.availablePlayers.filter(
              (p) => p.id !== player.id
            );
            this.updateStartingPositionUI(i, player);
          }
        }
      }

      // Restore bench
      for (let i = 0; i < squad.bench.length; i++) {
        const benchPlayer = squad.bench[i];
        if (benchPlayer.playerId) {
          const player = this.state.allPlayers.find(
            (p) => p.id === benchPlayer.playerId
          );
          if (player) {
            this.state.bench[i] = player;
            this.state.availablePlayers = this.state.availablePlayers.filter(
              (p) => p.id !== player.id
            );
            this.updateBenchUI(i, player);
          }
        }
      }

      this.renderAvailablePlayers();
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
  getCurrentSquad() {
    const starting = [];
    const bench = [];

    // Get starting players from DOM
    for (let i = 0; i < this.squadPositions.length; i++) {
      const slot = document.querySelector(`[data-position="${i}"]`);
      if (slot?.dataset.playerId) {
        const playerId = parseInt(slot.dataset.playerId);
        const player = this.state.allPlayers.find((p) => p.id === playerId);
        starting.push({
          position: this.squadPositions[i],
          playerId: playerId,
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

    // Get bench players from DOM
    for (let i = 0; i < 9; i++) {
      const slot = document.querySelector(`[data-bench="${i}"]`);
      if (slot?.dataset.playerId) {
        const playerId = parseInt(slot.dataset.playerId);
        const player = this.state.allPlayers.find((p) => p.id === playerId);
        bench.push({
          playerId: playerId,
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
   * @returns {Object} - Validation result with errors if any
   */
  validateSquad() {
    const squad = this.getCurrentSquad();
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

      // Reset state
      this.state.starters = new Array(7).fill(null);
      this.state.bench = new Array(9).fill(null);
      this.state.availablePlayers = [...this.state.allPlayers];

      // Clear all starting positions
      for (let i = 0; i < this.squadPositions.length; i++) {
        this.clearStartingPositionUI(i);
      }

      // Clear all bench slots
      for (let i = 0; i < 9; i++) {
        this.clearBenchUI(i);
      }

      // Refresh available players to show all players
      this.renderAvailablePlayers();

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
        this.state.searchTerm = e.target.value;
        this.renderAvailablePlayers();
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

        this.state.currentFilter = e.target.dataset.position;
        this.renderAvailablePlayers();
      });
    });

    console.log("Squad filter controls setup complete");
  },

  /**
   * Apply filters and search to available players (legacy method)
   *
   * This function filters the available players based on the current
   * search term and position filter.
   *
   * @returns {void}
   */
  applyFiltersAndSearch() {
    this.renderAvailablePlayers();
  },

  /**
   * Render available players based on current state
   */
  renderAvailablePlayers() {
    const availablePlayers = document.getElementById("availablePlayers");
    if (!availablePlayers) return;

    // Apply filters
    let filteredPlayers = [...this.state.availablePlayers];

    if (this.state.currentFilter !== "all") {
      filteredPlayers = filteredPlayers.filter(
        (player) => player.position === this.state.currentFilter
      );
    }

    if (this.state.searchTerm.trim()) {
      const searchLower = this.state.searchTerm.toLowerCase();
      filteredPlayers = filteredPlayers.filter(
        (player) =>
          (player.player_name || "").toLowerCase().includes(searchLower) ||
          (player.position || "").toLowerCase().includes(searchLower)
      );
    }

    // Clear and render
    availablePlayers.innerHTML = "";

    if (filteredPlayers.length === 0) {
      availablePlayers.innerHTML =
        '<div class="no-players">No players match your current filters.</div>';
      return;
    }

    filteredPlayers.forEach((player, index) => {
      console.log(
        `DEBUG SquadSelection: Creating card ${index} for player:`,
        player.player_name,
        "ID:",
        player.id
      );
      const playerCard = this.createPlayerCard(player, index);
      availablePlayers.appendChild(playerCard);
    });

    console.log(
      "DEBUG SquadSelection: Final availablePlayers children count:",
      availablePlayers.children.length
    );
  },

  /**
   * Render filtered players to the available players grid (legacy method)
   *
   * This function renders the filtered players to the available players
   * section and updates visibility of players that are already in the squad.
   *
   * @returns {void}
   */
  renderFilteredPlayers() {
    this.renderAvailablePlayers();
  },

  /**
   * Setup drag and drop functionality for player cards
   *
   * @param {HTMLElement} playerCard - The player card element
   * @param {Object} player - Player object
   */
  setupDragAndDropForPlayerCard(playerCard, player) {
    playerCard.draggable = true;
    playerCard.dataset.dragType = "player";
    playerCard.dataset.playerId = player.id;

    playerCard.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          type: "player",
          playerId: player.id,
          player: player,
        })
      );
      e.dataTransfer.effectAllowed = "move";
      playerCard.classList.add("dragging");
    });

    playerCard.addEventListener("dragend", (e) => {
      playerCard.classList.remove("dragging");
      // Remove all drag over highlights
      document.querySelectorAll(".drag-over").forEach((el) => {
        el.classList.remove("drag-over");
      });
    });
  },

  /**
   * Setup drag and drop functionality for position slots (starter or bench)
   *
   * @param {HTMLElement} slot - The slot element
   * @param {string} slotType - 'starter' or 'bench'
   * @param {number} slotIndex - The index of the slot
   */
  setupDragAndDropForSlot(slot, slotType, slotIndex) {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      slot.classList.add("drag-over");
    });

    slot.addEventListener("dragleave", (e) => {
      // Only remove highlight if we're actually leaving the slot
      if (!slot.contains(e.relatedTarget)) {
        slot.classList.remove("drag-over");
      }
    });

    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("drag-over");

      try {
        const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));

        if (dragData.type === "player") {
          this.handlePlayerDrop(dragData, slotType, slotIndex);
        } else if (dragData.type === "squad-player") {
          this.handleSquadPlayerDrop(dragData, slotType, slotIndex);
        }
      } catch (error) {
        console.error("Error handling drop:", error);
      }
    });
  },

  /**
   * Handle dropping a player from available players
   *
   * @param {Object} dragData - Drag data containing player info
   * @param {string} slotType - 'starter' or 'bench'
   * @param {number} slotIndex - The index of the slot
   */
  handlePlayerDrop(dragData, slotType, slotIndex) {
    const player = dragData.player;

    if (slotType === "starter") {
      // Check if there's already a player in this starting position
      const existingPlayer = this.state.starters[slotIndex];
      if (existingPlayer) {
        // Swap: move existing player back to available, add new player to starter
        this.state.availablePlayers.push(existingPlayer);
        this.state.starters[slotIndex] = player;
        this.state.availablePlayers = this.state.availablePlayers.filter(
          (p) => p.id !== player.id
        );
        this.updateStartingPositionUI(slotIndex, player);
        this.renderAvailablePlayers();
      } else {
        // No existing player, just add normally
        this.moveToStarter(player, slotIndex);
      }
    } else if (slotType === "bench") {
      // Check if there's already a player in this bench slot
      const existingPlayer = this.state.bench[slotIndex];
      if (existingPlayer) {
        // Swap: move existing player back to available, add new player to bench
        this.state.availablePlayers.push(existingPlayer);
        this.state.bench[slotIndex] = player;
        this.state.availablePlayers = this.state.availablePlayers.filter(
          (p) => p.id !== player.id
        );
        this.updateBenchUI(slotIndex, player);
        this.renderAvailablePlayers();
      } else {
        // No existing player, just add normally
        this.moveToBench(player, slotIndex);
      }
    }

    this.saveSquadSelections();
  },

  /**
   * Handle dropping a player from one squad position to another
   *
   * @param {Object} dragData - Drag data containing player and source info
   * @param {string} slotType - 'starter' or 'bench'
   * @param {number} slotIndex - The index of the slot
   */
  handleSquadPlayerDrop(dragData, slotType, slotIndex) {
    const player = dragData.player;
    const sourceType = dragData.sourceType;
    const sourceIndex = dragData.sourceIndex;

    // Don't allow dropping on the same position
    if (sourceType === slotType && sourceIndex === slotIndex) {
      return;
    }

    // Check if there's already a player in the target position
    let existingPlayer = null;
    if (slotType === "starter") {
      existingPlayer = this.state.starters[slotIndex];
    } else if (slotType === "bench") {
      existingPlayer = this.state.bench[slotIndex];
    }

    // Remove player from source position
    if (sourceType === "starter") {
      this.state.starters[sourceIndex] = null;
      this.clearStartingPositionUI(sourceIndex);
    } else if (sourceType === "bench") {
      this.state.bench[sourceIndex] = null;
      this.clearBenchUI(sourceIndex);
    }

    // Handle the swap or move
    if (existingPlayer) {
      // There's an existing player, swap them
      if (sourceType === "starter") {
        this.state.starters[sourceIndex] = existingPlayer;
        this.updateStartingPositionUI(sourceIndex, existingPlayer);
      } else if (sourceType === "bench") {
        this.state.bench[sourceIndex] = existingPlayer;
        this.updateBenchUI(sourceIndex, existingPlayer);
      }
    } else {
      // No existing player, just move normally
      // (source position is already cleared above)
    }

    // Add player to new position
    if (slotType === "starter") {
      this.state.starters[slotIndex] = player;
      this.updateStartingPositionUI(slotIndex, player);
    } else if (slotType === "bench") {
      this.state.bench[slotIndex] = player;
      this.updateBenchUI(slotIndex, player);
    }

    this.saveSquadSelections();
  },

  /**
   * Setup drag and drop for placed players (in starting positions or bench)
   *
   * @param {HTMLElement} playerElement - The placed player element
   * @param {string} sourceType - 'starter' or 'bench'
   * @param {number} sourceIndex - The index of the source position
   */
  setupDragAndDropForPlacedPlayer(playerElement, sourceType, sourceIndex) {
    playerElement.draggable = true;
    playerElement.dataset.dragType = "squad-player";
    playerElement.dataset.sourceType = sourceType;
    playerElement.dataset.sourceIndex = sourceIndex;

    playerElement.addEventListener("dragstart", (e) => {
      const playerId = parseInt(
        playerElement.closest("[data-position], [data-bench]").dataset.playerId
      );
      const player = this.state.allPlayers.find((p) => p.id === playerId);

      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          type: "squad-player",
          playerId: playerId,
          player: player,
          sourceType: sourceType,
          sourceIndex: sourceIndex,
        })
      );
      e.dataTransfer.effectAllowed = "move";
      playerElement.classList.add("dragging");
    });

    playerElement.addEventListener("dragend", (e) => {
      playerElement.classList.remove("dragging");
      // Remove all drag over highlights
      document.querySelectorAll(".drag-over").forEach((el) => {
        el.classList.remove("drag-over");
      });
    });
  },
};

// Export to global scope for use throughout the application
window.SquadSelection = SquadSelection;
