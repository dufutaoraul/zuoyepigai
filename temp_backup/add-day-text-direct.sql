-- Add day_text column to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS day_text TEXT;

-- Update each assignment with the original day format from description
UPDATE assignments 
SET day_text = SPLIT_PART(description, ' - ', 1),
    description = SUBSTRING(description FROM POSITION(' - ' IN description) + 3)
WHERE description LIKE '%-%';

-- Verify the results
SELECT assignment_id, day_text, day_number, assignment_title, 
       LEFT(description, 50) as description_preview
FROM assignments 
ORDER BY day_number 
LIMIT 10;