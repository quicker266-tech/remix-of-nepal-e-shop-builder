-- Add position column to page_sections table
-- Values: 'above' = before built-in content, 'below' = after built-in content
ALTER TABLE page_sections 
ADD COLUMN position TEXT NOT NULL DEFAULT 'below';

-- Add check constraint for valid values
ALTER TABLE page_sections 
ADD CONSTRAINT page_sections_position_check 
CHECK (position IN ('above', 'below'));