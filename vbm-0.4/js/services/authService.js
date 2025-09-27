/**
 * Authentication Service - User authentication and session management
 *
 * This module handles user authentication, registration, and session management
 * for the Volleyball Manager application using Supabase Auth.
 *
 * @fileoverview Authentication service with comprehensive user management
 * @author Volleyball Manager Team
 * @version 0.4.0
 */

/**
 * AuthService object
 *
 * This object contains all authentication operations for the application,
 * including user registration, login, logout, and session management.
 */
const AuthService = {
  // Service state
  isInitialized: false,
  currentUser: null,
  userTeam: null,

  /**
   * Initialize the authentication service
   *
   * @returns {Promise<boolean>} - True if initialization is successful
   */
  async initialize() {
    try {
      console.log("Initializing Authentication Service...");

      // Get Supabase client
      const supabase = window.SupabaseConfig.getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);

        if (event === "SIGNED_IN" && session) {
          this.currentUser = session.user;
          if (this.isInitialized) {
            await this.loadUserTeam();
          }
          this.onAuthStateChange("signed_in", session.user);
        } else if (event === "SIGNED_OUT") {
          this.currentUser = null;
          this.userTeam = null;
          this.onAuthStateChange("signed_out", null);
        }
      });

      // Mark as initialized first
      this.isInitialized = true;

      // Check for existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        this.currentUser = session.user;
        await this.loadUserTeam();
        this.onAuthStateChange("signed_in", session.user);
      }
      console.log("Authentication Service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Authentication Service:", error);
      throw error;
    }
  },

  /**
   * Get Supabase client
   *
   * @returns {Object} - Supabase client instance
   */
  getClient() {
    if (!this.isInitialized) {
      throw new Error("Authentication Service not initialized");
    }
    return window.SupabaseConfig.getSupabaseClient();
  },

  /**
   * Register a new user
   *
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @param {string} userData.username - User's username
   * @param {string} userData.displayName - User's display name
   * @returns {Promise<Object>} - Registration result
   */
  async register(userData) {
    try {
      const { email, password, username, displayName } = userData;

      // Validate input
      if (!email || !password || !username || !displayName) {
        throw new Error("All fields are required");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Register user with Supabase Auth
      const { data, error } = await this.getClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Create user profile in our users table
      if (data.user) {
        const { error: profileError } = await this.getClient()
          .from("users")
          .insert({
            id: data.user.id,
            email: email,
            username: username,
            display_name: displayName,
            password_hash: "managed_by_supabase_auth", // Supabase handles password hashing
          });

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // Don't throw here as the user is already created in Supabase Auth
        }
      }

      return {
        success: true,
        user: data.user,
        message:
          "Registration successful! Please check your email to verify your account.",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Login user
   *
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} - Login result
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Login with Supabase Auth
      const { data, error } = await this.getClient().auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last login timestamp
      if (data.user) {
        await this.getClient()
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", data.user.id);
      }

      return {
        success: true,
        user: data.user,
        message: "Login successful!",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Logout user
   *
   * @returns {Promise<Object>} - Logout result
   */
  async logout() {
    try {
      const { error } = await this.getClient().auth.signOut();

      if (error) throw error;

      this.currentUser = null;
      this.userTeam = null;

      // Refresh the page to reload JavaScript and clear any cached state
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Small delay to show logout message

      return {
        success: true,
        message: "Logged out successfully!",
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get current user
   *
   * @returns {Object|null} - Current user object or null
   */
  getCurrentUser() {
    return this.currentUser;
  },

  /**
   * Get current user's team
   *
   * @returns {Object|null} - Current user's team object or null
   */
  getUserTeam() {
    return this.userTeam;
  },

  /**
   * Check if user is authenticated
   *
   * @returns {boolean} - True if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null && this.isInitialized;
  },

  /**
   * Load user's team information
   *
   * @returns {Promise<void>}
   */
  async loadUserTeam() {
    try {
      if (!this.currentUser) {
        this.userTeam = null;
        return;
      }

      const { data, error } = await this.getClient()
        .from("user_teams")
        .select(
          `
          *,
          teams!inner(*)
        `
        )
        .eq("user_id", this.currentUser.id)
        .eq("is_primary", true)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading user team:", error);
        this.userTeam = null;
        return;
      }

      this.userTeam = data?.teams || null;
    } catch (error) {
      console.error("Error loading user team:", error);
      this.userTeam = null;
    }
  },

  /**
   * Assign a team to the current user
   *
   * @param {number} teamId - Team ID to assign
   * @returns {Promise<Object>} - Assignment result
   */
  async assignTeam(teamId) {
    try {
      if (!this.currentUser) {
        throw new Error("User must be logged in to assign a team");
      }

      // Check if team is already assigned to another user
      const { data: existingAssignment, error: checkError } =
        await this.getClient()
          .from("user_teams")
          .select("*")
          .eq("team_id", teamId)
          .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingAssignment) {
        throw new Error("This team is already assigned to another user");
      }

      // Assign team to user
      const { data, error } = await this.getClient()
        .from("user_teams")
        .insert({
          user_id: this.currentUser.id,
          team_id: teamId,
          is_primary: true,
        })
        .select(
          `
          *,
          teams!inner(*)
        `
        )
        .single();

      if (error) throw error;

      this.userTeam = data.teams;

      return {
        success: true,
        team: data.teams,
        message: "Team assigned successfully!",
      };
    } catch (error) {
      console.error("Error assigning team:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get available teams (not assigned to any user)
   *
   * @returns {Promise<Array>} - Array of available teams
   */
  async getAvailableTeams() {
    try {
      const { data, error } = await this.getClient()
        .from("teams")
        .select("*")
        .not(
          "id",
          "in",
          `(
          SELECT team_id 
          FROM user_teams 
          WHERE team_id IS NOT NULL
        )`
        )
        .order("team_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching available teams:", error);
      throw error;
    }
  },

  /**
   * Handle authentication state changes
   *
   * @param {string} event - Auth event type
   * @param {Object} user - User object
   */
  onAuthStateChange(event, user) {
    // Update UI based on auth state
    this.updateAuthUI(event, user);

    // Handle authentication modal visibility
    if (event === "signed_in" && user) {
      // Hide authentication modal when user signs in
      if (window.UserManagement && window.UserManagement.hideAuthModal) {
        window.UserManagement.hideAuthModal();
      }
      // Initialize dashboard if not already done
      if (window.VBManager && !window.VBManager.isInitialized) {
        window.VBManager.initializePage("dashboard");
      }
    } else if (event === "signed_out") {
      // Show authentication modal when user signs out
      if (window.UserManagement && window.UserManagement.showAuthModal) {
        window.UserManagement.showAuthModal();
      }
    }

    // Notify other components
    window.dispatchEvent(
      new CustomEvent("authStateChanged", {
        detail: { event, user, team: this.userTeam },
      })
    );
  },

  /**
   * Update UI based on authentication state
   *
   * @param {string} event - Auth event type
   * @param {Object} user - User object
   */
  updateAuthUI(event, user) {
    const authElements = document.querySelectorAll("[data-auth-required]");
    const guestElements = document.querySelectorAll("[data-guest-only]");
    const userInfoElements = document.querySelectorAll("[data-user-info]");

    if (event === "signed_in" && user) {
      // Show authenticated UI
      authElements.forEach((el) => (el.style.display = ""));
      guestElements.forEach((el) => (el.style.display = "none"));

      // Update user info
      userInfoElements.forEach((el) => {
        if (el.dataset.userInfo === "username") {
          el.textContent = user.user_metadata?.username || user.email;
        } else if (el.dataset.userInfo === "displayName") {
          el.textContent = user.user_metadata?.display_name || user.email;
        }
      });
    } else {
      // Show guest UI
      authElements.forEach((el) => (el.style.display = "none"));
      guestElements.forEach((el) => (el.style.display = ""));

      // Clear user info
      userInfoElements.forEach((el) => {
        el.textContent = "";
      });
    }
  },

  /**
   * Get service status
   *
   * @returns {Object} - Service status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: this.isAuthenticated(),
      currentUser: this.currentUser
        ? {
            id: this.currentUser.id,
            email: this.currentUser.email,
            username: this.currentUser.user_metadata?.username,
          }
        : null,
      userTeam: this.userTeam
        ? {
            id: this.userTeam.id,
            name: this.userTeam.team_name,
          }
        : null,
    };
  },
};

// Export to global scope for use throughout the application
window.AuthService = AuthService;
