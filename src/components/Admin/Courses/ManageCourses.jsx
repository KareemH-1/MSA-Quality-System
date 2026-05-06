import React from 'react';
import '../../Admin/styles/manageCourses.css';
import PagificationContainer from '../../General/PagificationContainer';
import CourseFormModal from './CourseFormModal';

const ManageCourses = () => {
  const [courses, setCourses] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [totalCourses, setTotalCourses] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState('add');
  const [editingCourse, setEditingCourse] = React.useState(null);
  const [faculties, setFaculties] = React.useState([]);
  const [moduleLeaders, setModuleLeaders] = React.useState([]);
  const [selectedCourse, setSelectedCourse] = React.useState(null);
  const [selectedCourseStats, setSelectedCourseStats] = React.useState(null);
  const [selectedStatsLoading, setSelectedStatsLoading] = React.useState(false);

  const fetchCourses = React.useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ page, perPage });
    if (search.trim()) {
      params.set('search', search.trim());
    }

    fetch(`/api/View/ManageCoursesView.php?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setCourses(Array.isArray(data.courses) ? data.courses : []);
          setTotalCourses(typeof data.total === 'number' ? data.total : 0);
        } else {
          alert(`Failed to load courses: ${data.message || 'Unknown error'}`);
        }
      })
      .catch((error) => {
        console.error('Failed to load courses', error);
        alert('Failed to load courses');
      })
      .finally(() => setIsLoading(false));
  }, [page, perPage, search]);

  const loadHelpers = React.useCallback(() => {
    fetch('/api/View/FacultyView.php')
      .then((response) => response.json())
      .then((data) => {
        setFaculties(Array.isArray(data.faculties) ? data.faculties : []);
      })
      .catch((error) => console.error('faculty load failed', error));

    fetch('/api/View/ManageUsersView.php')
      .then((response) => response.json())
      .then((data) => {
        const users = Array.isArray(data.users) ? data.users : [];
        const leaders = users.filter((user) => {
          const role = String(user.role || '').toLowerCase();
          return role === 'module_leader' || role === 'module leader';
        });
        setModuleLeaders(leaders);
      })
      .catch((error) => console.error('user load failed', error));
  }, []);

  React.useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  React.useEffect(() => {
    loadHelpers();
  }, [loadHelpers]);

  const loadCourseStats = React.useCallback((courseId) => {
    if (!courseId) {
      setSelectedCourseStats(null);
      return;
    }

    setSelectedStatsLoading(true);
    fetch(`/api/View/ManageCoursesView.php?get_type=courseStats&course_id=${courseId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setSelectedCourseStats(data.stats || null);
        } else {
          setSelectedCourseStats(null);
        }
      })
      .catch((error) => {
        console.error('Failed to load course stats', error);
        setSelectedCourseStats(null);
      })
      .finally(() => setSelectedStatsLoading(false));
  }, []);

  const openAddCourse = () => {
    setModalMode('add');
    setEditingCourse(null);
    setModalOpen(true);
  };

  const openEditCourse = (course) => {
    setModalMode('edit');
    setEditingCourse(course);
    setModalOpen(true);
  };

  const openCourseDetails = (course) => {
    setSelectedCourse(course);
    loadCourseStats(course.course_id);
  };

  const handleDelete = (course) => {
    if (!window.confirm(`Delete course "${course.code} - ${course.name}"? This cannot be undone.`)) {
      return;
    }

    fetch('/api/View/ManageCoursesView.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: course.course_id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          if (selectedCourse?.course_id === course.course_id) {
            setSelectedCourse(null);
            setSelectedCourseStats(null);
          }
          fetchCourses();
        } else {
          alert(`Delete failed: ${data.message || 'Unknown error'}`);
        }
      })
      .catch((error) => {
        console.error('Delete failed', error);
        alert('Delete failed');
      });
  };

  const handleSubmitCourse = (payload, mode) => {
    if (mode === 'add') {
      fetch('/api/View/ManageCoursesView.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === 'success') {
            setModalOpen(false);
            fetchCourses();
          } else {
            alert(`Create failed: ${data.message || 'Unknown error'}`);
          }
        })
        .catch((error) => {
          console.error('Create failed', error);
          alert('Create failed');
        });
      return;
    }

    const body = { course_id: editingCourse?.course_id };
    if (payload.code !== undefined) body.code = payload.code;
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.level !== undefined) body.level = payload.level;
    if (payload.semesters !== undefined) body.semesters = payload.semesters;
    if (payload.faculty_id !== undefined) body.faculty_id = payload.faculty_id;
    if (payload.module_leader_id !== undefined) body.module_leader_id = payload.module_leader_id;

    fetch('/api/View/ManageCoursesView.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          setModalOpen(false);
          setEditingCourse(null);
          fetchCourses();
        } else {
          alert(`Update failed: ${data.message || 'Unknown error'}`);
        }
      })
      .catch((error) => {
        console.error('Update failed', error);
        alert('Update failed');
      });
  };

  return (
    <div className="ManageCourses">
      <div className="mngHeader">
        <div className="title">
          <span>ADMINISTRATION</span>
          <h1>Manage Courses</h1>
        </div>
        <div className="end">
          <button type="button" className="addCourse" onClick={openAddCourse}>
            Add Course
          </button>
        </div>
      </div>

      <div className="contentMng">
        <div className="filtersRow">
          <input
            placeholder="Search courses"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <PagificationContainer
          data={courses}
          totalItems={totalCourses}
          itemName="courses"
          currentPage={page}
          setCurrentPage={setPage}
          rowsPerPage={perPage}
          onRowsPerPageChange={(nextRowsPerPage) => {
            setPerPage(nextRowsPerPage);
            setPage(1);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
          initialRowsPerPage={perPage}
          disableLocalPagination
        >
          {(paginatedCourses) => (
            <>
              <div className="courseTable">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Level</th>
                      <th>Semesters</th>
                      <th>Faculty</th>
                      <th>Module Leader</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7}>Loading...</td>
                      </tr>
                    ) : paginatedCourses.length > 0 ? (
                      paginatedCourses.map((course) => (
                        <tr
                          key={course.course_id}
                          className={selectedCourse?.course_id === course.course_id ? 'isSelected' : ''}
                          onClick={() => openCourseDetails(course)}
                        >
                          <td>{course.code}</td>
                          <td>{course.name}</td>
                          <td>{course.level}</td>
                          <td>{Array.isArray(course.semesters) ? course.semesters.join(', ') : '—'}</td>
                          <td>{course.faculty_name || '—'}</td>
                          <td>{course.module_leader_name || '—'}</td>
                          <td onClick={(event) => event.stopPropagation()}>
                            <button type="button" className="editBtn" onClick={() => openEditCourse(course)}>
                              Edit
                            </button>
                            <button type="button" className="deleteBtn" onClick={() => handleDelete(course)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>No courses found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="courseStatsPanel">
                {!selectedCourse ? (
                  <div className="emptyStats">Click a course to view its stats.</div>
                ) : selectedStatsLoading ? (
                  <div className="emptyStats">Loading course stats...</div>
                ) : (
                  <>
                    <div className="statsHead">
                      <div>
                        <h3>{selectedCourse.code} - {selectedCourse.name}</h3>
                        <p>{selectedCourse.faculty_name || 'No faculty assigned'}</p>
                        <p>{selectedCourseStats?.latest_survey_title ? `Latest survey: ${selectedCourseStats.latest_survey_title}` : 'Latest survey: none'}</p>
                      </div>
                      <button type="button" className="secondaryBtn" onClick={() => openEditCourse(selectedCourse)}>
                        Edit Course
                      </button>
                    </div>

                    <div className="statsGrid">
                      <div className="statsCard">
                        <strong>{selectedCourseStats?.enrolled_students ?? 0}</strong>
                        <span>Students registered</span>
                      </div>
                      <div className="statsCard">
                        <strong>{selectedCourseStats?.instructors ?? 0}</strong>
                        <span>Instructors</span>
                      </div>
                      <div className="statsCard">
                        <strong>{selectedCourseStats?.appeals ?? 0}</strong>
                        <span>Total appeals</span>
                      </div>
                      <div className="statsCard">
                        <strong>{selectedCourseStats?.open_appeals ?? 0}</strong>
                        <span>Open appeals</span>
                      </div>
                      <div className="statsCard">
                        <strong>{selectedCourseStats?.midterm_appeals ?? 0}</strong>
                        <span>Midterm appeals</span>
                      </div>
                      <div className="statsCard">
                        <strong>{selectedCourseStats?.finals_appeals ?? 0}</strong>
                        <span>Finals appeals</span>
                      </div>
                      <div className={selectedCourseStats?.midterm_open ? 'statsCard highlight' : 'statsCard'}>
                        <strong>{selectedCourseStats?.midterm_open ? 'Open' : 'Closed'}</strong>
                        <span>Midterm session status</span>
                      </div>
                      <div className={selectedCourseStats?.finals_open ? 'statsCard highlight' : 'statsCard'}>
                        <strong>{selectedCourseStats?.finals_open ? 'Open' : 'Closed'}</strong>
                        <span>Finals session status</span>
                      </div>
                      <div className="statsCard">
                        <strong>{selectedCourseStats?.satisfaction_rate === null || selectedCourseStats?.satisfaction_rate === undefined ? 'N/A' : `${selectedCourseStats.satisfaction_rate}%`}</strong>
                        <span>Satisfaction rate</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </PagificationContainer>
      </div>

      <CourseFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingCourse}
        faculties={faculties}
        moduleLeaders={moduleLeaders}
        onClose={() => {
          setModalOpen(false);
          setEditingCourse(null);
        }}
        onSubmit={handleSubmitCourse}
      />
    </div>
  );
};

export default ManageCourses;
