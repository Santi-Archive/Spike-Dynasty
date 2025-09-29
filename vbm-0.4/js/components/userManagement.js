/**
 * User Management Component - Authentication UI and user account management
 *
 * This module handles the user interface for authentication, registration,
 * and user account management in the Volleyball Manager application.
 *
 * @fileoverview User management component with login/register forms
 * @author Volleyball Manager Team
 * @version 0.4.0
 */

/**
 * UserManagement object
 *
 * This object contains all user management UI operations, including
 * login forms, registration forms, and user account management.
 */
const UserManagement = {
  // Component state
  isInitialized: false,
  currentView: "login", // 'login', 'register', 'profile'

  /**
   * Initialize the user management component
   *
   * @returns {void}
   */
  initialize() {
    try {
      console.log("Initializing User Management component...");

      // Set up event listeners
      this.initializeEventListeners();

      // Initialize UI state
      this.updateUI();

      this.isInitialized = true;
      console.log("User Management component initialized successfully");
    } catch (error) {
      console.error("Error initializing User Management component:", error);
      throw error;
    }
  },

  /**
   * Initialize event listeners for user management
   *
   * @returns {void}
   */
  initializeEventListeners() {
    // Login form submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin(e);
      });
    }

    // View switching buttons
    const showLoginBtn = document.getElementById("showLogin");
    if (showLoginBtn) {
      showLoginBtn.addEventListener("click", () => {
        this.showView("login");
      });
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.handleLogout();
      });
    }

    // Team selection form
    const teamSelectionForm = document.getElementById("teamSelectionForm");
    if (teamSelectionForm) {
      teamSelectionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleTeamSelection(e);
      });
    }

    // Listen for auth state changes
    window.addEventListener("authStateChanged", (e) => {
      this.updateUI();
    });
  },

  /**
   * Handle login form submission
   *
   * @param {Event} event - Form submission event
   * @returns {Promise<void>}
   */
  async handleLogin(event) {
    try {
      const formData = new FormData(event.target);
      const credentials = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      // Show loading state on form
      this.setFormLoading("loginForm", true);

      // Show login loading screen
      window.ModalHelpers.showLoginLoadingScreen("Authenticating...", 10);

      // Attempt login
      const result = await window.AuthService.login(credentials);

      if (result.success) {
        // Update loading progress
        window.ModalHelpers.updateLoginLoadingProgress(
          "Login successful! Loading user data...",
          30
        );

        // Check if user has a team assigned
        const userTeam = window.AuthService.getUserTeam();

        if (!userTeam) {
          // User needs to select a team
          window.ModalHelpers.updateLoginLoadingProgress(
            "Please select a team...",
            50
          );
          this.showTeamSelection();
          window.ModalHelpers.hideLoginLoadingScreen();
        } else {
          // User has a team, show post-login loading and refresh page
          window.ModalHelpers.showPostLoginLoadingScreen();

          // Show success notification
          window.DOMHelpers.showNotification(result.message, "success");

          // Wait a moment for user to see the success message, then refresh
          setTimeout(() => {
            console.log(
              "Login successful, refreshing page to load dashboard..."
            );
            window.location.reload();
          }, 2000); // 2 second delay to show the loading screen
        }
      } else {
        // Login failed, hide loading screen and show error
        window.ModalHelpers.forceHideLoadingScreen();
        window.DOMHelpers.showNotification(result.error, "error");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Hide loading screen on error
      window.ModalHelpers.forceHideLoadingScreen();

      window.DOMHelpers.showNotification(
        "An error occurred during login",
        "error"
      );
    } finally {
      this.setFormLoading("loginForm", false);
    }
  },

  /**
   * Handle logout
   *
   * @returns {Promise<void>}
   */
  async handleLogout() {
    try {
      const result = await window.AuthService.logout();

      if (result.success) {
        window.DOMHelpers.showNotification(result.message, "success");

        // Update UI to show authentication modal
        this.updateUI();

        // Navigate to dashboard page (which will show auth modal)
        window.DOMHelpers.showPage("dashboard");
      } else {
        window.DOMHelpers.showNotification(result.error, "error");
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.DOMHelpers.showNotification(
        "An error occurred during logout",
        "error"
      );
    }
  },

  /**
   * Handle team selection
   *
   * @param {Event} event - Form submission event
   * @returns {Promise<void>}
   */
  async handleTeamSelection(event) {
    try {
      const formData = new FormData(event.target);
      const teamId = parseInt(formData.get("teamId"));

      if (!teamId) {
        window.DOMHelpers.showNotification("Please select a team", "error");
        return;
      }

      // Show loading state
      this.setFormLoading("teamSelectionForm", true);

      // Show loading screen for team selection
      window.ModalHelpers.showLoginLoadingScreen("Assigning team...", 60);

      // Assign team to user
      const result = await window.AuthService.assignTeam(teamId);

      if (result.success) {
        // Show post-login loading and refresh page
        window.ModalHelpers.showPostLoginLoadingScreen();

        // Show success notification
        window.DOMHelpers.showNotification(result.message, "success");

        // Wait a moment for user to see the success message, then refresh
        setTimeout(() => {
          console.log(
            "Team assigned successfully, refreshing page to load dashboard..."
          );
          window.location.reload();
        }, 2000); // 2 second delay to show the loading screen
      } else {
        // Team assignment failed, hide loading screen and show error
        window.ModalHelpers.forceHideLoadingScreen();
        window.DOMHelpers.showNotification(result.error, "error");
      }
    } catch (error) {
      console.error("Team selection error:", error);

      // Hide loading screen on error
      window.ModalHelpers.forceHideLoadingScreen();

      window.DOMHelpers.showNotification(
        "An error occurred during team selection",
        "error"
      );
    } finally {
      this.setFormLoading("teamSelectionForm", false);
    }
  },

  /**
   * Show authentication modal
   *
   * @returns {void}
   */
  showAuthModal() {
    console.log("UserManagement: showAuthModal called");
    const authModal = document.getElementById("authModal");
    if (authModal) {
      console.log("UserManagement: Found authModal, showing it");
      authModal.style.display = "flex";
      authModal.classList.add("modal--active");
      this.showView("login");
    } else {
      console.error("UserManagement: authModal not found in DOM");
    }
  },

  /**
   * Hide authentication modal
   *
   * @returns {void}
   */
  hideAuthModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
      authModal.style.display = "none";
      authModal.classList.remove("modal--active");
    }
  },

  /**
   * Show team selection modal
   *
   * @returns {Promise<void>}
   */
  async showTeamSelection() {
    try {
      // Load available teams
      const teams = await window.AuthService.getAvailableTeams();

      const teamSelect = document.getElementById("teamSelect");
      if (teamSelect) {
        teamSelect.innerHTML = "";

        if (teams.length === 0) {
          teamSelect.innerHTML = '<option value="">No teams available</option>';
        } else {
          teams.forEach((team) => {
            const option = document.createElement("option");
            option.value = team.id;
            option.textContent = `${
              team.team_name
            } ($${team.team_money.toLocaleString()})`;
            teamSelect.appendChild(option);
          });
        }
      }

      // Show team selection view
      this.showView("teamSelection");
    } catch (error) {
      console.error("Error loading teams:", error);
      window.DOMHelpers.showNotification(
        "Error loading available teams",
        "error"
      );
    }
  },

  /**
   * Show specific view in auth modal
   *
   * @param {string} viewName - Name of view to show
   * @returns {void}
   */
  showView(viewName) {
    this.currentView = viewName;

    // Hide all views
    const views = ["login", "teamSelection"];
    views.forEach((view) => {
      const element = document.getElementById(`${view}View`);
      if (element) {
        element.style.display = "none";
      }
    });

    // Show selected view
    const selectedView = document.getElementById(`${viewName}View`);
    if (selectedView) {
      selectedView.style.display = "block";
    }

    // Update navigation buttons
    this.updateViewNavigation();
  },

  /**
   * Update view navigation buttons
   *
   * @returns {void}
   */
  updateViewNavigation() {
    const showLoginBtn = document.getElementById("showLogin");

    if (showLoginBtn) {
      showLoginBtn.style.display = "none"; // Always hide since we only have login now
    }
  },

  /**
   * Set form loading state
   *
   * @param {string} formId - Form element ID
   * @param {boolean} isLoading - Loading state
   * @returns {void}
   */
  setFormLoading(formId, isLoading) {
    const form = document.getElementById(formId);
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll("input, select, textarea");

    if (isLoading) {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Loading...";
      }
      inputs.forEach((input) => (input.disabled = true));
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || "Submit";
      }
      inputs.forEach((input) => (input.disabled = false));
    }
  },

  /**
   * Update UI based on authentication state
   *
   * @returns {void}
   */
  updateUI() {
    const isAuthenticated = window.AuthService.isAuthenticated();
    const user = window.AuthService.getCurrentUser();
    const userTeam = window.AuthService.getUserTeam();

    // Update user info display
    const userInfoElements = document.querySelectorAll("[data-user-info]");
    userInfoElements.forEach((el) => {
      if (el.dataset.userInfo === "username" && user) {
        el.textContent = user.user_metadata?.username || user.email;
      } else if (el.dataset.userInfo === "displayName" && user) {
        el.textContent = user.user_metadata?.display_name || user.email;
      } else if (el.dataset.userInfo === "teamName" && userTeam) {
        el.textContent = userTeam.team_name;
      }
    });

    // Show/hide auth modal based on authentication state
    if (!isAuthenticated) {
      this.showAuthModal();
    } else {
      this.hideAuthModal();
    }

    // Update navigation visibility
    this.updateNavigationVisibility(isAuthenticated);
  },

  /**
   * Update navigation visibility based on auth state
   *
   * @param {boolean} isAuthenticated - Whether user is authenticated
   * @returns {void}
   */
  updateNavigationVisibility(isAuthenticated) {
    const authElements = document.querySelectorAll("[data-auth-required]");
    const guestElements = document.querySelectorAll("[data-guest-only]");

    authElements.forEach((el) => {
      el.style.display = isAuthenticated ? "" : "none";
    });

    guestElements.forEach((el) => {
      el.style.display = isAuthenticated ? "none" : "";
    });
  },

  /**
   * Get component status
   *
   * @returns {Object} - Component status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentView: this.currentView,
      isAuthenticated: window.AuthService.isAuthenticated(),
      currentUser: window.AuthService.getCurrentUser(),
      userTeam: window.AuthService.getUserTeam(),
    };
  },
};

// Export to global scope for use throughout the application
window.UserManagement = UserManagement;
