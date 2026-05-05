import React from 'react'
import ManageUsers from '../../components/Admin/UserManagement/ManageUsers';
import ImportDataPage from '../../components/General/ImportDataPage';
import Loader from '../../components/Loader';

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
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const loadUsers = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/View/ManageUsersView.php");
                const data = await response.json();
                setUserData(data);
            } catch (e) {
                console.error('Failed to load users', e);
                setUserData({ users: [], faculties: [] });
            } finally {
                setIsLoading(false);
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
        // Send bulk import to server
        const payload = {
            bulk: true,
            users: importedUsers.map((u) => ({
                name: u.username || u.Username || '',
                email: u.email,
                password: u.password || '',
                role: u.role,
                role_details: {
                    faculty: u.Faculty || u.faculty || null,
                    level: u.level || null,
                    courses: u.courses || [],
                },
            })),
        };

        fetch('/api/View/ManageUsersView.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((r) => r.json())
            .then(() => {
                // reload page data from server
                window.location.reload();
            })
            .catch((e) => {
                console.error('Bulk import failed', e);
                closeImportView();
            });
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
            {isLoading ? (
                <Loader />
            ) : (
                currentNavItem === "User Management" && (
                    isImportViewOpen ? (
                        <ImportDataPage
                            file={importFile}
                            onCancel={closeImportView}
                            onConfirmImport={handleConfirmImport}
                            existingUsers={userData.users}
                        />
                    ) : (
                        <ManageUsers onOpenImportPage={openImportView} userData={userData} />
                    )
                )
            )}
        </div>
    );
};

export default UserManagement
