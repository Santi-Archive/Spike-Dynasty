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

  // Caching system for performance optimization
  cache: new Map(),
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
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

  // ==================== POSITION STATUS OPERATIONS ====================

  /**
   * Get players by position status (available, starter, bench)
   *
   * @param {string} status - Position status to filter by
   * @param {number} teamId - Optional team ID to filter by
   * @returns {Promise<Array>} - Array of player objects with the specified status
   */
  async getPlayersByPositionStatus(status, teamId = null) {
    try {
      console.log(
        `DEBUG DatabaseService: getPlayersByPositionStatus(${status}, ${teamId}) called`
      );

      // Validate status
      if (!["available", "starter", "bench"].includes(status)) {
        throw new Error(`Invalid position status: ${status}`);
      }

      // Use team ID if provided, otherwise get current user's team
      let targetTeamId = teamId;
      if (!targetTeamId && window.AuthService) {
        const userTeam = window.AuthService.getUserTeam();
        targetTeamId = userTeam?.id;
      }

      if (!targetTeamId) {
        console.log("DEBUG DatabaseService: No team ID available");
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
        .eq("team_id", targetTeamId)
        .eq("position_status", status)
        .order("overall", { ascending: false });

      if (error) throw error;
      console.log(
        `DEBUG DatabaseService: Found ${
          (data || []).length
        } players with status ${status}`
      );
      return data || [];
    } catch (error) {
      console.error(
        `Error fetching players by position status ${status}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Update player position status and indices
   *
   * @param {number} playerId - Player ID to update
   * @param {string} status - New position status
   * @param {number} positionIndex - Position index for starters (0-6)
   * @param {number} benchIndex - Bench index for bench players (0-8)
   * @returns {Promise<Object>} - Updated player object
   */
  async updatePlayerPositionStatus(
    playerId,
    status,
    positionIndex = null,
    benchIndex = null
  ) {
    try {
      console.log(
        `DEBUG DatabaseService: updatePlayerPositionStatus(${playerId}, ${status}, ${positionIndex}, ${benchIndex}) called`
      );

      // Validate status
      if (!["available", "starter", "bench"].includes(status)) {
        throw new Error(`Invalid position status: ${status}`);
      }

      // Prepare update data
      const updateData = {
        position_status: status,
        updated_at: new Date().toISOString(),
      };

      // Set appropriate index based on status
      if (status === "starter" && positionIndex !== null) {
        updateData.position_index = positionIndex;
        updateData.bench_index = null;
      } else if (status === "bench" && benchIndex !== null) {
        updateData.bench_index = benchIndex;
        updateData.position_index = null;
      } else if (status === "available") {
        updateData.position_index = null;
        updateData.bench_index = null;
      }

      const { data, error } = await this.getClient()
        .from("players")
        .update(updateData)
        .eq("id", playerId)
        .select(
          `
          *,
          teams(team_name, team_money)
        `
        )
        .single();

      if (error) throw error;
      console.log(
        `DEBUG DatabaseService: Player ${playerId} position status updated to ${status}`
      );
      return data;
    } catch (error) {
      console.error(
        `Error updating player ${playerId} position status:`,
        error
      );
      throw error;
    }
  },

  /**
   * Get starting lineup players ordered by position index
   *
   * @param {number} teamId - Optional team ID
   * @returns {Promise<Array>} - Array of starting players ordered by position
   */
  async getStartingLineup(teamId = null) {
    try {
      const players = await this.getPlayersByPositionStatus("starter", teamId);
      // Sort by position_index to maintain order
      return players.sort(
        (a, b) => (a.position_index || 0) - (b.position_index || 0)
      );
    } catch (error) {
      console.error("Error getting starting lineup:", error);
      throw error;
    }
  },

  /**
   * Get bench players ordered by bench index
   *
   * @param {number} teamId - Optional team ID
   * @returns {Promise<Array>} - Array of bench players ordered by bench position
   */
  async getBenchPlayers(teamId = null) {
    try {
      const players = await this.getPlayersByPositionStatus("bench", teamId);
      // Sort by bench_index to maintain order
      return players.sort(
        (a, b) => (a.bench_index || 0) - (b.bench_index || 0)
      );
    } catch (error) {
      console.error("Error getting bench players:", error);
      throw error;
    }
  },

  /**
   * Get available players
   *
   * @param {number} teamId - Optional team ID
   * @returns {Promise<Array>} - Array of available players
   */
  async getAvailablePlayers(teamId = null) {
    try {
      return await this.getPlayersByPositionStatus("available", teamId);
    } catch (error) {
      console.error("Error getting available players:", error);
      throw error;
    }
  },

  /**
   * Reset all players to available status
   *
   * @param {number} teamId - Optional team ID
   * @returns {Promise<number>} - Number of players updated
   */
  async resetAllPlayerPositions(teamId = null) {
    try {
      // Use team ID if provided, otherwise get current user's team
      let targetTeamId = teamId;
      if (!targetTeamId && window.AuthService) {
        const userTeam = window.AuthService.getUserTeam();
        targetTeamId = userTeam?.id;
      }

      if (!targetTeamId) {
        throw new Error("No team ID available");
      }

      const { data, error } = await this.getClient()
        .from("players")
        .update({
          position_status: "available",
          position_index: null,
          bench_index: null,
          updated_at: new Date().toISOString(),
        })
        .eq("team_id", targetTeamId)
        .neq("position_status", "available");

      if (error) throw error;
      console.log(
        `DEBUG DatabaseService: Reset player positions for team ${targetTeamId}`
      );
      return data?.length || 0;
    } catch (error) {
      console.error("Error resetting player positions:", error);
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

  // ==================== CACHING OPERATIONS ====================

  /**
   * Get cached data or fetch from database
   *
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch data if not cached
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} - Cached or fresh data
   */
  async getCachedData(key, fetchFunction, ttl = this.cacheTimeout) {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      console.log(`Cache hit for ${key}`);
      return cached.data;
    }

    console.log(`Cache miss for ${key}, fetching from database`);
    const data = await fetchFunction();
    this.cache.set(key, { data, timestamp: now });
    return data;
  },

  /**
   * Clear cache for specific key or all cache
   *
   * @param {string|null} key - Cache key to clear, or null to clear all
   * @returns {void}
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
      console.log(`Cache cleared for key: ${key}`);
    } else {
      this.cache.clear();
      console.log("All cache cleared");
    }
  },

  /**
   * Invalidate cache for team-related data
   *
   * @param {number} teamId - Team ID to invalidate cache for
   * @returns {void}
   */
  invalidateTeamCache(teamId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`team_${teamId}`) || key.includes("team_stats")) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(`Team cache invalidated for team ${teamId}`);
  },

  // ==================== TEAM STATISTICS OPERATIONS ====================

  /**
   * Get comprehensive team statistics for a specific team (OPTIMIZED)
   *
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} - Team statistics object
   */
  async getTeamStatisticsOptimized(teamId) {
    try {
      console.log(`Fetching optimized team statistics for team ID: ${teamId}`);

      // Get team basic info first
      const { data: teamData, error: teamError } = await this.getClient()
        .from("teams")
        .select("id, team_name, team_money")
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;
      console.log("Team data:", teamData);

      // Get team standings separately (LEFT JOIN to handle missing data)
      const { data: standingsData, error: standingsError } =
        await this.getClient()
          .from("team_standings")
          .select("matches_played, wins, losses, points, win_percentage")
          .eq("team_id", teamId)
          .single();

      if (standingsError && standingsError.code !== "PGRST116") {
        console.warn("No standings data found for team:", standingsError);
      }
      console.log("Standings data:", standingsData);

      // Get squad size
      const { data: playersData, error: playersError } = await this.getClient()
        .from("players")
        .select("id")
        .eq("team_id", teamId);

      if (playersError) throw playersError;
      console.log("Players count:", playersData?.length || 0);

      // Get average rating
      const { data: avgRatingData, error: avgError } = await this.getClient()
        .from("players")
        .select("overall")
        .eq("team_id", teamId);

      if (avgError) throw avgError;

      const averageRating =
        avgRatingData.length > 0
          ? (
              avgRatingData.reduce(
                (sum, player) => sum + (player.overall || 0),
                0
              ) / avgRatingData.length
            ).toFixed(1)
          : 0;

      // Calculate win rate with proper fallback
      let winRate = 0;
      if (
        standingsData?.win_percentage !== undefined &&
        standingsData?.win_percentage !== null
      ) {
        winRate = parseFloat(standingsData.win_percentage);
      } else if (standingsData?.matches_played > 0) {
        // Fallback calculation if win_percentage is not available
        winRate = Math.round(
          (standingsData.wins / standingsData.matches_played) * 100
        );
      }

      const result = {
        teamId: teamData.id,
        teamName: teamData.team_name,
        wins: standingsData?.wins || 0,
        losses: standingsData?.losses || 0,
        matchesPlayed: standingsData?.matches_played || 0,
        squadSize: playersData?.length || 0,
        winRate: winRate,
        averageRating: parseFloat(averageRating),
        budget: teamData.team_money || 0,
        points: standingsData?.points || 0,
      };

      console.log("Final team statistics result:", result);
      return result;
    } catch (error) {
      console.error("Error fetching optimized team statistics:", error);
      throw error;
    }
  },

  /**
   * Get comprehensive team statistics for a specific team (LEGACY - kept for compatibility)
   *
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} - Team statistics object
   */
  async getTeamStatistics(teamId) {
    try {
      // Get team basic info including budget
      const { data: teamData, error: teamError } = await this.getClient()
        .from("teams")
        .select("id, team_name, team_money")
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;

      // Get team standings for match statistics
      const standings = await this.getTeamStandings(teamId);

      // Get squad size (number of players)
      const { data: playersData, error: playersError } = await this.getClient()
        .from("players")
        .select("id")
        .eq("team_id", teamId);

      if (playersError) throw playersError;

      // Get average player rating
      const { data: playersStatsData, error: playersStatsError } =
        await this.getClient()
          .from("players")
          .select("overall")
          .eq("team_id", teamId);

      if (playersStatsError) throw playersStatsError;

      // Calculate average rating
      const averageRating =
        playersStatsData.length > 0
          ? (
              playersStatsData.reduce(
                (sum, player) => sum + (player.overall || 0),
                0
              ) / playersStatsData.length
            ).toFixed(1)
          : 0;

      // Calculate win rate
      const winRate =
        standings && standings.matches_played > 0
          ? Math.round((standings.wins / standings.matches_played) * 100)
          : 0;

      return {
        teamId: teamData.id,
        teamName: teamData.team_name,
        wins: standings?.wins || 0,
        losses: standings?.losses || 0,
        draws: standings?.draws || 0,
        matchesPlayed: standings?.matches_played || 0,
        squadSize: playersData.length,
        winRate: winRate,
        averageRating: parseFloat(averageRating),
        budget: teamData.team_money || 0,
        points: standings?.points || 0,
        goalDifference: standings?.goal_difference || 0,
      };
    } catch (error) {
      console.error("Error fetching team statistics:", error);
      throw error;
    }
  },

  /**
   * Get user's team statistics (OPTIMIZED with caching)
   *
   * @returns {Promise<Object>} - User's team statistics object
   */
  async getUserTeamStatistics() {
    try {
      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        throw new Error("No user team found");
      }

      // Use cached data with optimized query
      return await this.getCachedData(
        `team_stats_${userTeam.id}`,
        () => this.getTeamStatisticsOptimized(userTeam.id),
        2 * 60 * 1000 // 2 minutes cache for team stats
      );
    } catch (error) {
      console.error("Error fetching user team statistics:", error);
      throw error;
    }
  },

  // ==================== STANDINGS OPERATIONS ====================

  /**
   * Get team standings for all leagues
   *
   * @returns {Promise<Array>} - Array of team standings objects
   */
  async getStandings() {
    try {
      const { data, error } = await this.getClient()
        .from("team_standings")
        .select("*")
        .order("league_id", { ascending: true })
        .order("points", { ascending: false })
        .order("wins", { ascending: false })
        .order("team_name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching standings:", error);
      throw error;
    }
  },

  /**
   * Get standings for a specific league
   *
   * @param {string} leagueName - League name to filter by
   * @returns {Promise<Array>} - Array of team standings objects for the league
   */
  async getStandingsByLeague(leagueName) {
    try {
      const { data, error } = await this.getClient()
        .from("team_standings")
        .select("*")
        .eq("league_name", leagueName)
        .order("points", { ascending: false })
        .order("wins", { ascending: false })
        .order("team_name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching standings by league:", error);
      throw error;
    }
  },

  /**
   * Get standings for a specific team
   *
   * @param {number} teamId - Team ID
   * @returns {Promise<Object|null>} - Team standings object or null
   */
  async getTeamStandings(teamId) {
    try {
      const { data, error } = await this.getClient()
        .from("team_standings")
        .select("*")
        .eq("team_id", teamId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching team standings:", error);
      throw error;
    }
  },

  /**
   * Get recent matches for standings context
   *
   * @param {number} limit - Number of recent matches to fetch
   * @returns {Promise<Array>} - Array of recent match objects
   */
  async getRecentMatches(limit = 10) {
    try {
      const { data, error } = await this.getClient()
        .from("matches")
        .select(
          `
          *,
          home_team:teams!matches_home_team_id_fkey(team_name),
          away_team:teams!matches_away_team_id_fkey(team_name),
          league:leagues!matches_league_id_fkey(league_name)
        `
        )
        .eq("status", "completed")
        .order("match_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching recent matches:", error);
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
