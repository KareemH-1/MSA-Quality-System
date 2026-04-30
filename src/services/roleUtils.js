export const ROLE_ALIASES = {
  QA_Admin: "QA",
  QA: "QA",
  Admin: "Admin",
  Dean: "Dean",
  Module_Leader: "ModuleLeader",
  ModuleLeader: "ModuleLeader",
  Instructor: "Instructor",
  Student: "Student",
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