import React from "react";
import Loader from "../../components/Loader";
import { Building2, BookOpen, Users, UserCog, Search, Plus } from "lucide-react";
import "../../styles/Faculties.css";

const Faculties = ({ currentNavItem }) => {
  const [faculties, setFaculties] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [facultyName, setFacultyName] = React.useState("");

  React.useEffect(() => {
    const loadFaculties = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/View/FacultyView.php");
        const data = await response.json();
        setFaculties(Array.isArray(data?.faculties) ? data.faculties : []);
      } catch (error) {
        console.error("Failed to load faculty data", error);
        setFaculties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFaculties();
  }, []);

  const totals = React.useMemo(() => {
    return faculties.reduce(
      (accumulator, faculty) => ({
        faculties: accumulator.faculties + 1,
        students: accumulator.students + faculty.studentCount,
        instructors: accumulator.instructors + faculty.instructorCount,
        courses: accumulator.courses + faculty.courseCount,
      }),
      { faculties: 0, students: 0, instructors: 0, courses: 0 }
    );
  }, [faculties]);

  const filteredFaculties = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return faculties;
    }

    return faculties.filter((faculty) => {
      return (
        faculty.name.toLowerCase().includes(term) ||
        String(faculty.courseCount).includes(term) ||
        String(faculty.studentCount).includes(term) ||
        String(faculty.instructorCount).includes(term)
      );
    });
  }, [faculties, searchTerm]);

  const handleAddFaculty = async (event) => {
    event.preventDefault();

    const trimmedName = facultyName.trim();
    if (!trimmedName) {
      return;
    }

    const confirmed = window.confirm(`Add faculty "${trimmedName}"?`);
    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/View/FacultyView.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (data.status !== "success") {
        alert(data.message || "Could not add faculty");
        return;
      }

      setFacultyName("");

      const refreshed = await fetch("/api/View/FacultyView.php");
      const refreshedData = await refreshed.json();
      setFaculties(Array.isArray(refreshedData?.faculties) ? refreshedData.faculties : []);
    } catch (error) {
      console.error("Failed to add faculty", error);
      alert("Could not add faculty. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFaculty = async (faculty) => {
    const confirmed = window.confirm(
      `Delete faculty "${faculty.name}"? This will remove the faculty and all of its courses.`
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/View/FacultyView.php", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: faculty.id }),
      });

      const data = await response.json();

      if (data.status !== "success") {
        alert(data.message || "Could not delete faculty");
        return;
      }

      const refreshed = await fetch("/api/View/FacultyView.php");
      const refreshedData = await refreshed.json();
      setFaculties(Array.isArray(refreshedData?.faculties) ? refreshedData.faculties : []);
    } catch (error) {
      console.error("Failed to delete faculty", error);
      alert("Could not delete faculty. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (currentNavItem && currentNavItem !== "Faculties") {
    return null;
  }

  return (
    <div className="FacultyManagement">
      <div className="admin-header faculty-header">
        <p>Administration</p>
        <h1>Faculties</h1>
        <div className="heading">
          <p className="description">
            View faculty stats, track the people and courses assigned to each faculty, and add new faculties.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <div className="faculty-layout">
          <section className="faculty-summary">
            <div className="summary-card summary-card--primary">
              <Building2 />
              <div>
                <span>Total Faculties</span>
                <strong>{totals.faculties}</strong>
              </div>
            </div>
            <div className="summary-card">
              <Users />
              <div>
                <span>Students</span>
                <strong>{totals.students}</strong>
              </div>
            </div>
            <div className="summary-card">
              <UserCog />
              <div>
                <span>Instructors</span>
                <strong>{totals.instructors}</strong>
              </div>
            </div>
            <div className="summary-card">
              <BookOpen />
              <div>
                <span>Courses</span>
                <strong>{totals.courses}</strong>
              </div>
            </div>
          </section>

          <section className="faculty-content">
            <aside className="faculty-panel faculty-panel--form">
              <div className="panel-title">
                <p>New Faculty</p>
                <h2>Add a faculty</h2>
              </div>

              <form className="faculty-form" onSubmit={handleAddFaculty}>
                <label htmlFor="faculty-name">Faculty name</label>
                <input
                  id="faculty-name"
                  type="text"
                  placeholder="e.g. Faculty of Computing"
                  value={facultyName}
                  onChange={(event) => setFacultyName(event.target.value)}
                />

                <button type="submit" className="faculty-submit" disabled={isSaving}>
                  <Plus size={16} />
                  {isSaving ? "Saving..." : "Add Faculty"}
                </button>
              </form>

              <p className="faculty-note">
                New faculties become available immediately across user and course assignment screens.
              </p>
            </aside>

            <div className="faculty-panel faculty-panel--list">
              <div className="faculty-toolbar">
                <div className="faculty-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search faculties"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <span className="faculty-count">
                  {filteredFaculties.length} result{filteredFaculties.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="faculty-grid">
                {filteredFaculties.length === 0 ? (
                  <div className="faculty-empty">
                    <Building2 />
                    <h3>No faculties found</h3>
                    <p>Try another search or add the first faculty from the form.</p>
                  </div>
                ) : (
                  filteredFaculties.map((faculty) => (
                    <article className="faculty-card" key={faculty.name}>
                      <div className="faculty-card__head">
                        <div>
                          <span>Faculty</span>
                          <h3>{faculty.name}</h3>
                        </div>
                        <div className="faculty-card__actions">
                          <Building2 />
                          <button
                            type="button"
                            className="faculty-delete"
                            onClick={() => handleDeleteFaculty(faculty)}
                            disabled={isSaving}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="faculty-card__stats">
                        <div>
                          <strong>{faculty.studentCount}</strong>
                          <span>Students</span>
                        </div>
                        <div>
                          <strong>{faculty.instructorCount}</strong>
                          <span>Instructors</span>
                        </div>
                        <div>
                          <strong>{faculty.courseCount}</strong>
                          <span>Courses</span>
                        </div>
                      </div>

                      <div className="faculty-card__courses">
                        <span>Courses handled</span>
                        <p>{faculty.courseCount} course{faculty.courseCount === 1 ? "" : "s"}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Faculties;