/**
 * Transfer Offers Service - Player transfer negotiations between users
 *
 * This module handles transfer offers between users, including creating offers,
 * accepting/rejecting offers, and managing the transfer negotiation process.
 *
 * @fileoverview Transfer offers service for user-to-user player transfers
 * @author Volleyball Manager Team
 * @version 0.4.0
 */

/**
 * TransferOffersService object
 *
 * This object contains all transfer offer operations for the application,
 * including creating, managing, and processing transfer offers.
 */
const TransferOffersService = {
  // Service state
  isInitialized: false,

  /**
   * Initialize the transfer offers service
   *
   * @returns {Promise<boolean>} - True if initialization is successful
   */
  async initialize() {
    try {
      console.log("Initializing Transfer Offers Service...");

      // Get Supabase client
      const supabase = window.SupabaseConfig.getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      this.isInitialized = true;
      console.log("Transfer Offers Service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Transfer Offers Service:", error);
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
      throw new Error("Transfer Offers Service not initialized");
    }
    return window.SupabaseConfig.getSupabaseClient();
  },

  /**
   * Create a transfer offer for a player
   *
   * @param {Object} offerData - Transfer offer data
   * @param {number} offerData.playerId - Player ID
   * @param {number} offerData.offerAmount - Offer amount
   * @param {string} offerData.message - Optional message
   * @returns {Promise<Object>} - Creation result
   */
  async createOffer(offerData) {
    try {
      const { playerId, offerAmount, message } = offerData;

      // Get current user
      const currentUser = window.AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("User must be logged in to create offers");
      }

      console.log("Creating offer with NO constraints...");
      console.log("Player ID:", playerId);
      console.log("Offer amount:", offerAmount);
      console.log("Current user:", currentUser.id);

      // Create the simplest possible offer - no validation, no constraints
      const offerRecord = {
        player_id: playerId, // Required field - use the player ID from the form
        from_user_id: currentUser.id,
        offer_amount: offerAmount || 1000,
        message: message || "Transfer offer",
        status: "pending",
      };

      console.log("Final offerRecord (no constraints):", offerRecord);

      // Insert the offer directly - no validation
      const { data, error } = await this.getClient()
        .from("transfer_offers")
        .insert(offerRecord)
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("Offer created successfully:", data);

      return {
        success: true,
        offer: data,
        message: "Transfer offer created successfully!",
      };
    } catch (error) {
      console.error("Error creating transfer offer:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get transfer offers received by the current user
   *
   * @returns {Promise<Array>} - Array of received offers
   */
  async getReceivedOffers() {
    try {
      const currentUser = window.AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("User must be logged in");
      }

      console.log("Fetching received offers for user:", currentUser.id);

      // Get offers where to_user_id matches current user (offers received by current user)
      const { data, error } = await this.getClient()
        .from("transfer_offers")
        .select("*")
        .eq("to_user_id", currentUser.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error fetching received offers:", error);
        throw error;
      }

      console.log("Received offers data:", data);
      return data || [];
    } catch (error) {
      console.error("Error fetching received offers:", error);
      throw error;
    }
  },

  /**
   * Get transfer offers sent by the current user
   *
   * @returns {Promise<Array>} - Array of sent offers
   */
  async getSentOffers() {
    try {
      const currentUser = window.AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("User must be logged in");
      }

      console.log("Fetching sent offers for user:", currentUser.id);

      const { data, error } = await this.getClient()
        .from("transfer_offers")
        .select("*")
        .eq("from_user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error fetching sent offers:", error);
        throw error;
      }

      console.log("Sent offers data:", data);
      return data || [];
    } catch (error) {
      console.error("Error fetching sent offers:", error);
      throw error;
    }
  },

  /**
   * Accept a transfer offer
   *
   * @param {number} offerId - Offer ID to accept
   * @returns {Promise<Object>} - Acceptance result
   */
  async acceptOffer(offerId) {
    try {
      const currentUser = window.AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("User must be logged in");
      }

      // Get the offer
      const { data: offer, error: fetchError } = await this.getClient()
        .from("transfer_offers")
        .select(
          `
          *,
          players!inner(*)
        `
        )
        .eq("id", offerId)
        .eq("to_user_id", currentUser.id)
        .eq("status", "pending")
        .single();

      if (fetchError) throw fetchError;

      if (!offer) {
        throw new Error("Offer not found or already processed");
      }

      // Start a transaction-like operation
      const { data: updatedOffer, error: updateError } = await this.getClient()
        .from("transfer_offers")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", offerId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Transfer the player
      const transferResult = await this.processPlayerTransfer(offer);

      if (!transferResult.success) {
        // Rollback the offer status
        await this.getClient()
          .from("transfer_offers")
          .update({ status: "pending", responded_at: null })
          .eq("id", offerId);

        throw new Error(transferResult.error);
      }

      return {
        success: true,
        offer: updatedOffer,
        transfer: transferResult.transfer,
        message: "Transfer offer accepted and player transferred successfully!",
      };
    } catch (error) {
      console.error("Error accepting transfer offer:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Reject a transfer offer
   *
   * @param {number} offerId - Offer ID to reject
   * @returns {Promise<Object>} - Rejection result
   */
  async rejectOffer(offerId) {
    try {
      const currentUser = window.AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("User must be logged in");
      }

      const { data, error } = await this.getClient()
        .from("transfer_offers")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", offerId)
        .eq("to_user_id", currentUser.id)
        .eq("status", "pending")
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        offer: data,
        message: "Transfer offer rejected",
      };
    } catch (error) {
      console.error("Error rejecting transfer offer:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Withdraw a transfer offer
   *
   * @param {number} offerId - Offer ID to withdraw
   * @returns {Promise<Object>} - Withdrawal result
   */
  async withdrawOffer(offerId) {
    try {
      const currentUser = window.AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("User must be logged in");
      }

      const { data, error } = await this.getClient()
        .from("transfer_offers")
        .update({
          status: "withdrawn",
          responded_at: new Date().toISOString(),
        })
        .eq("id", offerId)
        .eq("from_user_id", currentUser.id)
        .eq("status", "pending")
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        offer: data,
        message: "Transfer offer withdrawn",
      };
    } catch (error) {
      console.error("Error withdrawing transfer offer:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Process player transfer after offer acceptance
   *
   * @param {Object} offer - Accepted offer object
   * @returns {Promise<Object>} - Transfer result
   */
  async processPlayerTransfer(offer) {
    try {
      const player = offer.players;
      const fromUserTeam = await this.getUserTeam(offer.from_user_id);
      const toUserTeam = await this.getUserTeam(offer.to_user_id);

      if (!fromUserTeam || !toUserTeam) {
        throw new Error("Could not find user teams");
      }

      // Update player's team
      const { error: playerError } = await this.getClient()
        .from("players")
        .update({ team_id: fromUserTeam.id })
        .eq("id", player.id);

      if (playerError) throw playerError;

      // Update team money
      const { error: fromTeamError } = await this.getClient()
        .from("teams")
        .update({ team_money: fromUserTeam.team_money - offer.offer_amount })
        .eq("id", fromUserTeam.id);

      if (fromTeamError) throw fromTeamError;

      const { error: toTeamError } = await this.getClient()
        .from("teams")
        .update({ team_money: toUserTeam.team_money + offer.offer_amount })
        .eq("id", toUserTeam.id);

      if (toTeamError) throw toTeamError;

      // Create transfer record
      const transferData = {
        player_id: player.id,
        from_team_id: toUserTeam.id,
        to_team_id: fromUserTeam.id,
        transfer_fee: offer.offer_amount,
        status: "completed",
      };

      const transfer = await window.DatabaseService.createTransfer(
        transferData
      );

      return {
        success: true,
        transfer: transfer,
      };
    } catch (error) {
      console.error("Error processing player transfer:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get player's team owner
   *
   * @param {number} teamId - Team ID
   * @returns {Promise<Object|null>} - Team owner user object
   */
  async getPlayerTeamOwner(teamId) {
    try {
      console.log("Looking for team owner for team_id:", teamId);

      const { data, error } = await this.getClient()
        .from("user_teams")
        .select(
          `
          *,
          users!inner(*)
        `
        )
        .eq("team_id", teamId)
        .eq("is_primary", true)
        .single();

      if (error) {
        console.error("Error fetching team owner:", error);
        // Try alternative approach - get any user associated with this team
        const { data: altData, error: altError } = await this.getClient()
          .from("user_teams")
          .select(
            `
            *,
            users!inner(*)
          `
          )
          .eq("team_id", teamId)
          .limit(1)
          .single();

        if (altError) {
          console.error("Alternative team owner lookup failed:", altError);
          return null;
        }

        return altData?.users || null;
      }

      console.log("Found team owner:", data?.users);
      return data?.users || null;
    } catch (error) {
      console.error("Error fetching player team owner:", error);
      return null;
    }
  },

  /**
   * Get user's team
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User's team object
   */
  async getUserTeam(userId) {
    try {
      const { data, error } = await this.getClient()
        .from("user_teams")
        .select(
          `
          *,
          teams!inner(*)
        `
        )
        .eq("user_id", userId)
        .eq("is_primary", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.teams || null;
    } catch (error) {
      console.error("Error fetching user team:", error);
      return null;
    }
  },

  /**
   * Debug function to check database structure
   *
   * @param {number} playerId - Player ID to debug
   * @returns {Promise<Object>} - Debug information
   */
  async debugPlayerTransfer(playerId) {
    try {
      console.log("=== DEBUG: Player Transfer Debug ===");

      // Get player
      const player = await window.DatabaseService.getPlayerById(playerId);
      console.log("1. Player:", player);

      if (!player) {
        return { error: "Player not found" };
      }

      // Check user_teams for this team
      const { data: userTeams, error: userTeamsError } = await this.getClient()
        .from("user_teams")
        .select("*")
        .eq("team_id", player.team_id);

      console.log("2. User teams for team_id", player.team_id, ":", userTeams);
      console.log("3. User teams error:", userTeamsError);

      // Check teams table
      const { data: team, error: teamError } = await this.getClient()
        .from("teams")
        .select("*")
        .eq("id", player.team_id)
        .single();

      console.log("4. Team:", team);
      console.log("5. Team error:", teamError);

      return {
        player,
        userTeams,
        team,
        errors: { userTeamsError, teamError },
      };
    } catch (error) {
      console.error("Debug error:", error);
      return { error: error.message };
    }
  },

  /**
   * Get offer statistics for the current user
   *
   * @returns {Promise<Object>} - Offer statistics
   */
  async getOfferStats() {
    try {
      const currentUser = window.AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("User must be logged in");
      }

      const [receivedOffers, sentOffers] = await Promise.all([
        this.getReceivedOffers(),
        this.getSentOffers(),
      ]);

      return {
        receivedPending: receivedOffers.filter((o) => o.status === "pending")
          .length,
        sentPending: sentOffers.filter((o) => o.status === "pending").length,
        totalReceived: receivedOffers.length,
        totalSent: sentOffers.length,
      };
    } catch (error) {
      console.error("Error fetching offer stats:", error);
      throw error;
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
    };
  },
};

// Export to global scope for use throughout the application
window.TransferOffersService = TransferOffersService;
