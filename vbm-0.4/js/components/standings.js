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
   * @returns {void}
   */
  initialize() {
    try {
      console.log("Initializing Standings component...");

      // Generate the standings tables
      this.generateStandings();

      console.log("Standings component initialized successfully");
    } catch (error) {
      console.error("Error initializing Standings:", error);
      throw error;
    }
  },

  /**
   * Generate and display league standings
   *
   * This function creates the HTML for all league standings tables
   * and populates them with team data.
   *
   * @returns {void}
   */
  generateStandings() {
    const standingsContent = document.getElementById("standingsContent");
    if (!standingsContent) {
      console.error("Standings content element not found");
      return;
    }

    try {
      // Get teams data and organize by league
      const teamsData = window.DataStorage.getTeamsData();
      const leagues = this.organizeTeamsByLeague(teamsData);

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

      // Attach click handlers to team rows
      this.attachTeamClickHandlers();

      console.log("Standings generated successfully");
    } catch (error) {
      console.error("Error generating standings:", error);
      standingsContent.innerHTML =
        '<div class="error-message">Error loading standings. Please try again.</div>';
    }
  },

  /**
   * Organize teams by league
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
   * @param {Object} team - Team object
   * @param {number} position - Team's position in the standings
   * @returns {string} - HTML string for the team row
   */
  generateTeamRow(team, position) {
    return `
            <div class="standings-table__row" data-team="${team.name}">
                <div class="standings-table__pos">${position}</div>
                <div class="standings-table__team">${team.name}</div>
                <div class="standings-table__played">${team.played || 0}</div>
                <div class="standings-table__won">${team.won || 0}</div>
                <div class="standings-table__lost">${team.lost || 0}</div>
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
      row.addEventListener("click", () => {
        const teamName = row.getAttribute("data-team");
        const team = window.DataStorage.getTeam(teamName);
        if (team) {
          this.showTeamDetails(team);
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
   * @returns {void}
   */
  showTeamDetails(team) {
    try {
      window.ModalHelpers.showTeamModal(team);
    } catch (error) {
      console.error("Error showing team details:", error);
      window.DOMHelpers.showNotification("Error showing team details", "error");
    }
  },

  /**
   * Update standings with new data
   *
   * This function updates the standings display with new team data.
   *
   * @param {Object} newStandings - Updated standings data
   * @returns {void}
   */
  updateStandings(newStandings) {
    try {
      console.log("Updating standings with new data:", newStandings);
      this.generateStandings();
    } catch (error) {
      console.error("Error updating standings:", error);
      window.DOMHelpers.showNotification("Error updating standings", "error");
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
   * @returns {Object} - Current standings data
   */
  getCurrentStandings() {
    try {
      const teamsData = window.DataStorage.getTeamsData();
      return this.organizeTeamsByLeague(teamsData);
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
