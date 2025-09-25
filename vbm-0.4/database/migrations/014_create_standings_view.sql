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

-- Create a function to get standings for a specific league
CREATE OR REPLACE FUNCTION get_league_standings(league_name_param TEXT DEFAULT NULL)
RETURNS TABLE (
    team_id INTEGER,
    team_name TEXT,
    league_id INTEGER,
    league_name TEXT,
    matches_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    draws INTEGER,
    points INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    goal_difference INTEGER,
    win_percentage DECIMAL
) AS $$
BEGIN
    IF league_name_param IS NULL THEN
        RETURN QUERY
        SELECT * FROM team_standings
        ORDER BY league_id, points DESC, goal_difference DESC, wins DESC, team_name;
    ELSE
        RETURN QUERY
        SELECT * FROM team_standings
        WHERE team_standings.league_name = league_name_param
        ORDER BY points DESC, goal_difference DESC, wins DESC, team_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get standings for a specific team
CREATE OR REPLACE FUNCTION get_team_standings(team_id_param INTEGER)
RETURNS TABLE (
    team_id INTEGER,
    team_name TEXT,
    league_id INTEGER,
    league_name TEXT,
    matches_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    draws INTEGER,
    points INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    goal_difference INTEGER,
    win_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM team_standings
    WHERE team_standings.team_id = team_id_param;
END;
$$ LANGUAGE plpgsql;
