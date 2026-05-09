ALTER TABLE survey_questions 
ADD COLUMN section VARCHAR(100) NOT NULL DEFAULT 'General' AFTER survey_id;

INSERT INTO surveys (title, start_at, end_at, created_by) VALUES 
('Course Evaluation Survey', '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1);

INSERT INTO course_surveys (survey_id, course_id)
SELECT 1, course_id FROM courses;

INSERT INTO survey_questions (survey_id, section, question_text, is_required, display_order) VALUES
-- Instructor / TA Evaluation
(1, 'Instructor Evaluation', 'The instructor explains concepts clearly', 1, 1),
(1, 'Instructor Evaluation', 'The instructor is available for questions', 1, 2),
(1, 'Instructor Evaluation', 'The instructor provides helpful feedback', 1, 3),
(1, 'Instructor Evaluation', 'The instructor respects students', 1, 4),
(1, 'Instructor Evaluation', 'The instructor encourages participation', 1, 5),
-- Course Material
(1, 'Course Material', 'The course material is well organized', 1, 6),
(1, 'Course Material', 'The textbook and resources are helpful', 1, 7),
(1, 'Course Material', 'The course content matches the objectives', 1, 8),
(1, 'Course Material', 'The difficulty level is appropriate', 1, 9),
(1, 'Course Material', 'Lecture slides are clear and useful', 1, 10),
-- Assessment Methods
(1, 'Assessment Methods', 'Assignments reflect course content fairly', 1, 11),
(1, 'Assessment Methods', 'Exams are clearly structured', 1, 12),
(1, 'Assessment Methods', 'Grading criteria are transparent', 1, 13),
(1, 'Assessment Methods', 'Feedback on assessments is timely', 1, 14),
(1, 'Assessment Methods', 'The workload is manageable', 1, 15),
-- E-Learning Platform
(1, 'E-Learning Platform', 'The online platform is easy to navigate', 1, 16),
(1, 'E-Learning Platform', 'Course materials are accessible online', 1, 17),
(1, 'E-Learning Platform', 'Online tools support learning effectively', 1, 18),
(1, 'E-Learning Platform', 'Technical issues are resolved quickly', 1, 19),
(1, 'E-Learning Platform', 'The platform enhances the learning experience', 1, 20),
-- Course Outcomes
(1, 'Course Outcomes', 'I achieved the learning objectives', 1, 21),
(1, 'Course Outcomes', 'This course improved my understanding of the subject', 1, 22),
(1, 'Course Outcomes', 'I can apply what I learned practically', 1, 23),
(1, 'Course Outcomes', 'The course prepared me for future studies', 1, 24),
(1, 'Course Outcomes', 'I would recommend this course to others', 1, 25),
-- Suggestions
(1, 'Suggestions', 'What did you like most about this course?', 0, 26),
(1, 'Suggestions', 'What could be improved?', 0, 27),
(1, 'Suggestions', 'Any additional comments for the instructor?', 0, 28);


ALTER TABLE survey_responses
ADD COLUMN course_id INT(11) NOT NULL AFTER survey_id,
ADD INDEX (course_id);

ALTER TABLE survey_questions 
ADD COLUMN question_type ENUM('likert', 'text') NOT NULL DEFAULT 'likert';

UPDATE survey_questions 
SET question_type = 'text' 
WHERE section = 'Suggestions';

ALTER TABLE answers 
ADD COLUMN likert_score TINYINT NULL AFTER answer_text;

-- testing data for notifications will be changed later to be dynamic
INSERT INTO notifications
(title, sender_id, sender_type, receiver_id, notify_by_email, is_read, sent_at)
VALUES
(
  'A new course survey for CS301 - Web Development is now open.',
  1,
  'survey',
  3,
  1,
  0,
  NOW()
),
(
  'Your Data Structures appeal has been submitted successfully.',
  2,
  'appeal',
  3,
  1,
  1,
  NOW()
),
(
  'Your Operating Systems appeal has been resolved.',
  2,
  'appeal',
  3,
  1,
  0,
  NOW()
),
(
  'Course evaluation survey deadline is approaching.',
  1,
  'survey',
  3,
  0,
  0,
  NOW()
),
(
  'A new survey for CS203 - Data Structures is available now.',
  1,
  'survey',
  3,
  1,
  1,
  NOW()
);

UPDATE grade_appeals 
SET assigned_instructor_id = 5 
WHERE appeal_id = 3;

ALTER TABLE grade_appeals
ADD COLUMN assigned_by INT NULL AFTER assigned_instructor_id,
ADD COLUMN assigned_at TIMESTAMP NULL AFTER assigned_by,
ADD FOREIGN KEY (assigned_by) REFERENCES users(user_id);