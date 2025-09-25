# Supabase Setup Guide for Volleyball Manager

This guide will help you set up Supabase PostgreSQL database for your Volleyball Manager application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project created

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `volleyball-manager`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Project API Key (anon/public key)

## Step 3: Configure the Application

1. Open `js/config/supabase.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_URL", // Replace with your Project URL
  anonKey: "YOUR_SUPABASE_ANON_KEY", // Replace with your Project API Key
};
```

Example:

```javascript
const SUPABASE_CONFIG = {
  url: "https://abcdefghijklmnop.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};
```

## Step 4: Run Database Migrations

1. In your Supabase dashboard, go to the SQL Editor
2. Run the migration files in order:

### Migration 1: Create leagues table

```sql
-- Copy and paste the contents of database/migrations/001_create_leagues_table.sql
```

### Migration 2: Create teams table

```sql
-- Copy and paste the contents of database/migrations/002_create_teams_table.sql
```

### Migration 3: Create players table

```sql
-- Copy and paste the contents of database/migrations/003_create_players_table.sql
```

### Migration 4: Create transfers table

```sql
-- Copy and paste the contents of database/migrations/004_create_transfers_table.sql
```

## Step 5: Verify Setup

1. Open your application in a browser
2. Open the browser's developer console (F12)
3. Look for these success messages:
   - "Supabase client initialized successfully"
   - "Database Service initialized successfully"
   - "Data migration completed successfully"

## Step 6: Test the Application

1. Navigate to different pages (Team Management, Transfer Market, etc.)
2. Verify that players are loaded from the database
3. Check that all functionality works as expected

## Database Schema Overview

### Tables Created:

1. **leagues** - Stores league information

   - id (Primary Key)
   - league_name (Unique)
   - created_at, updated_at (Timestamps)

2. **teams** - Stores team information

   - id (Primary Key)
   - team_name (Unique)
   - league_id (Foreign Key to leagues)
   - team_money (Numeric)
   - created_at, updated_at (Timestamps)

3. **players** - Stores player information with flexible stats

   - id (Primary Key)
   - player_name, position, age, country, jersey_number
   - overall, attack, defense, serve, block, receive, setting (Stats)
   - contract_years, monthly_wage, player_value
   - team_id (Foreign Key to teams, nullable for free agents)
   - created_at, updated_at (Timestamps)

4. **transfers** - Stores transfer history
   - id (Primary Key)
   - player_id (Foreign Key to players)
   - from_team, to_team (Foreign Keys to teams)
   - price, transfer_date, status
   - created_at, updated_at (Timestamps)

## Future-Proofing Features

### Automatic Player Value Calculation

- The database automatically calculates player values based on stats and age
- Uses a PostgreSQL function that can be easily modified

### Flexible Stats System

- Player stats are stored as individual columns
- Easy to add new stats by adding columns to the players table
- Database triggers ensure data consistency

### Transfer System

- Complete transfer tracking with status management
- Validation to prevent invalid transfers
- Historical transfer records

## Troubleshooting

### Common Issues:

1. **"Supabase client not initialized"**

   - Check that your URL and API key are correct
   - Ensure the Supabase client library is loaded

2. **"Database connection test failed"**

   - Verify your Supabase project is active
   - Check that the migrations have been run successfully

3. **"No players found in database"**

   - The migration should run automatically on first load
   - Check the browser console for migration errors

4. **CORS Issues**
   - Supabase handles CORS automatically for web applications
   - If you encounter CORS issues, check your Supabase project settings

### Getting Help:

1. Check the browser console for detailed error messages
2. Verify your Supabase project is running and accessible
3. Ensure all migration files have been executed successfully
4. Check the Supabase documentation for additional help

## Security Notes

- The anon key is safe to use in client-side code
- Row Level Security (RLS) is prepared but not enabled by default
- For production, consider enabling RLS and setting up proper policies
- Never expose your service role key in client-side code

## Next Steps

After successful setup, you can:

1. Customize the database schema for your specific needs
2. Add more sophisticated transfer logic
3. Implement user authentication
4. Add more detailed player statistics
5. Create additional leagues and teams
