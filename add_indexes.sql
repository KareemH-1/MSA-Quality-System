
ALTER TABLE users 
ADD INDEX idx_faculty_id (faculty_id),
ADD INDEX idx_role_faculty (role, faculty_id),
ADD INDEX idx_role (role);

ALTER TABLE courses
ADD INDEX idx_faculty_id (faculty_id),
ADD INDEX idx_module_leader_id (module_leader_id),
DROP COLUMN IF EXISTS semester,
ADD COLUMN IF NOT EXISTS semesters JSON DEFAULT NULL;

SHOW INDEX FROM users;
SHOW INDEX FROM courses;

