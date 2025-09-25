-- Migration: Setup test users and teams for testing
-- Description: Creates test users and assigns teams for real-time testing
-- Version: 0.4.1

-- First, let's create some test teams if they don't exist
INSERT INTO teams (team_name, league_id, team_money) VALUES
('Test Team Alpha', 1, 1000000.00),
('Test Team Beta', 1, 1000000.00)
ON CONFLICT (team_name) DO NOTHING;

-- First, create the users in our custom users table
-- Replace these UUIDs with the actual user IDs from Supabase Auth
-- You can find these in the Supabase Dashboard → Authentication → Users

-- Example: Replace '070a7722-b183-4b40-8006-fc8fc4735934' with your actual user ID
INSERT INTO users (id, email, username, display_name, password_hash, is_active) VALUES
('070a7722-b183-4b40-8006-fc8fc4735934', 'testuser1@example.com', 'testuser1', 'Test User 1', 'managed_by_supabase_auth', true),
('2bced672-8b4e-45ac-b744-5678bfbea6ae', 'testuser2@example.com', 'testuser2', 'Test User 2', 'managed_by_supabase_auth', true)
ON CONFLICT (id) DO NOTHING;

-- Now assign teams to the users
-- First, delete any existing assignments to avoid conflicts
DELETE FROM user_teams WHERE user_id IN ('070a7722-b183-4b40-8006-fc8fc4735934', '2bced672-8b4e-45ac-b744-5678bfbea6ae');

-- Then insert the new assignments
INSERT INTO user_teams (user_id, team_id, is_primary) VALUES
('070a7722-b183-4b40-8006-fc8fc4735934', (SELECT id FROM teams WHERE team_name = 'Test Team Alpha'), true),
('2bced672-8b4e-45ac-b744-5678bfbea6ae', (SELECT id FROM teams WHERE team_name = 'Test Team Beta'), true);

-- Create some test players for each team
INSERT INTO players (player_name, team_id, position, age, country, jersey_number, overall, attack, defense, serve, block, receive, setting, contract_years, monthly_wage) VALUES
-- Test Team Alpha players
('John Smith', (SELECT id FROM teams WHERE team_name = 'Test Team Alpha'), 'Outside Hitter', 25, 'USA', 1, 85, 90, 80, 85, 80, 85, 70, 2, 5000.00),
('Mike Johnson', (SELECT id FROM teams WHERE team_name = 'Test Team Alpha'), 'Middle Blocker', 27, 'USA', 2, 82, 75, 90, 80, 95, 75, 60, 3, 4500.00),
('David Wilson', (SELECT id FROM teams WHERE team_name = 'Test Team Alpha'), 'Setter', 24, 'USA', 3, 88, 70, 75, 85, 70, 80, 95, 2, 5500.00),
('Chris Brown', (SELECT id FROM teams WHERE team_name = 'Test Team Alpha'), 'Opposite', 26, 'USA', 4, 83, 95, 70, 90, 75, 70, 65, 2, 4800.00),
('Alex Davis', (SELECT id FROM teams WHERE team_name = 'Test Team Alpha'), 'Libero', 23, 'USA', 5, 80, 60, 95, 70, 60, 95, 50, 3, 4000.00),

-- Test Team Beta players
('Carlos Silva', (SELECT id FROM teams WHERE team_name = 'Test Team Beta'), 'Outside Hitter', 28, 'Brazil', 1, 87, 92, 82, 88, 82, 87, 72, 2, 5200.00),
('Pedro Santos', (SELECT id FROM teams WHERE team_name = 'Test Team Beta'), 'Middle Blocker', 26, 'Brazil', 2, 84, 78, 92, 82, 97, 77, 62, 3, 4700.00),
('Lucas Oliveira', (SELECT id FROM teams WHERE team_name = 'Test Team Beta'), 'Setter', 25, 'Brazil', 3, 89, 72, 77, 87, 72, 82, 96, 2, 5700.00),
('Rafael Costa', (SELECT id FROM teams WHERE team_name = 'Test Team Beta'), 'Opposite', 27, 'Brazil', 4, 85, 97, 72, 92, 77, 72, 67, 2, 5000.00),
('Gabriel Lima', (SELECT id FROM teams WHERE team_name = 'Test Team Beta'), 'Libero', 24, 'Brazil', 5, 82, 62, 97, 72, 62, 97, 52, 3, 4200.00);

-- Create some test transfer market players (free agents)
INSERT INTO players (player_name, team_id, position, age, country, jersey_number, overall, attack, defense, serve, block, receive, setting, contract_years, monthly_wage) VALUES
('Free Agent 1', NULL, 'Outside Hitter', 24, 'Italy', 99, 80, 85, 75, 80, 75, 80, 65, 1, 3000.00),
('Free Agent 2', NULL, 'Middle Blocker', 26, 'Poland', 99, 78, 70, 85, 75, 90, 70, 55, 1, 2800.00),
('Free Agent 3', NULL, 'Setter', 25, 'France', 99, 82, 65, 70, 80, 65, 75, 90, 1, 3200.00);
