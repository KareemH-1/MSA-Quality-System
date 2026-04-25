import React from 'react'
import Dashboard from '../../components/Admin/UserManagement/Dashboard';
import ManageUsers from '../../components/Admin/UserManagement/ManageUsers';
const UserManagement = ({ currentNavItem }) => {
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
            {currentNavItem === "Dashboard" && <Dashboard />}
            {currentNavItem === "User Management" && <ManageUsers />}
        </div>
    );
};

export default UserManagement
