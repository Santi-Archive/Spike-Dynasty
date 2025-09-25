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
   * Generate HTML for a single player card
   *
   * This function creates the HTML for a single player card in the transfer market.
   *
   * @param {Object} player - Player object
   * @returns {string} - HTML string for the player card
   */
  generatePlayerCardHTML(player) {
    const transferPrice = this.calculateTransferPrice(player);

    return `
            <div class="transfer-player-card" data-player-id="${
              player.id
            }" data-player-name="${player.player_name}">
                <div class="transfer-player-card__top">
                    <div class="transfer-player-card__face">👤</div>
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
      // Get actual offers from database
      const transfers = await window.DatabaseService.getTransfers();
      const pendingOffers = transfers.filter(
        (transfer) => transfer.status === "pending"
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
      // For now, return empty state - this would be populated with actual sent offers
      return '<div class="no-offers">No sent offers.</div>';
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
    return `
            <div class="offer-card" data-offer='${JSON.stringify(offer)}'>
                <div class="offer-card__top">
                    <div class="offer-card__info">
                        <div class="offer-card__player">${offer.player}</div>
                        <div class="offer-card__team">${offer.team}</div>
                    </div>
                    <div class="offer-card__amount">$${offer.amount.toLocaleString()}</div>
                </div>
                <div class="offer-card__actions">
                    <button class="btn btn--success offer-card__accept" data-player="${
                      offer.player
                    }" data-amount="${offer.amount}">Accept</button>
                    <button class="btn btn--danger offer-card__reject" data-player="${
                      offer.player
                    }">Reject</button>
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
          const playerName = btn.getAttribute("data-player");
          const amount = btn.getAttribute("data-amount");
          this.acceptOffer(playerName, amount);
        });
      });

      // Reject offer buttons
      document.querySelectorAll(".offer-card__reject").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const playerName = btn.getAttribute("data-player");
          this.rejectOffer(playerName);
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
    const currentContract = offer.currentContract;
    const offeredContract = offer.offeredContract;

    return `
      <div class="offer-details">
        <div class="offer-details__header">
          <h3 class="offer-details__player">${offer.player}</h3>
          <div class="offer-details__team">${offer.team}</div>
          <div class="offer-details__transfer-price">Transfer Fee: $${offer.amount.toLocaleString()}</div>
        </div>
        
        <div class="offer-details__contracts">
          <div class="contract-comparison">
            <div class="contract-card contract-card--current">
              <h4 class="contract-card__title">Current Contract</h4>
              <div class="contract-card__details">
                <div class="contract-detail">
                  <span class="contract-detail__label">Position:</span>
                  <span class="contract-detail__value">${
                    currentContract.position
                  }</span>
                </div>
                <div class="contract-detail">
                  <span class="contract-detail__label">Overall Rating:</span>
                  <span class="contract-detail__value">${
                    currentContract.overall
                  }</span>
                </div>
                <div class="contract-detail">
                  <span class="contract-detail__label">Salary:</span>
                  <span class="contract-detail__value">$${currentContract.salary.toLocaleString()}/year</span>
                </div>
                <div class="contract-detail">
                  <span class="contract-detail__label">Duration:</span>
                  <span class="contract-detail__value">${
                    currentContract.duration
                  } year${currentContract.duration > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
            
            <div class="contract-card contract-card--offered">
              <h4 class="contract-card__title">Offered Contract</h4>
              <div class="contract-card__details">
                <div class="contract-detail">
                  <span class="contract-detail__label">Position:</span>
                  <span class="contract-detail__value">${
                    offeredContract.position
                  }</span>
                </div>
                <div class="contract-detail">
                  <span class="contract-detail__label">Overall Rating:</span>
                  <span class="contract-detail__value">${
                    offeredContract.overall
                  }</span>
                </div>
                <div class="contract-detail">
                  <span class="contract-detail__label">Salary:</span>
                  <span class="contract-detail__value">$${offeredContract.salary.toLocaleString()}/year</span>
                </div>
                <div class="contract-detail">
                  <span class="contract-detail__label">Duration:</span>
                  <span class="contract-detail__value">${
                    offeredContract.duration
                  } year${offeredContract.duration > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="offer-details__summary">
          <div class="summary-item">
            <span class="summary-item__label">Salary Difference:</span>
            <span class="summary-item__value ${
              offeredContract.salary > currentContract.salary
                ? "positive"
                : "negative"
            }">
              ${offeredContract.salary > currentContract.salary ? "+" : ""}$${(
      offeredContract.salary - currentContract.salary
    ).toLocaleString()}/year
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Contract Length:</span>
            <span class="summary-item__value ${
              offeredContract.duration > currentContract.duration
                ? "positive"
                : "negative"
            }">
              ${
                offeredContract.duration > currentContract.duration ? "+" : ""
              }${offeredContract.duration - currentContract.duration} year${
      Math.abs(offeredContract.duration - currentContract.duration) > 1
        ? "s"
        : ""
    }
            </span>
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
   * @param {string} playerName - Name of the player
   * @param {string} amount - Offer amount
   * @returns {void}
   */
  acceptOffer(playerName, amount) {
    try {
      const confirmed = confirm(
        `Accept offer for ${playerName}?\nAmount: $${Number(
          amount
        ).toLocaleString()}\n\nThis player will be transferred to the offering team.`
      );

      if (confirmed) {
        window.DOMHelpers.showNotification(
          `Offer accepted for ${playerName} - $${Number(
            amount
          ).toLocaleString()}`,
          "success"
        );

        // Remove the offer from the list
        this.removeOfferFromList(playerName);

        // In a real app, this would process the transfer
        console.log("Offer accepted:", { player: playerName, amount });
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      window.DOMHelpers.showNotification("Error accepting offer", "error");
    }
  },

  /**
   * Reject an offer for one of your players
   *
   * This function handles rejecting a received transfer offer.
   *
   * @param {string} playerName - Name of the player
   * @returns {void}
   */
  rejectOffer(playerName) {
    try {
      const confirmed = confirm(`Reject offer for ${playerName}?`);

      if (confirmed) {
        window.DOMHelpers.showNotification(
          `Offer rejected for ${playerName}`,
          "info"
        );

        // Remove the offer from the list
        this.removeOfferFromList(playerName);

        console.log("Offer rejected:", { player: playerName });
      }
    } catch (error) {
      console.error("Error rejecting offer:", error);
      window.DOMHelpers.showNotification("Error rejecting offer", "error");
    }
  },

  /**
   * Remove an offer from the offers list
   *
   * This function removes a specific offer from the displayed offers list.
   *
   * @param {string} playerName - Name of the player
   * @returns {void}
   */
  removeOfferFromList(playerName) {
    try {
      const offerCards = document.querySelectorAll(".offer-card");
      offerCards.forEach((card) => {
        const playerNameElement = card.querySelector(".offer-card__player");
        if (playerNameElement && playerNameElement.textContent === playerName) {
          card.remove();
        }
      });
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
};

// Export to global scope for use throughout the application
window.TransferMarket = TransferMarket;
