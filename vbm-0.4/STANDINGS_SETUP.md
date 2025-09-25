# Standings Database Setup

This document provides the SQL commands needed to set up the standings functionality in your Supabase database.

## SQL Commands to Run

Run these SQL commands in your Supabase SQL Editor in the following order:

### 1. Create Matches Table

```sql
-- Migration: Create matches table for storing match results and statistics
-- Description: Creates the matches table to track team performance and calculate standings
-- Version: 0.4.2

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    home_sets_won INTEGER NOT NULL DEFAULT 0,
    away_sets_won INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    season TEXT NOT NULL DEFAULT '2024',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure teams are different
    CONSTRAINT different_teams CHECK (home_team_id != away_team_id),

    -- Ensure scores are non-negative
    CONSTRAINT valid_scores CHECK (home_score >= 0 AND away_score >= 0),

    -- Ensure sets are valid (0-5)
    CONSTRAINT valid_sets CHECK (home_sets_won >= 0 AND home_sets_won <= 5 AND away_sets_won >= 0 AND away_sets_won <= 5)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all matches (needed for standings)
CREATE POLICY "Users can view all matches" ON matches
    FOR SELECT USING (true);

-- Users can only insert matches for their own team (if needed for future features)
CREATE POLICY "Users can insert matches for own team" ON matches
    FOR INSERT WITH CHECK (
        home_team_id IN (
            SELECT ut.team_id
            FROM user_teams ut
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        ) OR
        away_team_id IN (
            SELECT ut.team_id
            FROM user_teams ut
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Users can update matches involving their own team
CREATE POLICY "Users can update own team matches" ON matches
    FOR UPDATE USING (
        home_team_id IN (
            SELECT ut.team_id
            FROM user_teams ut
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        ) OR
        away_team_id IN (
            SELECT ut.team_id
            FROM user_teams ut
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create Standings View

```sql
-- Migration: Create standings view for calculating team performance
-- Description: Creates a view that calculates team standings with wins, losses, and points
-- Version: 0.4.2

-- Create standings view that calculates team performance
CREATE OR REPLACE VIEW team_standings AS
WITH team_stats AS (
    SELECT
        t.id as team_id,
        t.team_name,
        t.league_id,
        l.league_name,
        COALESCE(SUM(
            CASE
                WHEN m.home_team_id = t.id AND m.status = 'completed' THEN 1
                WHEN m.away_team_id = t.id AND m.status = 'completed' THEN 1
                ELSE 0
            END
        ), 0) as matches_played,
        COALESCE(SUM(
            CASE
                WHEN m.home_team_id = t.id AND m.status = 'completed' AND m.home_sets_won > m.away_sets_won THEN 1
                WHEN m.away_team_id = t.id AND m.status = 'completed' AND m.away_sets_won > m.home_sets_won THEN 1
                ELSE 0
            END
        ), 0) as wins,
        COALESCE(SUM(
            CASE
                WHEN m.home_team_id = t.id AND m.status = 'completed' AND m.home_sets_won < m.away_sets_won THEN 1
                WHEN m.away_team_id = t.id AND m.status = 'completed' AND m.away_sets_won < m.home_sets_won THEN 1
                ELSE 0
            END
        ), 0) as losses,
        COALESCE(SUM(
            CASE
                WHEN m.home_team_id = t.id AND m.status = 'completed' AND m.home_sets_won = m.away_sets_won THEN 1
                WHEN m.away_team_id = t.id AND m.status = 'completed' AND m.away_sets_won = m.home_sets_won THEN 1
                ELSE 0
            END
        ), 0) as draws,
        -- Calculate points: 3 points for win, 1 point for draw, 0 for loss
        COALESCE(SUM(
            CASE
                WHEN m.home_team_id = t.id AND m.status = 'completed' AND m.home_sets_won > m.away_sets_won THEN 3
                WHEN m.away_team_id = t.id AND m.status = 'completed' AND m.away_sets_won > m.home_sets_won THEN 3
                WHEN m.home_team_id = t.id AND m.status = 'completed' AND m.home_sets_won = m.away_sets_won THEN 1
                WHEN m.away_team_id = t.id AND m.status = 'completed' AND m.away_sets_won = m.home_sets_won THEN 1
                ELSE 0
            END
        ), 0) as points,
        -- Calculate goals for and against
        COALESCE(SUM(
            CASE
                WHEN m.home_team_id = t.id AND m.status = 'completed' THEN m.home_score
                WHEN m.away_team_id = t.id AND m.status = 'completed' THEN m.away_score
                ELSE 0
            END
        ), 0) as goals_for,
        COALESCE(SUM(
            CASE
                WHEN m.home_team_id = t.id AND m.status = 'completed' THEN m.away_score
                WHEN m.away_team_id = t.id AND m.status = 'completed' THEN m.home_score
                ELSE 0
            END
        ), 0) as goals_against
    FROM teams t
    LEFT JOIN leagues l ON t.league_id = l.id
    LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.league_id = t.league_id
    GROUP BY t.id, t.team_name, t.league_id, l.league_name
)
SELECT
    team_id,
    team_name,
    league_id,
    league_name,
    matches_played,
    wins,
    losses,
    draws,
    points,
    goals_for,
    goals_against,
    (goals_for - goals_against) as goal_difference,
    CASE
        WHEN matches_played > 0 THEN ROUND((wins::DECIMAL / matches_played) * 100, 1)
        ELSE 0
    END as win_percentage
