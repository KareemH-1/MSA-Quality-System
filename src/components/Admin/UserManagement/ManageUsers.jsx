import React from "react";
import "../styles/manageUsers.css";
import Export from "../../data-components/Export";
import PagificationContainer from "../../General/PagificationContainer";
import { CloudUpload, FileText, Search, UserPen, UserRoundPlus, UserX } from "lucide-react";
const ManageUsers = () => {
  const [UserData, setUserData] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 6;

  const users = React.useMemo(() => {
    return Array.isArray(UserData?.users) ? UserData.users : [];
  }, [UserData]);

  const totalPages = Math.max(1, Math.ceil(users.length / rowsPerPage));

  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return users.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, users]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("/MockUsers.json");
        const data = await response.json();
        setUserData(data);
      } catch {
        setUserData([]);
      }
    };

    loadUsers();
  }, []);

  return (
    <div className="ManageUsers">
      <div className="mngHeader">
        <div className="title">
          <span>ADMINSTRATION</span>
          <h1>Manage Users</h1>
        </div>

        <div className="end">
          <Export data={UserData} title="UserData" />

          <button className="addUser">
            <UserRoundPlus />
            Add New User
          </button>
        </div>
      </div>

      <div className="contentMng">
        
        <div className="Users">
          
          <div className="userTable">
            <div className="filters" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div className="searchUsers">
            <Search />
            <input type="text" placeholder="Search Users" />
          </div>

          <div className="filterRole filter">
            <h3>Filter by Role:</h3>
            <select>
              <option value="Admin">Admin</option>
              <option value="QA">QA</option>
              <option value="Dean">Dean</option>
              <option value="ModuleLeader">Module Leader</option>
              <option value="Instructor">Instructor</option>
              <option value="Student">Student</option>
            </select>
          </div>

          <div className="filterFaculty filter">
            <h3>Filter by Faculty:</h3>
            <select>
              {UserData.faculties?.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </div> 
        </div>

            <PagificationContainer
              data={users}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemName="users"
            >
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Faculty</th>
                    <th>Edit User</th>
                    <th>Delete User</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.faculty || user.Faculty || "-"}</td>
                      <td>
                        <button className="editBtn">
                          <UserPen />
                          Edit
                        </button>
                      </td>
                      <td>
                        <button className="deleteBtn">
                          <UserX />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PagificationContainer>
          </div>

          <div className="BulkImport">
            <div className="background-svg">
              <FileText />
            </div>
            <h2>Bulk Import Users</h2>
            <p>Import multiple users at once using a CSV file, or an Excel file. The CSV should have the following columns: username, email, password , level , role, and faculty.</p>
            <div className="dragDropImport">
              <div className="dragArea">
                <CloudUpload />
                <p>Drag and drop your file here, or click to select a file.</p>
                <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                <p className="fileFormatNote">Supported formats: .csv, .xlsx, .xls</p>
              </div>
              <p className="importNote">Note: Ensure your file is properly formatted to avoid import errors.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
