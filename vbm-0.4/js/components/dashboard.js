/**
 * Dashboard Component - Handles calendar, season progress, and match simulation
 *
 * This component manages the main dashboard functionality including the calendar
 * system, season progress tracking, and match simulation features. It provides
 * a comprehensive overview of the team's current status and upcoming activities.
 *
 * @fileoverview Dashboard component with calendar and season management
 * @author Volleyball Manager Team
 * @version 0.2.0
 */

/**
 * Dashboard component object
 *
 * This object contains all the functionality for the dashboard page,
 * including calendar management, season progress, and match simulation.
 */
const Dashboard = {
  // Calendar state properties
  currentDay: 15,
  currentMonth: 1,
  currentYear: 2024,
  isTransitioning: false,
  isInitialized: false,

  // Month names for display
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],

  // Days in each month (non-leap year)
  daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],

  /**
   * Initialize the dashboard component
   *
   * This function sets up the dashboard by generating the calendar
   * and preparing all interactive elements.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Prevent double initialization
      if (this.isInitialized) {
        console.log("Dashboard component already initialized, skipping...");
        return;
      }

      console.log("Initializing Dashboard component...");

      // Generate the initial calendar
      this.generateCalendar();

      // Set up any additional dashboard-specific functionality
      this.setupDashboardFeatures();

      // Note: Team statistics will be loaded lazily when dashboard is shown
      // This improves initial page load performance

      this.isInitialized = true;
      console.log("Dashboard component initialized successfully");
    } catch (error) {
      console.error("Error initializing Dashboard:", error);
      throw error;
    }
  },

  /**
   * Setup additional dashboard features
   *
   * This function sets up any additional features specific to the dashboard
   * that aren't part of the core calendar functionality.
   *
   * @returns {void}
   */
  setupDashboardFeatures() {
    // Add any additional dashboard setup here
    // For example, setting up event listeners for dashboard-specific elements
    console.log("Dashboard features setup complete");
  },

  /**
   * Load and display team statistics from the database
   *
   * This function fetches the user's team statistics from the database
   * and updates the dashboard display with real data.
   *
   * @returns {Promise<void>}
   */
  async loadTeamStatistics() {
    try {
      console.log("Loading team statistics...");

      // Check if user is authenticated and has a team
      if (!window.AuthService || !window.AuthService.isAuthenticated()) {
        console.log("User not authenticated, skipping team statistics");
        return;
      }

      const userTeam = window.AuthService.getUserTeam();
      if (!userTeam) {
        console.log("No user team found, skipping team statistics");
        return;
      }

      // Fetch team statistics from database
      const stats = await window.DatabaseService.getUserTeamStatistics();

      console.log("Dashboard received team statistics:", stats);
      console.log(
        "Win rate value:",
        stats.winRate,
        "Type:",
        typeof stats.winRate
      );

      // Update the dashboard with real data
      this.updateTeamStatisticsDisplay(stats);

      console.log("Team statistics loaded successfully:", stats);
    } catch (error) {
      console.error("Error loading team statistics:", error);
      // Set default values on error
      this.updateTeamStatisticsDisplay({
        wins: 0,
        losses: 0,
        squadSize: 0,
        winRate: 0,
        averageRating: 0,
        budget: 0,
      });
    }
  },

  /**
   * Update the team statistics display with real data
   *
   * This function updates the HTML elements with the fetched team statistics.
   *
   * @param {Object} stats - Team statistics object
   * @returns {void}
   */
  updateTeamStatisticsDisplay(stats) {
    try {
      console.log("Updating team statistics display with:", stats);

      // Update wins
      const winsElement = document.getElementById("teamWins");
      if (winsElement) {
        winsElement.textContent = stats.wins || 0;
        console.log(`Set wins to: ${stats.wins || 0}`);
      }

      // Update losses
      const lossesElement = document.getElementById("teamLosses");
      if (lossesElement) {
        lossesElement.textContent = stats.losses || 0;
        console.log(`Set losses to: ${stats.losses || 0}`);
      }

      // Update squad size
      const squadSizeElement = document.getElementById("teamSquadSize");
      if (squadSizeElement) {
        squadSizeElement.textContent = stats.squadSize || 0;
      }

      // Update win rate
      const winRateElement = document.getElementById("teamWinRate");
      if (winRateElement) {
        let winRate = stats.winRate || 0;

        // If win rate is 0 but we have wins and matches, calculate it
        if (winRate === 0 && stats.wins > 0 && stats.matchesPlayed > 0) {
          winRate = Math.round((stats.wins / stats.matchesPlayed) * 100);
          console.log(
            `Calculated win rate: ${stats.wins}/${stats.matchesPlayed} = ${winRate}%`
          );
        }

        // Ensure win rate is a valid number and format it properly
        const formattedWinRate =
          typeof winRate === "number" && !isNaN(winRate)
            ? winRate.toFixed(1)
            : "0.0";
        winRateElement.textContent = `${formattedWinRate}%`;
        console.log(`Set win rate to: ${formattedWinRate}%`);
      }

      // Update average rating
      const avgRatingElement = document.getElementById("teamAvgRating");
      if (avgRatingElement) {
        avgRatingElement.textContent = stats.averageRating || 0;
      }

      // Update budget (format as currency)
      const budgetElement = document.getElementById("teamBudget");
      if (budgetElement) {
        const budget = stats.budget || 0;
        if (budget >= 1000000) {
          budgetElement.textContent = `$${(budget / 1000000).toFixed(1)}M`;
        } else if (budget >= 1000) {
          budgetElement.textContent = `$${(budget / 1000).toFixed(0)}K`;
        } else {
          budgetElement.textContent = `$${budget.toFixed(0)}`;
        }
      }

      console.log("Team statistics display updated successfully");
    } catch (error) {
      console.error("Error updating team statistics display:", error);
    }
  },

  /**
   * Show dashboard and load statistics (LAZY LOADING)
   *
   * This function is called when the dashboard page is shown.
   * It loads team statistics only when needed for better performance.
   *
   * @returns {Promise<void>}
   */
  async showDashboard() {
    try {
      console.log("Showing dashboard, loading team statistics...");

      // Load team statistics when dashboard is actually shown
      await this.loadTeamStatistics();

      // Update calendar if needed
      this.updateDayIndicator();
    } catch (error) {
      console.error("Error showing dashboard:", error);
    }
  },

  /**
   * Refresh team statistics
   *
   * This function reloads and updates the team statistics display.
   * Useful to call after matches, transfers, or other team changes.
   *
   * @returns {Promise<void>}
   */
  async refreshTeamStatistics() {
    try {
      console.log("Refreshing team statistics...");

      // Clear cache for this team's data
      const userTeam = window.AuthService?.getUserTeam();
      if (userTeam) {
        window.DatabaseService?.invalidateTeamCache(userTeam.id);
      }

      await this.loadTeamStatistics();
    } catch (error) {
      console.error("Error refreshing team statistics:", error);
    }
  },

  /**
   * Check if a year is a leap year
   *
   * This function determines if a given year is a leap year using the
   * standard leap year rules: divisible by 4, but not by 100 unless also by 400.
   *
   * @param {number} year - Year to check
   * @returns {boolean} - True if the year is a leap year
   */
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  },

  /**
   * Get number of days in a specific month
   *
   * This function returns the number of days in a given month,
   * accounting for leap years for February.
   *
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {number} - Number of days in the month
   */
  getDaysInMonth(month, year) {
    // Handle February in leap years
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }
    return this.daysInMonth[month - 1];
  },

  /**
   * Check if a specific day is a match day
   *
   * This function determines if a given day should be marked as a match day
   * based on the current scheduling logic. In a real application, this would
   * check against actual match schedules.
   *
   * @param {number} day - Day of the month
   * @returns {boolean} - True if the day is a match day
   */
  isMatchDay(day) {
    // Simple match day logic - every 3rd and 4th day
    // In a real app, this would check against actual match schedules
    return day % 3 === 0 || day % 4 === 0;
  },

  /**
   * Generate and display the calendar
   *
   * This function creates the calendar display with all days of the current month,
   * highlighting the current day and match days with appropriate styling.
   *
   * @returns {void}
   */
  generateCalendar() {
    const calendar = document.getElementById("calendar");
    if (!calendar) {
      console.error("Calendar element not found");
      return;
    }

    try {
      // Add transitioning class for smooth animation
      calendar.classList.add("calendar--transitioning");
      this.isTransitioning = true;

      // Clear existing calendar content
      setTimeout(() => {
        calendar.innerHTML = "";
        const maxDays = this.getDaysInMonth(
          this.currentMonth,
          this.currentYear
        );

        // Generate calendar days (show all days of the month)
        for (let day = 1; day <= maxDays; day++) {
          const dayElement = this.createCalendarDay(day);
          calendar.appendChild(dayElement);
        }

        // Update related displays
        this.updateDayIndicator();
        this.updateSeasonProgress();

        // Remove transitioning class
        calendar.classList.remove("calendar--transitioning");
        this.isTransitioning = false;
      }, 250); // Animation delay
    } catch (error) {
      console.error("Error generating calendar:", error);
      this.isTransitioning = false;
      calendar.classList.remove("calendar--transitioning");
    }
  },

  /**
   * Create a single calendar day element
   *
   * This function creates the HTML element for a single calendar day
   * with appropriate styling and content based on the day's properties.
   *
   * @param {number} day - Day number
   * @returns {HTMLElement} - Calendar day element
   */
  createCalendarDay(day) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar__day";
    dayElement.dataset.day = day;

    // Determine activity type and styling
    const isMatch = this.isMatchDay(day);
    const isCurrent = day === this.currentDay;

    // Add current day styling
    if (isCurrent) {
      dayElement.classList.add("calendar__day--current");
    }

    // Add match day styling
    if (isMatch) {
      dayElement.classList.add("calendar__day--match");
    }

    // Create activity dot
    let dotClass = "calendar__day-dot--training";
    if (isMatch) {
      dotClass = "calendar__day-dot--match";
    }
    if (isCurrent) {
      dotClass = "calendar__day-dot--today";
    }

    // Create day content
    dayElement.innerHTML = `
      <div class="calendar__day-number">${day}</div>
      <div class="calendar__day-info">${isMatch ? "Match" : "Training"}</div>
      <div class="calendar__day-dot ${dotClass}"></div>
    `;

    return dayElement;
  },

  /**
   * Update the current day indicator display
   *
   * This function updates the day indicator to show the current date
   * in a user-friendly format.
   *
   * @returns {void}
   */
  updateDayIndicator() {
    const indicator = document.getElementById("currentDayIndicator");
    if (indicator) {
      const monthName = this.monthNames[this.currentMonth - 1];
      indicator.textContent = `${monthName} ${this.currentDay}, ${this.currentYear}`;
    }
  },

  /**
   * Update season progress and match simulation visibility
   *
   * This function updates the season progress display and shows/hides
   * the appropriate content in the match simulation section based on whether today is a match day.
   *
   * @returns {void}
   */
  updateSeasonProgress() {
    const progressContainer = document.querySelector(".season-progress");
    const matchSimulation = document.getElementById("matchSimulation");
    const matchContent = document.getElementById("matchContent");
    const trainingContent = document.getElementById("trainingContent");

    if (this.isMatchDay(this.currentDay)) {
      // Show match content on match days
      if (progressContainer) {
        progressContainer.style.marginTop = "2rem";
      }
      if (matchSimulation) {
        matchSimulation.style.display = "block";
      }
      if (matchContent) {
        matchContent.style.display = "block";
      }
      if (trainingContent) {
        trainingContent.style.display = "none";
      }
    } else {
      // Show training content on non-match days
      if (progressContainer) {
        progressContainer.style.marginTop = "2rem";
      }
      if (matchSimulation) {
        matchSimulation.style.display = "block";
      }
      if (matchContent) {
        matchContent.style.display = "none";
      }
      if (trainingContent) {
        trainingContent.style.display = "block";
      }
    }
  },

  /**
   * Progress to the next day
   *
   * This function advances the calendar to the next day, handling month
   * and year transitions as needed. It includes smooth animations and
   * user feedback.
   *
   * @returns {void}
   */
  progressDay() {
    if (this.isTransitioning) {
      console.log("Calendar is transitioning, please wait...");
      return;
    }

    try {
      const maxDays = this.getDaysInMonth(this.currentMonth, this.currentYear);

      // Add transition animation to current day
      const currentDayElement = document.querySelector(
        ".calendar__day--current"
      );
      if (currentDayElement) {
        currentDayElement.classList.add("calendar__day--transition");
      }

      // Advance to next day
      if (this.currentDay < maxDays) {
        this.currentDay++;
      } else {
        // Move to next month
        this.currentDay = 1;
        this.currentMonth++;
        if (this.currentMonth > 12) {
          this.currentMonth = 1;
          this.currentYear++;
        }
      }

      // Regenerate calendar after transition
      setTimeout(() => {
        this.generateCalendar();

        // Show progress notification
        const message =
          this.currentDay === 1
            ? `Advanced to ${this.monthNames[this.currentMonth - 1]} ${
                this.currentYear
              }`
            : `Advanced to ${this.monthNames[this.currentMonth - 1]} ${
                this.currentDay
              }, ${this.currentYear}`;

        window.DOMHelpers.showNotification(message, "success");
      }, 300);
    } catch (error) {
      console.error("Error progressing day:", error);
      window.DOMHelpers.showNotification("Error progressing day", "error");
    }
  },

  /**
   * View upcoming calendar/schedule
   *
   * This function displays information about upcoming events and schedule.
   * In a full implementation, this would show a detailed calendar view.
   *
   * @returns {void}
   */
  viewCalendar() {
    try {
      const nextMonth = this.currentMonth < 12 ? this.currentMonth + 1 : 1;
      const nextYear =
        nextMonth === 1 ? this.currentYear + 1 : this.currentYear;
      const nextMonthName = this.monthNames[nextMonth - 1];

      // Show upcoming schedule information
      const message =
        `Upcoming: ${nextMonthName} ${nextYear}\n\n` +
        "Scheduled matches and training sessions will be displayed here in the full version.";

      alert(message);
    } catch (error) {
      console.error("Error viewing calendar:", error);
      window.DOMHelpers.showNotification("Error viewing calendar", "error");
    }
  },

  /**
   * Simulate a match (simple version)
   *
   * This function provides a basic match simulation with random results.
   * In a full implementation, this would use team strength, player stats,
   * and more sophisticated algorithms.
   *
   * @returns {Object|null} - Match result object or null if simulation fails
   */
  simulateMatch() {
    try {
      const results = document.getElementById("matchResults");
      const score = document.getElementById("finalScore");

      if (!results || !score) {
        console.error("Match results elements not found");
        return null;
      }

      // Simple random match result
      const yourScore = Math.floor(Math.random() * 4) + 1;
      const oppScore = Math.floor(Math.random() * 4) + 1;

      const result = {
        yourScore,
        oppScore,
        won: yourScore > oppScore,
        timestamp: new Date().toISOString(),
      };

      // Display results
      score.textContent = `${yourScore} - ${oppScore}`;
      results.style.display = "block";

      // Show result notification
      const message = result.won ? "Match Won! 🎉" : "Match Lost 😔";
      window.DOMHelpers.showNotification(
        message,
        result.won ? "success" : "error"
      );

      return result;
    } catch (error) {
      console.error("Error simulating match:", error);
      window.DOMHelpers.showNotification("Error simulating match", "error");
      return null;
    }
  },

  /**
   * Quick simulate a match (no delay)
   *
   * This function provides an instant match simulation without any delay,
   * useful for quick testing or when users want immediate results.
   *
   * @returns {Object|null} - Match result object or null if simulation fails
   */
  quickSimulate() {
    try {
      const result = this.simulateMatch();

      if (result) {
        // Show quick simulation notification
        const message = result.won
          ? "Quick Match Won! 🎉"
          : "Quick Match Lost 😔";
        window.DOMHelpers.showNotification(
          message,
          result.won ? "success" : "error"
        );
      }

      return result;
    } catch (error) {
      console.error("Error in quick simulate:", error);
      window.DOMHelpers.showNotification("Error in quick simulation", "error");
      return null;
    }
  },

  /**
   * Get current calendar state
   *
   * This function returns the current state of the calendar system,
   * useful for debugging and state management.
   *
   * @returns {Object} - Current calendar state
   */
  getCalendarState() {
    return {
      currentDay: this.currentDay,
      currentMonth: this.currentMonth,
      currentYear: this.currentYear,
      isTransitioning: this.isTransitioning,
      isMatchDay: this.isMatchDay(this.currentDay),
    };
  },

  /**
   * Set calendar to a specific date
   *
   * This function allows setting the calendar to a specific date,
   * useful for testing or jumping to specific dates.
   *
   * @param {number} day - Day to set
   * @param {number} month - Month to set (1-12)
   * @param {number} year - Year to set
   * @returns {void}
   */
  setDate(day, month, year) {
    try {
      // Validate date
      if (month < 1 || month > 12) {
        throw new Error("Invalid month");
      }
      if (day < 1 || day > this.getDaysInMonth(month, year)) {
        throw new Error("Invalid day for the given month");
      }

      this.currentDay = day;
      this.currentMonth = month;
      this.currentYear = year;

      this.generateCalendar();

      console.log(`Calendar set to ${day}/${month}/${year}`);
    } catch (error) {
      console.error("Error setting date:", error);
      window.DOMHelpers.showNotification("Error setting date", "error");
    }
  },
};

// Export to global scope for use throughout the application
window.Dashboard = Dashboard;
