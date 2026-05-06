export const ROLE_ALIASES = {
  QA_Admin: "QA",
  qa_admin: "QA",
  QA: "QA",
  qa: "QA",
  Admin: "Admin",
  admin: "Admin",
  Dean: "Dean",
  dean: "Dean",
  Module_Leader: "ModuleLeader",
  ModuleLeader: "ModuleLeader",
  module_leader: "ModuleLeader",
  moduleleader: "ModuleLeader",
  "module leader": "ModuleLeader",
  Instructor: "Instructor",
  instructor: "Instructor",
  Student: "Student",
  student: "Student",
};

export const normalizeRole = (role) => {
  if (!role) return "";

  const normalizedKey = String(role)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return ROLE_ALIASES[String(role).trim()] || ROLE_ALIASES[normalizedKey] || String(role).trim();
};

export const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "QA":
      return "Quality Assurance Admin";
    case "ModuleLeader":
      return "Module Leader";
    case "Admin":
    case "Dean":
    case "Instructor":
    case "Student":
      return normalizedRole;
    default:
      return normalizedRole || "User";
  }
};