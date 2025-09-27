/**
 * Transfer Market Component - Handles player transfers and market operations
 *
 * This component manages the transfer market functionality, including displaying
 * available players, handling transfer offers, and managing received offers.
 *
 * @fileoverview Transfer market component with player trading functionality
 * @author Volleyball Manager Team
 * @version 0.2.0
 */

/**
 * TransferMarket component object
 *
 * This object contains all functionality for managing the transfer market,
 * including player displays, offer management, and transfer operations.
 */
const TransferMarket = {
  // Component state
  currentFilter: "all",
  currentSort: "overall",
  currentSortDirection: "desc",
  searchTerm: "",
  isInitialized: false,

  /**
   * Initialize the transfer market component
   *
   * This function sets up the transfer market page by generating
   * the available players list and received offers.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Prevent double initialization
      if (this.isInitialized) {
        console.log(
          "Transfer Market component already initialized, skipping..."
        );
        return;
      }

      console.log("Initializing Transfer Market component...");

      // Generate the transfer market interface
      await this.generateTransferMarket();

      this.isInitialized = true;
      console.log("Transfer Market component initialized successfully");
    } catch (error) {
      console.error("Error initializing Transfer Market:", error);
      throw error;
    }
  },

  /**
   * Generate and display the transfer market
   *
   * This function creates the HTML for the transfer market interface
   * including tabs for available players and offers.
   *
   * @returns {Promise<void>}
   */
  async generateTransferMarket() {
    const transferContent = document.getElementById("transferContent");
    if (!transferContent) {
      console.error("Transfer content element not found");
      return;
    }

    try {
      // Show loading state for transfer market
      window.DOMHelpers.showComponentLoading("Transfer Market", 0);

      // Clear existing content and show loading placeholder
      transferContent.innerHTML =
        '<div class="loading-placeholder">Loading transfer market...</div>';

      // Update loading progress
      window.DOMHelpers.updateLoadingMessage(
        "Setting up transfer interface..."
      );
      window.DOMHelpers.updateLoadingProgress(20);

      transferContent.innerHTML = `
                <div class="transfer-market-tabs">
                    <button class="tab-btn tab-btn--active" data-tab="available">
                        Available Players
                    </button>
                    <button class="tab-btn" data-tab="received">
                        Received Offers
                    </button>
                    <button class="tab-btn" data-tab="sent">
                        Sent Offers
                    </button>
                </div>
                
                <div id="availablePlayersSection" class="transfer-section">
                    <div class="transfer-players" id="availableTransferPlayers">
                        Loading available players...
                    </div>
                </div>
                
                <div id="receivedOffersSection" class="transfer-section" style="display: none;">
                    <div class="offers-list" id="receivedOffersList">
                        Loading received offers...
                    </div>
                </div>
                
                <div id="sentOffersSection" class="transfer-section" style="display: none;">
                    <div class="offers-list" id="sentOffersList">
                        Loading sent offers...
                    </div>
                </div>
            `;

      // Update loading progress
      window.DOMHelpers.updateLoadingMessage("Loading available players...");
      window.DOMHelpers.updateLoadingProgress(40);

      // Load available players
      const availablePlayersHTML = await this.generateAvailablePlayersHTML();
      document.getElementById("availableTransferPlayers").innerHTML =
        availablePlayersHTML;

      window.DOMHelpers.updateLoadingMessage("Loading transfer offers...");
      window.DOMHelpers.updateLoadingProgress(70);

      // Load offers
      const offersHTML = await this.generateOffersHTML();
      document.getElementById("receivedOffersList").innerHTML = offersHTML;

      const sentOffersHTML = await this.generateSentOffersHTML();
      document.getElementById("sentOffersList").innerHTML = sentOffersHTML;

      window.DOMHelpers.updateLoadingMessage("Setting up event listeners...");
      window.DOMHelpers.updateLoadingProgress(90);

      // Attach event listeners
      this.attachTransferEventListeners();

      // Initialize transfer offer form
      this.initializeTransferOfferForm();

      window.DOMHelpers.updateLoadingMessage("Transfer market ready!");
      window.DOMHelpers.updateLoadingProgress(100);

      console.log("Transfer market generated successfully");

      // Hide loading screen after a brief delay
      setTimeout(() => {
        window.DOMHelpers.hideLoadingScreen();
      }, 500);
    } catch (error) {
      console.error("Error generating transfer market:", error);
      transferContent.innerHTML =
        '<div class="error-message">Error loading transfer market. Please try again.</div>';
      window.DOMHelpers.hideLoadingScreen();
    }
  },

  /**
   * Generate HTML for available transfer players
   *
   * This function creates the HTML for all available players in the transfer market.
   *
   * @returns {Promise<string>} - HTML string for available players
   */
  async generateAvailablePlayersHTML() {
    try {
      // Get all players from database and filter for those with teams (not free agents)
      // In the transfer market, we want to show players from other teams that can be bought
      const allPlayers = await window.DatabaseService.getAllPlayers();

      // Get current user's team to exclude their players
      const currentUserTeam = window.AuthService.getUserTeam();
      const currentUserTeamId = currentUserTeam ? currentUserTeam.id : null;

      // Filter out players from current user's team
      const transferPlayers = allPlayers.filter(
        (player) => player.team_id && player.team_id !== currentUserTeamId
      );

      if (transferPlayers.length === 0) {
        return '<div class="no-players">No players available in the transfer market.</div>';
      }

      return transferPlayers
        .map((player) => this.generatePlayerCardHTML(player))
        .join("");
    } catch (error) {
      console.error("Error generating available players HTML:", error);
      return '<div class="error-message">Error loading available players.</div>';
    }
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
   * Create country flag avatar element for transfer market
   */
  createCountryFlagAvatar(country, playerName) {
    const flagPath = this.getCountryFlagPath(country);

    if (flagPath) {
      return `<img src="${flagPath}" alt="${country} flag" class="transfer-player-card__flag-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="transfer-player-card__avatar-fallback" style="display: none;">👤</div>`;
    }

    // Fallback to emoji if no country
    return '<div class="transfer-player-card__avatar-fallback">👤</div>';
  },

  /**
   * Generate HTML for a single player card
   *
   * This function creates the HTML for a single player card in the transfer market.
   *
   * @param {Object} player - Player object
   * @returns {string} - HTML string for the player card
   */
  generatePlayerCardHTML(player) {
    const transferPrice = this.calculateTransferPrice(player);
    const avatarHTML = this.createCountryFlagAvatar(
      player.country,
      player.player_name
    );

    return `
            <div class="transfer-player-card" data-player-id="${
              player.id
            }" data-player-name="${player.player_name}">
                <div class="transfer-player-card__top">
                    <div class="transfer-player-card__face">${avatarHTML}</div>
                    <div class="transfer-player-card__info">
                        <div class="transfer-player-card__name">${
                          player.player_name || "Unknown Player"
                        }</div>
                        <div class="transfer-player-card__position" data-position="${
                          player.position || "Unknown"
                        }">${player.position || "Unknown Position"}</div>
                    </div>
                    <div class="transfer-player-card__overall">${
                      player.overall || "N/A"
                    }</div>
                </div>
                <div class="transfer-player-card__bottom">
                    <div class="transfer-player-card__price">$${transferPrice.toLocaleString()}</div>
                    <button class="transfer-player-card__offer-btn" 
                            data-player-id="${player.id}"
                            data-player-name="${player.player_name}"
                            data-suggested-price="${transferPrice}">
                        OFFER
                    </button>
                </div>
            </div>
        `;
  },

  /**
   * Generate HTML for received offers
   *
   * This function creates the HTML for all received transfer offers.
   *
   * @returns {Promise<string>} - HTML string for offers
   */
  async generateOffersHTML() {
    try {
      // Get actual offers from transfer offers service
      const offers = await window.TransferOffersService.getReceivedOffers();
      const pendingOffers = offers.filter(
        (offer) => offer.status === "pending"
      );

      if (pendingOffers.length === 0) {
        return '<div class="no-offers">No offers received.</div>';
      }

      return pendingOffers
        .map((offer) => this.generateOfferCardHTML(offer))
        .join("");
    } catch (error) {
      console.error("Error generating offers HTML:", error);
      return '<div class="error-message">Error loading offers.</div>';
    }
  },

  /**
   * Generate HTML for sent offers
   *
   * This function creates the HTML for all sent transfer offers.
   *
   * @returns {Promise<string>} - HTML string for sent offers
   */
  async generateSentOffersHTML() {
    try {
      // Get actual sent offers from transfer offers service
      const offers = await window.TransferOffersService.getSentOffers();
      const pendingOffers = offers.filter(
        (offer) => offer.status === "pending"
      );

      if (pendingOffers.length === 0) {
        return '<div class="no-offers">No sent offers.</div>';
      }

      return pendingOffers
        .map((offer) => this.generateSentOfferCardHTML(offer))
        .join("");
    } catch (error) {
      console.error("Error generating sent offers HTML:", error);
      return '<div class="error-message">Error loading sent offers.</div>';
    }
  },

  /**
   * Generate mock offers HTML (fallback)
   *
   * @returns {string} - HTML string for mock offers
   */
  generateMockOffersHTML() {
    // In a real application, this would fetch actual offers from a server
    // For now, we'll use mock data
    const mockOffers = [
      {
        player: "Alex Johnson",
        team: "Thunder Bolts",
        amount: 28000,
        currentContract: {
          salary: 15000,
          duration: 2,
          position: "Outside Hitter",
          overall: 78,
        },
        offeredContract: {
          salary: 18000,
          duration: 3,
          position: "Outside Hitter",
          overall: 78,
        },
      },
      {
        player: "Sofia Rodriguez",
        team: "Storm Riders",
        amount: 32000,
        currentContract: {
          salary: 12000,
          duration: 1,
          position: "Setter",
          overall: 82,
        },
        offeredContract: {
          salary: 16000,
          duration: 2,
          position: "Setter",
          overall: 82,
        },
      },
      {
        player: "Marcus Chen",
        team: "Lightning Strike",
        amount: 45000,
        currentContract: {
          salary: 20000,
          duration: 3,
          position: "Middle Blocker",
          overall: 85,
        },
        offeredContract: {
          salary: 25000,
          duration: 4,
          position: "Middle Blocker",
          overall: 85,
        },
      },
      {
        player: "Emma Thompson",
        team: "Volley Masters",
        amount: 38000,
        currentContract: {
          salary: 14000,
          duration: 2,
          position: "Opposite",
          overall: 80,
        },
        offeredContract: {
          salary: 19000,
          duration: 3,
          position: "Opposite",
          overall: 80,
        },
      },
      {
        player: "David Kim",
        team: "Spike Force",
        amount: 29000,
        currentContract: {
          salary: 11000,
          duration: 1,
          position: "Libero",
          overall: 75,
        },
        offeredContract: {
          salary: 15000,
          duration: 2,
          position: "Libero",
          overall: 75,
        },
      },
      {
        player: "Lisa Martinez",
        team: "Net Warriors",
        amount: 41000,
        currentContract: {
          salary: 18000,
          duration: 2,
          position: "Outside Hitter",
          overall: 83,
        },
        offeredContract: {
          salary: 22000,
          duration: 3,
          position: "Outside Hitter",
          overall: 83,
        },
      },
    ];

    if (mockOffers.length === 0) {
      return '<div class="no-offers">No offers received.</div>';
    }

    return mockOffers
      .map((offer) => this.generateOfferCardHTML(offer))
      .join("");
  },

  /**
   * Generate HTML for a single offer card
   *
   * This function creates the HTML for a single received offer.
   *
   * @param {Object} offer - Offer object
   * @returns {string} - HTML string for the offer card
   */
  generateOfferCardHTML(offer) {
    // Simplified data structure - no complex joins
    const playerName = `Player ID: ${offer.player_id}`;
    const fromTeamName = `From User: ${offer.from_user_id}`;
    const offerAmount = offer.offer_amount || 0;
    const message = offer.message || "";

    return `
            <div class="offer-card" data-offer-id="${
              offer.id
            }" data-offer='${JSON.stringify(offer)}'>
                <div class="offer-card__top">
                    <div class="offer-card__info">
                        <div class="offer-card__player">${playerName}</div>
                        <div class="offer-card__team">${fromTeamName}</div>
                        ${
                          message
                            ? `<div class="offer-card__message">"${message}"</div>`
                            : ""
                        }
                    </div>
                    <div class="offer-card__amount">$${offerAmount.toLocaleString()}</div>
                </div>
                <div class="offer-card__actions">
                    <button class="btn btn--success offer-card__accept" data-offer-id="${
                      offer.id
                    }">Accept</button>
                    <button class="btn btn--danger offer-card__reject" data-offer-id="${
                      offer.id
                    }">Reject</button>
                </div>
            </div>
        `;
  },

  /**
   * Generate HTML for a single sent offer card
   *
   * This function creates the HTML for a single sent offer.
   *
   * @param {Object} offer - Offer object
   * @returns {string} - HTML string for the sent offer card
   */
  generateSentOfferCardHTML(offer) {
    // Simplified data structure - no complex joins
    const playerName = `Player ID: ${offer.player_id}`;
    const toTeamName = `To User: ${offer.to_user_id || "No recipient"}`;
    const offerAmount = offer.offer_amount || 0;
    const message = offer.message || "";
    const status = offer.status || "pending";

    return `
            <div class="offer-card offer-card--sent" data-offer-id="${
              offer.id
            }">
                <div class="offer-card__top">
                    <div class="offer-card__info">
                        <div class="offer-card__player">${playerName}</div>
                        <div class="offer-card__team">${toTeamName}</div>
                        ${
                          message
                            ? `<div class="offer-card__message">"${message}"</div>`
                            : ""
                        }
                    </div>
                    <div class="offer-card__amount">$${offerAmount.toLocaleString()}</div>
                </div>
                <div class="offer-card__status">
                    <span class="offer-status offer-status--${status}">${status.toUpperCase()}</span>
                </div>
            </div>
        `;
  },

  /**
   * Calculate transfer price for a player
   *
   * This function calculates the transfer price based on player attributes.
   *
   * @param {Object} player - Player object
   * @returns {number} - Transfer price
   */
  calculateTransferPrice(player) {
    try {
      // Base price calculation based on overall rating and age
      const basePrice = (player.overall || 50) * 500;
      const ageModifier =
        (player.age || 25) < 25 ? 1.2 : (player.age || 25) > 30 ? 0.8 : 1.0;
      return Math.round(basePrice * ageModifier);
    } catch (error) {
      console.error("Error calculating transfer price:", error);
      return 100000; // Default price
    }
  },

  /**
   * Attach event listeners for transfer market actions
   *
   * This function sets up all event listeners for transfer market interactions.
   *
   * @returns {void}
   */
  attachTransferEventListeners() {
    try {
      // Tab switching
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const tab = e.target.dataset.tab;
          this.switchTab(tab);
        });
      });

      // Transfer player card clicks (for player details)
      document.querySelectorAll(".transfer-player-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          // Don't show player details if clicking on the offer button or its children
          if (
            e.target &&
            (e.target.classList.contains("transfer-player-card__offer-btn") ||
              e.target.closest(".transfer-player-card__offer-btn"))
          ) {
            return;
          }

          const playerId = card.getAttribute("data-player-id");
          const playerName = card.getAttribute("data-player-name");
          this.showPlayerDetailsById(playerId, playerName);
        });
      });

      // Offer card clicks (for offer details)
      document.querySelectorAll(".offer-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          // Don't show modal if clicking action buttons
          if (
            e.target &&
            (e.target.classList.contains("offer-card__accept") ||
              e.target.classList.contains("offer-card__reject"))
          ) {
            return;
          }
          const offerData = card.getAttribute("data-offer");
          if (offerData) {
            const offer = JSON.parse(offerData);
            this.showOfferDetails(offer);
          }
        });
      });

      // Accept offer buttons
      document.querySelectorAll(".offer-card__accept").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const offerId = btn.getAttribute("data-offer-id");
          this.acceptOffer(offerId);
        });
      });

      // Reject offer buttons
      document.querySelectorAll(".offer-card__reject").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const offerId = btn.getAttribute("data-offer-id");
          this.rejectOffer(offerId);
        });
      });

      // Transfer offer buttons
      document
        .querySelectorAll(".transfer-player-card__offer-btn")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const playerId = btn.getAttribute("data-player-id");
            const playerName = btn.getAttribute("data-player-name");
            const suggestedPrice = parseFloat(
              btn.getAttribute("data-suggested-price")
            );

            if (playerId && playerName) {
              this.makeTransferOffer(playerId, playerName, suggestedPrice);
            } else {
              console.error("Missing player data for transfer offer button");
            }
          });
        });

      console.log("Transfer market event listeners attached");
    } catch (error) {
      console.error("Error attaching transfer event listeners:", error);
    }
  },

  /**
   * Switch between transfer market tabs
   *
   * This function handles switching between available players, received offers, and sent offers tabs.
   *
   * @param {string} tab - Tab to switch to
   * @returns {void}
   */
  switchTab(tab) {
    try {
      // Update tab buttons
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.toggle("tab-btn--active", btn.dataset.tab === tab);
      });

      // Show/hide sections
      const availableSection = document.getElementById(
        "availablePlayersSection"
      );
      const receivedSection = document.getElementById("receivedOffersSection");
      const sentSection = document.getElementById("sentOffersSection");

      // Hide all sections first
      if (availableSection) availableSection.style.display = "none";
      if (receivedSection) receivedSection.style.display = "none";
      if (sentSection) sentSection.style.display = "none";

      // Show the selected section
      switch (tab) {
        case "available":
          if (availableSection) availableSection.style.display = "block";
          break;
        case "received":
          if (receivedSection) receivedSection.style.display = "block";
          break;
        case "sent":
          if (sentSection) sentSection.style.display = "block";
          break;
        default:
          console.warn(`Unknown tab: ${tab}`);
      }

      console.log(`Switched to ${tab} tab`);
    } catch (error) {
      console.error("Error switching tab:", error);
      window.DOMHelpers.showNotification("Error switching tab", "error");
    }
  },

  /**
   * Show player details modal
   *
   * This function displays detailed player information in a modal dialog.
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
   * Show player details modal by ID
   *
   * This function fetches player data by ID and displays it in a modal dialog.
   *
   * @param {string} playerId - Player ID to fetch
   * @param {string} playerName - Player name for fallback
   * @returns {void}
   */
  async showPlayerDetailsById(playerId, playerName) {
    try {
      if (!playerId) {
        window.DOMHelpers.showNotification("Player ID not found", "error");
        return;
      }

      // Fetch player data from database
      const allPlayers = await window.DatabaseService.getAllPlayers();
      const player = allPlayers.find((p) => p.id == playerId);

      if (!player) {
        window.DOMHelpers.showNotification(
          `Player ${playerName} not found`,
          "error"
        );
        return;
      }

      this.showPlayerDetails(player);
    } catch (error) {
      console.error("Error showing player details by ID:", error);
      window.DOMHelpers.showNotification(
        "Error loading player details",
        "error"
      );
    }
  },

  /**
   * Show offer details modal
   *
   * This function displays detailed transfer offer information in a modal dialog.
   *
   * @param {Object} offer - Offer object to display
   * @returns {void}
   */
  showOfferDetails(offer) {
    try {
      if (!offer) {
        throw new Error("No offer data provided to showOfferDetails");
      }

      const modalContent = this.generateOfferDetailsHTML(offer);
      window.ModalHelpers.showModal("Transfer Offer Details", modalContent);
    } catch (error) {
      console.error("Error showing offer details:", error);
      window.DOMHelpers.showNotification(
        "Error showing offer details",
        "error"
      );
    }
  },

  /**
   * Generate HTML for offer details modal
   *
   * This function creates the HTML content for the offer details modal.
   *
   * @param {Object} offer - Offer object
   * @returns {string} - HTML string for the modal content
   */
  generateOfferDetailsHTML(offer) {
    // Simplified offer details for basic offer structure
    const playerId = offer.player_id || "Unknown";
    const fromUserId = offer.from_user_id || "Unknown";
    const toUserId = offer.to_user_id || "No recipient";
    const offerAmount = offer.offer_amount || 0;
    const message = offer.message || "No message";
    const status = offer.status || "pending";
    const createdAt = offer.created_at
      ? new Date(offer.created_at).toLocaleString()
      : "Unknown";

    return `
      <div class="offer-details">
        <div class="offer-details__header">
          <h3 class="offer-details__player">Player ID: ${playerId}</h3>
          <div class="offer-details__team">From User: ${fromUserId}</div>
          <div class="offer-details__transfer-price">Transfer Fee: $${offerAmount.toLocaleString()}</div>
        </div>
        
        <div class="offer-details__info">
          <div class="info-section">
            <h4 class="info-section__title">Offer Information</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">Player ID:</span>
                <span class="info-item__value">${playerId}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">From User:</span>
                <span class="info-item__value">${fromUserId}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">To User:</span>
                <span class="info-item__value">${toUserId}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Offer Amount:</span>
                <span class="info-item__value">$${offerAmount.toLocaleString()}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Status:</span>
                <span class="info-item__value status-${status}">${status.toUpperCase()}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Created:</span>
                <span class="info-item__value">${createdAt}</span>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <h4 class="info-section__title">Message</h4>
            <div class="message-content">
              ${message}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Accept an offer for one of your players
   *
   * This function handles accepting a received transfer offer.
   *
   * @param {string} offerId - ID of the offer
   * @returns {Promise<void>}
   */
  async acceptOffer(offerId) {
    try {
      if (!offerId) {
        throw new Error("Offer ID is required");
      }

      const confirmed = confirm(
        `Accept this transfer offer?\n\nThis will transfer the player and add the money to your team budget.`
      );

      if (!confirmed) {
        return;
      }

      // Show loading state
      const acceptButton = document.querySelector(
        `[data-offer-id="${offerId}"].offer-card__accept`
      );
      if (acceptButton) {
        acceptButton.disabled = true;
        acceptButton.textContent = "Processing...";
      }

      // Accept the offer using the transfer offers service
      const result = await window.TransferOffersService.acceptOffer(offerId);

      if (result.success) {
        window.DOMHelpers.showNotification(
          "Transfer offer accepted! Player transferred and money added to your budget.",
          "success"
        );

        // Remove the offer from the list
        this.removeOfferFromList(offerId);

        // Refresh the transfer market to show updated data
        await this.generateTransferMarket();
      } else {
        throw new Error(result.error || "Failed to accept offer");
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      window.DOMHelpers.showNotification(
        error.message || "Error accepting offer",
        "error"
      );
    } finally {
      // Reset button state
      const acceptButton = document.querySelector(
        `[data-offer-id="${offerId}"].offer-card__accept`
      );
      if (acceptButton) {
        acceptButton.disabled = false;
        acceptButton.textContent = "Accept";
      }
    }
  },

  /**
   * Reject an offer for one of your players
   *
   * This function handles rejecting a received transfer offer.
   *
   * @param {string} offerId - ID of the offer
   * @returns {Promise<void>}
   */
  async rejectOffer(offerId) {
    try {
      if (!offerId) {
        throw new Error("Offer ID is required");
      }

      const confirmed = confirm(`Reject this transfer offer?`);

      if (!confirmed) {
        return;
      }

      // Show loading state
      const rejectButton = document.querySelector(
        `[data-offer-id="${offerId}"].offer-card__reject`
      );
      if (rejectButton) {
        rejectButton.disabled = true;
        rejectButton.textContent = "Processing...";
      }

      // Reject the offer using the transfer offers service
      const result = await window.TransferOffersService.rejectOffer(offerId);

      if (result.success) {
        window.DOMHelpers.showNotification("Transfer offer rejected.", "info");

        // Remove the offer from the list
        this.removeOfferFromList(offerId);
      } else {
        throw new Error(result.error || "Failed to reject offer");
      }
    } catch (error) {
      console.error("Error rejecting offer:", error);
      window.DOMHelpers.showNotification(
        error.message || "Error rejecting offer",
        "error"
      );
    } finally {
      // Reset button state
      const rejectButton = document.querySelector(
        `[data-offer-id="${offerId}"].offer-card__reject`
      );
      if (rejectButton) {
        rejectButton.disabled = false;
        rejectButton.textContent = "Reject";
      }
    }
  },

  /**
   * Remove an offer from the offers list
   *
   * This function removes a specific offer from the displayed offers list.
   *
   * @param {string} offerId - ID of the offer
   * @returns {void}
   */
  removeOfferFromList(offerId) {
    try {
      const offerCard = document.querySelector(`[data-offer-id="${offerId}"]`);
      if (offerCard) {
        offerCard.remove();
      }
    } catch (error) {
      console.error("Error removing offer from list:", error);
    }
  },

  /**
   * Filter available players by position
   *
   * This function filters the displayed players based on their position.
   *
   * @param {string} position - Position to filter by
   * @returns {void}
   */
  filterByPosition(position) {
    try {
      this.currentFilter = position;

      const playerCards = document.querySelectorAll(".transfer-player-card");
      playerCards.forEach((card) => {
        const playerPosition = card.querySelector(".player-card__position");
        if (
          position === "all" ||
          !playerPosition ||
          playerPosition.textContent === position
        ) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });

      console.log(`Filtered transfer players by position: ${position}`);
    } catch (error) {
      console.error("Error filtering players by position:", error);
      window.DOMHelpers.showNotification("Error filtering players", "error");
    }
  },

  /**
   * Sort players by price or rating
   *
   * This function sorts the displayed players based on the specified criteria.
   *
   * @param {string} criteria - Sort criteria (price, rating, name)
   * @param {boolean} ascending - Sort direction
   * @returns {void}
   */
  sortPlayers(criteria, ascending = true) {
    try {
      this.currentSort = criteria;
      this.currentSortDirection = ascending ? "asc" : "desc";

      const container = document.getElementById("availableTransferPlayers");
      if (!container) return;

      const cards = Array.from(
        container.querySelectorAll(".transfer-player-card")
      );

      cards.sort((a, b) => {
        let valueA, valueB;

        switch (criteria) {
          case "price":
            valueA = parseInt(
              a
                .querySelector(".transfer-player-card__price")
                .textContent.replace(/[$,]/g, "")
            );
            valueB = parseInt(
              b
                .querySelector(".transfer-player-card__price")
                .textContent.replace(/[$,]/g, "")
            );
            break;
          case "rating":
            valueA = parseInt(
              a.querySelector(".transfer-player-card__overall").textContent
            );
            valueB = parseInt(
              b.querySelector(".transfer-player-card__overall").textContent
            );
            break;
          case "name":
            valueA = a
              .querySelector(".transfer-player-card__name")
              .textContent.toLowerCase();
            valueB = b
              .querySelector(".transfer-player-card__name")
              .textContent.toLowerCase();
            break;
          default:
            return 0;
        }

        if (ascending) {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });

      // Re-append sorted cards
      cards.forEach((card) => container.appendChild(card));

      console.log(
        `Sorted transfer players by ${criteria} (${
          ascending ? "ascending" : "descending"
        })`
      );
    } catch (error) {
      console.error("Error sorting transfer players:", error);
      window.DOMHelpers.showNotification("Error sorting players", "error");
    }
  },

  /**
   * Search players by name
   *
   * This function filters players based on a search term.
   *
   * @param {string} searchTerm - Search term
   * @returns {void}
   */
  searchPlayers(searchTerm) {
    try {
      this.searchTerm = searchTerm;

      const playerCards = document.querySelectorAll(".transfer-player-card");
      const searchLower = searchTerm.toLowerCase();

      playerCards.forEach((card) => {
        const playerName = card
          .querySelector(".transfer-player-card__name")
          .textContent.toLowerCase();
        if (playerName.includes(searchLower) || searchTerm === "") {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });

      console.log(`Searched transfer players with term: "${searchTerm}"`);
    } catch (error) {
      console.error("Error searching transfer players:", error);
      window.DOMHelpers.showNotification("Error searching players", "error");
    }
  },

  /**
   * Get current filter and sort state
   *
   * This function returns the current state of filters and sorting.
   *
   * @returns {Object} - Current state
   */
  getCurrentState() {
    return {
      currentFilter: this.currentFilter,
      currentSort: this.currentSort,
      currentSortDirection: this.currentSortDirection,
      searchTerm: this.searchTerm,
    };
  },

  /**
   * Reset all filters and sorting
   *
   * This function resets all filters and sorting to their default state.
   *
   * @returns {void}
   */
  resetFilters() {
    try {
      this.currentFilter = "all";
      this.currentSort = "overall";
      this.currentSortDirection = "desc";
      this.searchTerm = "";

      // Show all players
      const playerCards = document.querySelectorAll(".transfer-player-card");
      playerCards.forEach((card) => {
        card.style.display = "block";
      });

      // Regenerate transfer market with default sorting
      this.generateTransferMarket();

      console.log("Transfer market filters and sorting reset");
    } catch (error) {
      console.error("Error resetting transfer market filters:", error);
      window.DOMHelpers.showNotification("Error resetting filters", "error");
    }
  },

  /**
   * Make a transfer offer for a player
   *
   * This function opens the transfer offer modal for the specified player.
   *
   * @param {string} playerId - The ID of the player
   * @param {string} playerName - The name of the player
   * @param {number} suggestedPrice - The suggested transfer price
   */
  makeTransferOffer(playerId, playerName, suggestedPrice) {
    try {
      // Validate input parameters
      if (!playerId || !playerName) {
        throw new Error("Player ID and name are required for transfer offer");
      }

      if (suggestedPrice && (isNaN(suggestedPrice) || suggestedPrice < 0)) {
        throw new Error("Invalid suggested price provided");
      }

      // Debug: Check player transfer data
      if (
        window.TransferOffersService &&
        typeof window.TransferOffersService.debugPlayerTransfer === "function"
      ) {
        window.TransferOffersService.debugPlayerTransfer(playerId).then(
          (debugInfo) => {
            console.log("Debug info for player", playerId, ":", debugInfo);
          }
        );
      }

      // Use the modal helper to show the transfer offer modal
      window.ModalHelpers.showTransferOfferModal({
        playerId: playerId,
        playerName: playerName,
        suggestedPrice: suggestedPrice || 0,
      });

      console.log(`Opening transfer offer for ${playerName} (ID: ${playerId})`);
    } catch (error) {
      console.error("Error opening transfer offer modal:", error);
      window.DOMHelpers.showNotification("Error opening offer form", "error");
    }
  },

  /**
   * Handle transfer offer form submission
   *
   * This function processes the transfer offer form submission with validation
   * and error handling.
   *
   * @param {Event} event - Form submission event
   * @returns {Promise<void>}
   */
  async handleTransferOfferSubmission(event) {
    event.preventDefault();

    let form = null;
    let submitButton = null;

    try {
      // Get form data
      form = event.target;
      const formData = new FormData(form);
      const offerAmount = parseFloat(formData.get("offerAmount"));
      const message = formData.get("message") || "";

      // Validate form data
      const validationResult = this.validateTransferOfferForm(
        offerAmount,
        message
      );
      if (!validationResult.isValid) {
        window.DOMHelpers.showNotification(validationResult.error, "error");
        return;
      }

      // Check if we have current transfer offer data
      if (!window.currentTransferOffer) {
        throw new Error("No transfer offer data found");
      }

      // Show loading state
      submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      // Create offer data
      const offerData = {
        playerId: window.currentTransferOffer.playerId,
        offerAmount: offerAmount,
        message: message.trim(),
      };

      // Submit the offer
      const result = await window.TransferOffersService.createOffer(offerData);

      if (result.success) {
        window.DOMHelpers.showNotification(
          `Transfer offer submitted for ${window.currentTransferOffer.playerName}`,
          "success"
        );

        // Close the modal
        window.ModalHelpers.closeTransferOfferModal();

        // Refresh the transfer market if needed
        // this.refreshTransferMarket();
      } else {
        throw new Error(result.error || "Failed to submit transfer offer");
      }
    } catch (error) {
      console.error("Error submitting transfer offer:", error);
      window.DOMHelpers.showNotification(
        error.message || "Error submitting transfer offer",
        "error"
      );
    } finally {
      // Reset button state
      if (form && submitButton) {
        submitButton.disabled = false;
        submitButton.textContent =
          submitButton.getAttribute("data-original-text") || "Make Offer";
      }
    }
  },

  /**
   * Validate transfer offer form data
   *
   * @param {number} offerAmount - Offer amount
   * @param {string} message - Optional message
   * @returns {Object} - Validation result with isValid and error properties
   */
  validateTransferOfferForm(offerAmount, message) {
    // Check if offer amount is valid
    if (isNaN(offerAmount) || offerAmount <= 0) {
      return {
        isValid: false,
        error: "Please enter a valid offer amount greater than 0",
      };
    }

    // Check if offer amount is too high (optional business logic)
    if (offerAmount > 10000000) {
      return {
        isValid: false,
        error: "Offer amount cannot exceed $10,000,000",
      };
    }

    // Check message length if provided
    if (message && message.length > 500) {
      return {
        isValid: false,
        error: "Message cannot exceed 500 characters",
      };
    }

    return { isValid: true };
  },

  /**
   * Initialize transfer offer form event listeners
   *
   * This function sets up event listeners for the transfer offer form.
   *
   * @returns {void}
   */
  initializeTransferOfferForm() {
    try {
      const form = document.getElementById("transferOfferForm");
      if (!form) {
        console.warn("Transfer offer form not found");
        return;
      }

      // Remove existing event listeners to prevent duplicates
      form.removeEventListener(
        "submit",
        this.handleTransferOfferSubmission.bind(this)
      );

      // Add form submission handler
      form.addEventListener(
        "submit",
        this.handleTransferOfferSubmission.bind(this)
      );

      // Add input validation for real-time feedback
      const offerAmountInput = document.getElementById("offerAmount");
      if (offerAmountInput) {
        offerAmountInput.addEventListener("input", (e) => {
          const value = parseFloat(e.target.value);
          if (value && (value < 0 || value > 10000000)) {
            e.target.setCustomValidity(
              "Amount must be between $0 and $10,000,000"
            );
          } else {
            e.target.setCustomValidity("");
          }
        });

        // Add focus handling for better UX
        offerAmountInput.addEventListener("focus", () => {
          if (offerAmountInput.value === "0") {
            offerAmountInput.select();
          }
        });
      }

      // Add message character counter
      const messageInput = document.getElementById("offerMessage");
      if (messageInput) {
        messageInput.addEventListener("input", (e) => {
          const length = e.target.value.length;
          const maxLength = 500;

          // Update character count if there's a counter element
          const counter = document.getElementById("messageCounter");
          if (counter) {
            counter.textContent = `${length}/${maxLength}`;
            counter.style.color = length > maxLength ? "#e74c3c" : "#666";
          }
        });
      }

      console.log("Transfer offer form event listeners initialized");
    } catch (error) {
      console.error("Error initializing transfer offer form:", error);
    }
  },

  /**
   * Check if transfer offer modal is ready
   *
   * This function checks if all required elements for the transfer offer modal
   * are present and ready for use.
   *
   * @returns {boolean} - True if modal is ready
   */
  isTransferOfferModalReady() {
    try {
      const modal = document.getElementById("transferOfferModal");
      const form = document.getElementById("transferOfferForm");
      const amountInput = document.getElementById("offerAmount");
      const messageInput = document.getElementById("offerMessage");

      return !!(modal && form && amountInput && messageInput);
    } catch (error) {
      console.error("Error checking transfer offer modal readiness:", error);
      return false;
    }
  },

  /**
   * Reset transfer offer form to default state
   *
   * This function resets the transfer offer form and clears any error states.
   *
   * @returns {void}
   */
  resetTransferOfferForm() {
    try {
      const form = document.getElementById("transferOfferForm");
      if (form) {
        form.reset();

        // Clear any custom validity messages
        const inputs = form.querySelectorAll("input, textarea");
        inputs.forEach((input) => {
          input.setCustomValidity("");
        });
      }

      // Clear stored transfer offer data
      if (window.currentTransferOffer) {
        delete window.currentTransferOffer;
      }

      console.log("Transfer offer form reset");
    } catch (error) {
      console.error("Error resetting transfer offer form:", error);
    }
  },
};

// Export to global scope for use throughout the application
window.TransferMarket = TransferMarket;

// Make functions globally available
window.closeTransferOfferModal = () => {
  window.ModalHelpers.closeTransferOfferModal();
};
