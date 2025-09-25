/**
 * Database Service - Supabase database operations for Volleyball Manager
 *
 * This module handles all database operations using Supabase, replacing
 * the JSON file-based data storage with a proper PostgreSQL database.
 *
 * @fileoverview Database service layer with comprehensive error handling
 * @author Volleyball Manager Team
 * @version 0.3.0
 */

/**
 * DatabaseService object
 *
 * This object contains all database operations for the application,
 * including CRUD operations for leagues, teams, players, and transfers.
 */
const DatabaseService = {
  // Service state
  isInitialized: false,
  connectionStatus: "disconnected",

  /**
   * Initialize the database service
   *
   * @returns {Promise<boolean>} - True if initialization is successful
   */
  async initialize() {
    try {
      console.log("Initializing Database Service...");

      // Get Supabase client
      const supabase = window.SupabaseConfig.getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      // Test connection
      const isConnected = await window.SupabaseConfig.testConnection();
      if (!isConnected) {
        throw new Error("Database connection test failed");
      }

      this.isInitialized = true;
      this.connectionStatus = "connected";
      console.log("Database Service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Database Service:", error);
      this.connectionStatus = "error";
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
      throw new Error("Database Service not initialized");
    }
    return window.SupabaseConfig.getSupabaseClient();
  },

  // ==================== LEAGUES OPERATIONS ====================

  /**
   * Get all leagues
   *
   * @returns {Promise<Array>} - Array of league objects
   */
  async getLeagues() {
    try {
      const { data, error } = await this.getClient()
        .from("leagues")
        .select("*")
        .order("league_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching leagues:", error);
      throw error;
    }
  },

  /**
   * Get league by ID
   *
   * @param {number} id - League ID
   * @returns {Promise<Object|null>} - League object or null
   */
  async getLeagueById(id) {
    try {
      const { data, error } = await this.getClient()
        .from("leagues")
        .select("*")
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching league by ID:", error);
      throw error;
    }
  },

  // ==================== TEAMS OPERATIONS ====================

  /**
   * Get all teams
   *
   * @returns {Promise<Array>} - Array of team objects with league information
   */
  async getTeams() {
    try {
      const { data, error } = await this.getClient()
        .from("teams")
        .select(
          `
          *,
          leagues!inner(league_name)
        `
        )
        .order("team_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  },

  /**
   * Get team by ID
   *
   * @param {number} id - Team ID
   * @returns {Promise<Object|null>} - Team object or null
   */
  async getTeamById(id) {
    try {
      const { data, error } = await this.getClient()
        .from("teams")
        .select(
          `
          *,
          leagues!inner(league_name)
        `
        )
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching team by ID:", error);
      throw error;
    }
  },

  /**
   * Get teams by league
   *
   * @param {number} leagueId - League ID
   * @returns {Promise<Array>} - Array of team objects
   */
  async getTeamsByLeague(leagueId) {
    try {
      const { data, error } = await this.getClient()
        .from("teams")
        .select(
          `
          *,
          leagues!inner(league_name)
        `
        )
        .eq("league_id", leagueId)
        .order("team_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching teams by league:", error);
      throw error;
    }
  },

  /**
   * Update team money
   *
   * @param {number} teamId - Team ID
   * @param {number} amount - New money amount
   * @returns {Promise<Object>} - Updated team object
   */
  async updateTeamMoney(teamId, amount) {
    try {
      const { data, error } = await this.getClient()
        .from("teams")
        .update({ team_money: amount })
        .eq("id", teamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating team money:", error);
      throw error;
    }
  },

  // ==================== PLAYERS OPERATIONS ====================

  /**
   * Get all players for the current user's team
   *
   * @returns {Promise<Array>} - Array of player objects with team information
   */
  async getPlayers() {
    try {
      console.log("DEBUG DatabaseService: getPlayers() called");

      // Check if AuthService is available
      if (!window.AuthService) {
        console.log("DEBUG DatabaseService: AuthService not available yet");
        return [];
      }

      // Get current user's team
      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        console.log("DEBUG DatabaseService: No user team found");
        return [];
      }

      const { data, error } = await this.getClient()
        .from("players")
        .select(
          `
          *,
          teams(team_name, team_money)
        `
        )
        .eq("team_id", userTeam.id)
        .order("player_name");

      if (error) throw error;
      console.log("DEBUG DatabaseService: Raw data from Supabase:", data);
      console.log(
        "DEBUG DatabaseService: Number of players returned:",
        (data || []).length
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching players:", error);
      throw error;
    }
  },

  /**
   * Get all players (including free agents for transfer market)
   *
   * @returns {Promise<Array>} - Array of all player objects
   */
  async getAllPlayers() {
    try {
      const { data, error } = await this.getClient()
        .from("players")
        .select(
          `
          *,
          teams(team_name, team_money)
        `
        )
        .order("player_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching all players:", error);
      throw error;
    }
  },

  /**
   * Get players by team
   *
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} - Array of player objects
   */
  async getPlayersByTeam(teamId) {
    try {
      const { data, error } = await this.getClient()
        .from("players")
        .select(
          `
          *,
          teams!inner(team_name, team_money)
        `
        )
        .eq("team_id", teamId)
        .order("jersey_number");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching players by team:", error);
      throw error;
    }
  },

  /**
   * Get player by ID
   *
   * @param {number} id - Player ID
   * @returns {Promise<Object|null>} - Player object or null
   */
  async getPlayerById(id) {
    try {
      const { data, error } = await this.getClient()
        .from("players")
        .select(
          `
          *,
          teams!left(team_name)
        `
        )
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching player by ID:", error);
      throw error;
    }
  },

  /**
   * Search players
   *
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} - Array of matching player objects
   */
  async searchPlayers(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return await this.getPlayers();
      }

      // Check if AuthService is available
      if (!window.AuthService) {
        console.log("DEBUG DatabaseService: AuthService not available yet");
        return [];
      }

      // Get current user's team
      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        return [];
      }

      const { data, error } = await this.getClient()
        .from("players")
        .select("*")
        .eq("team_id", userTeam.id)
        .or(
          `player_name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`
        )
        .order("player_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching players:", error);
      throw error;
    }
  },

  /**
   * Filter players by position
   *
   * @param {string} position - Position to filter by
   * @returns {Promise<Array>} - Array of filtered player objects
   */
  async filterPlayersByPosition(position) {
    try {
      if (!position || position === "all") {
        return await this.getPlayers();
      }

      // Check if AuthService is available
      if (!window.AuthService) {
        console.log("DEBUG DatabaseService: AuthService not available yet");
        return [];
      }

      // Get current user's team
      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        return [];
      }

      const { data, error } = await this.getClient()
        .from("players")
        .select("*")
        .eq("team_id", userTeam.id)
        .eq("position", position)
        .order("overall", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error filtering players by position:", error);
      throw error;
    }
  },

  /**
   * Sort players
   *
   * @param {string} attribute - Attribute to sort by
   * @param {boolean} ascending - Sort direction
   * @returns {Promise<Array>} - Array of sorted player objects
   */
  async sortPlayers(attribute, ascending = true) {
    try {
      // Check if AuthService is available
      if (!window.AuthService) {
        console.log("DEBUG DatabaseService: AuthService not available yet");
        return [];
      }

      // Get current user's team
      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        return [];
      }

      const { data, error } = await this.getClient()
        .from("players")
        .select("*")
        .eq("team_id", userTeam.id)
        .order(attribute, { ascending });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error sorting players:", error);
      throw error;
    }
  },

  /**
   * Add new player
   *
   * @param {Object} playerData - Player data object
   * @returns {Promise<Object>} - Created player object
   */
  async addPlayer(playerData) {
    try {
      const { data, error } = await this.getClient()
        .from("players")
        .insert([playerData])
        .select("*")
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding player:", error);
      throw error;
    }
  },

  /**
   * Update player
   *
   * @param {number} id - Player ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated player object
   */
  async updatePlayer(id, updateData) {
    try {
      const { data, error } = await this.getClient()
        .from("players")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating player:", error);
      throw error;
    }
  },

  /**
   * Delete player
   *
   * @param {number} id - Player ID
   * @returns {Promise<boolean>} - True if deletion is successful
   */
  async deletePlayer(id) {
    try {
      const { error } = await this.getClient()
        .from("players")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting player:", error);
      throw error;
    }
  },

  // ==================== TRANSFERS OPERATIONS ====================

  /**
   * Get all transfers
   *
   * @returns {Promise<Array>} - Array of transfer objects
   */
  async getTransfers() {
    try {
      const { data, error } = await this.getClient()
        .from("transfers")
        .select(
          `
          *,
          players!inner(player_name, position, overall),
          from_team:teams!transfers_from_team_fkey(team_name),
          to_team:teams!transfers_to_team_fkey(team_name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching transfers:", error);
      throw error;
    }
  },

  /**
   * Get transfers by player
   *
   * @param {number} playerId - Player ID
   * @returns {Promise<Array>} - Array of transfer objects
   */
  async getTransfersByPlayer(playerId) {
    try {
      const { data, error } = await this.getClient()
        .from("transfers")
        .select(
          `
          *,
          players!inner(player_name, position, overall),
          from_team:teams!transfers_from_team_fkey(team_name),
          to_team:teams!transfers_to_team_fkey(team_name)
        `
        )
        .eq("player_id", playerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching transfers by player:", error);
      throw error;
    }
  },

  /**
   * Create transfer
   *
   * @param {Object} transferData - Transfer data object
   * @returns {Promise<Object>} - Created transfer object
   */
  async createTransfer(transferData) {
    try {
      const { data, error } = await this.getClient()
        .from("transfers")
        .insert([transferData])
        .select(
          `
          *,
          players!inner(player_name, position, overall),
          from_team:teams!transfers_from_team_fkey(team_name),
          to_team:teams!transfers_to_team_fkey(team_name)
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating transfer:", error);
      throw error;
    }
  },

  /**
   * Update transfer status
   *
   * @param {number} id - Transfer ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated transfer object
   */
  async updateTransferStatus(id, status) {
    try {
      const { data, error } = await this.getClient()
        .from("transfers")
        .update({ status })
        .eq("id", id)
        .select(
          `
          *,
          players!inner(player_name, position, overall),
          from_team:teams!transfers_from_team_fkey(team_name),
          to_team:teams!transfers_to_team_fkey(team_name)
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating transfer status:", error);
      throw error;
    }
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Get application data summary
   *
   * @returns {Promise<Object>} - Summary of all application data
   */
  async getDataSummary() {
    try {
      const [leagues, teams, players, transfers] = await Promise.all([
        this.getLeagues(),
        this.getTeams(),
        this.getPlayers(),
        this.getTransfers(),
      ]);

      return {
        leagueCount: leagues.length,
        teamCount: teams.length,
        playerCount: players.length,
        transferCount: transfers.length,
        lastUpdated: new Date().toISOString(),
        connectionStatus: this.connectionStatus,
      };
    } catch (error) {
      console.error("Error getting data summary:", error);
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
      connectionStatus: this.connectionStatus,
      supabaseConfigured: window.SupabaseConfig.isSupabaseConfigured(),
    };
  },
};

// Export to global scope for use throughout the application
window.DatabaseService = DatabaseService;
