-- Migration: Update existing tables for user authentication
-- Description: Updates existing tables to work with the new user authentication system
-- Version: 0.4.0

-- Update teams table to add RLS policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Users can view teams (needed for transfer market and standings)
CREATE POLICY "Users can view all teams" ON teams
    FOR SELECT USING (true);

-- Users can only update their own team's money
CREATE POLICY "Users can update own team money" ON teams
    FOR UPDATE USING (
        id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Update players table to add RLS policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Users can view all players (needed for transfer market)
CREATE POLICY "Users can view all players" ON players
    FOR SELECT USING (true);

-- Users can only update players on their own team
CREATE POLICY "Users can update own team players" ON players
    FOR UPDATE USING (
        team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Users can only insert players to their own team
CREATE POLICY "Users can insert players to own team" ON players
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Users can only delete players from their own team
CREATE POLICY "Users can delete own team players" ON players
    FOR DELETE USING (
        team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Update transfers table to add RLS policies
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Users can view all transfers (needed for transfer history)
CREATE POLICY "Users can view all transfers" ON transfers
    FOR SELECT USING (true);

-- Users can only create transfers involving their own team
CREATE POLICY "Users can create transfers for own team" ON transfers
    FOR INSERT WITH CHECK (
        from_team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        ) OR to_team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Users can only update transfers involving their own team
CREATE POLICY "Users can update transfers for own team" ON transfers
    FOR UPDATE USING (
        from_team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        ) OR to_team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Update leagues table to add RLS policies
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Users can view all leagues
CREATE POLICY "Users can view all leagues" ON leagues
    FOR SELECT USING (true);

-- Create function to get user's primary team ID
CREATE OR REPLACE FUNCTION get_user_primary_team_id(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    team_id INTEGER;
BEGIN
    SELECT ut.team_id INTO team_id
    FROM user_teams ut
    WHERE ut.user_id = user_uuid AND ut.is_primary = true;
    
    RETURN team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user owns a team
CREATE OR REPLACE FUNCTION user_owns_team(user_uuid UUID, team_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_teams ut 
        WHERE ut.user_id = user_uuid 
        AND ut.team_id = team_id 
        AND ut.is_primary = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
