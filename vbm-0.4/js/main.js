/**
 * Main.js - Entry point and application coordinator
 *
 * This file serves as the main entry point for the Spike Dynasty application.
 * It initializes all components, manages the application state, and coordinates
 * communication between different modules.
 *
 * @fileoverview Main application coordinator with comprehensive error handling
 * @author Spike Dynasty Team
 * @version 0.2.0
 */

/**
 * Main Spike Dynasty application object
 *
 * This object contains all the core application logic, state management,
 * and coordination between different components.
 */
const VBManager = {
  // Application state properties
  isInitialized: false,
  currentPage: "dashboard",
  isLoading: false,
  errorCount: 0,
  maxErrors: 5,

  /**
   * Initialize the entire application
   *
   * This is the main initialization function that sets up all components,
   * loads data, and prepares the application for use. It includes comprehensive
   * error handling and logging.
   *
   * @returns {Promise<void>} - Promise that resolves when initialization is complete
   */
  async init() {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.warn("VB Manager already initialized");
      return;
    }

    try {
      console.log("Initializing Spike Dynasty v0.2.0...");
      this.isLoading = true;

      // Show loading screen immediately
      window.DOMHelpers.showLoadingScreen("Initializing application...", 0);

      // Create loading state manager for tracking progress
      const loadingManager = window.DOMHelpers.createLoadingStateManager([
        { name: "Loading...", weight: 2 },
        { name: "Preparing your players...", weight: 1 },
        { name: "Loading...", weight: 2 },
        { name: "Preparing the teams...", weight: 1 },
        { name: "Loading...", weight: 1 },
        { name: "Loading...", weight: 2 },
      ]);

      // Step 1: Load application data (including Supabase initialization)
      loadingManager.nextStep("Loading application data...");
      await this.loadApplicationData();

      // Step 2: Run data migration if needed (before authentication)
      loadingManager.nextStep("Loading...!");
      await this.runDataMigrationIfNeeded();

      // Step 3: Initialize authentication service (after data is ready)
      loadingManager.nextStep("Loading...");
      await this.initializeAuthentication();

      // Step 4: Initialize utility components
      loadingManager.nextStep("Preparing players...");
      this.initializeUtilities();

      // Step 5: Initialize global event listeners
      loadingManager.nextStep("Preparing teams...");
      this.initializeGlobalEventListeners();

      // Step 6: Check authentication state and show appropriate UI
      loadingManager.nextStep("Preparing user interface...");
      if (window.AuthService.isAuthenticated()) {
        console.log("User is already authenticated, loading dashboard");
        await this.initializePage("dashboard");
      } else {
        console.log("User not authenticated, showing authentication modal");
        window.UserManagement.showAuthModal();
      }

      // Mark as initialized
      this.isInitialized = true;
      this.isLoading = false;

      console.log("Spike Dynasty initialized successfully");

      // Complete loading and hide loading screen
      loadingManager.complete();

      // Show welcome notification after loading screen is hidden
      setTimeout(() => {
        window.DOMHelpers.showNotification(
          "Welcome to Spike Dynasty!",
          "success"
        );
      }, 1500);
    } catch (error) {
      this.isLoading = false;
      this.errorCount++;

      console.error("Failed to initialize Spike Dynasty:", error);

      // Hide loading screen on error
      window.DOMHelpers.hideLoadingScreen();

      // Show error notification
      window.DOMHelpers.showNotification(
        "Failed to initialize application. Please refresh the page.",
        "error"
      );

      // If too many errors, show critical error
      if (this.errorCount >= this.maxErrors) {
        this.showCriticalError(error);
      }
    }
  },

  /**
   * Load all application data from various sources
   *
   * This function loads player data, transfer market data, and any other
   * required data for the application to function properly.
   *
   * @returns {Promise<void>} - Promise that resolves when all data is loaded
   */
  async loadApplicationData() {
    try {
      console.log("Loading application data...");

      // First, initialize Supabase client
      const supabaseClient = window.SupabaseConfig.initializeSupabase();
      if (!supabaseClient) {
        throw new Error("Failed to initialize Supabase client");
      }

      // Then initialize database service
      await window.DatabaseService.initialize();

      // Log data summary
      const summary = await window.DatabaseService.getDataSummary();
      console.log("Application data loaded successfully:", summary);
    } catch (error) {
      console.error("Error loading application data:", error);
      throw error;
    }
  },

  /**
   * Run data migration if needed (before authentication)
   *
   * This function checks if data migration is needed and runs it
   * before the user is authenticated to avoid RLS policy issues.
   *
   * @returns {Promise<void>}
   */
  async runDataMigrationIfNeeded() {
    try {
      console.log("Checking if data migration is needed...");

      // Check if we need to run data migration
      const summary = await window.DatabaseService.getDataSummary();
      if (summary.playerCount === 0) {
        console.log("No players found in database, running migration...");
        await window.DataMigration.runMigration();
      } else {
        console.log("Data migration not needed, players already exist");
      }
    } catch (error) {
      console.error("Error during data migration check:", error);
      // Don't throw error here as migration failure shouldn't stop the app
      window.DOMHelpers.showNotification(
        "Data migration failed, but application will continue",
        "warning"
      );
    }
  },

  /**
   * Initialize authentication service
   *
   * This function initializes the authentication service and user management.
   *
   * @returns {Promise<void>}
   */
  async initializeAuthentication() {
    try {
      console.log("Initializing authentication...");

      // Initialize authentication service
      await window.AuthService.initialize();

      // Initialize transfer offers service
      await window.TransferOffersService.initialize();

      // Initialize user management component
      window.UserManagement.initialize();

      console.log("Authentication initialized successfully");
    } catch (error) {
      console.error("Error initializing authentication:", error);
      throw error;
    }
  },

  /**
   * Initialize utility components
   *
   * This function sets up utility components that are used throughout
   * the application, such as modal helpers and other shared functionality.
   *
   * @returns {void}
   */
  initializeUtilities() {
    try {
      // Initialize modal event listeners
      window.ModalHelpers.initializeModalEventListeners();

      console.log("Utilities initialized successfully");
    } catch (error) {
      console.error("Error initializing utilities:", error);
      throw error;
    }
  },

  /**
   * Initialize global event listeners
   *
   * This function sets up event listeners that are used across multiple
   * components, such as navigation, calendar controls, and global interactions.
   *
   * @returns {void}
   */
  initializeGlobalEventListeners() {
    try {
      // Navigation handling - attach to all nav items
      document.querySelectorAll(".sidebar__nav-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const pageId = this.extractPageIdFromNavigation(e.target);
          if (pageId) {
            this.navigateToPage(pageId);
          }
        });
      });

      // Calendar controls - progress day button
      const progressBtn = document.querySelector(
        ".btn[onclick*='progressDay']"
      );
      if (progressBtn) {
        progressBtn.addEventListener("click", () => {
          window.Dashboard.progressDay();
        });
      }

      // Calendar controls - view calendar button
      const viewCalendarBtn = document.querySelector(
        ".btn[onclick*='viewCalendar']"
      );
      if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener("click", () => {
          window.Dashboard.viewCalendar();
        });
      }

      // Global error handling for unhandled promises
      window.addEventListener("unhandledrejection", (event) => {
        console.error("Unhandled promise rejection:", event.reason);
        this.handleError(event.reason, "Unhandled Promise Rejection");
      });

      // Global error handling for JavaScript errors
      window.addEventListener("error", (event) => {
        console.error("Global error:", event.error);
        this.handleError(event.error, "Global Error Handler");
      });

      console.log("Global event listeners initialized successfully");
    } catch (error) {
      console.error("Error initializing global event listeners:", error);
      throw error;
    }
  },

  /**
   * Extract page ID from navigation click event
   *
   * This helper function extracts the target page ID from a navigation
   * click event, handling both onclick attributes and href attributes.
   *
   * @param {HTMLElement} element - Clicked navigation element
   * @returns {string|null} - Page ID or null if not found
   */
  extractPageIdFromNavigation(element) {
    // Check for onclick attribute first
    const onclick = element.getAttribute("onclick");
    if (onclick) {
      const match = onclick.match(/showPage$$['"]([^'"]+)['"]$$/);
      if (match) {
        return match[1];
      }
    }

    // Check for href attribute as fallback
    const href = element.getAttribute("href");
    if (href && href.includes("showPage")) {
      const match = href.match(/showPage$$['"]([^'"]+)['"]$$/);
      if (match) {
        return match[1];
      }
    }

    return null;
  },

  /**
   * Navigate to a specific page
   *
   * This function handles page navigation by updating the current page state
   * and calling the appropriate page initialization function.
   *
   * @param {string} pageId - ID of the page to navigate to
   * @returns {void}
   */
  navigateToPage(pageId) {
    // Don't navigate if already on the target page
    if (this.currentPage === pageId) {
      console.log(`Already on page: ${pageId}`);
      return;
    }

    try {
      console.log(`Navigating to page: ${pageId}`);

      // Use the DOMHelpers showPage function
      window.DOMHelpers.showPage(pageId);

      // Update current page state
      this.currentPage = pageId;

      // Log navigation success
      console.log(`Successfully navigated to: ${pageId}`);
    } catch (error) {
      console.error(`Error navigating to page ${pageId}:`, error);
      this.handleError(error, `Navigation to ${pageId}`);
    }
  },

  /**
   * Initialize a specific page component
   *
   * This function initializes the appropriate page component based on
   * the page ID, ensuring each page is properly set up when accessed.
   *
   * @param {string} pageId - ID of the page to initialize
   * @returns {Promise<void>}
   */
  async initializePage(pageId) {
    try {
      console.log(`Initializing page: ${pageId}`);

      switch (pageId) {
        case "dashboard":
          await window.Dashboard.initialize();
          // Load team statistics only when dashboard is shown (lazy loading)
          await window.Dashboard.showDashboard();
          break;
        case "team-management":
          window.TeamManagement.initialize();
          break;
        case "squad-selection":
          window.SquadSelection.initialize();
          break;
        case "standings":
          await window.Standings.initialize();
          break;
        case "transfer-market":
          window.TransferMarket.initialize();
          break;
        case "match-simulation":
          window.MatchSimulation.initialize();
          break;
        default:
          console.warn(`Unknown page: ${pageId}`);
      }

      console.log(`Page ${pageId} initialized successfully`);
    } catch (error) {
      console.error(`Error initializing page ${pageId}:`, error);
      this.handleError(error, `Page initialization: ${pageId}`);
    }
  },

  /**
   * Get current application state
   *
   * This function returns a snapshot of the current application state,
   * useful for debugging and monitoring application health.
   *
   * @returns {Object} - Current application state object
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      currentPage: this.currentPage,
      isLoading: this.isLoading,
      errorCount: this.errorCount,
      playerCount: 0, // Will be updated by database service
      transferPlayerCount: 0, // Will be updated by database service
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Handle application errors with comprehensive logging and user feedback
   *
   * This function provides centralized error handling for the application,
   * including logging, user notifications, and error recovery strategies.
   *
   * @param {Error} error - Error object that occurred
   * @param {string} context - Context where the error occurred
   * @returns {void}
   */
  handleError(error, context = "Unknown") {
    // Increment error count
    this.errorCount++;

    // Log error details
    console.error(`VB Manager Error [${context}]:`, {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      errorCount: this.errorCount,
    });

    // Show user notification for non-critical errors
    if (this.errorCount < this.maxErrors) {
      window.DOMHelpers.showNotification(
        `Error in ${context}: ${error.message}`,
        "error"
      );
    }

    // If too many errors, show critical error
    if (this.errorCount >= this.maxErrors) {
      this.showCriticalError(error);
    }
  },

  /**
   * Show critical error message and recovery options
   *
   * This function displays a critical error message when the application
   * has encountered too many errors and may need to be restarted.
   *
   * @param {Error} error - The error that triggered the critical state
   * @returns {void}
   */
  showCriticalError(error) {
    console.error("Critical error threshold reached:", error);

    // Show critical error notification
    window.DOMHelpers.showNotification(
      "Critical error occurred. Please refresh the page to restart the application.",
      "error"
    );

    // Could add more sophisticated error recovery here
    // such as automatic page refresh, error reporting, etc.
  },

  /**
   * Reset application state
   *
   * This function resets the application to its initial state,
   * useful for error recovery or manual reset operations.
   *
   * @returns {void}
   */
  reset() {
    console.log("Resetting application state...");

    this.isInitialized = false;
    this.currentPage = "dashboard";
    this.isLoading = false;
    this.errorCount = 0;

    // Close any open modals
    window.ModalHelpers.closeAllModals();

    console.log("Application state reset complete");
  },

  /**
   * Reload application data
   *
   * This function reloads all application data without restarting
   * the entire application, useful for data refresh operations.
   *
   * @returns {Promise<void>} - Promise that resolves when data is reloaded
   */
  async reloadData() {
    try {
      console.log("Reloading application data...");
      await this.loadApplicationData();

      // Reinitialize current page to refresh data
      await this.initializePage(this.currentPage);

      window.DOMHelpers.showNotification(
        "Application data reloaded successfully",
        "success"
      );
    } catch (error) {
      console.error("Error reloading data:", error);
      this.handleError(error, "Data Reload");
    }
  },
};

