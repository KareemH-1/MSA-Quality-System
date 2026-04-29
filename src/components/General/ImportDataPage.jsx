import React from "react";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Plus,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import PagificationContainer from "./PagificationContainer";
import "./ImportDataPage.css";

/* ============================================================
   SCHEMA
   ============================================================ */

// Canonical role keys used internally + what we accept in CSVs
const ROLE_LABELS = {
  Admin: "Admin",
  QA: "Quality Assurance Admin",
  Dean: "Dean",
  ModuleLeader: "Module Leader",
  Instructor: "Instructor",
  Student: "Student",
};
const ROLE_KEYS = Object.keys(ROLE_LABELS);

const ROLE_INPUT_OPTIONS = [
  "Admin",
  "QA",
  "Dean",
  "Module Leader",
  "Instructor",
  "Student",
];

const normalizeRole = (raw) => {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!v) return "";
  if (v === "admin") return "Admin";
  if (["qa", "quality assurance", "quality assurance admin"].includes(v))
    return "QA";
  if (v === "dean") return "Dean";
  if (["module leader", "moduleleader", "ml"].includes(v))
    return "ModuleLeader";
  if (v === "instructor") return "Instructor";
  if (v === "student") return "Student";
  return null; // unknown
};

// Fields that the importer cares about
const FIELDS = {
  username: { label: "Name", required: true, type: "string" },
  email: { label: "Email", required: true, type: "email" },
  password: {
    label: "Password",
    required: true,
    type: "password",
    minLength: 6,
  },
  role: {
    label: "Role",
    required: true,
    type: "enum",
    options: ROLE_INPUT_OPTIONS,
  },
  faculty: {
    label: "Faculty",
    required: false,
    type: "string",
    requiredForRoles: ["Dean", "Instructor", "ModuleLeader", "Student"],
  },
  courses: {
    label: "Courses",
    required: false,
    type: "list",
    requiredForRoles: ["Instructor", "ModuleLeader", "Student"],
  },
  managedCourses: {
    label: "Managed Courses",
    required: false,
    type: "list",
    requiredForRoles: ["ModuleLeader"],
  },
  level: {
    label: "Level",
    required: false,
    type: "number",
    requiredForRoles: ["Student"],
  },
};
const FIELD_KEYS = Object.keys(FIELDS);

// Header aliases for auto-mapping (lowercased)
const FIELD_ALIASES = {
  username: ["username", "name", "full name", "fullname"],
  email: ["email", "e-mail", "mail"],
  password: ["password", "pass", "pwd"],
  role: ["role", "type", "user role", "usertype"],
  faculty: ["faculty", "department", "school"],
  courses: [
    "courses",
    "course",
    "enrolled courses",
    "enrolledcourses",
    "taught courses",
  ],
  managedCourses: [
    "managedcourses",
    "managed courses",
    "leading courses",
    "managed",
  ],
  level: ["level", "year", "grade"],
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];


const norm = (v) => (v === null || v === undefined ? "" : String(v).trim());

