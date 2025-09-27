/**
 * Modal Helpers - Utility functions for modal dialogs and overlays
 *
 * This module provides functions for creating and managing modal dialogs
 * throughout the Volleyball Manager application, including player details,
 * team information, and other overlay content.
 *
 * @fileoverview Modal management utilities with comprehensive error handling
 * @author Volleyball Manager Team
 * @version 0.2.0
 */

/**
 * Get country flag image path for player avatar
 */
function getCountryFlagPath(country) {
  if (!country) {
    return null;
  }

  // Clean country name to match file naming convention
  const cleanCountry = country.trim();

  // Check if flag file exists by attempting to construct the path
  const flagPath = `database/flags/${cleanCountry}.png`;

  return flagPath;
}

/**
 * Create country flag avatar element for modal
 */
function createCountryFlagAvatar(country, playerName) {
  const flagPath = getCountryFlagPath(country);

  if (flagPath) {
    const img = document.createElement("img");
    img.src = flagPath;
    img.alt = `${country} flag`;
    img.className = "modal__flag-avatar";
    img.onerror = () => {
      // Fallback to emoji if flag fails to load
      img.style.display = "none";
      const fallbackDiv = document.createElement("div");
      fallbackDiv.className = "modal__avatar-fallback";
      fallbackDiv.textContent = "👤";
      img.parentNode.appendChild(fallbackDiv);
    };
    return img;
  }

  // Fallback to emoji if no country
  const fallbackDiv = document.createElement("div");
  fallbackDiv.className = "modal__avatar-fallback";
  fallbackDiv.textContent = "👤";
  return fallbackDiv;
}

/**
 * Get player initials for avatar (fallback)
 */
function getPlayerInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Show player details modal with comprehensive information
 *
 * This function creates and displays a detailed modal for a player,
 * including all stats, contract information, and personal details.
 * The modal is responsive and includes proper error handling.
 *
 * @param {Object} player - Player object to display
 * @returns {void}
 */
