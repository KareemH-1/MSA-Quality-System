import React from "react";
import "../styles/userFormModal.css";
import { X, Plus, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { ROLES } from "../../../constants/roles";
import { normalizeRole } from "../../../services/roleUtils";

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: "Admin" },
  { value: ROLES.QA, label: "Quality Assurance Admin" },
  { value: ROLES.DEAN, label: "Dean" },
  { value: ROLES.MODULE_LEADER, label: "Module Leader" },
  { value: ROLES.INSTRUCTOR, label: "Instructor" },
  { value: ROLES.STUDENT, label: "Student" },
];

const LEVELS = [1, 2, 3, 4, 5];

const emptyForm = {
  username: "",
  email: "",
  password: "",
  role: "",
  Faculty: "",
  level: "",
  courses: [],
  managedCourses: [],
};

const UserFormModal = ({
  open,
  mode = "add",
  initialUser = null,
  faculties = [], // [{ name, deanId, courses: [{ code, name }] }]
  existingUsers = [],
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState({});
  const [courseInput, setCourseInput] = React.useState("");
  const [managedInput, setManagedInput] = React.useState("");
  const [comboError, setComboError] = React.useState({
    courses: "",
    managedCourses: "",
  });
  const [facultyNotice, setFacultyNotice] = React.useState("");

  const normalizedExistingUsers = React.useMemo(
    () => existingUsers.map((user) => ({ ...user, role: normalizeRole(user.role) })),
    [existingUsers]
  );

  const normalizedInitialUser = React.useMemo(
    () => (initialUser ? { ...initialUser, role: normalizeRole(initialUser.role) } : null),
    [initialUser]
  );

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && normalizedInitialUser) {
      setForm({
        ...emptyForm,
        ...normalizedInitialUser,
        Faculty: normalizedInitialUser.Faculty || normalizedInitialUser.faculty || "",
        courses: normalizedInitialUser.courses || [],
        managedCourses: normalizedInitialUser.managedCourses || [],
        level: normalizedInitialUser.level ?? "",
        password: "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setCourseInput("");
    setManagedInput("");
    setComboError({ courses: "", managedCourses: "" });
    setFacultyNotice("");
  }, [open, mode, normalizedInitialUser]);

  const facultyObj = React.useMemo(
    () => faculties.find((f) => f.name === form.Faculty) || null,
    [faculties, form.Faculty]
  );

  // courseCode -> the user (Module Leader) who currently manages it
  // Excludes the user being edited so they keep their own managed courses.
  const managedByMap = React.useMemo(() => {
    const map = {};
    normalizedExistingUsers.forEach((u) => {
      if (u.role === ROLES.MODULE_LEADER && Array.isArray(u.managedCourses)) {
        if (u.id === normalizedInitialUser?.id) return;
        u.managedCourses.forEach((code) => {
          map[code] = u;
        });
      }
    });
    return map;
  }, [normalizedExistingUsers, normalizedInitialUser]);

  if (!open) return null;

  const facultyCourses = facultyObj?.courses || [];

  const courseLabel = (code) => {
    const c = facultyCourses.find((x) => x.code === code);
    return c ? `${c.code} — ${c.name}` : code;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };


  const handleFacultyChange = (newFaculty) => {
    const newFacObj = faculties.find((f) => f.name === newFaculty);
    const validCodes = newFacObj ? newFacObj.courses.map((c) => c.code) : [];

    setForm((prev) => {
      const keptCourses = prev.courses.filter((c) => validCodes.includes(c));
      const droppedCourses = prev.courses.filter(
        (c) => !validCodes.includes(c)
      );
      const keptManaged = prev.managedCourses.filter((c) =>
        keptCourses.includes(c)
      );

      if (droppedCourses.length > 0) {
        setFacultyNotice(
          `Removed ${droppedCourses.length} course(s) that don't belong to ${newFaculty}: ${droppedCourses.join(
            ", "
          )}`
        );
      } else {
        setFacultyNotice("");
      }

      return {
        ...prev,
        Faculty: newFaculty,
        courses: keptCourses,
        managedCourses: keptManaged,
      };
    });
    setErrors((prev) => ({
      ...prev,
      Faculty: undefined,
      courses: undefined,
      managedCourses: undefined,
    }));
  };


  const addCourse = (rawCode, target, sourceCodes) => {
    const code = rawCode.trim();
    if (!code) {
      setComboError((p) => ({
        ...p,
        [target]: "Please type or pick a course.",
      }));
      return false;
    }
    const match = sourceCodes.find(
      (c) => c.toLowerCase() === code.toLowerCase()
    );
    if (!match) {
      setComboError((p) => ({
        ...p,
        [target]: `"${code}" is not a valid course for ${form.Faculty || "this faculty"}.`,
      }));
      return false;
    }
    if (form[target].includes(match)) {
      setComboError((p) => ({
        ...p,
        [target]: `"${match}" is already added.`,
      }));
      return false;
    }

    // Each course can only have ONE Module Leader
    if (target === "managedCourses" && managedByMap[match]) {
      setComboError((p) => ({
        ...p,
        managedCourses: `"${match}" is already managed by ${managedByMap[match].username}.`,
      }));
      return false;
    }

    setForm((prev) => ({ ...prev, [target]: [...prev[target], match] }));
    setComboError((p) => ({ ...p, [target]: "" }));
    return true;
  };

  const removeCourse = (code, target = "courses") => {
    setForm((prev) => {
      const next = {
        ...prev,
        [target]: prev[target].filter((c) => c !== code),
      };
      if (target === "courses") {
        next.managedCourses = next.managedCourses.filter((c) =>
          next.courses.includes(c)
        );
      }
      return next;
    });
  };

  const validate = () => {
    const e = {};

    if (!form.username.trim()) e.username = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Invalid email format.";
    }

    if (mode === "add" && !form.password.trim()) {
      e.password = "Password is required.";
    } else if (form.password && form.password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }

    if (!form.role) e.role = "Role is required.";

    const emailTaken = normalizedExistingUsers.some(
      (u) =>
        u.email.toLowerCase() === form.email.toLowerCase() &&
        u.id !== normalizedInitialUser?.id
    );
    if (emailTaken) e.email = "This email is already registered.";

    // Dean: one per faculty
    if (form.role === ROLES.DEAN) {
      if (!form.Faculty) e.Faculty = "Faculty is required for Dean.";
      else {
        const existingDean = normalizedExistingUsers.find(
          (u) =>
            u.role === ROLES.DEAN &&
            (u.Faculty || u.faculty) === form.Faculty &&
            u.id !== normalizedInitialUser?.id
        );
        if (existingDean) {
          e.Faculty = `Faculty "${form.Faculty}" already has a Dean (${existingDean.username}).`;
        }
      }
    }

    const validCodes = facultyCourses.map((c) => c.code);

    if (form.role === ROLES.INSTRUCTOR || form.role === ROLES.MODULE_LEADER) {
      if (!form.Faculty) e.Faculty = "Faculty is required.";
      if (!form.courses?.length) e.courses = "At least one course is required.";
      const invalid = form.courses.filter((c) => !validCodes.includes(c));
      if (invalid.length) {
        e.courses = `Courses not in ${form.Faculty}: ${invalid.join(", ")}`;
      }

      if (form.role === ROLES.MODULE_LEADER) {
        if (!form.managedCourses?.length) {
          e.managedCourses = "Module Leader must manage at least one course.";
        }

        const notAssigned = form.managedCourses.filter(
          (c) => !form.courses.includes(c)
        );
        if (notAssigned.length) {
          e.managedCourses = "Managed courses must be part of assigned courses.";
        }

        const conflicts = form.managedCourses
          .filter((c) => managedByMap[c])
          .map((c) => `${c} (led by ${managedByMap[c].username})`);
        if (conflicts.length) {
          e.managedCourses = `Already managed by another leader: ${conflicts.join(
            ", "
          )}`;
        }
      }
    }

    if (form.role === ROLES.STUDENT) {
      if (!form.Faculty) e.Faculty = "Faculty is required.";
      if (!form.level) e.level = "Level is required.";
      if (!form.courses?.length) {
        e.courses = "At least one enrolled course is required.";
      }

      const invalid = form.courses.filter((c) => !validCodes.includes(c));
      if (invalid.length) {
        e.courses = `Courses not offered by ${form.Faculty}: ${invalid.join(
          ", "
        )}`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      id: initialUser?.id,
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
    };
    if (form.password) payload.password = form.password;

    if (
      [
        ROLES.DEAN,
        ROLES.INSTRUCTOR,
        ROLES.MODULE_LEADER,
        ROLES.STUDENT,
      ].includes(form.role)
    ) {
      payload.Faculty = form.Faculty;
    }
    if (
      [ROLES.INSTRUCTOR, ROLES.MODULE_LEADER, ROLES.STUDENT].includes(
        form.role
      )
    ) {
      payload.courses = form.courses;
    }
    if (form.role === ROLES.MODULE_LEADER) {
      payload.managedCourses = form.managedCourses;
    }
    if (form.role === ROLES.STUDENT) {
      payload.level = Number(form.level);
    }

    onSubmit?.(payload, mode);
  };

  const role = form.role;
  const showFaculty = [
    ROLES.DEAN,
    ROLES.INSTRUCTOR,
    ROLES.MODULE_LEADER,
    ROLES.STUDENT,
  ].includes(role);
  const showCourses = [
    ROLES.INSTRUCTOR,
    ROLES.MODULE_LEADER,
    ROLES.STUDENT,
  ].includes(role);
  const showManaged = role === ROLES.MODULE_LEADER;
  const showLevel = role === ROLES.STUDENT;

  const facultyDean = facultyObj?.deanId
    ? normalizedExistingUsers.find((u) => u.id === facultyObj.deanId)
    : null;

  const courseSourceCodes = facultyCourses.map((c) => c.code);

  const takenManagedCourses = form.courses.filter((c) => managedByMap[c]);

  return (
    <div className="userModalOverlay" onMouseDown={onClose}>
      <div
        className="userModal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="userModalHeader">
          <h2>{mode === "edit" ? "Edit User" : "Add New User"}</h2>
          <button className="closeBtn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form className="userModalBody" onSubmit={handleSubmit}>
          <div className="formGrid">
            <div className="formField">
              <label>
                Name <span className="req">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Enter full name"
              />
              {errors.username && (
                <span className="err">
                  <AlertCircle size={12} /> {errors.username}
                </span>
              )}
            </div>

            <div className="formField">
              <label>
                Email <span className="req">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="user@msa.edu.eg"
              />
              {errors.email && (
                <span className="err">
                  <AlertCircle size={12} /> {errors.email}
                </span>
              )}
            </div>

            <div className="formField">
              <label>
                Password {mode === "add" && <span className="req">*</span>}
                {mode === "edit" && (
                  <small> (leave blank to keep current)</small>
                )}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
              />
              {errors.password && (
                <span className="err">
                  <AlertCircle size={12} /> {errors.password}
                </span>
              )}
            </div>

            <div className="formField">
              <label>
                Role <span className="req">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <option value="">Select role…</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <span className="err">
                  <AlertCircle size={12} /> {errors.role}
                </span>
              )}
            </div>
          </div>

          {role && (
            <div className="roleSection">
              <h3>
                Role Details —{" "}
                {ROLE_OPTIONS.find((r) => r.value === role)?.label}
              </h3>

              <div className="formGrid">
                {showFaculty && (
                  <div className="formField">
                    <label>
                      Faculty <span className="req">*</span>
                    </label>
                    <select
                      value={form.Faculty}
                      onChange={(e) => handleFacultyChange(e.target.value)}
                    >
                      <option value="">Select faculty…</option>
                      {faculties.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                    {errors.Faculty && (
                      <span className="err">
                        <AlertCircle size={12} /> {errors.Faculty}
                      </span>
                    )}

                    {/* Dean info for chosen faculty */}
                    {role === ROLES.DEAN &&
                      form.Faculty &&
                      !errors.Faculty &&
                      (facultyDean && facultyDean.id !== initialUser?.id ? (
                        <span className="err">
                          <AlertCircle size={12} /> Already has Dean:{" "}
                          {facultyDean.username}
                        </span>
                      ) : (
                        <span className="ok">
                          <CheckCircle2 size={12} /> Faculty available — no Dean
                          assigned yet.
                        </span>
                      ))}
                    {role !== ROLES.DEAN && form.Faculty && (
                      <span className="hint">
                        <Info size={12} /> Current Dean:{" "}
                        {facultyDean ? facultyDean.username : "Not assigned"}
                      </span>
                    )}
                  </div>
                )}

                {showLevel && (
                  <div className="formField">
                    <label>
                      Level <span className="req">*</span>
                    </label>
                    <select
                      value={form.level}
                      onChange={(e) => handleChange("level", e.target.value)}
                    >
                      <option value="">Select level…</option>
                      {LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Level {lvl}
                        </option>
                      ))}
                    </select>
                    {errors.level && (
                      <span className="err">
                        <AlertCircle size={12} /> {errors.level}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {facultyNotice && (
                <div className="facultyNotice">
                  <Info size={14} /> {facultyNotice}
                </div>
              )}

              {showCourses && (
                <div className="formField">
                  <label>
                    {role === ROLES.STUDENT ? "Enrolled Courses" : "Courses"}
                    <span className="req">*</span>
                  </label>

                  {!form.Faculty ? (
                    <span className="hint">
                      <Info size={12} /> Select a faculty first to see its
                      courses.
                    </span>
                  ) : (
                    <>
                      <div className="comboRow">
                        <input
                          type="text"
                          list="coursesList"
                          value={courseInput}
                          onChange={(e) => {
                            setCourseInput(e.target.value);
                            setComboError((p) => ({ ...p, courses: "" }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (
                                addCourse(
                                  courseInput,
                                  "courses",
                                  courseSourceCodes
                                )
                              ) {
                                setCourseInput("");
                              }
                            }
                          }}
                          placeholder={`Pick a course from ${form.Faculty}…`}
                        />
                        <datalist id="coursesList">
                          {facultyCourses
                            .filter((c) => !form.courses.includes(c.code))
                            .map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.name}
                              </option>
                            ))}
                        </datalist>
                        <button
                          type="button"
                          className="addChipBtn"
                          onClick={() => {
                            if (
                              addCourse(
                                courseInput,
                                "courses",
                                courseSourceCodes
                              )
                            ) {
                              setCourseInput("");
                            }
                          }}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                      <div className="chips">
                        {form.courses.map((c) => (
                          <span
                            key={c}
                            className="chip"
                            title={courseLabel(c)}
                          >
                            {courseLabel(c)}
                            <button
                              type="button"
                              onClick={() => removeCourse(c, "courses")}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      {comboError.courses && (
                        <span className="err">
                          <AlertCircle size={12} /> {comboError.courses}
                        </span>
                      )}
                      {errors.courses && (
                        <span className="err">
                          <AlertCircle size={12} /> {errors.courses}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {showManaged && (
                <div className="formField">
                  <label>
                    Managed Courses <span className="req">*</span>
                  </label>
                  <div className="comboRow">
                    <input
                      type="text"
                      list="managedList"
                      value={managedInput}
                      disabled={form.courses.length === 0}
                      onChange={(e) => {
                        setManagedInput(e.target.value);
                        setComboError((p) => ({ ...p, managedCourses: "" }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            addCourse(
                              managedInput,
                              "managedCourses",
                              form.courses
                            )
                          ) {
                            setManagedInput("");
                          }
                        }
                      }}
                      placeholder={
                        form.courses.length === 0
                          ? "Add courses first…"
                          : "Pick from assigned courses…"
                      }
                    />
                    <datalist id="managedList">
                      {form.courses
                        .filter(
                          (c) =>
                            !form.managedCourses.includes(c) &&
                            !managedByMap[c]
                        )
                        .map((c) => (
                          <option key={c} value={c}>
                            {courseLabel(c)}
                          </option>
                        ))}
                    </datalist>
                    <button
                      type="button"
                      className="addChipBtn"
                      disabled={form.courses.length === 0}
                      onClick={() => {
                        if (
                          addCourse(
                            managedInput,
                            "managedCourses",
                            form.courses
                          )
                        ) {
                          setManagedInput("");
                        }
                      }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className="chips">
                    {form.managedCourses.map((c) => (
                      <span
                        key={c}
                        className="chip chip-managed"
                        title={courseLabel(c)}
                      >
                        {courseLabel(c)}
                        <button
                          type="button"
                          onClick={() => removeCourse(c, "managedCourses")}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {takenManagedCourses.length > 0 && (
                    <span className="hint">
                      <Info size={12} /> Already led by another leader:{" "}
                      {takenManagedCourses
                        .map((c) => `${c} (${managedByMap[c].username})`)
                        .join(", ")}
                    </span>
                  )}

                  {comboError.managedCourses && (
                    <span className="err">
                      <AlertCircle size={12} /> {comboError.managedCourses}
                    </span>
                  )}
                  {errors.managedCourses && (
                    <span className="err">
                      <AlertCircle size={12} /> {errors.managedCourses}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="userModalFooter">
            <button type="button" className="btnSecondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btnPrimary">
              {mode === "edit" ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;