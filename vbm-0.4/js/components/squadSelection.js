/**
 * Squad Selection Component - Handles starting lineup and bench player management
 *
 * This component manages the squad selection interface, including drag-and-drop
 * functionality for placing players in starting positions and bench slots.
 * It ensures proper position validation and provides a comprehensive squad management system.
 *
 * @fileoverview Squad selection component with drag-and-drop functionality
 * @author Volleyball Manager Team
 * @version 0.2.0
 */

/**
 * SquadSelection component object
 *
 * This object contains all functionality for managing squad selection,
 * including drag-and-drop operations, position validation, and squad management.
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
  draggedPlayer: null,
  draggedFrom: null,
  isDragActive: false,
  isInitialized: false,
  isPopulatingPlayers: false,

  /**
   * Initialize the squad selection component
   *
   * This function sets up the squad selection interface with drag-and-drop
   * functionality and populates the available players list.
   *
   * @returns {void}
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

      // Initialize the squad selection interface
      await this.initializeSquadSelection();

      this.isInitialized = true;
      console.log("Squad Selection component initialized successfully");
    } catch (error) {
      console.error("Error initializing Squad Selection:", error);
      throw error;
    }
  },

  /**
   * Initialize squad selection interface with drag and drop
   *
   * This function creates the starting positions, bench slots, and available
   * players sections with all necessary event listeners for drag-and-drop.
   *
   * @returns {void}
   */
  async initializeSquadSelection() {
    try {
      // Create starting positions
      this.createStartingPositions();

      // Create bench slots
      this.createBenchSlots();

      // Populate available players
      await this.populateAvailablePlayers();

      // Set up drag and drop event listeners
      this.setupDragAndDropListeners();

      // Load saved squad selections
      await this.loadSavedSquadSelections();
    } catch (error) {
      console.error("Error initializing squad selection interface:", error);
      throw error;
    }
  },

  /**
   * Create starting position slots
   *
   * This function creates the 7 starting position slots with appropriate
   * labels and drag-and-drop event listeners.
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
      slot.className = "position-slot";
      slot.dataset.position = index;
      slot.dataset.requiredPosition = position;
      slot.innerHTML = `
                <div class="position-slot__label">${position}</div>
                <div class="position-slot__player" id="starting-${index}"></div>
            `;

      // Add drag and drop event listeners
      slot.addEventListener("dragover", this.handleDragOver.bind(this));
      slot.addEventListener("drop", this.handleDrop.bind(this));
      slot.addEventListener("dragleave", this.handleDragLeave.bind(this));

      startingPositions.appendChild(slot);
    });
  },

  /**
   * Create bench slots
   *
   * This function creates the bench slots for substitute players
   * with appropriate labels and drag-and-drop event listeners.
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
      slot.className = "bench-slot";
      slot.dataset.bench = i;
      slot.innerHTML = `
                <div class="position-slot__label">Bench ${i + 1}</div>
                <div class="position-slot__player" id="bench-${i}"></div>
            `;

      // Add drag and drop event listeners
      slot.addEventListener("dragover", this.handleDragOver.bind(this));
      slot.addEventListener("drop", this.handleDrop.bind(this));
      slot.addEventListener("dragleave", this.handleDragLeave.bind(this));

      benchSlots.appendChild(slot);
    }
  },

  /**
   * Populate the available players list
   *
   * This function creates draggable player cards for all available players
   * and sets up the necessary drag-and-drop event listeners.
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

    // Clear existing content
    availablePlayers.innerHTML = "";

    // Get all players from database
    const players = await window.DatabaseService.getPlayers();

    console.log("DEBUG SquadSelection: Raw players from database:", players);
    console.log(
      "DEBUG SquadSelection: Number of players from database:",
      players.length
    );

    // Create draggable player cards
    players.forEach((player, index) => {
      console.log(
        `DEBUG SquadSelection: Creating card ${index} for player:`,
        player.player_name,
        "ID:",
        player.id
      );
      const playerCard = this.createDraggablePlayerCard(player, index);
      availablePlayers.appendChild(playerCard);
    });

    console.log(
      "DEBUG SquadSelection: Final availablePlayers children count:",
      availablePlayers.children.length
    );
    this.isPopulatingPlayers = false;
    console.log("DEBUG SquadSelection: Finished populateAvailablePlayers()");
  },

  /**
   * Create a draggable player card
   *
   * This function creates a player card that can be dragged to squad positions
   * with all necessary attributes and event listeners.
   *
   * @param {Object} player - Player object
   * @param {number} index - Player index
   * @returns {HTMLElement} - Draggable player card element
   */
  createDraggablePlayerCard(player, index) {
    const playerCard = document.createElement("div");
    playerCard.className = "draggable-player draggable-player--squad";
    playerCard.draggable = true;
    playerCard.dataset.playerId = index;
    playerCard.dataset.playerPosition = player.position;
    playerCard.innerHTML = `
            <div class="draggable-player__face">👤</div>
            <div class="draggable-player__info">
                <div class="draggable-player__name">${
                  player.player_name || "Unknown Player"
                }</div>
                <div class="player-card__position" data-position="${
                  player.position || "Unknown"
                }">${player.position || "Unknown Position"}</div>
            </div>
            <div class="draggable-player__overall">${
              player.overall || "N/A"
            }</div>
        `;

    // Add drag event listeners
    playerCard.addEventListener("dragstart", this.handleDragStart.bind(this));
    playerCard.addEventListener("dragend", this.handleDragEnd.bind(this));

    return playerCard;
  },

  /**
   * Setup drag and drop event listeners for containers
   *
   * This function sets up the necessary event listeners for drag-and-drop
   * operations on the available players container.
   *
   * @returns {void}
   */
  setupDragAndDropListeners() {
    const availablePlayers = document.getElementById("availablePlayers");
    if (availablePlayers) {
      availablePlayers.addEventListener(
        "dragover",
        this.handleDragOver.bind(this)
      );
      availablePlayers.addEventListener("drop", this.handleDrop.bind(this));
      availablePlayers.addEventListener(
        "dragleave",
        this.handleDragLeave.bind(this)
      );
    }
  },

  /**
   * Handle drag start event
   *
   * This function is called when a player card starts being dragged.
   * It sets up the drag data and visual feedback.
   *
   * @param {Event} e - Drag event
   * @returns {void}
   */
  handleDragStart(e) {
    try {
      const playerId = e.target.dataset.playerId;
      const playerPosition = e.target.dataset.playerPosition;

      // Set drag data
      e.dataTransfer.setData("text/plain", playerId);
      e.dataTransfer.setData("player-position", playerPosition);
      e.dataTransfer.setData("source-type", "available");
      e.dataTransfer.setData("source-element", e.target.id || "");

      // Store drag state
      this.draggedPlayer = playerId;
      this.draggedFrom = "available";
      this.isDragActive = true;

      // Add visual feedback
      e.target.classList.add("dragging");

      console.log(`Started dragging player ${playerId}`);
    } catch (error) {
      console.error("Error handling drag start:", error);
    }
  },

  /**
   * Handle drag end event
   *
   * This function is called when a drag operation ends.
   * It cleans up the drag state and visual feedback.
   *
   * @param {Event} e - Drag event
   * @returns {void}
   */
  handleDragEnd(e) {
    try {
      // Remove visual feedback
      e.target.classList.remove("dragging");

      // Clear drag state
      this.draggedPlayer = null;
      this.draggedFrom = null;
      this.isDragActive = false;

      console.log("Drag operation ended");
    } catch (error) {
      console.error("Error handling drag end:", error);
    }
  },

  /**
   * Handle drag over event
   *
   * This function is called when a dragged element is over a drop target.
   * It prevents the default behavior to allow dropping.
   *
   * @param {Event} e - Drag event
   * @returns {void}
   */
  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  },

  /**
   * Handle drag leave event
   *
   * This function is called when a dragged element leaves a drop target.
   * It removes the drag-over visual feedback.
   *
   * @param {Event} e - Drag event
   * @returns {void}
   */
  handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  },

  /**
   * Handle drop event
   *
   * This function is called when a player is dropped on a valid target.
   * It handles the placement logic and validation.
   *
   * @param {Event} e - Drop event
   * @returns {Promise<void>}
   */
  async handleDrop(e) {
    try {
      e.preventDefault();
      e.currentTarget.classList.remove("drag-over");

      // Get drag data
      const playerId = e.dataTransfer.getData("text/plain");
      const playerPosition = e.dataTransfer.getData("player-position");
      const sourceType = e.dataTransfer.getData("source-type");
      const sourceElement = e.dataTransfer.getData("source-element");

      // Get player data
      const players = await window.DatabaseService.getPlayers();
      const player = players.find((p) => p.id === parseInt(playerId));
      const slot = e.currentTarget;

      if (!player) {
        console.error("Player not found:", playerId);
        return;
      }

      // Handle drop back to available players section
      if (slot.id === "availablePlayers" || slot.closest("#availablePlayers")) {
        if (sourceType === "placed") {
          this.clearPreviousPlacement(sourceElement);
          this.updateAvailablePlayerVisibility(playerId, "placed");
        }
        return;
      }

      // Check if slot is already occupied
      const existingPlayer = slot.querySelector(".placed-player");
      if (existingPlayer && existingPlayer.id !== sourceElement) {
        this.showInvalidDrop(slot);
        return;
      }

      // Handle starting position slots
      if (slot.dataset.position !== undefined) {
        this.handleStartingPositionDrop(
          slot,
          player,
          playerId,
          playerPosition,
          sourceType,
          sourceElement
        );
      }
      // Handle bench slots
      else if (slot.dataset.bench !== undefined) {
        this.handleBenchDrop(
          slot,
          player,
          playerId,
          playerPosition,
          sourceType,
          sourceElement
        );
      }

      // Update available player visibility
      this.updateAvailablePlayerVisibility(playerId, sourceType);

      // Save squad selections after successful drop
      await this.saveSquadSelections();
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  },

  /**
   * Handle drop on starting position slot
   *
   * This function handles the logic for placing a player in a starting position,
   * including position validation and placement.
   *
   * @param {HTMLElement} slot - Position slot element
   * @param {Object} player - Player object
   * @param {string} playerId - Player ID
   * @param {string} playerPosition - Player position
   * @param {string} sourceType - Source type (available or placed)
   * @param {string} sourceElement - Source element ID
   * @returns {void}
   */
  handleStartingPositionDrop(
    slot,
    player,
    playerId,
    playerPosition,
    sourceType,
    sourceElement
  ) {
    const requiredPosition = slot.dataset.requiredPosition;

    // Check position compatibility
    if (playerPosition !== requiredPosition) {
      this.showInvalidDrop(slot);
      return;
    }

    // Clear previous placement if moving from another slot
    if (sourceType === "placed") {
      this.clearPreviousPlacement(sourceElement);
    }

    // Place player in starting position
    this.placePlayerInStartingPosition(slot, player, playerId, playerPosition);
  },

  /**
   * Handle drop on bench slot
   *
   * This function handles the logic for placing a player on the bench.
   *
   * @param {HTMLElement} slot - Bench slot element
   * @param {Object} player - Player object
   * @param {string} playerId - Player ID
   * @param {string} playerPosition - Player position
   * @param {string} sourceType - Source type (available or placed)
   * @param {string} sourceElement - Source element ID
   * @returns {void}
   */
  handleBenchDrop(
    slot,
    player,
    playerId,
    playerPosition,
    sourceType,
    sourceElement
  ) {
    // Clear previous placement if moving from another slot
    if (sourceType === "placed") {
      this.clearPreviousPlacement(sourceElement);
    }

    // Place player on bench
    this.placePlayerOnBench(slot, player, playerId, playerPosition);
  },

  /**
   * Place a player in a starting position
   *
   * This function creates the visual representation of a player in a starting position slot.
   *
   * @param {HTMLElement} slot - Position slot element
   * @param {Object} player - Player object
   * @param {string} playerId - Player ID
   * @param {string} playerPosition - Player position
   * @returns {void}
   */
  placePlayerInStartingPosition(slot, player, playerId, playerPosition) {
    const playerSlot = slot.querySelector(".position-slot__player");
    const positionAbbrev = window.DOMHelpers.getPositionAbbrev(playerPosition);

    playerSlot.innerHTML = `
            <div class="placed-player" draggable="true" data-player-id="${playerId}" data-player-position="${playerPosition}" id="placed-starting-${slot.dataset.position}">
                <div class="placed-player__face">👤</div>
                <div class="placed-player__name">${player.player_name}</div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div class="placed-player__overall">${player.overall}</div>
                    <div class="placed-player__position" data-position="${positionAbbrev}">${positionAbbrev}</div>
                </div>
            </div>
        `;

    slot.classList.add("position-slot--occupied");

    // Add drag event listeners to placed player
    const placedPlayer = playerSlot.querySelector(".placed-player");
    placedPlayer.addEventListener("dragstart", this.handleDragStart.bind(this));
    placedPlayer.addEventListener("dragend", this.handleDragEnd.bind(this));
  },

  /**
   * Place a player on the bench
   *
   * This function creates the visual representation of a player on the bench.
   *
   * @param {HTMLElement} slot - Bench slot element
   * @param {Object} player - Player object
   * @param {string} playerId - Player ID
   * @param {string} playerPosition - Player position
   * @returns {void}
   */
  placePlayerOnBench(slot, player, playerId, playerPosition) {
    const playerSlot = slot.querySelector(".position-slot__player");
    const positionAbbrev = window.DOMHelpers.getPositionAbbrev(playerPosition);

    playerSlot.innerHTML = `
            <div class="placed-player" draggable="true" data-player-id="${playerId}" data-player-position="${playerPosition}" id="placed-bench-${slot.dataset.bench}">
                <div class="placed-player__face">👤</div>
                <div class="placed-player__name">${player.player_name}</div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div class="placed-player__overall">${player.overall}</div>
                    <div class="placed-player__position" data-position="${positionAbbrev}">${positionAbbrev}</div>
                </div>
            </div>
        `;

    slot.classList.add("bench-slot--occupied");

    // Add drag event listeners to placed player
    const placedPlayer = playerSlot.querySelector(".placed-player");
    placedPlayer.addEventListener("dragstart", this.handleDragStart.bind(this));
    placedPlayer.addEventListener("dragend", this.handleDragEnd.bind(this));
  },

  /**
   * Show invalid drop feedback
   *
   * This function provides visual feedback when an invalid drop occurs.
   *
   * @param {HTMLElement} slot - Slot element that received invalid drop
   * @returns {void}
   */
  showInvalidDrop(slot) {
    slot.classList.add("invalid-drop");
    setTimeout(() => slot.classList.remove("invalid-drop"), 1000);
  },

  /**
   * Update available player visibility
   *
   * This function manages the visibility of players in the available players list
   * based on whether they are currently placed in the squad.
   *
   * @param {string} playerId - Player ID
   * @param {string} sourceType - Source type (available or placed)
   * @returns {void}
   */
  updateAvailablePlayerVisibility(playerId, sourceType) {
    const originalCard = document.querySelector(
      `[data-player-id="${playerId}"].draggable-player`
    );

    if (sourceType === "available") {
      // Hide player from available list when placed
      if (originalCard) {
        originalCard.style.display = "none";
      }
    } else if (sourceType === "placed") {
      // Show player in available list when removed from squad
      if (originalCard) {
        originalCard.style.display = "flex";
      }
    }
  },

  /**
   * Update all available player visibility based on current squad
   *
   * This function checks all players in the current squad and hides them
   * from the available players list to prevent duplicates.
   *
   * @returns {void}
   */
  updateAllAvailablePlayerVisibility() {
    // Get all currently placed players
    const placedPlayers = document.querySelectorAll(".placed-player");
    const placedPlayerIds = new Set();

    placedPlayers.forEach((player) => {
      const playerId = player.dataset.playerId;
      if (playerId) {
        placedPlayerIds.add(playerId);
      }
    });

    // Update visibility of all available players
    const availablePlayers = document.querySelectorAll(".draggable-player");
    availablePlayers.forEach((player) => {
      const playerId = player.dataset.playerId;
      if (placedPlayerIds.has(playerId)) {
        player.style.display = "none";
      } else {
        player.style.display = "flex";
      }
    });
  },

  /**
   * Clear previous player placement
   *
   * This function removes a player from their previous slot when moving them.
   *
   * @param {string} sourceElementId - ID of source element to clear
   * @returns {void}
   */
  clearPreviousPlacement(sourceElementId) {
    if (!sourceElementId) return;

    const sourceElement = document.getElementById(sourceElementId);
    if (sourceElement) {
      const parentSlot = sourceElement.closest(".position-slot, .bench-slot");
      if (parentSlot) {
        const playerSlot = parentSlot.querySelector(".position-slot__player");
        playerSlot.innerHTML = "";
        parentSlot.classList.remove(
          "position-slot--occupied",
          "bench-slot--occupied"
        );
      }
    }
  },

  /**
   * Save current squad selections to database
   *
   * This function saves the current squad configuration to the database
   * so it can be restored when the user returns to the page.
   *
   * @returns {Promise<void>}
   */
  async saveSquadSelections() {
    try {
      const squad = await this.getCurrentSquad();

      // Create squad data object
      const squadData = {
        team_id: 1, // Assuming team_id 1 is the user's team
        starting_players: squad.starting.map((pos) => ({
          position: pos.position,
          player_id: pos.playerId,
        })),
        bench_players: squad.bench.map((bench) => ({
          player_id: bench.playerId,
        })),
        updated_at: new Date().toISOString(),
      };

      // Save to localStorage as a fallback (since we don't have a dedicated squad table)
      localStorage.setItem(
        "volleyball_manager_squad_selections",
        JSON.stringify(squadData)
      );

      console.log("Squad selections saved successfully");
    } catch (error) {
      console.error("Error saving squad selections:", error);
    }
  },

  /**
   * Load saved squad selections from database
   *
   * This function loads previously saved squad selections and restores
   * the players to their correct positions.
   *
   * @returns {Promise<void>}
   */
  async loadSavedSquadSelections() {
    try {
      // Load from localStorage
      const savedData = localStorage.getItem(
        "volleyball_manager_squad_selections"
      );
      if (!savedData) {
        console.log("No saved squad selections found");
        return;
      }

      const squadData = JSON.parse(savedData);
      console.log("Loading saved squad selections:", squadData);

      // Restore starting players
      if (squadData.starting_players) {
        for (const startingPlayer of squadData.starting_players) {
          if (startingPlayer.player_id) {
            await this.restorePlayerToStartingPosition(
              startingPlayer.position,
              startingPlayer.player_id
            );
          }
        }
      }

      // Restore bench players
      if (squadData.bench_players) {
        for (let i = 0; i < squadData.bench_players.length; i++) {
          const benchPlayer = squadData.bench_players[i];
          if (benchPlayer.player_id) {
            await this.restorePlayerToBench(i, benchPlayer.player_id);
          }
        }
      }

      // Update visibility of all available players to prevent duplicates
      this.updateAllAvailablePlayerVisibility();

      console.log("Squad selections loaded successfully");
    } catch (error) {
      console.error("Error loading saved squad selections:", error);
    }
  },

  /**
   * Restore a player to a starting position
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
      this.updateAvailablePlayerVisibility(playerId, "available");
    } catch (error) {
      console.error("Error restoring player to starting position:", error);
    }
  },

  /**
   * Restore a player to a bench slot
   *
   * @param {number} benchIndex - Bench slot index
   * @param {number} playerId - Player ID
   * @returns {Promise<void>}
   */
  async restorePlayerToBench(benchIndex, playerId) {
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
      this.updateAvailablePlayerVisibility(playerId, "available");
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
   * This function removes all players from the squad and returns them to the available list.
   *
   * @returns {Promise<void>}
   */
  async clearSquad() {
    try {
      // Clear all starting positions
      for (let i = 0; i < this.squadPositions.length; i++) {
        const slot = document.getElementById(`starting-${i}`);
        if (slot) {
          slot.innerHTML = `
                        <div class="position-slot__label">${this.squadPositions[i]}</div>
                        <div class="position-slot__player" id="starting-${i}"></div>
                    `;
        }
      }

      // Clear all bench slots
      for (let i = 0; i < 9; i++) {
        const slot = document.getElementById(`bench-${i}`);
        if (slot) {
          slot.innerHTML = `
                        <div class="position-slot__label">Bench ${i + 1}</div>
                        <div class="position-slot__player" id="bench-${i}"></div>
                    `;
        }
      }

      // Show all available players
      const availablePlayers = document.querySelectorAll(".draggable-player");
      availablePlayers.forEach((player) => {
        player.style.display = "flex";
      });

      // Save squad selections after clearing
      await this.saveSquadSelections();

      console.log("Squad cleared successfully");
    } catch (error) {
      console.error("Error clearing squad:", error);
      window.DOMHelpers.showNotification("Error clearing squad", "error");
    }
  },
};

// Export to global scope for use throughout the application
window.SquadSelection = SquadSelection;