function showPlayerModal(player) {
  // Validate player object
  if (!player) {
    console.error("No player data provided to showPlayerModal");
    return;
  }

  const modal = document.getElementById("playerModal");
  const modalContent = modal.querySelector(".modal__content");

  if (!modal || !modalContent) {
    console.error("Modal elements not found");
    return;
  }

  // Extract contract information from database fields
  const contractYears = player.contract_years || null;
  const monthlyWages = player.monthly_wage || null;
  const playerValue = player.player_value || null;
  const currentTeam = player.teams?.team_name || null;

  // Determine team status
  const teamStatus = player.team_id
    ? currentTeam || "Unknown Team"
    : "Free Agent";

  // Check if any contract information exists
  const contractHasAny =
    contractYears !== null ||
    monthlyWages !== null ||
    playerValue !== null ||
    currentTeam !== null;

  // Generate contract section HTML if contract data exists
  const contractSection = contractHasAny
    ? `
        <div class="modal__contract">
            <h4 class="modal__contract-title">Contract Details</h4>
            <div class="modal__contract-info">
                ${
                  contractYears !== null
                    ? `
                <div class="modal__contract-item">
                    <div class="modal__contract-label">Contract Years</div>
                    <div class="modal__contract-value">${contractYears} years</div>
                </div>`
                    : ""
                }
                ${
                  monthlyWages !== null
                    ? `
                <div class="modal__contract-item">
                    <div class="modal__contract-label">Monthly Wages</div>
                    <div class="modal__contract-value">$${Number(
                      monthlyWages
                    ).toLocaleString()}</div>
                </div>`
                    : ""
                }
                ${
                  playerValue !== null
                    ? `
                <div class="modal__contract-item">
                    <div class="modal__contract-label">Player Value</div>
                    <div class="modal__contract-value">$${Number(
                      playerValue
                    ).toLocaleString()}</div>
                </div>`
                    : ""
                }
                ${
                  currentTeam !== null
                    ? `
                <div class="modal__contract-item">
                    <div class="modal__contract-label">Current Team</div>
                    <div class="modal__contract-value">${currentTeam}</div>
                </div>`
                    : ""
                }
            </div>
        </div>
        `
    : "";

  // Generate modal content HTML
  modalContent.innerHTML = `
        <div class="modal__header">
            <h2 class="modal__title">Player Details</h2>
            <button class="modal__close" onclick="closePlayerModal()">&times;</button>
        </div>
        <div class="modal__player-info">
            <div class="modal__player-face"></div>
            <div class="modal__player-details">
                <h3 class="modal__player-name">${
                  player.player_name || "Unknown Player"
                }</h3>
                <div class="player-card__position" data-position="${
                  player.position || "Unknown"
                }">${player.position || "Unknown Position"}</div>
            </div>
        </div>
        <div class="modal__team-info">
            <div class="modal__team-item">
                <div class="modal__team-label">Current Team</div>
                <div class="modal__team-value">${teamStatus}</div>
            </div>
        </div>
        <div class="modal__player-meta">
            <div class="modal__meta-item">
                <div class="modal__meta-label">Age</div>
                <div class="modal__meta-value">${player.age || "N/A"}</div>
            </div>
            <div class="modal__meta-item">
                <div class="modal__meta-label">Jersey</div>
                <div class="modal__meta-value">#${
                  player.jersey_number || "N/A"
                }</div>
            </div>
            <div class="modal__meta-item">
                <div class="modal__meta-label">Nationality</div>
                <div class="modal__meta-value">${player.country || "N/A"}</div>
            </div>
            <div class="modal__meta-item">
                <div class="modal__meta-label">Overall</div>
                <div class="modal__meta-value modal__meta-value--highlight">${
                  player.overall || "N/A"
                }</div>
            </div>
        </div>
        <div class="modal__stats">
            <div class="modal__stat">
                <div class="modal__stat-value">${player.attack || "N/A"}</div>
                <div class="modal__stat-label">Attack</div>
            </div>
            <div class="modal__stat">
                <div class="modal__stat-value">${player.defense || "N/A"}</div>
                <div class="modal__stat-label">Defense</div>
            </div>
            <div class="modal__stat">
                <div class="modal__stat-value">${player.serve || "N/A"}</div>
                <div class="modal__stat-label">Serve</div>
            </div>
            <div class="modal__stat">
                <div class="modal__stat-value">${player.block || "N/A"}</div>
                <div class="modal__stat-label">Block</div>
            </div>
            <div class="modal__stat">
                <div class="modal__stat-value">${player.receive || "N/A"}</div>
                <div class="modal__stat-label">Receive</div>
            </div>
            <div class="modal__stat">
                <div class="modal__stat-value">${player.setting || "N/A"}</div>
                <div class="modal__stat-label">Setting</div>
            </div>
        </div>
        ${contractSection}
    `;

  // Insert country flag avatar into the modal
  const playerFaceContainer = modalContent.querySelector(".modal__player-face");
  if (playerFaceContainer) {
    const avatarElement = createCountryFlagAvatar(
      player.country,
      player.player_name || "Unknown Player"
    );
    playerFaceContainer.appendChild(avatarElement);
  }

  // Show the modal
  modal.classList.add("modal--active");
}

/**
 * Close player details modal
 *
 * This function hides the player modal by removing the active class.
 *
 * @returns {void}
 */
function closePlayerModal() {
  const modal = document.getElementById("playerModal");
  if (modal) {
    modal.classList.remove("modal--active");
  }
}

/**
 * Show team details modal with comprehensive information
 *
 * This function creates and displays a detailed modal for a team,
 * including team statistics, league information, and performance data.
 *
 * @param {Object} team - Team object to display
 * @returns {void}
 */
