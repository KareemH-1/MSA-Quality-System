import React from "react";
import "../styles/manageUsers.css";
import Export from "../../data-components/Export";
import PagificationContainer from "../../General/PagificationContainer";
import { ROLES } from "../../../constants/roles";
import { getRoleLabel, normalizeRole } from "../../../services/roleUtils";
import {
  CloudUpload,
  FileText,
  Search,
  UserPen,
  UserRoundPlus,
  UserX,
} from "lucide-react";
import UserFormModal from "./UserFormModal";

const ROLE_LABELS = {
  Admin: "Admin",
  QA: "Quality Assurance Admin",
  Dean: "Dean",
  ModuleLeader: "Module Leader",
  Instructor: "Instructor",
  Student: "Student",
};

const normalizeUserRecord = (user) => ({
  ...user,
  role:
    normalizeRole(user?.role) === 'User' && Number(user?.managedCourseCount || 0) > 0
      ? 'ModuleLeader'
      : normalizeRole(user?.role),
});

const ManageUsers = ({
  onOpenImportPage,
  userData = { users: [], faculties: [] },
}) => {
  const ROWS_PER_PAGE_OPTIONS = [5, 6, 10, 15, 20];

  const [usersList, setUsersList] = React.useState(
    Array.isArray(userData?.users) ? userData.users.map(normalizeUserRecord) : []
  );

  React.useEffect(() => {
    setUsersList(Array.isArray(userData?.users) ? userData.users.map(normalizeUserRecord) : []);
  }, [userData]);

  const faculties = React.useMemo(
    () => (Array.isArray(userData?.faculties) ? userData.faculties : []),
    [userData]
  );

  const facultyNames = React.useMemo(
    () => faculties.map((f) => f.name),
    [faculties]
  );

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("All");
  const [facultyFilter, setFacultyFilter] = React.useState("All");

  // Modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("add");
  const [editingUser, setEditingUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const filteredUsers = React.useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All" || normalizeRole(u.role) === roleFilter;
      const userFaculty = u.Faculty || u.faculty || "";
      const matchesFaculty =
        facultyFilter === "All" || userFaculty === facultyFilter;
      return matchesSearch && matchesRole && matchesFaculty;
    });
  }, [usersList, searchTerm, roleFilter, facultyFilter]);

  const handleImportFileSelected = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) return;
    onOpenImportPage?.(selectedFile);
    event.target.value = "";
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDelete = (user) => {
    // Prevent self-deletion
    if (user.role === 'Admin') {
      alert('Admins cannot delete themselves. Please contact system administration.');
      return;
    }
    
    if (
      !window.confirm(`Delete user "${user.username}"? This cannot be undone.`)
    )
      return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    fetch('/api/View/ManageUsersView.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          const elapsed = Date.now() - startTime;
          console.log(`Delete completed in ${elapsed}ms`);
          window.location.reload();
        } else {
          setIsLoading(false);
          alert(`Delete failed: ${data.message || 'Unknown error'}`);
        }
      })
      .catch((e) => {
        setIsLoading(false);
        console.error('Delete failed', e);
        alert('Delete failed: ' + e.message);
      });
  };

  const handleSaveUser = (payload, mode) => {
    const body = {
      name: payload.username,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      role_details: {
        faculty: payload.Faculty,
        level: payload.level,
        courses: payload.courses,
        Managed_Courses: payload.managedCourses,
      },
    };

    if (mode === 'add') {
      fetch('/api/View/ManageUsersView.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.status === 'success') {
            window.location.reload();
          } else {
            alert(`Add user failed: ${data.message || 'Unknown error'}`);
          }
        })
        .catch((e) => {
          console.error('Add user failed', e);
          alert('Add user failed: ' + e.message);
        });
    } else {
      // update via PUT
      fetch('/api/View/ManageUsersView.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.status === 'success') {
            window.location.reload();
          } else {
            alert(`Update user failed: ${data.message || 'Unknown error'}`);
          }
        })
        .catch((e) => {
          console.error('Update user failed', e);
          alert('Update user failed: ' + e.message);
        });
    }

    setModalOpen(false);
    setEditingUser(null);
  };

  // Build a map: facultyName -> dean username (for display)
  const deanByFaculty = React.useMemo(() => {
    const map = {};
    faculties.forEach((f) => {
      if (f.deanId != null) {
        const dean = usersList.find((u) => u.id === f.deanId);
        if (dean) map[f.name] = dean.username;
      }
    });
    return map;
  }, [faculties, usersList]);

  return (
    <div className="ManageUsers">
      <div className="mngHeader">
        <div className="title">
          <span>ADMINSTRATION</span>
          <h1>Manage Users</h1>
        </div>

        <div className="end">
          <Export data={{ ...userData, users: usersList }} title="UserData" />

          <button className="addUser" onClick={openAddModal}>
            <UserRoundPlus />
            Add New User
          </button>
        </div>
      </div>

      <div className="contentMng">
        <div className="Users">
          <div className="userTable">
            <div
              className="filters"
              style={{ display: "flex", gap: "20px", marginBottom: "20px" }}
            >
              <div className="searchUsers">
                <Search />
                <input
                  type="text"
                  placeholder="Search Users"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filterRole filter">
                <h3>Filter by Role:</h3>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.QA}>QA</option>
                  <option value={ROLES.DEAN}>Dean</option>
                  <option value={ROLES.MODULE_LEADER}>Module Leader</option>
                  <option value={ROLES.INSTRUCTOR}>Instructor</option>
                  <option value={ROLES.STUDENT}>Student</option>
                </select>
              </div>

              <div className="filterFaculty filter">
                <h3>Filter by Faculty:</h3>
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {facultyNames.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <PagificationContainer
              data={filteredUsers}
              itemName="users"
              initialRowsPerPage={6}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            >
              {(paginatedUsers) => (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Faculty</th>
                      <th>Dean</th>
                      <th>Edit User</th>
                      <th>Delete User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const userFaculty = user.Faculty || user.faculty || "";
                      return (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{ROLE_LABELS[normalizeRole(user.role)] || getRoleLabel(user.role) || (Number(user.managedCourseCount || 0) > 0 ? 'Module Leader' : 'User')}</td>
                          <td>{userFaculty || "-"}</td>
                          <td>
                            {userFaculty
                              ? deanByFaculty[userFaculty] || (
                                  <span className="noDean">No Dean</span>
                                )
                              : "-"}
                          </td>
                          <td>
                            <button
                              className="editBtn"
                              onClick={() => openEditModal(user)}
                            >
                              <UserPen />
                              Edit
                            </button>
                          </td>
                          <td>
                            <button
                              className="deleteBtn"
                              onClick={() => handleDelete(user)}
                              disabled={isLoading}
                            >
                              <UserX />
                              {isLoading ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </PagificationContainer>
          </div>

          <div className="BulkImport">
            <div className="background-svg">
              <FileText />
            </div>
            <h2>Bulk Import Users</h2>
            <p>
              Import multiple users at once using a CSV file, or an Excel file.
              The CSV should have the following columns: username, email,
              password, level, role, and faculty.
            </p>
            <div className="dragDropImport">
              <div className="dragArea">
                <CloudUpload />
                <p>Drag and drop your file here, or click to select a file.</p>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleImportFileSelected}
                />
                <p className="fileFormatNote">
                  Supported formats: .csv, .xlsx, .xls
                </p>
              </div>
              <p className="importNote">
                Note: Ensure your file is properly formatted to avoid import
                errors.
              </p>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        initialUser={editingUser}
        faculties={faculties}
        existingUsers={usersList}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveUser}
      />
    </div>
  );
};

export default ManageUsers;
