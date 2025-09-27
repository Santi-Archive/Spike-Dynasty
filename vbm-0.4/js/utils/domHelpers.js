/**
 * DOM Helpers - Utility functions for DOM manipulation and common UI operations
 *
 * This module provides reusable functions for common DOM operations, navigation,
 * and UI interactions throughout the Spike Dynasty application.
 *
 * @fileoverview DOM manipulation utilities with detailed comments
 * @author Spike Dynasty Team
 * @version 0.2.0
 */

/**
 * Show a specific page and update navigation state
 *
 * This function handles page navigation by hiding all pages, showing the target page,
 * updating navigation states, and initializing page-specific functionality.
 *
 * @param {string} pageId - The ID of the page to show (e.g., 'dashboard', 'team-management')
 * @returns {void}
 */
function showPage(pageId) {
  // Hide all pages by removing the active class
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("page--active");
  });

  // Remove active class from all navigation items
  document.querySelectorAll(".sidebar__nav-item").forEach((item) => {
    item.classList.remove("sidebar__nav-item--active");
  });

  // Show the target page by adding the active class
  document.getElementById(pageId).classList.add("page--active");

  // Add active class to the clicked navigation item
  if (event && event.target) {
    event.target.classList.add("sidebar__nav-item--active");
  }

  // Initialize page-specific functionality based on the page ID
  if (pageId === "dashboard") {
    window.Dashboard.initialize();
  } else if (pageId === "team-management") {
    window.TeamManagement.initialize();
  } else if (pageId === "squad-selection") {
    // Handle async initialization for squad selection
    window.SquadSelection.initialize().catch((error) => {
      console.error("Error initializing squad selection:", error);
    });
  } else if (pageId === "standings") {
    // Handle async initialization for standings
    window.Standings.initialize().catch((error) => {
      console.error("Error initializing standings:", error);
    });
  } else if (pageId === "transfer-market") {
    window.TransferMarket.initialize();
  }

  // Close mobile menu if open (for responsive design)
  if (window.innerWidth <= 768) {
    document.getElementById("sidebar").classList.remove("sidebar--open");
  }
}

/**
 * Toggle mobile menu visibility
 *
 * This function handles the mobile menu toggle for responsive navigation.
 * It adds or removes the 'sidebar--open' class to show/hide the sidebar.
 *
 * @returns {void}
 */
function toggleMobileMenu() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("sidebar--open");
}

/**
 * Create and display a notification message
 *
 * This function creates a temporary notification that appears in the top-right
 * corner of the screen with different styles based on the notification type.
 *
 * @param {string} message - The notification message to display
 * @param {string} type - The type of notification ('success', 'error', 'info')
 * @returns {void}
 */
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");

  // Set notification styles based on type
  notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${
          type === "success"
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : type === "error"
            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
        };
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

  // Set notification content
  notification.textContent = message;

  // Add notification to the page
  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Get position abbreviation for display purposes
 *
 * This function converts full position names to abbreviated forms
 * for use in compact displays like player cards and squad selection.
 *
 * @param {string} position - Full position name (e.g., 'Outside Hitter', 'Setter')
 * @returns {string} - Abbreviated position (e.g., 'OH', 'S')
 */
function getPositionAbbrev(position) {
  // Mapping of full position names to abbreviations
  const abbrevMap = {
    "Outside Hitter": "OH",
    "Opposite Hitter": "OP",
    "Middle Blocker": "MB",
    Setter: "S",
    Libero: "L",
  };

  // Return abbreviation if found, otherwise return first 2 characters uppercase
  return abbrevMap[position] || position.substring(0, 2).toUpperCase();
}

/**
 * Create a player face/avatar element
 *
 * This function creates a standardized player face element that can be used
 * throughout the application for consistent player representation.
 *
 * @param {string} size - Size variant ('small', 'medium', 'large')
 * @returns {HTMLElement} - Player face element with appropriate styling
 */
function createPlayerFace(size = "medium") {
  // Create the face element
  const face = document.createElement("div");

  // Set base class and size-specific class
  face.className = `player-card__face player-card__face--${size}`;

  // Set emoji content (could be replaced with actual player photos)
  face.textContent = "👤";

  return face;
}

/**
 * Create a player position badge element
 *
 * This function creates a styled position badge that can be used in player cards
 * and other displays to show a player's position with appropriate styling.
 *
 * @param {string} position - Player position name
 * @param {boolean} abbreviated - Whether to use abbreviated form
 * @returns {HTMLElement} - Position badge element with styling
 */