async function showTeamModal(team) {
  // Validate team object
  if (!team) {
    console.error("No team data provided to showTeamModal");
    return;
  }

  const modal = document.getElementById("teamModal");
  const modalContent = modal.querySelector(".modal__content");

  if (!modal || !modalContent) {
    console.error("Team modal elements not found");
    return;
  }

  try {
    // Get team statistics from database
    const teamStats = await window.DatabaseService.getTeamStatisticsOptimized(
      team.id
    );
    console.log("Team stats for modal:", teamStats);

    // Get league name from team data
    const leagueName = team.leagues?.league_name || "Unknown League";

    // Generate team modal content HTML
    modalContent.innerHTML = `
          <div class="modal__header">
              <h2 class="modal__title">Team Details</h2>
              <button class="modal__close" onclick="closeTeamModal()">&times;</button>
          </div>
          <div class="modal__player-info">
              <div class="modal__player-face">🏐</div>
              <div class="modal__player-details">
                  <h3 class="modal__player-name">${
                    team.team_name || "Unknown Team"
                  }</h3>
                  <div class="player-card__position" data-position="Team">Professional Team</div>
              </div>
          </div>
          <div class="modal__player-meta">
              <div class="modal__meta-item">
                  <div class="modal__meta-label">League</div>
                  <div class="modal__meta-value">${leagueName}</div>
              </div>
              <div class="modal__meta-item">
                  <div class="modal__meta-label">Budget</div>
                  <div class="modal__meta-value">$${
                    team.team_money
                      ? Number(team.team_money).toLocaleString()
                      : "N/A"
                  }</div>
              </div>
              <div class="modal__meta-item">
                  <div class="modal__meta-label">Squad Size</div>
                  <div class="modal__meta-value">${
                    teamStats.squadSize || 0
                  }</div>
              </div>
              <div class="modal__meta-item">
                  <div class="modal__meta-label">Average Rating</div>
                  <div class="modal__meta-value modal__meta-value--highlight">${
                    teamStats.averageRating || "N/A"
                  }</div>
              </div>
          </div>
          <div class="modal__stats">
              <div class="modal__stat">
                  <div class="modal__stat-value">${
                    teamStats.matchesPlayed || 0
                  }</div>
                  <div class="modal__stat-label">Matches Played</div>
              </div>
              <div class="modal__stat">
                  <div class="modal__stat-value">${teamStats.wins || 0}</div>
                  <div class="modal__stat-label">Wins</div>
              </div>
              <div class="modal__stat">
                  <div class="modal__stat-value">${teamStats.losses || 0}</div>
                  <div class="modal__stat-label">Losses</div>
              </div>
              <div class="modal__stat">
                  <div class="modal__stat-value">${teamStats.points || 0}</div>
                  <div class="modal__stat-label">Points</div>
              </div>
              <div class="modal__stat">
                  <div class="modal__stat-value">${
                    teamStats.winRate || 0
                  }%</div>
                  <div class="modal__stat-label">Win Rate</div>
              </div>
              <div class="modal__stat">
                  <div class="modal__stat-value">${
                    teamStats.averageRating || "N/A"
                  }</div>
                  <div class="modal__stat-label">Avg Rating</div>
              </div>
          </div>
      `;

    // Show the modal
    modal.classList.add("modal--active");
  } catch (error) {
    console.error("Error loading team statistics for modal:", error);

    // Show basic team info even if stats fail to load
    modalContent.innerHTML = `
          <div class="modal__header">
              <h2 class="modal__title">Team Details</h2>
              <button class="modal__close" onclick="closeTeamModal()">&times;</button>
          </div>
          <div class="modal__player-info">
              <div class="modal__player-face">🏐</div>
              <div class="modal__player-details">
                  <h3 class="modal__player-name">${
                    team.team_name || "Unknown Team"
                  }</h3>
                  <div class="player-card__position" data-position="Team">Professional Team</div>
              </div>
          </div>
          <div class="modal__player-meta">
              <div class="modal__meta-item">
                  <div class="modal__meta-label">League</div>
                  <div class="modal__meta-value">${
                    team.leagues?.league_name || "Unknown League"
                  }</div>
              </div>
              <div class="modal__meta-item">
                  <div class="modal__meta-label">Budget</div>
                  <div class="modal__meta-value">$${
                    team.team_money
                      ? Number(team.team_money).toLocaleString()
                      : "N/A"
                  }</div>
              </div>
          </div>
          <div class="modal__stats">
              <div class="modal__stat">
                  <div class="modal__stat-value">N/A</div>
                  <div class="modal__stat-label">Statistics</div>
              </div>
              <div class="modal__stat">
                  <div class="modal__stat-value">N/A</div>
                  <div class="modal__stat-label">Not Available</div>
              </div>
          </div>
      `;

    // Show the modal
    modal.classList.add("modal--active");
  }
}

