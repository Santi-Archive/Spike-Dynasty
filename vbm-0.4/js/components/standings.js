/**
 * Standings Component - Handles league standings display and team information
 *
 * This component manages the display of league standings, team statistics,
 * and provides detailed team information through modals and interactive elements.
 *
 * @fileoverview Standings component with league tables and team management
 * @author Volleyball Manager Team
 * @version 0.2.0
 */

/**
 * Standings component object
 *
 * This object contains all functionality for displaying and managing
 * league standings and team information.
 */
const Standings = {
  // Component state
  currentLeague: "all",
  sortBy: "points",
  sortDirection: "desc",

  /**
   * Initialize the standings component
   *
   * This function sets up the standings page by generating the league tables
   * and setting up interactive elements.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log("Initializing Standings component...");

      // Show loading screen for standings with timeout
      window.DOMHelpers.showComponentLoading("Standings", 0);

      // Set up a timeout to force hide loading screen if it gets stuck
      const loadingTimeout = setTimeout(() => {
        console.warn(
          "Standings initialization timeout, force hiding loading screen"
        );
        window.DOMHelpers.forceHideLoadingScreen();
        window.DOMHelpers.showNotification(
          "Standings loading timed out. Please try again.",
          "error"
        );
      }, 20000); // 20 second timeout

      try {
        // Generate the standings tables
        await this.generateStandings();

        console.log("Standings component initialized successfully");

        // Clear timeout and hide loading screen after successful initialization
        clearTimeout(loadingTimeout);
        window.DOMHelpers.hideLoadingScreen();
      } catch (error) {
        clearTimeout(loadingTimeout);
        throw error;
      }
    } catch (error) {
      console.error("Error initializing Standings:", error);
      // Hide loading screen on error
      window.DOMHelpers.forceHideLoadingScreen();
      // Show error notification
      window.DOMHelpers.showNotification(
        "Error loading standings. Please try again.",
        "error"
      );
      throw error;
    }
  },

  /**
   * Generate and display league standings
   *
   * This function creates the HTML for all league standings tables
   * and populates them with team data from the database.
   *
   * @returns {Promise<void>}
   */
  async generateStandings() {
    const standingsContent = document.getElementById("standingsContent");
    if (!standingsContent) {
      console.error("Standings content element not found");
      return;
    }

    try {
      // Update loading progress - checking database service
      window.DOMHelpers.updateLoadingMessage("Connecting to database...");
      window.DOMHelpers.updateLoadingProgress(20);

      // Show loading state
      standingsContent.innerHTML =
        '<div class="loading-placeholder">Loading standings...</div>';

      // Check if DatabaseService is available
      if (!window.DatabaseService || !window.DatabaseService.isInitialized) {
        throw new Error("Database service not available");
      }

      // Update loading progress - fetching data
      window.DOMHelpers.updateLoadingMessage("Fetching standings data...");
      window.DOMHelpers.updateLoadingProgress(40);

      // Clear any potential cache and get fresh standings data from database
      const standingsData = await window.DatabaseService.getStandings();

      console.log("Standings data from database:", standingsData);

      if (!standingsData || standingsData.length === 0) {
        standingsContent.innerHTML =
          '<div class="no-players">No standings data available.</div>';
        return;
      }

      // Debug: Log team names to identify discrepancy
      console.log("Team names in standings data:");
      standingsData.forEach((team, index) => {
        console.log(
          `${index + 1}. Team ID: ${team.team_id}, Team Name: "${
            team.team_name
          }"`
        );
      });

      // Update loading progress - organizing data
      window.DOMHelpers.updateLoadingMessage("Organizing league standings...");
      window.DOMHelpers.updateLoadingProgress(60);

      // Organize standings by league
      const leagues = this.organizeStandingsByLeague(standingsData);

      console.log("Organized leagues:", leagues);

      // Update loading progress - generating HTML
      window.DOMHelpers.updateLoadingMessage("Generating standings tables...");
      window.DOMHelpers.updateLoadingProgress(80);

      // Generate HTML for all leagues
      let standingsHTML = "";
      Object.keys(leagues).forEach((leagueName, index) => {
        standingsHTML += this.generateLeagueStandings(
          leagueName,
          leagues[leagueName]
        );

        // Add divider between leagues (except for the last one)
        if (index < Object.keys(leagues).length - 1) {
          standingsHTML += '<div class="standings-divider"></div>';
        }
      });

      standingsContent.innerHTML = standingsHTML;

      console.log("Generated standings HTML:", standingsHTML);

      // Update loading progress - setting up interactions
      window.DOMHelpers.updateLoadingMessage("Setting up team interactions...");
      window.DOMHelpers.updateLoadingProgress(90);

      // Attach click handlers to team rows
      this.attachTeamClickHandlers();

      // Update loading progress - complete
      window.DOMHelpers.updateLoadingMessage("Standings ready!");
      window.DOMHelpers.updateLoadingProgress(100);

      console.log("Standings generated successfully from database");
    } catch (error) {
      console.error("Error generating standings:", error);
      standingsContent.innerHTML =
        '<div class="error-message">Error loading standings. Please try again.</div>';
      throw error;
    }
  },

  /**
   * Organize standings by league
   *
   * This function groups standings data by league name.
   *
   * @param {Array} standingsData - Array of standings data from database
   * @returns {Object} - Standings organized by league
   */
  organizeStandingsByLeague(standingsData) {
    const leagues = {};

    standingsData.forEach((team) => {
      const leagueName = team.league_name;
      if (!leagues[leagueName]) {
        leagues[leagueName] = [];
      }
      leagues[leagueName].push(team);
    });

    // Teams are already sorted by the database query, but ensure proper ordering
    Object.keys(leagues).forEach((league) => {
      leagues[league].sort((a, b) => {
        // Primary sort: points (descending)
        if (b.points !== a.points) return b.points - a.points;
        // Secondary sort: wins (descending)
        if (b.wins !== a.wins) return b.wins - a.wins;
        // Tertiary sort: win percentage (descending)
        if (b.win_percentage !== a.win_percentage)
          return b.win_percentage - a.win_percentage;
        // Final sort: team name (ascending)
        return a.team_name.localeCompare(b.team_name);
      });
    });

    return leagues;
  },

  /**
   * Organize teams by league (legacy method for backward compatibility)
   *
   * This function groups teams by their league and sorts them by points.
   *
   * @param {Object} teamsData - All teams data
   * @returns {Object} - Teams organized by league
   */
  organizeTeamsByLeague(teamsData) {
    const leagues = {};

    Object.values(teamsData).forEach((team) => {
      const league = team.league;
      if (!leagues[league]) {
        leagues[league] = [];
      }
      leagues[league].push(team);
    });

    // Sort teams in each league by points (descending)
    Object.keys(leagues).forEach((league) => {
      leagues[league].sort((a, b) => b.points - a.points);
    });

    return leagues;
  },

  /**
   * Generate standings table for a specific league
   *
   * This function creates the HTML for a single league's standings table.
   *
   * @param {string} leagueName - Name of the league
   * @param {Array} teams - Array of teams in the league
   * @returns {string} - HTML string for the league standings
   */
  generateLeagueStandings(leagueName, teams) {
    return `
            <div class="standings-section">
                <h3 class="standings-section__title">${leagueName}</h3>
                <div class="standings-table">
                    <div class="standings-table__header">
                        <div class="standings-table__pos">#</div>
                        <div class="standings-table__team">Team</div>
                        <div class="standings-table__played">P</div>
                        <div class="standings-table__won">W</div>
                        <div class="standings-table__lost">L</div>
                        <div class="standings-table__points">Pts</div>
                    </div>
                    ${teams
                      .map((team, index) =>
                        this.generateTeamRow(team, index + 1)
                      )
                      .join("")}
                </div>
            </div>
        `;
  },

  /**
   * Generate a single team row for the standings table
   *
   * This function creates the HTML for a single team's row in the standings.
   *
   * @param {Object} team - Team standings object from database
   * @param {number} position - Team's position in the standings
   * @returns {string} - HTML string for the team row
   */
  generateTeamRow(team, position) {
    return `
            <div class="standings-table__row" data-team="${
              team.team_name
            }" data-team-id="${team.team_id}">
                <div class="standings-table__pos">${position}</div>
                <div class="standings-table__team">${team.team_name}</div>
                <div class="standings-table__played">${
                  team.matches_played || 0
                }</div>
                <div class="standings-table__won">${team.wins || 0}</div>
                <div class="standings-table__lost">${team.losses || 0}</div>
                <div class="standings-table__points">${team.points || 0}</div>
            </div>
        `;
  },

  /**
   * Attach click handlers to team rows for showing team details
   *
   * This function sets up click event listeners on all team rows
   * to show detailed team information when clicked.
   *
   * @returns {void}
   */
  attachTeamClickHandlers() {
    document.querySelectorAll(".standings-table__row").forEach((row) => {
      row.addEventListener("click", async () => {
        const teamId = row.getAttribute("data-team-id");
        const teamName = row.getAttribute("data-team");

        try {
          // Get team details from database
          const team = await window.DatabaseService.getTeamById(teamId);
          if (team) {
            await this.showTeamDetails(team);
          } else {
            console.warn(`Team not found: ${teamName}`);
          }
        } catch (error) {
          console.error("Error fetching team details:", error);
          window.DOMHelpers.showNotification(
            "Error loading team details",
            "error"
          );
        }
      });
    });
  },

  /**
   * Show team details modal
   *
   * This function displays detailed team information in a modal dialog.
   *
   * @param {Object} team - Team object to display
   * @returns {Promise<void>}
   */
  async showTeamDetails(team) {
    try {
      // Debug: Log team data being passed to modal
      console.log("Team data being passed to modal:", team);
      console.log("Team name in modal data:", team.team_name);

      await window.ModalHelpers.showTeamModal(team);
    } catch (error) {
      console.error("Error showing team details:", error);
      window.DOMHelpers.showNotification("Error showing team details", "error");
    }
  },

  /**
   * Filter standings by league
   *
   * This function shows or hides league sections based on the selected filter.
   *
   * @param {string} league - League name to filter by ("all" shows all leagues)
   * @returns {void}
   */
  filterByLeague(league) {
    try {
      this.currentLeague = league;

      const sections = document.querySelectorAll(".standings-section");
      sections.forEach((section) => {
        const heading = section.querySelector(".standings-section__title");
        if (heading) {
          if (league === "all" || heading.textContent === league) {
            section.style.display = "block";
          } else {
            section.style.display = "none";
          }
        }
      });

      console.log(`Filtered standings by league: ${league}`);
    } catch (error) {
      console.error("Error filtering standings by league:", error);
      window.DOMHelpers.showNotification("Error filtering standings", "error");
    }
  },

  /**
   * Sort standings by a specific criteria
   *
   * This function sorts the standings table by the specified criteria.
   *
   * @param {string} criteria - Sort criteria (points, wins, losses, etc.)
   * @param {boolean} ascending - Sort direction
   * @returns {void}
   */
  sortStandings(criteria, ascending = false) {
    try {
      this.sortBy = criteria;
      this.sortDirection = ascending ? "asc" : "desc";

      // Get all team rows
      const rows = Array.from(
        document.querySelectorAll(".standings-table__row")
      );

      // Sort rows based on criteria
      rows.sort((a, b) => {
        let valueA, valueB;

        switch (criteria) {
          case "points":
            valueA = parseInt(
              a.querySelector(".standings-table__points").textContent
            );
            valueB = parseInt(
              b.querySelector(".standings-table__points").textContent
            );
            break;
          case "wins":
            valueA = parseInt(
              a.querySelector(".standings-table__won").textContent
            );
            valueB = parseInt(
              b.querySelector(".standings-table__won").textContent
            );
            break;
          case "losses":
            valueA = parseInt(
              a.querySelector(".standings-table__lost").textContent
            );
            valueB = parseInt(
              b.querySelector(".standings-table__lost").textContent
            );
            break;
          case "team":
            valueA = a
              .querySelector(".standings-table__team")
              .textContent.toLowerCase();
            valueB = b
              .querySelector(".standings-table__team")
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

      // Re-append sorted rows
      rows.forEach((row, index) => {
        const parent = row.parentNode;
        parent.appendChild(row);

        // Update position numbers
        const posElement = row.querySelector(".standings-table__pos");
        if (posElement) {
          posElement.textContent = index + 1;
        }
      });

      console.log(
        `Sorted standings by ${criteria} (${
          ascending ? "ascending" : "descending"
        })`
      );
    } catch (error) {
      console.error("Error sorting standings:", error);
      window.DOMHelpers.showNotification("Error sorting standings", "error");
    }
  },

  /**
   * Search teams by name
   *
   * This function filters the standings to show only teams matching the search term.
   *
   * @param {string} searchTerm - Search term to filter teams
   * @returns {void}
   */
  searchTeams(searchTerm) {
    try {
      const rows = document.querySelectorAll(".standings-table__row");
      const searchLower = searchTerm.toLowerCase();

      rows.forEach((row) => {
        const teamName = row
          .querySelector(".standings-table__team")
          .textContent.toLowerCase();
        if (teamName.includes(searchLower) || searchTerm === "") {
          row.style.display = "grid";
        } else {
          row.style.display = "none";
        }
      });

      console.log(`Searched teams with term: "${searchTerm}"`);
    } catch (error) {
      console.error("Error searching teams:", error);
      window.DOMHelpers.showNotification("Error searching teams", "error");
    }
  },

  /**
   * Get current standings data
   *
   * This function returns the current standings data organized by league.
   *
   * @returns {Promise<Object>} - Current standings data
   */
  async getCurrentStandings() {
    try {
      if (!window.DatabaseService || !window.DatabaseService.isInitialized) {
        throw new Error("Database service not available");
      }

      const standingsData = await window.DatabaseService.getStandings();
      return this.organizeStandingsByLeague(standingsData);
    } catch (error) {
      console.error("Error getting current standings:", error);
      return {};
    }
  },

  /**
   * Calculate team statistics
   *
   * This function calculates additional statistics for a team.
   *
   * @param {Object} team - Team object
   * @returns {Object} - Team object with calculated statistics
   */
  calculateTeamStats(team) {
    try {
      const winRate =
        team.played > 0 ? Math.round((team.won / team.played) * 100) : 0;
      const pointsPerGame =
        team.played > 0 ? (team.points / team.played).toFixed(2) : 0;

      return {
        ...team,
        winRate,
        pointsPerGame,
        lossRate: 100 - winRate,
      };
    } catch (error) {
      console.error("Error calculating team stats:", error);
      return team;
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
      currentLeague: this.currentLeague,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
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
      this.currentLeague = "all";
      this.sortBy = "points";
      this.sortDirection = "desc";

      // Show all leagues
      const sections = document.querySelectorAll(".standings-section");
      sections.forEach((section) => {
        section.style.display = "block";
      });

      // Show all teams
      const rows = document.querySelectorAll(".standings-table__row");
      rows.forEach((row) => {
        row.style.display = "grid";
      });

      // Regenerate standings with default sorting
      this.generateStandings();

      console.log("Standings filters and sorting reset");
    } catch (error) {
      console.error("Error resetting standings filters:", error);
      window.DOMHelpers.showNotification("Error resetting filters", "error");
    }
  },
};

// Export to global scope for use throughout the application
window.Standings = Standings;
