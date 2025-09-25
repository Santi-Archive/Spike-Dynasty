-- Migration: Create transfers table
-- Description: Creates the transfers table for tracking player transfers
-- Version: 0.3.0

-- Create transfers table
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    from_team INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    to_team INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    transfer_date VARCHAR(20) NOT NULL, -- Format: YYYY-MM-DD
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfers_player_id ON transfers(player_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_team ON transfers(from_team);
CREATE INDEX IF NOT EXISTS idx_transfers_to_team ON transfers(to_team);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(transfer_date);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_transfers_updated_at 
    BEFORE UPDATE ON transfers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate transfer
CREATE OR REPLACE FUNCTION validate_transfer(
    p_player_id INTEGER,
    p_from_team INTEGER,
    p_to_team INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    player_team_id INTEGER;
BEGIN
    -- Check if player exists
    IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_player_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Get player's current team
    SELECT team_id INTO player_team_id FROM players WHERE id = p_player_id;
    
    -- Validate that from_team matches player's current team
    IF p_from_team IS NOT NULL AND player_team_id != p_from_team THEN
        RETURN FALSE;
    END IF;
    
    -- Validate that to_team is different from from_team
    IF p_from_team = p_to_team THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate transfers
CREATE OR REPLACE FUNCTION validate_transfer_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_transfer(NEW.player_id, NEW.from_team, NEW.to_team) THEN
        RAISE EXCEPTION 'Invalid transfer: player team mismatch or same team transfer';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transfer_trigger
    BEFORE INSERT OR UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION validate_transfer_trigger();