// Global functions that are called from HTML (for backward compatibility)
// These functions delegate to the appropriate components

/**
 * Show page function called from HTML navigation
 *
 * @param {string} pageId - Page to show
 * @returns {void}
 */
function showPage(pageId) {
  window.DOMHelpers.showPage(pageId);
}

/**
 * Toggle mobile menu function called from HTML
 *
 * @returns {void}
 */
function toggleMobileMenu() {
  window.DOMHelpers.toggleMobileMenu();
}

/**
 * Progress day function called from HTML
 *
 * @returns {void}
 */
function progressDay() {
  window.Dashboard.progressDay();
}

/**
 * View calendar function called from HTML
 *
 * @returns {void}
 */
function viewCalendar() {
  window.Dashboard.viewCalendar();
}

/**
 * Simulate match function called from HTML
 *
 * @returns {void}
 */
function simulateMatch() {
  window.MatchSimulation.simulateMatch();
}

/**
 * Quick simulate function called from HTML
 *
 * @returns {void}
 */
function quickSimulate() {
  window.MatchSimulation.quickSimulate();
}

/**
 * Close player modal function called from HTML
 *
 * @returns {void}
 */
function closePlayerModal() {
  window.ModalHelpers.closePlayerModal();
}

/**
 * Close team modal function called from HTML
 *
 * @returns {void}
 */
