-- ==============================================================================
-- LUCY PROJECT: ROLE MIGRATION SCRIPT
-- Run this script on your local SQL Server to migrate legacy roles to the new standard.
-- ==============================================================================

USE LUCY_DBS;
GO

-- 1. Migrate Admin to Super
UPDATE Users 
SET role = 'super' 
WHERE role = 'admin';

-- 2. Migrate Teachers/Mentors to Pro
UPDATE Users 
SET role = 'pro' 
WHERE role IN ('teacher', 'mentor');

-- 3. Migrate Students/Influencers to Lucy
UPDATE Users 
SET role = 'lucy' 
WHERE role IN ('student', 'influencer', 'user');

-- 4. Verify the migration
SELECT id, username, role FROM Users;
GO
