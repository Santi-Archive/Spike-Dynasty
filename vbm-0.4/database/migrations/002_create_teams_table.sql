-- Migration: Create teams table
-- Description: Creates the teams table for storing team information
-- Version: 0.3.0

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team_name TEXT NOT NULL UNIQUE,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_money NUMERIC(15,2) DEFAULT 1000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON teams(league_id);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Insert default teams
INSERT INTO teams (team_name, league_id, team_money) VALUES 
    ('Your Team', (SELECT id FROM leagues WHERE league_name = 'VB League'), 1000000.00),
    ('Thunder Bolts', (SELECT id FROM leagues WHERE league_name = 'VB League'), 800000.00),
    ('Storm Riders', (SELECT id FROM leagues WHERE league_name = 'VB League'), 750000.00),
    ('Wave Crushers', (SELECT id FROM leagues WHERE league_name = 'VB League'), 600000.00),
    ('Rising Stars', (SELECT id FROM leagues WHERE league_name = 'VBL Division 2'), 500000.00),
    ('Fire Hawks', (SELECT id FROM leagues WHERE league_name = 'VBL Division 2'), 450000.00),
    ('Ice Breakers', (SELECT id FROM leagues WHERE league_name = 'VBL Division 2'), 400000.00)
ON CONFLICT (team_name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