function createPositionBadge(position, abbreviated = false) {
  // Create badge element
  const badge = document.createElement("div");

  // Set base class
  badge.className = "player-card__position";

  // Set data attribute for CSS styling
  badge.setAttribute("data-position", position);

  // Set text content (abbreviated or full)
  badge.textContent = abbreviated ? getPositionAbbrev(position) : position;

  return badge;
}

/**
 * Create a loading spinner element
 *
 * This function creates a loading spinner that can be displayed during
 * asynchronous operations like data loading or API calls.
 *
 * @param {string} message - Optional loading message
 * @returns {HTMLElement} - Loading spinner element
 */
function createLoadingSpinner(message = "Loading...") {
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.innerHTML = `
        <div class="loading-spinner__animation"></div>
        <div class="loading-spinner__message">${message}</div>
    `;
  return spinner;
}

/**
 * Debounce function to limit function calls
 *
 * This utility function prevents a function from being called too frequently
 * by delaying its execution until after a specified time has passed since
 * the last time it was invoked.
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 *
 * This utility function ensures a function is called at most once per
 * specified time interval, useful for scroll and resize event handlers.
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Show the loading screen with optional message and progress
 *
 * This function displays the loading screen overlay and can update
 * the loading message and progress bar during the loading process.
 *
 * @param {string} message - Loading message to display
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @returns {void}
 */
function showLoadingScreen(
  message = "Loading application...",
  progress = 0,
  timeout = 30000
) {
  const loadingScreen = document.getElementById("loadingScreen");
  const loadingMessage = document.getElementById("loadingMessage");
  const loadingProgress = document.getElementById("loadingProgress");

  // Track when loading screen was shown
  window.lastLoadingShowTime = Date.now();

  if (loadingScreen) {
    loadingScreen.classList.remove("loading-screen--hidden");
    loadingScreen.style.display = "flex";
  }

  if (loadingMessage) {
    loadingMessage.textContent = message;
  }

  if (loadingProgress) {
    loadingProgress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  // Set up timeout to force hide loading screen
  if (window.loadingTimeout) {
    clearTimeout(window.loadingTimeout);
  }

  window.loadingTimeout = setTimeout(() => {
    console.warn("Loading screen timeout reached, force hiding...");
    forceHideLoadingScreen();
    window.DOMHelpers.showNotification(
      "Loading timed out. Please try again.",
      "error"
    );
  }, timeout);
}

/**
 * Hide the loading screen
 *
 * This function hides the loading screen with a smooth transition
 * after all data has been loaded.
 *
 * @returns {void}
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");

  // Clear any existing timeout
  if (window.loadingTimeout) {
    clearTimeout(window.loadingTimeout);
    window.loadingTimeout = null;
  }

  if (loadingScreen) {
    loadingScreen.classList.add("loading-screen--hidden");

    // Remove from DOM after transition completes
    setTimeout(() => {
      if (loadingScreen.parentNode) {
        loadingScreen.style.display = "none";
      }
    }, 500); // Match the CSS transition duration
  }
}

/**
 * Force hide loading screen (emergency fallback)
 *
 * This function immediately hides the loading screen without animation
 * and should be used as a fallback when normal hiding fails.
 *
 * @returns {void}
 */
function forceHideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");

  if (loadingScreen) {
    loadingScreen.style.display = "none";
    loadingScreen.classList.add("loading-screen--hidden");
    console.log("Loading screen force hidden");
  }

  // Clear any existing timeout
  if (window.loadingTimeout) {
    clearTimeout(window.loadingTimeout);
    window.loadingTimeout = null;
  }
}

/**
 * Check for stuck loading screens and provide recovery
 *
 * This function checks if a loading screen has been visible for too long
 * and provides a manual recovery option.
 *
 * @returns {void}
 */
function checkForStuckLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");

  if (
    loadingScreen &&
    !loadingScreen.classList.contains("loading-screen--hidden")
  ) {
    const now = Date.now();
    const lastShowTime = window.lastLoadingShowTime || now;
    const timeVisible = now - lastShowTime;

    // If loading screen has been visible for more than 30 seconds
    if (timeVisible > 30000) {
      console.warn(
        "Loading screen appears to be stuck, providing recovery option"
      );

      // Show a recovery notification
      window.DOMHelpers.showNotification(
        "Loading appears to be stuck. Click here to force continue.",
        "warning"
      );

      // Add click handler to the notification for manual recovery
      setTimeout(() => {
        const notifications = document.querySelectorAll(".notification");
        const lastNotification = notifications[notifications.length - 1];
        if (lastNotification) {
          lastNotification.style.cursor = "pointer";
          lastNotification.addEventListener("click", () => {
            window.DOMHelpers.forceHideLoadingScreen();
            window.DOMHelpers.showNotification(
              "Loading screen cleared. You can now continue.",
              "success"
            );
          });
        }
      }, 100);
    }
  }
}

/**
 * Update loading screen message
 *
 * This function updates the loading message without affecting
 * the progress bar or visibility state.
 *
 * @param {string} message - New loading message
 * @returns {void}
 */
function updateLoadingMessage(message) {
  const loadingMessage = document.getElementById("loadingMessage");
  if (loadingMessage) {
    loadingMessage.textContent = message;
  }
}

/**
 * Update loading screen progress
 *
 * This function updates the progress bar without affecting
 * the message or visibility state.
 *
 * @param {number} progress - Progress percentage (0-100)
 * @returns {void}
 */
function updateLoadingProgress(progress) {
  const loadingProgress = document.getElementById("loadingProgress");
  if (loadingProgress) {
    loadingProgress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
}

/**
 * Check if loading screen is currently visible
 *
 * This function checks whether the loading screen is currently
 * visible to the user.
 *
 * @returns {boolean} - True if loading screen is visible
 */
function isLoadingScreenVisible() {
  const loadingScreen = document.getElementById("loadingScreen");
  return (
    loadingScreen && !loadingScreen.classList.contains("loading-screen--hidden")
  );
}

/**
 * Show loading screen for a specific component
 *
 * This function shows a component-specific loading screen with
 * a custom message and optional progress tracking.
 *
 * @param {string} componentName - Name of the component being loaded
 * @param {number} progress - Initial progress percentage
 * @returns {void}
 */
function showComponentLoading(componentName, progress = 0) {
  const message = `Loading ${componentName}...`;
  showLoadingScreen(message, progress);
}

/**
 * Create a loading state manager for complex loading operations
 *
 * This function creates a loading state manager that can track
 * multiple loading steps and update the UI accordingly.
 *
 * @param {Array} steps - Array of loading step objects with name and weight
 * @returns {Object} - Loading state manager object
 */
function createLoadingStateManager(steps = []) {
  let currentStep = 0;
  let totalWeight = steps.reduce((sum, step) => sum + (step.weight || 1), 0);
  let completedWeight = 0;

  return {
    /**
     * Move to the next loading step
     *
     * @param {string} stepName - Name of the current step
     * @returns {void}
     */
    nextStep(stepName) {
      if (currentStep < steps.length) {
        completedWeight += steps[currentStep].weight || 1;
        currentStep++;
      }

      const progress = Math.round((completedWeight / totalWeight) * 100);
      updateLoadingMessage(
        stepName || `Step ${currentStep} of ${steps.length}`
      );
      updateLoadingProgress(progress);
    },

    /**
     * Complete all loading steps
     *
     * @returns {void}
     */
    complete() {
      updateLoadingMessage("Loading complete!");
      updateLoadingProgress(100);

      // Hide loading screen after a brief delay
      setTimeout(() => {
        hideLoadingScreen();
      }, 1000);
    },

    /**
     * Get current loading state
     *
     * @returns {Object} - Current loading state
     */
    getState() {
      return {
        currentStep,
        totalSteps: steps.length,
        progress: Math.round((completedWeight / totalWeight) * 100),
        isComplete: currentStep >= steps.length,
      };
    },
  };
}

// Export functions to global scope for use throughout the application
window.DOMHelpers = {
  showPage,
  toggleMobileMenu,
  showNotification,
  getPositionAbbrev,
  createPlayerFace,
  createPositionBadge,
  createLoadingSpinner,
  debounce,
  throttle,
  showLoadingScreen,
  hideLoadingScreen,
  forceHideLoadingScreen,
  checkForStuckLoadingScreen,
  updateLoadingMessage,
  updateLoadingProgress,
  isLoadingScreenVisible,
  showComponentLoading,
  createLoadingStateManager,
};

// Set up periodic check for stuck loading screens
setInterval(() => {
  checkForStuckLoadingScreen();
}, 10000); // Check every 10 seconds