/**
 * Close team details modal
 *
 * This function hides the team modal by removing the active class.
 *
 * @returns {void}
 */
function closeTeamModal() {
  const modal = document.getElementById("teamModal");
  if (modal) {
    modal.classList.remove("modal--active");
  }
}

/**
 * Show a custom modal with provided content
 *
 * This function creates a generic modal that can display any HTML content.
 * Useful for confirmation dialogs, forms, or other custom content.
 *
 * @param {string} title - Modal title
 * @param {string} content - HTML content to display
 * @param {Array} buttons - Array of button objects with text and onclick handlers
 * @returns {void}
 */
function showCustomModal(title, content, buttons = []) {
  const modal = document.getElementById("playerModal"); // Reuse existing modal
  const modalContent = modal.querySelector(".modal__content");

  if (!modal || !modalContent) {
    console.error("Modal elements not found for custom modal");
    return;
  }

  // Generate buttons HTML
  const buttonsHTML = buttons
    .map(
      (button) =>
        `<button class="btn ${button.class || "btn--primary"}" onclick="${
          button.onclick
        }">${button.text}</button>`
    )
    .join("");

  // Generate modal content
  modalContent.innerHTML = `
        <div class="modal__header">
            <h2 class="modal__title">${title}</h2>
            <button class="modal__close" onclick="closePlayerModal()">&times;</button>
        </div>
        <div class="modal__body">
            ${content}
        </div>
        ${
          buttons.length > 0
            ? `<div class="modal__footer">${buttonsHTML}</div>`
            : ""
        }
    `;

  // Show the modal
  modal.classList.add("modal--active");
}

/**
 * Show a generic modal with provided content
 *
 * This function creates a modal that can display any HTML content.
 * It's a more flexible version of showCustomModal.
 *
 * @param {string} title - Modal title
 * @param {string} content - HTML content to display
 * @returns {void}
 */
function showModal(title, content) {
  const modal = document.getElementById("playerModal");
  const modalContent = modal.querySelector(".modal__content");

  if (!modal || !modalContent) {
    console.error("Modal elements not found for showModal");
    return;
  }

  // Generate modal content
  modalContent.innerHTML = `
        <div class="modal__header">
            <h2 class="modal__title">${title}</h2>
            <button class="modal__close" onclick="closePlayerModal()">&times;</button>
        </div>
        <div class="modal__body">
            ${content}
        </div>
    `;

  // Show the modal
  modal.classList.add("modal--active");
}

/**
 * Show a confirmation dialog
 *
 * This function creates a simple confirmation modal with Yes/No buttons.
 *
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Function to call if user confirms
 * @param {Function} onCancel - Function to call if user cancels (optional)
 * @returns {void}
 */
function showConfirmationModal(message, onConfirm, onCancel = null) {
  const buttons = [
    {
      text: "Yes",
      class: "btn--primary",
      onclick: `closePlayerModal(); (${onConfirm.toString()})();`,
    },
    {
      text: "No",
      class: "btn--secondary",
      onclick: `closePlayerModal(); ${
        onCancel ? `(${onCancel.toString()})();` : ""
      }`,
    },
  ];

  showCustomModal("Confirmation", `<p>${message}</p>`, buttons);
}

/**
 * Initialize modal event listeners
 *
 * This function sets up event listeners for modal interactions,
 * including clicking outside to close and keyboard navigation.
 *
 * @returns {void}
 */
function initializeModalEventListeners() {
  // Close player modal when clicking outside
  const playerModal = document.getElementById("playerModal");
  if (playerModal) {
    playerModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closePlayerModal();
      }
    });
  }

  // Close team modal when clicking outside
  const teamModal = document.getElementById("teamModal");
  if (teamModal) {
    teamModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeTeamModal();
      }
    });
  }

  // Close transfer offer modal when clicking outside
  const transferOfferModal = document.getElementById("transferOfferModal");
  if (transferOfferModal) {
    transferOfferModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeTransferOfferModal();
      }
    });
  }

  // Close modals with Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closePlayerModal();
      closeTeamModal();
      closeTransferOfferModal();
    }
  });

  console.log("Modal event listeners initialized");
}

