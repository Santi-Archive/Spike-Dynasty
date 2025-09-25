-- Migration: Remove position_status, position_index, and bench_index columns from players table
-- This migration removes the drag and drop related columns that are no longer needed

-- Remove the position_status column
ALTER TABLE players DROP COLUMN IF EXISTS position_status;

-- Remove the position_index column (for starting 7 positions)
ALTER TABLE players DROP COLUMN IF EXISTS position_index;

-- Remove the bench_index column (for bench positions)
ALTER TABLE players DROP COLUMN IF EXISTS bench_index;

-- Optional: Add a comment to document this change
COMMENT ON TABLE players IS 'Players table - position management columns removed';
