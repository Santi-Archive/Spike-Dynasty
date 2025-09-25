-- Migration: Temporarily disable RLS for data migration
-- Description: Creates a function to temporarily disable RLS policies during migration
-- Version: 0.4.2

-- Create a function to check if we're in migration mode
-- This function checks if there are no users in the system, indicating migration mode
CREATE OR REPLACE FUNCTION is_migration_mode()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if there are any users in the system
    -- If no users exist, we're likely in migration mode
    RETURN NOT EXISTS (SELECT 1 FROM users LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update players table RLS policies to allow migration
DROP POLICY IF EXISTS "Users can insert players to own team or during migration" ON players;
DROP POLICY IF EXISTS "Users can insert players to own team" ON players;

-- Create new policy that allows insertion during migration OR when user owns team
CREATE POLICY "Users can insert players to own team or during migration" ON players
    FOR INSERT WITH CHECK (
        is_migration_mode() OR
        team_id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Update teams table RLS policies to allow migration
DROP POLICY IF EXISTS "Users can update own team money or during migration" ON teams;
DROP POLICY IF EXISTS "Users can update own team money" ON teams;

-- Create new policy that allows team updates during migration OR when user owns team
CREATE POLICY "Users can update own team money or during migration" ON teams
    FOR UPDATE USING (
        is_migration_mode() OR
        id IN (
            SELECT ut.team_id 
            FROM user_teams ut 
            WHERE ut.user_id = auth.uid() AND ut.is_primary = true
        )
    );

-- Allow team insertion during migration
CREATE POLICY "Users can insert teams during migration" ON teams
    FOR INSERT WITH CHECK (is_migration_mode());

-- Allow league insertion during migration
CREATE POLICY "Users can insert leagues during migration" ON leagues
    FOR INSERT WITH CHECK (is_migration_mode());

-- Update transfers table RLS policies to allow migration
DROP POLICY IF EXISTS "Users can create transfers involving own team or during migration" ON transfers;
DROP POLICY IF EXISTS "Users can create transfers for own team" ON transfers;

-- Create new policy that allows transfer creation during migration OR when user owns team
CREATE POLICY "Users can create transfers involving own team or during migration" ON transfers
    FOR INSERT WITH CHECK (
        is_migration_mode() OR
        (
            from_team_id IN (
                SELECT ut.team_id 
                FROM user_teams ut 
                WHERE ut.user_id = auth.uid() AND ut.is_primary = true
            ) OR
            to_team_id IN (
                SELECT ut.team_id 
                FROM user_teams ut 
                WHERE ut.user_id = auth.uid() AND ut.is_primary = true
            )
        )
    );

-- Update transfers table UPDATE policy
DROP POLICY IF EXISTS "Users can update transfers involving own team or during migration" ON transfers;
DROP POLICY IF EXISTS "Users can update transfers for own team" ON transfers;

-- Create new policy that allows transfer updates during migration OR when user owns team
CREATE POLICY "Users can update transfers involving own team or during migration" ON transfers
    FOR UPDATE USING (
        is_migration_mode() OR
        (
            from_team_id IN (
                SELECT ut.team_id 
                FROM user_teams ut 
                WHERE ut.user_id = auth.uid() AND ut.is_primary = true
            ) OR
            to_team_id IN (
                SELECT ut.team_id 
                FROM user_teams ut 
                WHERE ut.user_id = auth.uid() AND ut.is_primary = true
            )
        )
    );
