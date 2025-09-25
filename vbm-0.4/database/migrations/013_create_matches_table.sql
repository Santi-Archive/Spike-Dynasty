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
