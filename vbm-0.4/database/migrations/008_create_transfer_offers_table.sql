-- Migration: Create transfer_offers table for player transfer negotiations
-- Description: Creates the transfer_offers table for managing transfer offers between users
-- Version: 0.4.0

-- Create transfer_offers table
CREATE TABLE IF NOT EXISTS transfer_offers (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_amount NUMERIC(15,2) NOT NULL CHECK (offer_amount > 0),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure a user can't make multiple pending offers for the same player
    UNIQUE(player_id, from_user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfer_offers_player_id ON transfer_offers(player_id);
CREATE INDEX IF NOT EXISTS idx_transfer_offers_from_user_id ON transfer_offers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_offers_to_user_id ON transfer_offers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_offers_status ON transfer_offers(status);
CREATE INDEX IF NOT EXISTS idx_transfer_offers_expires_at ON transfer_offers(expires_at);

-- Enable Row Level Security
ALTER TABLE transfer_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view offers they sent or received
CREATE POLICY "Users can view own transfer offers" ON transfer_offers
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create offers (only as the sender)
CREATE POLICY "Users can create transfer offers" ON transfer_offers
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update offers they sent (to withdraw) or received (to accept/reject)
CREATE POLICY "Users can update own transfer offers" ON transfer_offers
    FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can delete offers they sent
CREATE POLICY "Users can delete own sent offers" ON transfer_offers
    FOR DELETE USING (auth.uid() = from_user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_transfer_offers_updated_at 
    BEFORE UPDATE ON transfer_offers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically expire old offers
CREATE OR REPLACE FUNCTION expire_old_offers()
RETURNS void AS $$
BEGIN
    UPDATE transfer_offers 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to validate transfer offer
CREATE OR REPLACE FUNCTION validate_transfer_offer()
RETURNS TRIGGER AS $$
DECLARE
    player_team_id INTEGER;
    from_user_team_id INTEGER;
    to_user_team_id INTEGER;
    from_user_balance NUMERIC;
BEGIN
    -- Get player's current team
    SELECT team_id INTO player_team_id FROM players WHERE id = NEW.player_id;
    
    -- Get the team IDs for both users
    SELECT ut.team_id INTO from_user_team_id 
    FROM user_teams ut 
    WHERE ut.user_id = NEW.from_user_id AND ut.is_primary = true;
    
    SELECT ut.team_id INTO to_user_team_id 
    FROM user_teams ut 
    WHERE ut.user_id = NEW.to_user_id AND ut.is_primary = true;
    
    -- Validate that the player belongs to the receiving user's team
    IF player_team_id != to_user_team_id THEN
        RAISE EXCEPTION 'Player does not belong to the specified team';
    END IF;
    
    -- Validate that the offering user has enough money
    SELECT team_money INTO from_user_balance 
    FROM teams 
    WHERE id = from_user_team_id;
    
    IF from_user_balance < NEW.offer_amount THEN
        RAISE EXCEPTION 'Insufficient funds for this offer';
    END IF;
    
    -- Validate that users can't make offers to themselves
    IF NEW.from_user_id = NEW.to_user_id THEN
        RAISE EXCEPTION 'Users cannot make offers to themselves';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate transfer offers
CREATE TRIGGER validate_transfer_offer_trigger
    BEFORE INSERT ON transfer_offers
    FOR EACH ROW
    EXECUTE FUNCTION validate_transfer_offer();
