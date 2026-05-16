import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Plus,
  Search,
  FileText,
  CalendarDays,
  Trash2,
  Pencil,
  Eye,
  ChevronRight,
  BookOpen,
  Users,
  Building2,
  CheckCircle2,
  Clock3,
  Archive,
  X,
  Save,
  ClipboardList,
} from "lucide-react";
import api from "../../api/axios";
import "../../styles/SurveyManagement.css";

const initialForm = {
  survey_id: null,
  title: "",
  description: "",
  status: "draft",
  start_at: "",
  end_at: "",
  course_ids: [],
  faculty_ids: [],
  questions: [],
};

const initialState = {
  surveys: [],
  courses: [],
  faculties: [],
  selectedSurveyId: null,
  mode: "view", // view | create | edit
  form: initialForm,
  loading: true,
  saving: false,
  deleting: false,
  search: "",
  statusFilter: "all",
  error: "",
  success: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: "" };

    case "LOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        surveys: action.payload.surveys || [],
        courses: action.payload.courses || [],
        faculties: action.payload.faculties || [],
      };

    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SET_SEARCH":
      return { ...state, search: action.payload };

    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload };

    case "SELECT_SURVEY":
      return {
        ...state,
        selectedSurveyId: action.payload,
        mode: "view",
        success: "",
        error: "",
      };

    case "SET_MODE":
      return { ...state, mode: action.payload, success: "", error: "" };

    case "SET_FORM":
      return { ...state, form: action.payload };

    case "RESET_FORM":
      return { ...state, form: initialForm };

    case "UPDATE_FORM_FIELD":
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.payload,
        },
      };

    case "ADD_QUESTION":
      return {
        ...state,
        form: {
          ...state.form,
          questions: [
            ...state.form.questions,
            {
              question_id: null,
              section: "General",
              question_text: "",
              question_type: "likert",
              is_required: 1,
              display_order: state.form.questions.length + 1,
              options: null,
            },
          ],
        },
      };

    case "INSERT_QUESTION_AFTER": {
      const currentIndex = Number(action.payload);
      const safeIndex = Number.isFinite(currentIndex) ? currentIndex : -1;
      const insertAt = Math.min(
        Math.max(safeIndex + 1, 0),
        state.form.questions.length,
      );

      const nextQuestions = [
        ...state.form.questions.slice(0, insertAt),
        {
          question_id: null,
          section: "General",
          question_text: "",
          question_type: "likert",
          is_required: 1,
          display_order: 0,
          options: null,
        },
        ...state.form.questions.slice(insertAt),
      ].map((q, i) => ({ ...q, display_order: i + 1 }));

      return {
        ...state,
        form: {
          ...state.form,
          questions: nextQuestions,
        },
      };
    }

    case "UPDATE_QUESTION":
      return {
        ...state,
        form: {
          ...state.form,
          questions: state.form.questions.map((q, i) =>
            i === action.index ? { ...q, [action.field]: action.payload } : q,
          ),
        },
      };

    case "REMOVE_QUESTION": {
      const questions = state.form.questions
        .filter((_, i) => i !== action.payload)
        .map((q, i) => ({ ...q, display_order: i + 1 }));

      return {
        ...state,
        form: {
          ...state.form,
          questions,
        },
      };
    }

    case "TOGGLE_COURSE": {
      const exists = state.form.course_ids.includes(action.payload);
      return {
        ...state,
        form: {
          ...state.form,
          course_ids: exists
            ? state.form.course_ids.filter((id) => id !== action.payload)
            : [...state.form.course_ids, action.payload],
        },
      };
    }

    case "TOGGLE_FACULTY": {
      const exists = state.form.faculty_ids.includes(action.payload);
      return {
        ...state,
        form: {
          ...state.form,
          faculty_ids: exists
            ? state.form.faculty_ids.filter((id) => id !== action.payload)
            : [...state.form.faculty_ids, action.payload],
        },
      };
    }

    case "SAVE_START":
      return { ...state, saving: true, error: "", success: "" };

    case "SAVE_END":
      return { ...state, saving: false };

    case "DELETE_START":
      return { ...state, deleting: true, error: "", success: "" };

    case "DELETE_END":
      return { ...state, deleting: false };

    case "SET_SUCCESS":
      return { ...state, success: action.payload, error: "" };

    case "SET_ERROR":
      return { ...state, error: action.payload, success: "" };

    default:
      return state;
  }
}

