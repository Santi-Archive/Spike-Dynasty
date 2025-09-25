-- Migration: Create user_teams table for linking users to their teams
-- Description: Creates the user_teams table to establish ownership between users and teams
-- Version: 0.4.0

-- Create user_teams table
CREATE TABLE IF NOT EXISTS user_teams (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one user can only own one team
    UNIQUE(user_id, team_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team_id ON user_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_primary ON user_teams(is_primary) WHERE is_primary = true;

-- Enable Row Level Security
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own team associations
CREATE POLICY "Users can view own team associations" ON user_teams
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own team associations
CREATE POLICY "Users can insert own team associations" ON user_teams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own team associations
CREATE POLICY "Users can update own team associations" ON user_teams
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own team associations
CREATE POLICY "Users can delete own team associations" ON user_teams
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_teams_updated_at 
    BEFORE UPDATE ON user_teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure only one primary team per user
CREATE OR REPLACE FUNCTION ensure_single_primary_team()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a team as primary, unset all other primary teams for this user
    IF NEW.is_primary = true THEN
        UPDATE user_teams 
        SET is_primary = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single primary team
CREATE TRIGGER ensure_single_primary_team_trigger
    BEFORE INSERT OR UPDATE ON user_teams
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_team();
