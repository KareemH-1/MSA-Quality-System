import React from 'react'
import ManageUsers from '../../components/Admin/UserManagement/ManageUsers';
import ImportDataPage from '../../components/General/ImportDataPage';

const parseListValue = (value) => {
    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

const buildImportedUsers = ({ columns = [], rows = [] }) => {
    const normalizedColumns = Array.isArray(columns)
        ? columns.map((column) => ({
            ...column,
            normalizedName: String(column.name || "").trim().toLowerCase()
        }))
        : [];

    return (Array.isArray(rows) ? rows : []).map((row) => {
        const values = row?.values || {};
        const nextUser = {};

        normalizedColumns.forEach((column) => {
            const rawValue = values[column.id] ?? "";
            const normalizedValue = String(rawValue).trim();

            if (column.type === "list") {
                nextUser[column.name] = parseListValue(normalizedValue);
                return;
            }

            if (column.normalizedName === "courses" || column.normalizedName === "course") {
                nextUser.courses = parseListValue(normalizedValue);
                return;
            }

            if (column.normalizedName === "faculty") {
                nextUser.Faculty = normalizedValue;
                return;
            }

            nextUser[column.name] = normalizedValue;
        });

        // Normalize known user fields for the existing table and filters.
        if (!nextUser.username && nextUser.Username) {
            nextUser.username = nextUser.Username;
        }

        if (!nextUser.email && nextUser.Email) {
            nextUser.email = nextUser.Email;
        }

        if (!nextUser.role && nextUser.Role) {
            nextUser.role = nextUser.Role;
        }

        return nextUser;
    });
};

const UserManagement = ({ currentNavItem }) => {
    const [importFile, setImportFile] = React.useState(null);
    const [isImportViewOpen, setIsImportViewOpen] = React.useState(false);
    const [userData, setUserData] = React.useState({ users: [], faculties: [] });

    React.useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await fetch("/MockUsers.json");
                const data = await response.json();
                setUserData(data);
            } catch {
                setUserData({ users: [], faculties: [] });
            }
        };

        loadUsers();
    }, []);

    const openImportView = (file) => {
        setImportFile(file ?? null);
        setIsImportViewOpen(true);
    };

    const closeImportView = () => {
        setIsImportViewOpen(false);
        setImportFile(null);
    };

    const handleConfirmImport = (importedDataset) => {
        const importedUsers = buildImportedUsers(importedDataset || {});
        const nextMaxId = Math.max(0, ...userData.users.map((u) => u.id || 0));
        const usersWithIds = importedUsers.map((user, index) => ({
            ...user,
            id: nextMaxId + index + 1
        }));
        const allUsers = [...userData.users, ...usersWithIds];
        const allFaculties = Array.from(
            new Set([
                ...userData.faculties,
                ...allUsers
                    .map((user) => user.Faculty || user.faculty)
                    .filter((faculty) => String(faculty || "").trim() !== "")
            ])
        );
        setUserData({ users: allUsers, faculties: allFaculties });
        closeImportView();
    };

    return (
        <div
            style={{
                padding: "20px 40px",
                width: "100%",
                margin: 0,
                alignSelf: "stretch",
                textAlign: "left"
            }}
        >
            {currentNavItem === "User Management" && (
                isImportViewOpen ? (
                    <ImportDataPage
                        file={importFile}
                        onCancel={closeImportView}
                        onConfirmImport={handleConfirmImport}                        existingUsers={userData.users}                    />
                ) : (
                    <ManageUsers onOpenImportPage={openImportView} userData={userData} />
                )
            )}
        </div>
    );
};

export default UserManagement
