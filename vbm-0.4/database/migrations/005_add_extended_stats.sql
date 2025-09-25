-- Migration: Add extended player stats columns
-- Description: Adds flexible extended statistics columns to the players table
-- Version: 0.3.0

-- Add extended physical attributes
ALTER TABLE players ADD COLUMN IF NOT EXISTS speed SMALLINT CHECK (speed >= 1 AND speed <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS agility SMALLINT CHECK (agility >= 1 AND agility <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS strength SMALLINT CHECK (strength >= 1 AND strength <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS endurance SMALLINT CHECK (endurance >= 1 AND endurance <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS height SMALLINT CHECK (height >= 150 AND height <= 220);

-- Add mental attributes
ALTER TABLE players ADD COLUMN IF NOT EXISTS leadership SMALLINT CHECK (leadership >= 1 AND leadership <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS teamwork SMALLINT CHECK (teamwork >= 1 AND teamwork <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS concentration SMALLINT CHECK (concentration >= 1 AND concentration <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS pressure_handling SMALLINT CHECK (pressure_handling >= 1 AND pressure_handling <= 100);

-- Add technical skills
ALTER TABLE players ADD COLUMN IF NOT EXISTS jump_serve SMALLINT CHECK (jump_serve >= 1 AND jump_serve <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS float_serve SMALLINT CHECK (float_serve >= 1 AND float_serve <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS spike_power SMALLINT CHECK (spike_power >= 1 AND spike_power <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS spike_accuracy SMALLINT CHECK (spike_accuracy >= 1 AND spike_accuracy <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS block_timing SMALLINT CHECK (block_timing >= 1 AND block_timing <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS dig_technique SMALLINT CHECK (dig_technique >= 1 AND dig_technique <= 100);

-- Add experience and development
ALTER TABLE players ADD COLUMN IF NOT EXISTS experience SMALLINT CHECK (experience >= 1 AND experience <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS potential SMALLINT CHECK (potential >= 1 AND potential <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS consistency SMALLINT CHECK (consistency >= 1 AND consistency <= 100);

-- Create indexes for commonly queried extended stats
CREATE INDEX IF NOT EXISTS idx_players_speed ON players(speed);
CREATE INDEX IF NOT EXISTS idx_players_agility ON players(agility);
CREATE INDEX IF NOT EXISTS idx_players_strength ON players(strength);
CREATE INDEX IF NOT EXISTS idx_players_height ON players(height);
CREATE INDEX IF NOT EXISTS idx_players_leadership ON players(leadership);
CREATE INDEX IF NOT EXISTS idx_players_potential ON players(potential);

-- Update the player value calculation function to include extended stats
CREATE OR REPLACE FUNCTION calculate_player_value_extended(
    p_overall INTEGER,
    p_age INTEGER,
    p_attack INTEGER,
    p_defense INTEGER,
    p_serve INTEGER,
    p_block INTEGER,
    p_receive INTEGER,
    p_setting INTEGER,
    p_speed INTEGER DEFAULT NULL,
    p_agility INTEGER DEFAULT NULL,
    p_strength INTEGER DEFAULT NULL,
    p_leadership INTEGER DEFAULT NULL,
    p_potential INTEGER DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
    base_value NUMERIC;
    age_modifier NUMERIC;
    stat_bonus NUMERIC;
    extended_bonus NUMERIC;
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
    
    -- Core stat bonus
    stat_bonus := (p_attack + p_defense + p_serve + p_block + p_receive + p_setting) * 50;
    
    -- Extended stat bonus (if available)
    extended_bonus := 0;
    IF p_speed IS NOT NULL THEN
        extended_bonus := extended_bonus + (p_speed * 25);
    END IF;
    IF p_agility IS NOT NULL THEN
        extended_bonus := extended_bonus + (p_agility * 25);
    END IF;
    IF p_strength IS NOT NULL THEN
        extended_bonus := extended_bonus + (p_strength * 30);
    END IF;
    IF p_leadership IS NOT NULL THEN
        extended_bonus := extended_bonus + (p_leadership * 40);
    END IF;
    IF p_potential IS NOT NULL THEN
        extended_bonus := extended_bonus + (p_potential * 60);
    END IF;
    
    RETURN ROUND((base_value * age_modifier) + stat_bonus + extended_bonus, 2);
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the extended calculation function
CREATE OR REPLACE FUNCTION update_player_value_extended()
RETURNS TRIGGER AS $$
BEGIN
    NEW.player_value := calculate_player_value_extended(
        NEW.overall,
        NEW.age,
        NEW.attack,
        NEW.defense,
        NEW.serve,
        NEW.block,
        NEW.receive,
        NEW.setting,
        NEW.speed,
        NEW.agility,
        NEW.strength,
        NEW.leadership,
        NEW.potential
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger and create the new one
DROP TRIGGER IF EXISTS update_player_value_trigger ON players;
CREATE TRIGGER update_player_value_extended_trigger
    BEFORE INSERT OR UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_player_value_extended();

-- Create a function to generate random extended stats for existing players
CREATE OR REPLACE FUNCTION populate_extended_stats()
RETURNS INTEGER AS $$
DECLARE
    player_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR player_record IN 
        SELECT id, position, overall, age FROM players 
        WHERE speed IS NULL OR agility IS NULL OR strength IS NULL
    LOOP
        -- Generate random extended stats based on position and overall rating
        UPDATE players SET
            speed = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.7 + RANDOM() * 0.6)))),
            agility = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.7 + RANDOM() * 0.6)))),
            strength = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.7 + RANDOM() * 0.6)))),
            endurance = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.6 + RANDOM() * 0.8)))),
            height = GREATEST(150, LEAST(220, ROUND(170 + (RANDOM() * 30)))),
            leadership = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.5 + RANDOM() * 0.8)))),
            teamwork = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.6 + RANDOM() * 0.7)))),
            concentration = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.7 + RANDOM() * 0.6)))),
            pressure_handling = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.6 + RANDOM() * 0.7)))),
            jump_serve = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.5 + RANDOM() * 0.8)))),
            float_serve = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.6 + RANDOM() * 0.7)))),
            spike_power = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.7 + RANDOM() * 0.6)))),
            spike_accuracy = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.7 + RANDOM() * 0.6)))),
            block_timing = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.6 + RANDOM() * 0.7)))),
            dig_technique = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.6 + RANDOM() * 0.7)))),
            experience = GREATEST(1, LEAST(100, ROUND(player_record.age * 2 + RANDOM() * 20))),
            potential = GREATEST(1, LEAST(100, ROUND((100 - player_record.age) * 2 + RANDOM() * 30))),
            consistency = GREATEST(1, LEAST(100, ROUND(player_record.overall * (0.7 + RANDOM() * 0.6))))
        WHERE id = player_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Run the function to populate extended stats for existing players
SELECT populate_extended_stats();

-- Drop the temporary function
DROP FUNCTION populate_extended_stats();
