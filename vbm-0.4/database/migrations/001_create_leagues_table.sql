-- Migration: Create leagues table
-- Description: Creates the leagues table for storing league information
-- Version: 0.3.0

-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id SERIAL PRIMARY KEY,
    league_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on league_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_leagues_league_name ON leagues(league_name);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Insert default leagues
INSERT INTO leagues (league_name) VALUES 
    ('VB League'),
    ('VBL Division 2')
ON CONFLICT (league_name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leagues_updated_at 
    BEFORE UPDATE ON leagues 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
