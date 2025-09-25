-- Migration: Create players table
-- Description: Creates the players table with flexible stats system for future extensibility
-- Version: 0.3.0

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    position TEXT NOT NULL,
    age SMALLINT NOT NULL CHECK (age >= 16 AND age <= 50),
    country TEXT NOT NULL,
    jersey_number SMALLINT NOT NULL CHECK (jersey_number >= 1 AND jersey_number <= 99),
    overall SMALLINT NOT NULL CHECK (overall >= 1 AND overall <= 100),
    attack SMALLINT NOT NULL CHECK (attack >= 1 AND attack <= 100),
    defense SMALLINT NOT NULL CHECK (defense >= 1 AND defense <= 100),
    serve SMALLINT NOT NULL CHECK (serve >= 1 AND serve <= 100),
    block SMALLINT NOT NULL CHECK (block >= 1 AND block <= 100),
    receive SMALLINT NOT NULL CHECK (receive >= 1 AND receive <= 100),
    setting SMALLINT NOT NULL CHECK (setting >= 1 AND setting <= 100),
    contract_years SMALLINT NOT NULL DEFAULT 1 CHECK (contract_years >= 1 AND contract_years <= 10),
    monthly_wage NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
    player_value NUMERIC(15,2) NOT NULL DEFAULT 100000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_overall ON players(overall);
CREATE INDEX IF NOT EXISTS idx_players_country ON players(country);
CREATE INDEX IF NOT EXISTS idx_players_jersey_number ON players(jersey_number);

-- Create unique constraint for jersey number per team
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_team_jersey_unique 
ON players(team_id, jersey_number) 
WHERE team_id IS NOT NULL;

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate player value based on stats
CREATE OR REPLACE FUNCTION calculate_player_value(
    p_overall INTEGER,
    p_age INTEGER,
    p_attack INTEGER,
    p_defense INTEGER,
    p_serve INTEGER,
    p_block INTEGER,
    p_receive INTEGER,
    p_setting INTEGER
) RETURNS NUMERIC AS $$
DECLARE
    base_value NUMERIC;
    age_modifier NUMERIC;
    stat_bonus NUMERIC;
BEGIN
    -- Base value calculation
    base_value := p_overall * 5000;
    
    -- Age modifier (younger players are more valuable)
    IF p_age < 22 THEN
        age_modifier := 1.3;
    ELSIF p_age < 25 THEN
        age_modifier := 1.1;
    ELSIF p_age < 30 THEN
        age_modifier := 1.0;
    ELSIF p_age < 35 THEN
        age_modifier := 0.8;
    ELSE
        age_modifier := 0.6;
    END IF;
    
    -- Stat bonus for exceptional stats
    stat_bonus := (p_attack + p_defense + p_serve + p_block + p_receive + p_setting) * 50;
    
    RETURN ROUND((base_value * age_modifier) + stat_bonus, 2);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate player value
CREATE OR REPLACE FUNCTION update_player_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.player_value := calculate_player_value(
        NEW.overall,
        NEW.age,
        NEW.attack,
        NEW.defense,
        NEW.serve,
        NEW.block,
        NEW.receive,
        NEW.setting
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_value_trigger
    BEFORE INSERT OR UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_player_value();