FROM team_stats
ORDER BY league_id, points DESC, goal_difference DESC, wins DESC, team_name;
```

### 3. Insert Sample Match Data

```sql
-- Insert some sample matches for testing
INSERT INTO matches (home_team_id, away_team_id, league_id, match_date, home_score, away_score, home_sets_won, away_sets_won, status, season) VALUES
-- VB League matches
((SELECT id FROM teams WHERE team_name = 'Your Team'), (SELECT id FROM teams WHERE team_name = 'Thunder Bolts'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-01-15', 3, 1, 3, 1, 'completed', '2024'),
((SELECT id FROM teams WHERE team_name = 'Storm Riders'), (SELECT id FROM teams WHERE team_name = 'Wave Crushers'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-01-15', 2, 3, 2, 3, 'completed', '2024'),
((SELECT id FROM teams WHERE team_name = 'Thunder Bolts'), (SELECT id FROM teams WHERE team_name = 'Storm Riders'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-01-20', 3, 0, 3, 0, 'completed', '2024'),
((SELECT id FROM teams WHERE team_name = 'Wave Crushers'), (SELECT id FROM teams WHERE team_name = 'Your Team'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-01-20', 1, 3, 1, 3, 'completed', '2024'),
((SELECT id FROM teams WHERE team_name = 'Your Team'), (SELECT id FROM teams WHERE team_name = 'Storm Riders'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-01-25', 3, 2, 3, 2, 'completed', '2024'),
((SELECT id FROM teams WHERE team_name = 'Thunder Bolts'), (SELECT id FROM teams WHERE team_name = 'Wave Crushers'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-01-25', 2, 3, 2, 3, 'completed', '2024'),

-- VBL Division 2 matches
((SELECT id FROM teams WHERE team_name = 'Rising Stars'), (SELECT id FROM teams WHERE team_name = 'Fire Hawks'), (SELECT id FROM leagues WHERE league_name = 'VBL Division 2'), '2024-01-15', 3, 1, 3, 1, 'completed', '2024'),
((SELECT id FROM teams WHERE team_name = 'Ice Breakers'), (SELECT id FROM teams WHERE team_name = 'Rising Stars'), (SELECT id FROM leagues WHERE league_name = 'VBL Division 2'), '2024-01-20', 2, 3, 2, 3, 'completed', '2024'),
((SELECT id FROM teams WHERE team_name = 'Fire Hawks'), (SELECT id FROM teams WHERE team_name = 'Ice Breakers'), (SELECT id FROM leagues WHERE league_name = 'VBL Division 2'), '2024-01-25', 3, 0, 3, 0, 'completed', '2024'),

-- Future matches
((SELECT id FROM teams WHERE team_name = 'Your Team'), (SELECT id FROM teams WHERE team_name = 'Wave Crushers'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-02-01', 0, 0, 0, 0, 'scheduled', '2024'),
((SELECT id FROM teams WHERE team_name = 'Thunder Bolts'), (SELECT id FROM teams WHERE team_name = 'Storm Riders'), (SELECT id FROM leagues WHERE league_name = 'VB League'), '2024-02-01', 0, 0, 0, 0, 'scheduled', '2024'),
((SELECT id FROM teams WHERE team_name = 'Rising Stars'), (SELECT id FROM teams WHERE team_name = 'Ice Breakers'), (SELECT id FROM leagues WHERE league_name = 'VBL Division 2'), '2024-02-01', 0, 0, 0, 0, 'scheduled', '2024')
ON CONFLICT DO NOTHING;
```

## Expected Results

After running these SQL commands, you should see:

1. **Matches Table**: Contains match results with home/away teams, scores, sets won, and status
2. **Standings View**: Automatically calculates team performance including:
   - Matches played
   - Wins, losses, draws
   - Points (3 for win, 1 for draw, 0 for loss)
   - Goals for/against and goal difference
   - Win percentage

## Sample Standings Data

Based on the sample matches, the standings should show:

**VB League:**

- Your Team: 3 matches, 3 wins, 0 losses, 9 points
- Thunder Bolts: 3 matches, 1 win, 2 losses, 3 points
- Storm Riders: 3 matches, 1 win, 2 losses, 3 points
- Wave Crushers: 3 matches, 1 win, 2 losses, 3 points

**VBL Division 2:**

- Rising Stars: 2 matches, 2 wins, 0 losses, 6 points
- Fire Hawks: 2 matches, 1 win, 1 loss, 3 points
- Ice Breakers: 2 matches, 0 wins, 2 losses, 0 points

## Testing the Integration

1. Run the SQL commands in Supabase
2. Open your application and navigate to the Standings page
3. The standings should now display real data from the database
4. Teams should be sorted by points (descending), then goal difference, then wins
5. Clicking on a team row should show team details from the database

## Troubleshooting

If you encounter issues:

1. **No data showing**: Check that the matches table has data and the view is working
2. **Permission errors**: Ensure RLS policies are correctly set up
3. **JavaScript errors**: Check browser console for database connection issues
4. **Wrong calculations**: Verify the view logic matches your scoring system

The standings page now uses real database data instead of local storage, providing accurate and up-to-date team performance information.
