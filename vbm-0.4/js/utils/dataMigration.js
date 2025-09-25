/**
 * Data Migration Utility - Migrate JSON data to Supabase database
 *
 * This module handles the migration of existing JSON data to the new
 * Supabase PostgreSQL database structure.
 *
 * @fileoverview Data migration utility for transitioning from JSON to database
 * @author Volleyball Manager Team
 * @version 0.3.0
 */

/**
 * DataMigration utility object
 *
 * This object contains functions to migrate existing JSON data
 * to the new Supabase database structure.
 */
const DataMigration = {
  // Migration state
  isRunning: false,
  migrationProgress: 0,
  migrationStatus: "idle",

  /**
   * Run complete data migration
   *
   * @returns {Promise<Object>} - Migration results
   */
  async runMigration() {
    if (this.isRunning) {
      throw new Error("Migration is already running");
    }

    try {
      this.isRunning = true;
      this.migrationStatus = "running";
      this.migrationProgress = 0;

      console.log("Starting data migration...");

      const results = {
        leagues: 0,
        teams: 0,
        players: 0,
        transfers: 0,
        errors: [],
      };

      // Step 1: Migrate leagues (5%)
      this.migrationProgress = 5;
      results.leagues = await this.migrateLeagues();

      // Step 2: Migrate teams (25%)
      this.migrationProgress = 25;
      results.teams = await this.migrateTeams();

      // Step 3: Migrate players (75%)
      this.migrationProgress = 75;
      results.players = await this.migratePlayers();

      // Step 4: Migrate transfers (95%)
      this.migrationProgress = 95;
      results.transfers = await this.migrateTransfers();

      // Complete migration (100%)
      this.migrationProgress = 100;
      this.migrationStatus = "completed";

      console.log("Data migration completed successfully:", results);
      return results;
    } catch (error) {
      this.migrationStatus = "error";
      console.error("Data migration failed:", error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  },

  /**
   * Migrate leagues data
   *
   * @returns {Promise<number>} - Number of leagues migrated
   */
  async migrateLeagues() {
    try {
      console.log("Migrating leagues...");

      // Get existing leagues from database
      const existingLeagues = await window.DatabaseService.getLeagues();
      const existingLeagueNames = existingLeagues.map((l) => l.league_name);

      // Define default leagues
      const defaultLeagues = [
        { league_name: "VB League" },
        { league_name: "VBL Division 2" },
      ];

      let migratedCount = 0;
      const supabase = window.DatabaseService.getClient();

      for (const league of defaultLeagues) {
        if (!existingLeagueNames.includes(league.league_name)) {
          const { error } = await supabase.from("leagues").insert([league]);

          if (error) {
            console.warn(
              `Failed to migrate league ${league.league_name}:`,
              error
            );
          } else {
            migratedCount++;
          }
        }
      }

      console.log(`Migrated ${migratedCount} leagues`);
      return migratedCount;
    } catch (error) {
      console.error("Error migrating leagues:", error);
      throw error;
    }
  },

  /**
   * Migrate teams data
   *
   * @returns {Promise<number>} - Number of teams migrated
   */
  async migrateTeams() {
    try {
      console.log("Migrating teams...");

      // Get leagues for team assignment
      const leagues = await window.DatabaseService.getLeagues();
      const leagueMap = {};
      leagues.forEach((league) => {
        leagueMap[league.league_name] = league.id;
      });

      // Get existing teams
      const existingTeams = await window.DatabaseService.getTeams();
      const existingTeamNames = existingTeams.map((t) => t.team_name);

      // Define default teams based on existing data structure
      const defaultTeams = [
        {
          team_name: "Your Team",
          league_name: "VB League",
          team_money: 1000000.0,
        },
        {
          team_name: "Thunder Bolts",
          league_name: "VB League",
          team_money: 800000.0,
        },
        {
          team_name: "Storm Riders",
          league_name: "VB League",
          team_money: 750000.0,
        },
        {
          team_name: "Wave Crushers",
          league_name: "VB League",
          team_money: 600000.0,
        },
        {
          team_name: "Rising Stars",
          league_name: "VBL Division 2",
          team_money: 500000.0,
        },
        {
          team_name: "Fire Hawks",
          league_name: "VBL Division 2",
          team_money: 450000.0,
        },
        {
          team_name: "Ice Breakers",
          league_name: "VBL Division 2",
          team_money: 400000.0,
        },
      ];

      let migratedCount = 0;
      const supabase = window.DatabaseService.getClient();

      for (const team of defaultTeams) {
        if (!existingTeamNames.includes(team.team_name)) {
          const teamData = {
            team_name: team.team_name,
            league_id: leagueMap[team.league_name],
            team_money: team.team_money,
          };

          const { error } = await supabase.from("teams").insert([teamData]);

          if (error) {
            console.warn(`Failed to migrate team ${team.team_name}:`, error);
          } else {
            migratedCount++;
          }
        }
      }

      console.log(`Migrated ${migratedCount} teams`);
      return migratedCount;
    } catch (error) {
      console.error("Error migrating teams:", error);
      throw error;
    }
  },

  /**
   * Migrate players data from JSON files
   *
   * @returns {Promise<number>} - Number of players migrated
   */
  async migratePlayers() {
    try {
      console.log("Migrating players...");

      // Get teams for player assignment
      const teams = await window.DatabaseService.getTeams();
      const teamMap = {};
      teams.forEach((team) => {
        teamMap[team.team_name] = team.id;
      });

      // Get existing players
      const existingPlayers = await window.DatabaseService.getPlayers();
      const existingPlayerNames = existingPlayers.map((p) => p.player_name);

      let migratedCount = 0;
      const supabase = window.DatabaseService.getClient();

      // Migrate team players
      const teamPlayers = await this.loadJSONData("players.json");
      for (const player of teamPlayers) {
        if (!existingPlayerNames.includes(player.name)) {
          const playerData = this.transformPlayerData(player, teamMap);
          if (playerData) {
            const { error } = await supabase
              .from("players")
              .insert([playerData]);

            if (error) {
              console.warn(`Failed to migrate player ${player.name}:`, error);
            } else {
              migratedCount++;
            }
          }
        }
      }

      // Migrate transfer market players (as free agents)
      const transferPlayers = await this.loadJSONData("transfer-players.json");
      for (const player of transferPlayers) {
        if (!existingPlayerNames.includes(player.name)) {
          const playerData = this.transformPlayerData(player, teamMap, true);
          if (playerData) {
            const { error } = await supabase
              .from("players")
              .insert([playerData]);

            if (error) {
              console.warn(
                `Failed to migrate transfer player ${player.name}:`,
                error
              );
            } else {
              migratedCount++;
            }
          }
        }
      }

      console.log(`Migrated ${migratedCount} players`);
      return migratedCount;
    } catch (error) {
      console.error("Error migrating players:", error);
      throw error;
    }
  },

  /**
   * Transform player data from JSON format to database format
   *
   * @param {Object} jsonPlayer - Player data from JSON
   * @param {Object} teamMap - Map of team names to IDs
   * @param {boolean} isFreeAgent - Whether this is a free agent player
   * @returns {Object|null} - Transformed player data or null if invalid
   */
  transformPlayerData(jsonPlayer, teamMap, isFreeAgent = false) {
    try {
      // Determine team ID
      let teamId = null;
      if (!isFreeAgent && jsonPlayer.contract && jsonPlayer.contract.team) {
        teamId = teamMap[jsonPlayer.contract.team];
      }

      // Transform the data structure
      const playerData = {
        player_name: jsonPlayer.name,
        team_id: teamId,
        position: jsonPlayer.position,
        age: jsonPlayer.age,
        country: jsonPlayer.nationality,
        jersey_number: jsonPlayer.jersey,
        overall: jsonPlayer.overall,
        attack: jsonPlayer.attack,
        defense: jsonPlayer.defense,
        serve: jsonPlayer.serve,
        block: jsonPlayer.block,
        receive: jsonPlayer.receive,
        setting: jsonPlayer.setting,
        contract_years: jsonPlayer.contract
          ? jsonPlayer.contract.yearsRemaining
          : 1,
        monthly_wage: jsonPlayer.contract
          ? jsonPlayer.contract.wagesPerMonth
          : 1000,
        // player_value will be calculated automatically by the database trigger
      };

      return playerData;
    } catch (error) {
      console.error("Error transforming player data:", error);
      return null;
    }
  },

  /**
   * Migrate transfers data
   *
   * @returns {Promise<number>} - Number of transfers migrated
   */
  async migrateTransfers() {
    try {
      console.log("Migrating transfers...");

      // For now, we'll create some sample transfer data
      // In a real application, this would come from existing transfer records
      const sampleTransfers = [
        {
          player_name: "Alex Johnson",
          from_team: "Your Team",
          to_team: "Thunder Bolts",
          price: 450000,
          transfer_date: "2024-01-15",
          status: "completed",
        },
        {
          player_name: "Sofia Rodriguez",
          from_team: "Your Team",
          to_team: "Storm Riders",
          price: 520000,
          transfer_date: "2024-01-20",
          status: "completed",
        },
      ];

      let migratedCount = 0;
      const supabase = window.DatabaseService.getClient();

      // Get players and teams for ID mapping
      const players = await window.DatabaseService.getPlayers();
      const teams = await window.DatabaseService.getTeams();

      const playerMap = {};
      const teamMap = {};

      players.forEach((player) => {
        playerMap[player.player_name] = player.id;
      });

      teams.forEach((team) => {
        teamMap[team.team_name] = team.id;
      });

      for (const transfer of sampleTransfers) {
        const transferData = {
          player_id: playerMap[transfer.player_name],
          from_team: teamMap[transfer.from_team],
          to_team: teamMap[transfer.to_team],
          price: transfer.price,
          transfer_date: transfer.transfer_date,
          status: transfer.status,
        };

        if (
          transferData.player_id &&
          transferData.from_team &&
          transferData.to_team
        ) {
          const { error } = await supabase
            .from("transfers")
            .insert([transferData]);

          if (error) {
            console.warn(
              `Failed to migrate transfer for ${transfer.player_name}:`,
              error
            );
          } else {
            migratedCount++;
          }
        }
      }

      console.log(`Migrated ${migratedCount} transfers`);
      return migratedCount;
    } catch (error) {
      console.error("Error migrating transfers:", error);
      throw error;
    }
  },

  /**
   * Load JSON data from file
   *
   * @param {string} filename - JSON file name
   * @returns {Promise<Array>} - JSON data array
   */
  async loadJSONData(filename) {
    try {
      const response = await fetch(filename);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to load ${filename}, using empty array:`, error);
      return [];
    }
  },

  /**
   * Get migration status
   *
   * @returns {Object} - Migration status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      progress: this.migrationProgress,
      status: this.migrationStatus,
    };
  },

  /**
   * Reset migration status
   */
  reset() {
    this.isRunning = false;
    this.migrationProgress = 0;
    this.migrationStatus = "idle";
  },
};

// Export to global scope
window.DataMigration = DataMigration;