/**
 * Check if any modal is currently open
 *
 * @returns {boolean} - True if any modal is open
 */
function isModalOpen() {
  const playerModal = document.getElementById("playerModal");
  const teamModal = document.getElementById("teamModal");
  const transferOfferModal = document.getElementById("transferOfferModal");

  return (
    (playerModal && playerModal.classList.contains("modal--active")) ||
    (teamModal && teamModal.classList.contains("modal--active")) ||
    (transferOfferModal &&
      transferOfferModal.classList.contains("modal--active"))
  );
}

/**
 * Close transfer offer modal
 *
 * This function hides the transfer offer modal and cleans up any state.
 *
 * @returns {void}
 */
function closeTransferOfferModal() {
  try {
    const modal = document.getElementById("transferOfferModal");
    if (modal) {
      modal.classList.remove("modal--active");
      document.body.style.overflow = "";

      // Use the transfer market's reset function for proper cleanup
      if (
        window.TransferMarket &&
        typeof window.TransferMarket.resetTransferOfferForm === "function"
      ) {
        window.TransferMarket.resetTransferOfferForm();
      } else {
        // Fallback cleanup
        const form = document.getElementById("transferOfferForm");
        if (form) {
          form.reset();
        }

        if (window.currentTransferOffer) {
          delete window.currentTransferOffer;
        }
      }

      console.log("Transfer offer modal closed");
    }
  } catch (error) {
    console.error("Error closing transfer offer modal:", error);
  }
}

/**
 * Show transfer offer modal
 *
 * This function displays the transfer offer modal for making offers.
 *
 * @param {Object} playerData - Player data for the offer
 * @param {string} playerData.playerId - Player ID
 * @param {string} playerData.playerName - Player name
 * @param {number} playerData.suggestedPrice - Suggested offer price
 * @returns {void}
 */
function showTransferOfferModal(playerData) {
  try {
    if (!playerData || !playerData.playerId || !playerData.playerName) {
      throw new Error("Invalid player data provided to transfer offer modal");
    }

    const modal = document.getElementById("transferOfferModal");
    if (!modal) {
      throw new Error("Transfer offer modal not found in DOM");
    }

    // Check if transfer market is ready
    if (
      window.TransferMarket &&
      typeof window.TransferMarket.isTransferOfferModalReady === "function"
    ) {
      if (!window.TransferMarket.isTransferOfferModalReady()) {
        throw new Error("Transfer offer modal is not ready");
      }
    }

    // Store the current player info for the offer
    window.currentTransferOffer = {
      playerId: playerData.playerId,
      playerName: playerData.playerName,
      suggestedPrice: playerData.suggestedPrice || 0,
    };

    // Set the suggested price in the form
    const offerAmountInput = document.getElementById("offerAmount");
    if (offerAmountInput) {
      offerAmountInput.value = playerData.suggestedPrice || 0;

      // Select the value for easy editing
      setTimeout(() => {
        offerAmountInput.focus();
        offerAmountInput.select();
      }, 100);
    }

    // Clear any previous form state
    const form = document.getElementById("transferOfferForm");
    if (form) {
      // Reset validation states
      const inputs = form.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        input.setCustomValidity("");
      });
    }

    // Show the modal
    modal.classList.add("modal--active");
    document.body.style.overflow = "hidden";

    console.log(
      `Transfer offer modal opened for ${playerData.playerName} (ID: ${playerData.playerId})`
    );
  } catch (error) {
    console.error("Error showing transfer offer modal:", error);
    window.DOMHelpers.showNotification("Error opening offer form", "error");
  }
}

/**
 * Close all open modals
 *
 * @returns {void}
 */
function closeAllModals() {
  closePlayerModal();
  closeTeamModal();
  closeTransferOfferModal();
}

// Export functions to global scope for use throughout the application
window.ModalHelpers = {
  showPlayerModal,
  closePlayerModal,
  showTeamModal,
  closeTeamModal,
  showCustomModal,
  showModal,
  showConfirmationModal,
  showTransferOfferModal,
  closeTransferOfferModal,
  initializeModalEventListeners,
  isModalOpen,
  closeAllModals,
};