const parseList = (v) =>
  norm(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

let __idSeq = 0;
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${(__idSeq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const autoMapField = (rawHeader) => {
  const h = norm(rawHeader).toLowerCase();
  if (!h) return null;
  for (const field of FIELD_KEYS) {
    if (FIELD_ALIASES[field].includes(h)) return field;
  }
  return null;
};


const parseSpreadsheet = async (file) => {
  if (!file) return { headers: [], rows: [] };
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = wb.Sheets[sheetName];
  const arr = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
  if (arr.length === 0) return { headers: [], rows: [] };

  const longest = arr.reduce(
    (m, r) => Math.max(m, Array.isArray(r) ? r.length : 0),
    0,
  );
  const headerRow = Array.isArray(arr[0]) ? arr[0] : [];
  const headers = Array.from(
    { length: Math.max(longest, headerRow.length) },
    (_, i) => ({
      id: uid("h"),
      rawName: norm(headerRow[i]) || `Column ${i + 1}`,
      field: autoMapField(headerRow[i]), // schema field key (e.g. "email") or null
    }),
  );

  const rows = arr
    .slice(1)
    .map((raw) => {
      const safe = Array.isArray(raw) ? raw : [];
      const cells = {};
      headers.forEach((h, i) => {
        cells[h.id] = norm(safe[i]);
      });
      return { id: uid("r"), cells };
    })
    .filter((r) => Object.values(r.cells).some((v) => v !== ""));

  return { headers, rows };
};


const computeSchemaReport = (headers) => {
  const fieldToHeaderId = {};
  const duplicateMappings = [];
  headers.forEach((h) => {
    if (!h.field) return;
    if (fieldToHeaderId[h.field]) {
      duplicateMappings.push(h.field);
    } else {
      fieldToHeaderId[h.field] = h.id;
    }
  });

  const missingRequired = FIELD_KEYS.filter(
    (f) => FIELDS[f].required && !fieldToHeaderId[f],
  );
  const extraHeaders = headers.filter((h) => !h.field);
  const mapped = headers.filter((h) => h.field);

  return {
    fieldToHeaderId, // { fieldKey: headerId }
    missingRequired, // [fieldKey]
    duplicateMappings: [...new Set(duplicateMappings)],
    extraHeaders, // [headerObj]
    mapped, // [headerObj]
  };
};


const getCell = (row, fieldKey, fieldToHeaderId) => {
  const hid = fieldToHeaderId[fieldKey];
  return hid ? norm(row.cells[hid]) : "";
};

const validateRows = ({ rows, fieldToHeaderId, existingUsers, faculties }) => {
  const issues = new Map(); // rowId -> string[]
  const status = new Map(); // rowId -> 'valid'|'warning'|'invalid'|'duplicate'
  const add = (rowId, msg) => {
    if (!issues.has(rowId)) issues.set(rowId, []);
    issues.get(rowId).push(msg);
  };

  /* --- Pre-existing constraints from current DB --- */
  const dbDeanByFaculty = {};
  faculties.forEach((f) => {
    if (f.deanId != null) {
      const dean = existingUsers.find((u) => u.id === f.deanId);
      if (dean) dbDeanByFaculty[f.name] = dean.username || dean.email;
    }
  });

  const dbLeaderByCourse = {};
  existingUsers.forEach((u) => {
    if (u.role === "ModuleLeader" && Array.isArray(u.managedCourses)) {
      u.managedCourses.forEach((code) => {
        dbLeaderByCourse[code] = u.username || u.email;
      });
    }
  });

  const dbEmails = new Set(
    existingUsers.map((u) => norm(u.email).toLowerCase()),
  );

  /* --- Within-batch trackers --- */
  const batchEmails = new Map(); // email -> [rowIds]
  const batchDeanByFaculty = new Map(); // faculty -> [rowIds]
  const batchLeaderByCourse = new Map(); // course -> [rowIds]

  /* --- Per-row checks --- */
  rows.forEach((row) => {
    const username = getCell(row, "username", fieldToHeaderId);
    const email = getCell(row, "email", fieldToHeaderId);
    const password = getCell(row, "password", fieldToHeaderId);
    const rawRole = getCell(row, "role", fieldToHeaderId);
    const faculty = getCell(row, "faculty", fieldToHeaderId);
    const courses = parseList(getCell(row, "courses", fieldToHeaderId));
    const managed = parseList(getCell(row, "managedCourses", fieldToHeaderId));
    const level = getCell(row, "level", fieldToHeaderId);

    // Skip wholly empty rows (don't even count them)
    if (
      !username &&
      !email &&
      !password &&
      !rawRole &&
      !faculty &&
      !courses.length &&
      !managed.length &&
      !level
    ) {
      status.set(row.id, "valid"); // treated as valid-empty so it doesn't block
      return;
    }

    /* --- Required everywhere --- */
    if (!username) add(row.id, "Name is required.");
    if (!email) add(row.id, "Email is required.");
    else if (!isEmail(email)) add(row.id, `Invalid email format: "${email}".`);
    if (!password) add(row.id, "Password is required.");
    else if (password.length < FIELDS.password.minLength)
      add(
        row.id,
        `Password must be at least ${FIELDS.password.minLength} characters.`,
      );

    if (!rawRole) {
      add(row.id, "Role is required.");
    }

    const role = rawRole ? normalizeRole(rawRole) : "";
    if (rawRole && !role) {
      add(row.id, `Unknown role "${rawRole}".`);
    }

    /* --- Faculty existence --- */
    const facultyObj = faculty
      ? faculties.find((f) => f.name.toLowerCase() === faculty.toLowerCase())
      : null;
    const validCodes = facultyObj
      ? new Set(facultyObj.courses.map((c) => c.code))
      : null;
    if (faculty && !facultyObj)
      add(row.id, `Faculty "${faculty}" does not exist.`);

    /* --- Role-specific rules --- */
    if (role === "Dean") {
      if (!faculty) add(row.id, "Dean requires a Faculty.");
      else if (facultyObj) {
        if (dbDeanByFaculty[facultyObj.name])
          add(
            row.id,
            `Faculty "${facultyObj.name}" already has a Dean (${dbDeanByFaculty[facultyObj.name]}).`,
          );
        if (!batchDeanByFaculty.has(facultyObj.name))
          batchDeanByFaculty.set(facultyObj.name, []);
        batchDeanByFaculty.get(facultyObj.name).push(row.id);
      }
    }

    if (role === "Instructor" || role === "ModuleLeader") {
      const lbl = ROLE_LABELS[role];
      if (!faculty) add(row.id, `${lbl} requires a Faculty.`);
      if (!courses.length) add(row.id, `${lbl} requires at least one course.`);
      else if (validCodes) {
        const bad = courses.filter((c) => !validCodes.has(c));
        if (bad.length)
          add(
            row.id,
            `Course(s) not in "${facultyObj.name}": ${bad.join(", ")}.`,
          );
      }
    }

    if (role === "ModuleLeader") {
      if (!managed.length)
        add(row.id, "Module Leader requires at least one managed course.");
      else {
        if (validCodes) {
          const bad = managed.filter((c) => !validCodes.has(c));
          if (bad.length)
            add(
              row.id,
              `Managed course(s) not in "${facultyObj.name}": ${bad.join(", ")}.`,
            );
        }
        managed.forEach((code) => {
          if (dbLeaderByCourse[code])
            add(
              row.id,
              `Course "${code}" already managed by ${dbLeaderByCourse[code]}.`,
            );
          if (!batchLeaderByCourse.has(code)) batchLeaderByCourse.set(code, []);
          batchLeaderByCourse.get(code).push(row.id);
        });
      }
    }

    if (role === "Student") {
      if (!faculty) add(row.id, "Student requires a Faculty.");
      if (!level) add(row.id, "Student requires a Level.");
      else if (!Number.isFinite(Number(level)))
        add(row.id, `Level "${level}" must be a number.`);
      if (courses.length && validCodes) {
        const bad = courses.filter((c) => !validCodes.has(c));
        if (bad.length)
          add(
            row.id,
            `Enrolled course(s) not in "${facultyObj.name}": ${bad.join(", ")}.`,
          );
      }
    }

    /* --- Email tracking for duplicates --- */
    if (email) {
      const k = email.toLowerCase();
      if (!batchEmails.has(k)) batchEmails.set(k, []);
      batchEmails.get(k).push(row.id);
    }
  });

  /* --- Email duplicates (DB + within batch) --- */
  const dupRowIds = new Set();
  batchEmails.forEach((ids, k) => {
    const inDb = dbEmails.has(k);
    if (inDb || ids.length > 1) {
      ids.forEach((rid) => {
        dupRowIds.add(rid);
        add(
          rid,
          inDb
            ? `Email "${k}" is already used by an existing user.`
            : `Email "${k}" is duplicated within this import.`,
        );
      });
    }
  });

  /* --- Cross-batch dean / leader conflicts --- */
  batchDeanByFaculty.forEach((ids, fac) => {
    if (ids.length > 1)
      ids.forEach((rid) =>
        add(rid, `Multiple Deans in this import for faculty "${fac}".`),
      );
  });
  batchLeaderByCourse.forEach((ids, code) => {
    if (ids.length > 1)
      ids.forEach((rid) =>
        add(
          rid,
          `Multiple Module Leaders in this import for course "${code}".`,
        ),
      );
  });

  /* --- Compute final status per row --- */
  rows.forEach((row) => {
    if (status.has(row.id)) return; // already set (e.g. empty)
    if (dupRowIds.has(row.id)) status.set(row.id, "duplicate");
    else if (issues.has(row.id)) status.set(row.id, "invalid");
    else status.set(row.id, "valid");
  });

  return { issues, status };
};

/* ============================================================
   PAYLOAD BUILDER
   ============================================================ */

const buildUserPayloads = ({ rows, fieldToHeaderId, existingUsers }) => {
  const maxId = existingUsers.reduce((m, u) => Math.max(m, u.id || 0), 0);
  let nextId = maxId + 1;

  return rows
    .filter((row) => Object.values(row.cells).some((v) => norm(v) !== ""))
    .map((row) => {
      const username = getCell(row, "username", fieldToHeaderId);
      const email = getCell(row, "email", fieldToHeaderId);
      const password = getCell(row, "password", fieldToHeaderId);
      const role = normalizeRole(getCell(row, "role", fieldToHeaderId));
      const faculty = getCell(row, "faculty", fieldToHeaderId);
      const courses = parseList(getCell(row, "courses", fieldToHeaderId));
      const managed = parseList(
        getCell(row, "managedCourses", fieldToHeaderId),
      );
      const level = getCell(row, "level", fieldToHeaderId);

      const user = { id: nextId++, username, email, password, role };
      if (["Dean", "Instructor", "ModuleLeader", "Student"].includes(role))
        user.Faculty = faculty;
      if (["Instructor", "ModuleLeader", "Student"].includes(role))
        user.courses = courses;
      if (role === "ModuleLeader") user.managedCourses = managed;
      if (role === "Student" && level) user.level = Number(level);
      return user;
    });
};

/* ============================================================
   COMPONENT
   ============================================================ */

const ImportDataPage = ({
  file,
  onCancel,
  onConfirmImport,
  existingUsers = [],
  faculties = [],
}) => {
  const [selectedFile, setSelectedFile] = React.useState(file ?? null);
  const [headers, setHeaders] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [confirmIntent, setConfirmIntent] = React.useState(null); // 'import' | 'cancel'
  const [dragActive, setDragActive] = React.useState(false);
  const [showAllIssues, setShowAllIssues] = React.useState(false);

  const dragCounter = React.useRef(0);

  /* ----- Sync external file prop ----- */
  React.useEffect(() => {
    setSelectedFile((prev) =>
      prev === (file ?? null) ? prev : (file ?? null),
    );
  }, [file]);

  /* ----- Parse file (only when file actually changes) ----- */
  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!selectedFile) {
        setHeaders([]);
        setRows([]);
        setErrorMessage("");
        return;
      }
      setIsLoading(true);
      setErrorMessage("");
      try {
        const ds = await parseSpreadsheet(selectedFile);
        if (!alive) return;
        setHeaders(ds.headers);
        setRows(ds.rows);
      } catch {
        if (!alive) return;
        setHeaders([]);
        setRows([]);
        setErrorMessage(
          "Unable to read this file. Please upload a valid CSV or Excel file.",
        );
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [selectedFile]);

  /* ----- Esc key closes confirm modal ----- */
  React.useEffect(() => {
    if (!confirmIntent) return;
    const onKey = (e) => {
      if (e.key === "Escape") setConfirmIntent(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmIntent]);

  /* ----- Schema report (memoised) ----- */
  const schema = React.useMemo(() => computeSchemaReport(headers), [headers]);

  /* ----- Row validation ----- */
  const { issues, status } = React.useMemo(
    () =>
      validateRows({
        rows,
        fieldToHeaderId: schema.fieldToHeaderId,
        existingUsers,
        faculties,
      }),
    [rows, schema.fieldToHeaderId, existingUsers, faculties],
  );

  /* ----- Counts ----- */
  const counts = React.useMemo(() => {
    let valid = 0,
      invalid = 0,
      duplicate = 0;
    status.forEach((s) => {
      if (s === "valid") valid++;
      else if (s === "duplicate") duplicate++;
      else if (s === "invalid") invalid++;
    });
    return { valid, invalid, duplicate };
  }, [status]);

  const canImport =
    rows.length > 0 &&
    schema.missingRequired.length === 0 &&
    schema.duplicateMappings.length === 0 &&
    counts.invalid === 0 &&
    counts.duplicate === 0;

  /* ----- Handlers ----- */

  const onFileInputChange = (e) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return;
    dragCounter.current += 1;
    if (dragCounter.current === 1) setDragActive(true);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragCounter.current === 0) return;
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && /\.(csv|xlsx|xls)$/i.test(f.name)) setSelectedFile(f);
  };

  const updateCell = (rowId, headerId, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id !== rowId ? r : { ...r, cells: { ...r.cells, [headerId]: value } },
      ),
    );
  };

  const setHeaderField = (headerId, fieldKey) => {
    setHeaders((prev) =>
      prev.map((h) =>
        h.id !== headerId ? h : { ...h, field: fieldKey || null },
      ),
    );
  };

  const addRow = () => {
    const cells = {};
    headers.forEach((h) => {
      cells[h.id] = "";
    });
    setRows((p) => [...p, { id: uid("r"), cells }]);
  };
  const removeRow = (rowId) => setRows((p) => p.filter((r) => r.id !== rowId));

  const handleImportClick = () => {
    if (canImport) setConfirmIntent("import");
  };
  const handleCancelClick = () => setConfirmIntent("cancel");
  const closeConfirm = () => setConfirmIntent(null);

  const confirmAction = () => {
    if (confirmIntent === "import") {
      const payloads = buildUserPayloads({
        rows,
        fieldToHeaderId: schema.fieldToHeaderId,
        existingUsers,
      });
      onConfirmImport?.({
        fileName: selectedFile?.name ?? "",
        users: payloads,
      });
    } else if (confirmIntent === "cancel") {
      onCancel?.();
    }
    setConfirmIntent(null);
  };

  /* ----- Issues list for the panel ----- */
  const issuesList = React.useMemo(() => {
    const arr = [];
    rows.forEach((r, i) => {
      const list = issues.get(r.id) || [];
      if (list.length)
        arr.push({ rowId: r.id, rowNumber: i + 1, messages: list });
    });
    return arr;
  }, [rows, issues]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <section
      className="idp"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* HEADER */}
      <header className="idp__header">
        <div className="idp__heading">
          <span className="idp__kicker">Bulk Import Users</span>
          <h1>Review &amp; Validate</h1>
          <p>
            Map columns, fix any issues, then confirm the import. The system
            will enforce all role rules.
          </p>
        </div>
        <div className="idp__header-actions">
          <label className="idp__upload" htmlFor="idp-file-input">
            <Upload size={16} />
            {selectedFile ? "Replace File" : "Upload File"}
          </label>
          <input
            id="idp-file-input"
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={onFileInputChange}
          />
        </div>
      </header>

      {/* SCHEMA CHECK */}
      {headers.length > 0 && (
        <div className="idp__schema">
          <div className="idp__schema-row">
            <h3>Schema Check</h3>
            <div className="idp__schema-stats">
              <span className="idp__pill idp__pill--ok">
                <CheckCircle2 size={12} /> {schema.mapped.length} mapped
              </span>
              {schema.missingRequired.length > 0 && (
                <span className="idp__pill idp__pill--bad">
                  <XCircle size={12} /> {schema.missingRequired.length} missing
                  required
                </span>
              )}
              {schema.duplicateMappings.length > 0 && (
                <span className="idp__pill idp__pill--bad">
                  <AlertTriangle size={12} /> {schema.duplicateMappings.length}{" "}
                  duplicate mappings
                </span>
              )}
              {schema.extraHeaders.length > 0 && (
                <span className="idp__pill idp__pill--warn">
                  <Info size={12} /> {schema.extraHeaders.length} unknown
                  columns
                </span>
              )}
            </div>
          </div>

          {schema.missingRequired.length > 0 && (
            <div className="idp__schema-msg idp__schema-msg--bad">
              <strong>
                Missing required column
                {schema.missingRequired.length === 1 ? "" : "s"}:
              </strong>{" "}
              {schema.missingRequired.map((f) => FIELDS[f].label).join(", ")}.{" "}
              Add them to your file or map an existing column below.
            </div>
          )}
          {schema.duplicateMappings.length > 0 && (
            <div className="idp__schema-msg idp__schema-msg--bad">
              <strong>Duplicate mappings:</strong>{" "}
              {schema.duplicateMappings.map((f) => FIELDS[f].label).join(", ")}.{" "}
              Each schema field can only be mapped to one column.
            </div>
          )}
          {schema.extraHeaders.length > 0 && (
            <div className="idp__schema-msg idp__schema-msg--warn">
              <strong>Unknown columns will be ignored:</strong>{" "}
              {schema.extraHeaders.map((h) => h.rawName).join(", ")}. Map them
              to a schema field below if you want to include them.
            </div>
          )}
        </div>
      )}

      {/* META */}
      <div className="idp__meta">
        <div className="idp__meta-card">
          <span className="idp__meta-label">File</span>
          <strong className="idp__meta-value">
            {selectedFile?.name || "No file selected"}
          </strong>
        </div>
        <div className="idp__meta-card">
          <span className="idp__meta-label">Rows</span>
          <strong className="idp__meta-value">{rows.length}</strong>
        </div>
        <div className="idp__meta-card">
          <span className="idp__meta-label">Columns</span>
          <strong className="idp__meta-value">{headers.length}</strong>
        </div>
        <div className="idp__meta-card">
          <span className="idp__meta-label">Validation</span>
          <div className="idp__stats">
            <span className="idp__stat idp__stat--ok">
              <CheckCircle2 size={12} /> {counts.valid}
            </span>
            <span className="idp__stat idp__stat--bad">
              <XCircle size={12} /> {counts.invalid}
            </span>
            <span className="idp__stat idp__stat--dup">
              <Info size={12} /> {counts.duplicate}
            </span>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {errorMessage && (
        <div className="idp__alert idp__alert--error">
          <AlertTriangle size={16} /> <span>{errorMessage}</span>
        </div>
      )}
      {!errorMessage &&
        !isLoading &&
        rows.length === 0 &&
        headers.length === 0 && (
          <div className="idp__alert idp__alert--neutral">
            <Upload size={16} />{" "}
            <span>Upload a CSV or Excel file to begin.</span>
          </div>
        )}

      {/* ISSUES */}
      {issuesList.length > 0 && (
        <div className="idp__issues">
          <button
            type="button"
            className="idp__issues-head"
            onClick={() => setShowAllIssues((v) => !v)}
            aria-expanded={showAllIssues}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{issuesList.length}</strong> row
              {issuesList.length === 1 ? "" : "s"} need fixing
            </span>
            <ChevronDown
              size={14}
              className={`idp__chev ${showAllIssues ? "is-open" : ""}`}
            />
          </button>
          {showAllIssues && (
            <ul className="idp__issues-list">
              {issuesList.map(({ rowId, rowNumber, messages }) => (
                <li key={rowId}>
                  <span className="idp__rowtag">Row {rowNumber}</span>
                  <ul>
                    {messages.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* TOOLBAR */}
      {headers.length > 0 && (
        <div className="idp__toolbar">
          <button
            type="button"
            onClick={addRow}
            className="idp__btn idp__btn--ghost"
          >
            <Plus size={16} /> Add Row
          </button>
        </div>
      )}

      {/* TABLE */}
      {headers.length > 0 && (
        <PagificationContainer
          data={rows}
          itemName="rows"
          initialRowsPerPage={20}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        >
          {(paginatedRows, pagination) => (
            <div className="idp__table-wrap">
              <table className="idp__table">
                <thead>
                  <tr>
                    <th className="idp__th-index">#</th>
                    {headers.map((h) => {
                      const isDup =
                        h.field && schema.duplicateMappings.includes(h.field);
                      return (
                        <th
                          key={h.id}
                          className={`idp__th-col ${!h.field ? "is-extra" : ""} ${isDup ? "is-dup" : ""}`}
                        >
                          <div className="idp__col-editor">
                            <span className="idp__col-raw" title={h.rawName}>
                              {h.rawName}
                            </span>
                            <select
                              className="idp__col-mapping"
                              value={h.field || ""}
                              onChange={(e) =>
                                setHeaderField(h.id, e.target.value)
                              }
                            >
                              <option value="">— Ignore —</option>
                              {FIELD_KEYS.map((fk) => (
                                <option key={fk} value={fk}>
                                  {FIELDS[fk].label}
                                  {FIELDS[fk].required ? " *" : ""}
                                </option>
                              ))}
                            </select>
                            {isDup && (
                              <span className="idp__col-warn">
                                duplicate mapping
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="idp__th-issues">Status</th>
                    <th className="idp__th-actions">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, index) => {
                    const s = status.get(row.id) || "valid";
                    const rowIssues = issues.get(row.id) || [];
                    const cls =
                      s === "duplicate"
                        ? "idp__row idp__row--dup"
                        : s === "invalid"
                          ? "idp__row idp__row--invalid"
                          : "idp__row idp__row--ok";

                    return (
                      <tr key={row.id} className={cls}>
                        <td className="idp__td-index">
                          {(pagination.currentPage - 1) *
                            pagination.rowsPerPage +
                            index +
                            1}
                        </td>
                        {headers.map((h) => {
                          const value = row.cells[h.id] ?? "";
                          // Render role as enum, level as number, others as text
                          if (h.field === "role") {
                            return (
                              <td key={`${row.id}-${h.id}`} className="idp__td">
                                <select
                                  className="idp__cell"
                                  value={value}
                                  onChange={(e) =>
                                    updateCell(row.id, h.id, e.target.value)
                                  }
                                >
                                  <option value="">Select…</option>
                                  {ROLE_INPUT_OPTIONS.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          }
                          return (
                            <td key={`${row.id}-${h.id}`} className="idp__td">
                              <input
                                className="idp__cell"
                                type={h.field === "password" ? "text" : "text"}
                                value={value}
                                onChange={(e) =>
                                  updateCell(row.id, h.id, e.target.value)
                                }
                                placeholder={
                                  h.field === "courses" ||
                                  h.field === "managedCourses"
                                    ? "CS213, CS232"
                                    : ""
                                }
                              />
                            </td>
                          );
                        })}
                        <td className="idp__td-issues">
                          {rowIssues.length > 0 ? (
                            <span
                              className={`idp__badge ${s === "duplicate" ? "idp__badge--dup" : "idp__badge--bad"}`}
                              title={rowIssues.join("\n")}
                            >
                              <Info size={12} /> {rowIssues.length}
                            </span>
                          ) : (
                            <span className="idp__badge idp__badge--ok">
                              <CheckCircle2 size={12} /> ok
                            </span>
                          )}
                        </td>
                        <td className="idp__td-actions">
                          <button
                            type="button"
                            className="idp__icon-btn idp__icon-btn--danger"
                            onClick={() => removeRow(row.id)}
                            aria-label="Remove row"
                            title="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PagificationContainer>
      )}

      <div className="idp__footer">
        {!canImport && rows.length > 0 && (
          <p className="idp__footer-hint">
            <AlertTriangle size={14} />
            {schema.missingRequired.length > 0
              ? "Map all required columns before importing."
              : "Fix all invalid and duplicate rows before importing."}
          </p>
        )}
        <div className="idp__footer-actions">
          <button
            type="button"
            className="idp__btn idp__btn--ghost"
            onClick={handleCancelClick}
          >
            Cancel Import
          </button>
          <button
            type="button"
            className="idp__btn idp__btn--primary"
            onClick={handleImportClick}
            disabled={!canImport}
          >
            <CheckCircle2 size={16} /> Confirm Import
          </button>
        </div>
      </div>

      {confirmIntent && (
        <div
          className="idp-modal__backdrop"
          onClick={closeConfirm}
          role="presentation"
        >
          <div
            className="idp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="idp-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="idp-modal__head">
              <div
                className={`idp-modal__icon ${confirmIntent === "import" ? "is-success" : "is-danger"}`}
              >
                {confirmIntent === "import" ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <XCircle size={22} />
                )}
              </div>
              <h2 id="idp-modal-title">
                {confirmIntent === "import"
                  ? "Confirm Import"
                  : "Cancel Import"}
              </h2>
              <button
                type="button"
                className="idp-modal__close"
                onClick={closeConfirm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>
            <div className="idp-modal__body">
              {confirmIntent === "import" ? (
                <>
                  <p>
                    Import <strong>{counts.valid}</strong> user
                    {counts.valid === 1 ? "" : "s"} from{" "}
                    <strong>
                      {selectedFile?.name || "the current dataset"}
                    </strong>
                    ?
                  </p>
                  <p className="idp-modal__muted">
                    This will create new accounts. Cannot be undone.
                  </p>
                </>
              ) : (
                <>
                  <p>Cancel and discard your changes?</p>
                  <p className="idp-modal__muted">
                    You'll go back to the previous page.
                  </p>
                </>
              )}
            </div>
            <footer className="idp-modal__foot">
              <button
                type="button"
                className="idp__btn idp__btn--ghost"
                onClick={closeConfirm}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className={`idp__btn ${confirmIntent === "import" ? "idp__btn--primary" : "idp__btn--danger"}`}
                onClick={confirmAction}
              >
                {confirmIntent === "import" ? "Yes, Import" : "Yes, Cancel"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {dragActive && (
        <div className="idp-drop">
          <div className="idp-drop__card">
            <Upload size={48} />
            <h2>Drop your file here</h2>
            <p>Release to load your CSV or Excel file</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ImportDataPage;