const statusClass = (status) => {
  switch ((status || "").toLowerCase()) {
    case "published":
      return "survey-status survey-status--published";
    case "draft":
      return "survey-status survey-status--draft";
    case "closed":
      return "survey-status survey-status--closed";
    case "archived":
      return "survey-status survey-status--archived";
    default:
      return "survey-status";
  }
};

// const emptyQuestion = () => ({
//   question_id: null,
//   section: "General",
//   question_text: "",
//   question_type: "likert",
//   is_required: 1,
//   display_order: 1,
//   options: null,
// });

export default function SurveyManagement() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const questionTextRefs = useRef([]);
  const [focusQuestionIndex, setFocusQuestionIndex] = useState(null);

  useEffect(() => {
    if (focusQuestionIndex === null) return;
    const el = questionTextRefs.current[focusQuestionIndex];
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "center" });
    }
    setFocusQuestionIndex(null);
  }, [state.form.questions.length, focusQuestionIndex]);

  const handleQuestionTextKeyDown = (e, index) => {
    if (e.key !== "Enter") return;

    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

    e.preventDefault();
    dispatch({ type: "INSERT_QUESTION_AFTER", payload: index });
    setFocusQuestionIndex(index + 1);
  };

  const loadPage = async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const [dashboardRes, surveysRes] = await Promise.all([
        api.get("/View/QAView.php", { params: { action: "dashboard" } }),
        api.get("/View/QAView.php", { params: { action: "surveys" } }),
      ]);

      dispatch({
        type: "LOAD_SUCCESS",
        payload: {
          courses: dashboardRes.data?.courses || [],
          faculties: dashboardRes.data?.faculties || [],
          surveys: surveysRes.data?.surveys || [],
        },
      });
    } catch (e) {
      dispatch({
        type: "LOAD_ERROR",
        payload: "Failed to load survey management data." + e,
      });
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const loadSurveyDetails = async (surveyId) => {
    if (!surveyId) return;
    setDetailsLoading(true);
    try {
      const res = await api.get("/View/QAView.php", {
        params: { action: "survey", survey_id: surveyId },
      });
      setDetails(res.data?.survey || null);
    } catch {
      setDetails(null);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load survey details.",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (state.selectedSurveyId && state.mode === "view") {
      loadSurveyDetails(state.selectedSurveyId);
    }
  }, [state.selectedSurveyId, state.mode]);

  const filteredSurveys = useMemo(() => {
    return state.surveys.filter((s) => {
      const matchesSearch =
        s.title?.toLowerCase().includes(state.search.toLowerCase()) ||
        String(s.survey_id).includes(state.search);

      const matchesStatus =
        state.statusFilter === "all" ||
        (s.status || "").toLowerCase() === state.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [state.surveys, state.search, state.statusFilter]);

  const stats = useMemo(() => {
    const total = state.surveys.length;
    const published = state.surveys.filter(
      (s) => s.status === "published",
    ).length;
    const draft = state.surveys.filter((s) => s.status === "draft").length;
    const totalResponses = state.surveys.reduce(
      (sum, s) => sum + Number(s.responses_count || 0),
      0,
    );
    return { total, published, draft, totalResponses };
  }, [state.surveys]);

  const startCreate = () => {
    dispatch({ type: "RESET_FORM" });
    dispatch({ type: "SET_MODE", payload: "create" });
    setDetails(null);
  };

  const startEdit = async () => {
    if (!state.selectedSurveyId) return;
    setDetailsLoading(true);
    try {
      const res = await api.get("/View/QAView.php", {
        params: { action: "survey", survey_id: state.selectedSurveyId },
      });
      const survey = res.data?.survey;
      if (!survey) return;

      dispatch({
        type: "SET_FORM",
        payload: {
          survey_id: survey.survey_id,
          title: survey.title || "",
          description: survey.description || "",
          status: survey.status || "draft",
          start_at: survey.start_at ? survey.start_at.slice(0, 16) : "",
          end_at: survey.end_at ? survey.end_at.slice(0, 16) : "",
          course_ids:
            survey.assignments?.courses?.map((c) => Number(c.id)) || [],
          faculty_ids:
            survey.assignments?.faculties?.map((f) => Number(f.id)) || [],
          questions: (survey.questions || []).map((q, index) => ({
            question_id: q.question_id || null,
            section: q.section || "General",
            question_text: q.question_text || "",
            question_type: q.question_type || "text",
            is_required: Number(q.is_required) ? 1 : 0,
            display_order: q.display_order || index + 1,
            options: q.options || null,
          })),
        },
      });

      dispatch({ type: "SET_MODE", payload: "edit" });
    } catch {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to open survey for editing.",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const validateForm = () => {
    if (!state.form.title.trim()) return "Survey title is required.";
    if (!state.form.start_at) return "Start date is required.";
    if (!state.form.end_at) return "End date is required.";
    if (new Date(state.form.start_at) >= new Date(state.form.end_at)) {
      return "End date must be after start date.";
    }
    if (!state.form.questions.length)
      return "At least one question is required.";

    for (const [index, q] of state.form.questions.entries()) {
      if (!q.question_text.trim())
        return `Question ${index + 1} text is required.`;
      if (!["likert", "text"].includes(q.question_type)) {
        return `Question ${index + 1} has invalid type.`;
      }
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      dispatch({ type: "SET_ERROR", payload: validationError });
      return;
    }

    dispatch({ type: "SAVE_START" });

    const payload = {
      ...state.form,
      questions: state.form.questions.map((q, index) => ({
        ...q,
        display_order: index + 1,
        options: q.question_type === "likert" ? null : null,
      })),
    };

    try {
      if (state.mode === "create") {
        await api.post("/View/QAView.php?action=create-survey", payload);
        dispatch({
          type: "SET_SUCCESS",
          payload: "Survey created successfully.",
        });
      } else {
        await api.post("/View/QAView.php?action=update-survey", payload);
        dispatch({
          type: "SET_SUCCESS",
          payload: "Survey updated successfully.",
        });
      }

      await loadPage();
      if (state.mode === "edit" && state.form.survey_id) {
        dispatch({ type: "SELECT_SURVEY", payload: state.form.survey_id });
      } else {
        dispatch({ type: "SET_MODE", payload: "view" });
      }
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err?.response?.data?.message || "Failed to save survey.",
      });
    } finally {
      dispatch({ type: "SAVE_END" });
    }
  };

  const confirmDelete = async () => {
    if (!state.selectedSurveyId) return;
    dispatch({ type: "DELETE_START" });
    try {
      await api.post("/View/QAView.php?action=delete-survey", {
        survey_id: state.selectedSurveyId,
      });
      setShowDeleteConfirm(false);
      dispatch({
        type: "SET_SUCCESS",
        payload: "Survey deleted successfully.",
      });
      dispatch({ type: "SELECT_SURVEY", payload: null });
      setDetails(null);
      await loadPage();
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err?.response?.data?.message || "Failed to delete survey.",
      });
    } finally {
      dispatch({ type: "DELETE_END" });
    }
  };

  const visibleCourses = state.courses.filter((c) =>
    `${c.code} ${c.name}`.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  const visibleFaculties = state.faculties.filter((f) =>
    f.name.toLowerCase().includes(facultySearch.toLowerCase()),
  );

  return (
    <div className="survey-page">
      <header className="survey-page__header">
        <div>
          <p className="survey-page__eyebrow">Quality Assurance</p>
          <h1 className="survey-page__title">Survey Management Workspace</h1>
          <p className="survey-page__subtitle">
            Build, assign, review, and manage institutional surveys from one
            place.
          </p>
        </div>

        <button className="survey-primary-btn" onClick={startCreate}>
          <Plus size={16} />
          Create Survey
        </button>
      </header>

      <section className="survey-stats">
        <div className="survey-stat-card">
          <div className="survey-stat-card__icon">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="survey-stat-card__label">Total Surveys</p>
            <h3>{stats.total}</h3>
          </div>
        </div>
        <div className="survey-stat-card">
          <div className="survey-stat-card__icon survey-stat-card__icon--green">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="survey-stat-card__label">Published</p>
            <h3>{stats.published}</h3>
          </div>
        </div>
        <div className="survey-stat-card">
          <div className="survey-stat-card__icon survey-stat-card__icon--amber">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="survey-stat-card__label">Drafts</p>
            <h3>{stats.draft}</h3>
          </div>
        </div>
        <div className="survey-stat-card">
          <div className="survey-stat-card__icon survey-stat-card__icon--purple">
            <Users size={18} />
          </div>
          <div>
            <p className="survey-stat-card__label">Responses</p>
            <h3>{stats.totalResponses}</h3>
          </div>
        </div>
      </section>

      <section className="survey-workspace">
        <aside className="survey-sidebar">
          <div className="survey-toolbar">
            <div className="survey-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search surveys..."
                value={state.search}
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH", payload: e.target.value })
                }
              />
            </div>

            <select
              className="survey-select"
              value={state.statusFilter}
              onChange={(e) =>
                dispatch({ type: "SET_STATUS_FILTER", payload: e.target.value })
              }
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="survey-list">
            {state.loading ? (
              <div className="survey-empty">Loading surveys...</div>
            ) : filteredSurveys.length === 0 ? (
              <div className="survey-empty">No surveys found.</div>
            ) : (
              filteredSurveys.map((survey) => (
                <button
                  key={survey.survey_id}
                  className={`survey-list-item ${state.selectedSurveyId === survey.survey_id ? "survey-list-item--active" : ""}`}
                  onClick={() =>
                    dispatch({
                      type: "SELECT_SURVEY",
                      payload: survey.survey_id,
                    })
                  }
                >
                  <div className="survey-list-item__top">
                    <h3>{survey.title}</h3>
                    <span className={statusClass(survey.status)}>
                      {survey.status}
                    </span>
                  </div>

                  <div className="survey-list-item__meta">
                    <span>
                      <FileText size={13} /> {survey.questions_count || 0}{" "}
                      questions
                    </span>
                    <span>
                      <Users size={13} /> {survey.responses_count || 0}{" "}
                      responses
                    </span>
                  </div>

                  <div className="survey-list-item__dates">
                    <CalendarDays size={13} />
                    <span>
                      {survey.start_at
                        ? new Date(survey.start_at).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {survey.end_at
                        ? new Date(survey.end_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="survey-main">
          {state.error && (
            <div className="survey-alert survey-alert--error">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="survey-alert survey-alert--success">
              {state.success}
            </div>
          )}

          {state.mode === "create" || state.mode === "edit" ? (
            <div className="survey-editor">
              <div className="survey-editor__header">
                <div>
                  <p className="survey-section-eyebrow">Builder</p>
                  <h2>
                    {state.mode === "create"
                      ? "Create New Survey"
                      : "Edit Survey"}
                  </h2>
                </div>
                <div className="survey-editor__actions">
                  <button
                    className="survey-secondary-btn"
                    onClick={() =>
                      dispatch({ type: "SET_MODE", payload: "view" })
                    }
                  >
                    Cancel
                  </button>
                  <button
                    className="survey-primary-btn"
                    onClick={handleSave}
                    disabled={state.saving}
                  >
                    <Save size={16} />
                    {state.saving ? "Saving..." : "Save Survey"}
                  </button>
                </div>
              </div>

              <div className="survey-form-grid">
                <section className="survey-panel">
                  <h3 className="survey-panel__title">Basic Information</h3>

                  <div className="survey-field">
                    <label>Survey Title</label>
                    <input
                      type="text"
                      value={state.form.title}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FORM_FIELD",
                          field: "title",
                          payload: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="survey-field">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={state.form.description}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FORM_FIELD",
                          field: "description",
                          payload: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="survey-form-row">
                    <div className="survey-field">
                      <label>Status</label>
                      <select
                        value={state.form.status}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_FORM_FIELD",
                            field: "status",
                            payload: e.target.value,
                          })
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="survey-field">
                      <label>Start At</label>
                      <input
                        type="datetime-local"
                        value={state.form.start_at}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_FORM_FIELD",
                            field: "start_at",
                            payload: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="survey-field">
                      <label>End At</label>
                      <input
                        type="datetime-local"
                        value={state.form.end_at}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_FORM_FIELD",
                            field: "end_at",
                            payload: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="survey-panel">
                  <h3 className="survey-panel__title">Assignments</h3>

                  <div className="survey-assignments-grid">
                    <div className="survey-selector">
                      <div className="survey-selector__header">
                        <BookOpen size={16} />
                        <span>Courses</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search courses..."
                        className="search-diff"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                      />
                      <div className="survey-selector__list">
                        {visibleCourses.map((course) => {
                          const active = state.form.course_ids.includes(
                            Number(course.id),
                          );
                          return (
                            <button
                              type="button"
                              key={course.id}
                              className={`survey-selector__item ${active ? "survey-selector__item--active" : ""}`}
                              onClick={() =>
                                dispatch({
                                  type: "TOGGLE_COURSE",
                                  payload: Number(course.id),
                                })
                              }
                            >
                              <span>
                                {course.code} — {course.name}
                              </span>
                              {active && <CheckCircle2 size={14} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="survey-selector">
                      <div className="survey-selector__header">
                        <Building2 size={16} />
                        <span>Faculties</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search faculties..."
                        className="search-diff"
                        value={facultySearch}
                        onChange={(e) => setFacultySearch(e.target.value)}
                      />
                      <div className="survey-selector__list">
                        {visibleFaculties.map((faculty) => {
                          const active = state.form.faculty_ids.includes(
                            Number(faculty.id),
                          );
                          return (
                            <button
                              type="button"
                              key={faculty.id}
                              className={`survey-selector__item ${active ? "survey-selector__item--active" : ""}`}
                              onClick={() =>
                                dispatch({
                                  type: "TOGGLE_FACULTY",
                                  payload: Number(faculty.id),
                                })
                              }
                            >
                              <span>{faculty.name}</span>
                              {active && <CheckCircle2 size={14} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="survey-panel">
                  <div className="survey-panel__topline">
                    <h3 className="survey-panel__title">Questions</h3>
                    <button
                      className="survey-secondary-btn"
                      onClick={() => dispatch({ type: "ADD_QUESTION" })}
                    >
                      <Plus size={15} />
                      Add Question
                    </button>
                  </div>

                  <div className="survey-questions">
                    {state.form.questions.length === 0 ? (
                      <div className="survey-empty-inline">
                        No questions yet. Add your first question.
                      </div>
                    ) : (
                      state.form.questions.map((question, index) => (
                        <div key={index} className="survey-question-card">
                          <div className="survey-question-card__header">
                            <h4>Question {index + 1}</h4>
                            <button
                              className="survey-icon-btn survey-icon-btn--danger"
                              onClick={() =>
                                dispatch({
                                  type: "REMOVE_QUESTION",
                                  payload: index,
                                })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="survey-form-row survey-form-row--question">
                            <div className="survey-field">
                              <label>Section</label>
                              <input
                                type="text"
                                value={question.section}
                                onChange={(e) =>
                                  dispatch({
                                    type: "UPDATE_QUESTION",
                                    index,
                                    field: "section",
                                    payload: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="survey-field">
                              <label>Question Type</label>
                              <select
                                value={question.question_type}
                                onChange={(e) =>
                                  dispatch({
                                    type: "UPDATE_QUESTION",
                                    index,
                                    field: "question_type",
                                    payload: e.target.value,
                                  })
                                }
                              >
                                <option value="likert">Likert</option>
                                <option value="text">Text</option>
                              </select>
                            </div>

                            <div className="survey-field survey-field--checkbox">
                              <label>Required</label>
                              <button
                                type="button"
                                className={`survey-toggle ${question.is_required ? "survey-toggle--active" : ""}`}
                                onClick={() =>
                                  dispatch({
                                    type: "UPDATE_QUESTION",
                                    index,
                                    field: "is_required",
                                    payload: question.is_required ? 0 : 1,
                                  })
                                }
                              >
                                {question.is_required ? "Yes" : "No"}
                              </button>
                            </div>
                          </div>

                          <div className="survey-field">
                            <label>Question Text</label>
                            <textarea
                              ref={(el) => {
                                questionTextRefs.current[index] = el;
                              }}
                              rows="3"
                              value={question.question_text}
                              onKeyDown={(e) =>
                                handleQuestionTextKeyDown(e, index)
                              }
                              onChange={(e) =>
                                dispatch({
                                  type: "UPDATE_QUESTION",
                                  index,
                                  field: "question_text",
                                  payload: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : !state.selectedSurveyId ? (
            <div className="survey-blank-state">
              <div className="survey-blank-state__icon">
                <ClipboardList size={28} />
              </div>
              <h2>Select a survey</h2>
              <p>
                Choose a survey from the left panel or create a new one to
                begin.
              </p>
            </div>
          ) : detailsLoading ? (
            <div className="survey-blank-state">
              <h2>Loading survey details...</h2>
            </div>
          ) : details ? (
            <div className="survey-details">
              <div className="survey-details__header">
                <div>
                  <p className="survey-section-eyebrow">Survey Details</p>
                  <h2>{details.title}</h2>
                  <p className="survey-details__desc">
                    {details.description || "No description provided."}
                  </p>
                </div>

                <div className="survey-details__actions">
                  <button className="survey-secondary-btn" onClick={startEdit}>
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button
                    className="survey-danger-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>

              <div className="survey-info-grid">
                <div className="survey-info-card">
                  <span>Status</span>
                  <strong className={statusClass(details.status)}>
                    {details.status}
                  </strong>
                </div>
                <div className="survey-info-card">
                  <span>Start</span>
                  <strong>
                    {details.start_at
                      ? new Date(details.start_at).toLocaleString()
                      : "—"}
                  </strong>
                </div>
                <div className="survey-info-card">
                  <span>End</span>
                  <strong>
                    {details.end_at
                      ? new Date(details.end_at).toLocaleString()
                      : "—"}
                  </strong>
                </div>
                <div className="survey-info-card">
                  <span>Questions</span>
                  <strong>{details.questions?.length || 0}</strong>
                </div>
              </div>

              <div className="survey-detail-sections">
                <section className="survey-panel">
                  <h3 className="survey-panel__title">Assigned Courses</h3>
                  <div className="survey-chip-list">
                    {details.assignments?.courses?.length ? (
                      details.assignments.courses.map((c) => (
                        <span key={c.id} className="survey-chip">
                          {c.code} — {c.name}
                        </span>
                      ))
                    ) : (
                      <p className="survey-muted">No courses assigned.</p>
                    )}
                  </div>
                </section>

                <section className="survey-panel">
                  <h3 className="survey-panel__title">Assigned Faculties</h3>
                  <div className="survey-chip-list">
                    {details.assignments?.faculties?.length ? (
                      details.assignments.faculties.map((f) => (
                        <span key={f.id} className="survey-chip">
                          {f.name}
                        </span>
                      ))
                    ) : (
                      <p className="survey-muted">No faculties assigned.</p>
                    )}
                  </div>
                </section>

                <section className="survey-panel">
                  <h3 className="survey-panel__title">Questions</h3>
                  <div className="survey-question-preview-list">
                    {details.questions?.map((q, i) => (
                      <div
                        key={q.question_id || i}
                        className="survey-question-preview"
                      >
                        <div className="survey-question-preview__top">
                          <span className="survey-question-preview__index">
                            Q{i + 1}
                          </span>
                          <span className="survey-question-preview__type">
                            {q.question_type}
                          </span>
                          {Number(q.is_required) === 1 && (
                            <span className="survey-question-preview__required">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="survey-question-preview__section">
                          {q.section}
                        </p>
                        <h4>{q.question_text}</h4>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="survey-blank-state">
              <h2>Survey not found</h2>
            </div>
          )}
        </main>
      </section>

      {showDeleteConfirm && (
        <div
          className="survey-modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
            <div className="survey-modal__header">
              <h3>Delete Survey</h3>
              <button
                className="survey-icon-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="survey-modal__text">
              Are you sure you want to delete this survey? If responses exist,
              the system will archive it instead.
            </p>
            <div className="survey-modal__actions">
              <button
                className="survey-secondary-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="survey-danger-btn"
                onClick={confirmDelete}
                disabled={state.deleting}
              >
                {state.deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