function closeTeamModal() {
  window.ModalHelpers.closeTeamModal();
}

/**
 * Refresh team statistics on dashboard
 *
 * This function can be called from other components to refresh
 * the team statistics display after changes.
 *
 * @returns {Promise<void>}
 */
async function refreshTeamStatistics() {
  try {
    if (window.Dashboard && window.Dashboard.refreshTeamStatistics) {
      await window.Dashboard.refreshTeamStatistics();
    }
  } catch (error) {
    console.error("Error refreshing team statistics:", error);
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await VBManager.init();
  } catch (error) {
    console.error("Failed to start Spike Dynasty:", error);

    // Show critical error if initialization fails completely
    window.DOMHelpers.showNotification(
      "Failed to start application. Please refresh the page.",
      "error"
    );
  }
});

// Export VBManager to global scope for debugging and console access
window.VBManager = VBManager;

// Add some helpful debugging functions to global scope
window.debug = {
  getState: () => VBManager.getState(),
  reset: () => VBManager.reset(),
  reloadData: () => VBManager.reloadData(),
  refreshTeamStats: () => refreshTeamStatistics(),
  clearCache: (key) => window.DatabaseService?.clearCache(key),
  clearAllCache: () => window.DatabaseService?.clearCache(),
  showError: (message) => window.DOMHelpers.showNotification(message, "error"),
  showSuccess: (message) =>
    window.DOMHelpers.showNotification(message, "success"),
};
