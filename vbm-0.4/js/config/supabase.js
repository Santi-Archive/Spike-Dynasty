/**
 * Supabase Configuration - Database connection and setup
 *
 * This module handles the Supabase client configuration and provides
 * the database connection for the Volleyball Manager application.
 *
 * @fileoverview Supabase configuration and client setup
 * @author Volleyball Manager Team
 * @version 0.3.0
 */

// Supabase configuration
const SUPABASE_CONFIG = {
  // Replace these with your actual Supabase project credentials
  url: "https://glcmpysxlnoyfmnfwtxh.supabase.co", // e.g., 'https://your-project.supabase.co'
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY21weXN4bG5veWZtbmZ3dHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODg5MTQsImV4cCI6MjA3NDI2NDkxNH0.JK6oZCavlP-M6RZ9poVzLgFzpue6SpVA_QQTw2pqFrE", // Your public anon key
};

// Initialize Supabase client
let supabase = null;

/**
 * Initialize Supabase client
 *
 * This function initializes the Supabase client with the provided configuration.
 * It should be called once when the application starts.
 *
 * @returns {Object|null} - Supabase client instance or null if initialization fails
 */
function initializeSupabase() {
  try {
    // Check if Supabase is available
    if (typeof window.supabase === "undefined") {
      console.error(
        "Supabase library not loaded. Please include the Supabase client library."
      );
      return null;
    }

    // Initialize the client with session persistence options
    supabase = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );

    console.log("Supabase client initialized successfully");
    return supabase;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}

/**
 * Get the Supabase client instance
 *
 * @returns {Object|null} - Supabase client instance or null if not initialized
 */
function getSupabaseClient() {
  if (!supabase) {
    console.warn(
      "Supabase client not initialized. Call initializeSupabase() first."
    );
  }
  return supabase;
}

/**
 * Check if Supabase is properly configured
 *
 * @returns {boolean} - True if Supabase is configured and ready
 */
function isSupabaseConfigured() {
  return (
    supabase !== null &&
    SUPABASE_CONFIG.url !== "YOUR_SUPABASE_URL" &&
    SUPABASE_CONFIG.anonKey !== "YOUR_SUPABASE_ANON_KEY"
  );
}

/**
 * Test database connection
 *
 * @returns {Promise<boolean>} - True if connection is successful
 */
async function testConnection() {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from("leagues")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Database connection test failed:", error);
      return false;
    }

    console.log("Database connection test successful");
    return true;
  } catch (error) {
    console.error("Database connection test error:", error);
    return false;
  }
}

// Export functions to global scope
window.SupabaseConfig = {
  initializeSupabase,
  getSupabaseClient,
  isSupabaseConfigured,
  testConnection,
  config: SUPABASE_CONFIG,
};
