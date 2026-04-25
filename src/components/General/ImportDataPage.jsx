import React from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, Plus, Trash2, Upload, XCircle } from "lucide-react";
import PagificationContainer from "./PagificationContainer";
import "./ImportDataPage.css";

const TYPE_OPTIONS = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "dropdown", label: "Dropdown" },
  { value: "list", label: "List (Text Items)" }
];

const DEFAULT_ROLE_OPTIONS = ["Admin", "QA", "Dean", "Module Leader", "Instructor", "Student"];

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const parseOptionsText = (value) => {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildColumnMetaByName = (name) => {
  const normalizedName = normalizeValue(name).toLowerCase();

  if (normalizedName === "role") {
    return {
      type: "dropdown",
      options: DEFAULT_ROLE_OPTIONS
    };
  }

  if (normalizedName === "courses" || normalizedName === "course") {
    return {
      type: "list",
      options: []
    };
  }

  return {
    type: "string",
    options: []
  };
};

const isValueValidForType = (value, type, column = null) => {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return true;
  }

  if (type === "number") {
    return Number.isFinite(Number(normalized));
  }

  if (type === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  }

  if (type === "date") {
    return !Number.isNaN(Date.parse(normalized));
  }

  if (type === "boolean") {
    const lower = normalized.toLowerCase();
    return ["true", "false", "1", "0", "yes", "no"].includes(lower);
  }

  if (type === "dropdown") {
    const options = Array.isArray(column?.options) ? column.options : [];
    return options.includes(normalized);
  }

  if (type === "list") {
    const items = normalized.split(",").map((item) => item.trim());
    if (items.length === 0) {
      return false;
    }

    return items.every((item) => item.length > 0);
  }

  return true;
};

const hasDuplicateEmail = (rows, columns, existingUsers = []) => {
  const emailColumnId = columns.find(
    (col) => normalizeValue(col.name).toLowerCase() === "email"
  )?.id;

  if (!emailColumnId) return false;

  const existingEmails = new Set(existingUsers.map((user) => normalizeValue(user.email || "").toLowerCase()));
  const importedEmails = new Set();

  for (const row of rows) {
    const email = normalizeValue(row.values[emailColumnId] || "").toLowerCase();
    if (email && (existingEmails.has(email) || importedEmails.has(email))) {
      return true;
    }
    if (email) {
      importedEmails.add(email);
    }
  }

  return false;
};

const hasDuplicateId = (rows, columns, existingUsers = []) => {
  const idColumnId = columns.find(
    (col) => normalizeValue(col.name).toLowerCase() === "id"
  )?.id;

  if (!idColumnId) return false;

  const existingIds = new Set(existingUsers.map((user) => user.id));
  const importedIds = new Set();

  for (const row of rows) {
    const id = normalizeValue(row.values[idColumnId] || "");
    if (id && (existingIds.has(Number(id)) || importedIds.has(Number(id)))) {
      return true;
    }
    if (id) {
      importedIds.add(Number(id));
    }
  }

  return false;
};

const getDuplicateRowIds = (rows, columns, existingUsers = []) => {
  const duplicateRowIds = new Set();
  const emailColumnId = columns.find(
    (col) => normalizeValue(col.name).toLowerCase() === "email"
  )?.id;
  const idColumnId = columns.find(
    (col) => normalizeValue(col.name).toLowerCase() === "id"
  )?.id;

  if (emailColumnId) {
    const existingEmails = new Set(existingUsers.map((user) => normalizeValue(user.email || "").toLowerCase()));
    const importedEmails = new Map();

    rows.forEach((row) => {
      const email = normalizeValue(row.values[emailColumnId] || "").toLowerCase();
      if (email) {
        if (existingEmails.has(email) || importedEmails.has(email)) {
          duplicateRowIds.add(row.id);
          if (importedEmails.has(email)) {
            duplicateRowIds.add(importedEmails.get(email));
          }
        }
        importedEmails.set(email, row.id);
      }
    });
  }

  if (idColumnId) {
    const existingIds = new Set(existingUsers.map((user) => user.id));
    const importedIds = new Map();

    rows.forEach((row) => {
      const id = normalizeValue(row.values[idColumnId] || "");
      if (id) {
        const numId = Number(id);
        if (existingIds.has(numId) || importedIds.has(numId)) {
          duplicateRowIds.add(row.id);
          if (importedIds.has(numId)) {
            duplicateRowIds.add(importedIds.get(numId));
          }
        }
        importedIds.set(numId, row.id);
      }
    });
  }

  return duplicateRowIds;
};

const createColumnId = () => `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const createRowId = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const buildDatasetFromArray = (arrayData = []) => {
  const safeRows = Array.isArray(arrayData) ? arrayData : [];

  if (safeRows.length === 0) {
    return { columns: [], rows: [] };
  }

  const longestRowLength = safeRows.reduce((max, row) => {
    return Math.max(max, Array.isArray(row) ? row.length : 0);
  }, 0);

  const headerSource = Array.isArray(safeRows[0]) ? safeRows[0] : [];
  const headers = Array.from({ length: Math.max(longestRowLength, headerSource.length) }, (_, index) => {
    const value = normalizeValue(headerSource[index]);
    return value || `Column ${index + 1}`;
  });

  const columns = headers.map((name) => {
    const meta = buildColumnMetaByName(name);

    return {
      id: createColumnId(),
      name,
      type: meta.type,
      options: meta.options
    };
  });

  const rows = safeRows
    .slice(1)
    .map((rawRow) => {
      const safeRow = Array.isArray(rawRow) ? rawRow : [];
      const values = {};

      columns.forEach((column, index) => {
        values[column.id] = normalizeValue(safeRow[index]);
      });

      return {
        id: createRowId(),
        values
      };
    })
    .filter((row) => Object.values(row.values).some((value) => normalizeValue(value) !== ""));

  return { columns, rows };
};

const parseSpreadsheetFile = async (selectedFile) => {
  if (!selectedFile) {
    return { columns: [], rows: [] };
  }

  const arrayBuffer = await selectedFile.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames?.[0];

  if (!firstSheetName) {
    return { columns: [], rows: [] };
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  const arrayData = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false
  });

  return buildDatasetFromArray(arrayData);
};

const ImportDataPage = ({ file, onCancel, onConfirmImport, existingUsers = [] }) => {
  const [selectedFile, setSelectedFile] = React.useState(file ?? null);
  const [columns, setColumns] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [confirmIntent, setConfirmIntent] = React.useState(null);
  const [dragActive, setDragActive] = React.useState(false);

  React.useEffect(() => {
    setSelectedFile(file ?? null);
  }, [file]);

  React.useEffect(() => {
    let isMounted = true;

    const loadFile = async () => {
      if (!selectedFile) {
        setColumns([]);
        setRows([]);
        setErrorMessage("");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const dataset = await parseSpreadsheetFile(selectedFile);
        if (isMounted) {
          setColumns(dataset.columns);
          setRows(dataset.rows);
        }
      } catch {
        if (isMounted) {
          setColumns([]);
          setRows([]);
          setErrorMessage("Unable to read this file. Please upload a valid CSV or Excel file.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  const duplicateRowIds = React.useMemo(() => {
    return getDuplicateRowIds(rows, columns, existingUsers);
  }, [rows, columns, existingUsers]);

  const rowSummaries = React.useMemo(() => {
    return rows.map((row) => {
      if (duplicateRowIds.has(row.id)) {
        return { rowId: row.id, status: "duplicate" };
      }

      let hasInvalid = false;
      let hasEmpty = false;

      columns.forEach((column) => {
        const value = row.values[column.id] ?? "";
        const normalized = normalizeValue(value);

        if (!normalized) {
          hasEmpty = true;
          return;
        }

        if (!isValueValidForType(value, column.type, column)) {
          hasInvalid = true;
        }
      });

      if (hasInvalid) {
        return { rowId: row.id, status: "invalid" };
      }

      if (hasEmpty) {
        return { rowId: row.id, status: "warning" };
      }

      return { rowId: row.id, status: "valid" };
    });
  }, [columns, rows, duplicateRowIds]);

  const rowStatusMap = React.useMemo(() => {
    return rowSummaries.reduce((acc, item) => {
      acc[item.rowId] = item.status;
      return acc;
    }, {});
  }, [rowSummaries]);

  const hasDupEmail = hasDuplicateEmail(rows, columns, existingUsers);
  const hasDupId = hasDuplicateId(rows, columns, existingUsers);
  const invalidRowCount = rowSummaries.filter((item) => item.status === "invalid").length;
  const warningRowCount = rowSummaries.filter((item) => item.status === "warning").length;
  const canImport = rows.length > 0 && columns.length > 0 && invalidRowCount === 0 && !hasDupEmail && !hasDupId;

  const onFileInputChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const nextFile = event.dataTransfer?.files?.[0] ?? null;
    if (nextFile && (nextFile.name.endsWith(".csv") || nextFile.name.endsWith(".xlsx") || nextFile.name.endsWith(".xls"))) {
      setSelectedFile(nextFile);
    }
  };

  const updateCell = (rowId, columnId, value) => {
    setRows((prevRows) => {
      return prevRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        return {
          ...row,
          values: {
            ...row.values,
            [columnId]: value
          }
        };
      });
    });
  };

  const updateColumnMeta = (columnId, patch) => {
    setColumns((prevColumns) => {
      return prevColumns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        const nextType = patch.type ?? column.type;
        return {
          ...column,
          ...patch,
          type: nextType,
          options: nextType === "dropdown" ? (patch.options ?? column.options ?? []) : []
        };
      });
    });
  };

  const updateColumnName = (columnId, nextName) => {
    setColumns((prevColumns) => {
      return prevColumns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        const autoMeta = buildColumnMetaByName(nextName);
        const shouldAutoApply = autoMeta.type === "dropdown" || autoMeta.type === "list";

        if (!shouldAutoApply) {
          return {
            ...column,
            name: nextName
          };
        }

        return {
          ...column,
          name: nextName,
          type: autoMeta.type,
          options: autoMeta.options
        };
      });
    });
  };

  const removeColumn = (columnId) => {
    setColumns((prevColumns) => prevColumns.filter((column) => column.id !== columnId));
    setRows((prevRows) => {
      return prevRows.map((row) => {
        const nextValues = { ...row.values };
        delete nextValues[columnId];
        return { ...row, values: nextValues };
      });
    });
  };

  const addColumn = () => {
    const nextColumnId = createColumnId();

    setColumns((prevColumns) => [
      ...prevColumns,
      {
        id: nextColumnId,
        name: `Column ${prevColumns.length + 1}`,
        type: "string",
        options: []
      }
    ]);

    setRows((prevRows) => {
      return prevRows.map((row) => ({
        ...row,
        values: {
          ...row.values,
          [nextColumnId]: ""
        }
      }));
    });
  };

  const addRow = () => {
    const values = {};
    columns.forEach((column) => {
      values[column.id] = "";
    });

    setRows((prevRows) => [
      ...prevRows,
      {
        id: createRowId(),
        values
      }
    ]);
  };

  const removeRow = (rowId) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
  };

  const handleImportClick = () => {
    if (!canImport) {
      return;
    }

    setConfirmIntent("import");
  };

  const handleCancelClick = () => {
    setConfirmIntent("cancel");
  };

  const confirmAction = () => {
    if (confirmIntent === "import") {
      onConfirmImport?.({
        fileName: selectedFile?.name ?? "",
        columns,
        rows
      });
    }

    if (confirmIntent === "cancel") {
      onCancel?.();
    }

    setConfirmIntent(null);
  };

  return (
    <section
      className={`ImportDataPage ${dragActive ? "idp-drag-active" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <header className="idp-header">
        <div>
          <p className="idp-kicker">BULK IMPORT WORKSPACE</p>
          <h1>Review Data Before Import</h1>
          <p>
            Edit rows, change structure, remove columns, and fix validation issues before confirming import.
          </p>
        </div>

        <label className="idp-upload-btn" htmlFor="idp-file-input">
          <Upload size={16} />
          {selectedFile ? "Replace File" : "Upload File"}
        </label>
        <input
          id="idp-file-input"
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={onFileInputChange}
        />
      </header>

      <div className="idp-meta-grid">
        <div className="idp-meta-card">
          <span>File Name</span>
          <strong>{selectedFile?.name || "No file selected"}</strong>
        </div>
        <div className="idp-meta-card">
          <span>Total Rows</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="idp-meta-card">
          <span>Total Columns</span>
          <strong>{columns.length}</strong>
        </div>
        <div className="idp-meta-card">
          <span>Validation</span>
          <strong>
            {invalidRowCount} invalid / {warningRowCount} warning
          </strong>
        </div>
      </div>

      {(errorMessage || hasDupEmail || hasDupId) && (
        <div className="idp-alert idp-alert-error">
          <AlertTriangle size={16} />
          <span>
            {errorMessage || (hasDupEmail ? "Duplicate email found in import or existing users." : "Duplicate ID found in import or existing users.")}
          </span>
        </div>
      )}

      {!errorMessage && !isLoading && rows.length === 0 && columns.length === 0 && (
        <div className="idp-alert idp-alert-neutral">
          <AlertTriangle size={16} />
          <span>Upload a file to start editing and validating your import data.</span>
        </div>
      )}

      <div className="idp-toolbar">
        <button type="button" onClick={addRow} className="idp-btn idp-btn-secondary" disabled={columns.length === 0}>
          <Plus size={16} />
          Add Row
        </button>
        <button type="button" onClick={addColumn} className="idp-btn idp-btn-secondary">
          <Plus size={16} />
          Add Column
        </button>
      </div>

      <PagificationContainer
        data={rows}
        itemName="rows"
        initialRowsPerPage={20}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      >
        {(paginatedRows, pagination) => (
        <div className="idp-table-wrap">
          <table className="idp-table">
            <thead>
              <tr>
                <th className="idp-index-col">#</th>
                {columns.map((column) => (
                  <th key={column.id}>
                    <div className="idp-col-editor">
                      <input
                        type="text"
                        value={column.name}
                        onChange={(event) => updateColumnName(column.id, event.target.value)}
                        placeholder="Column name"
                      />
                      <select
                        value={column.type}
                        onChange={(event) => updateColumnMeta(column.id, { type: event.target.value })}
                      >
                        {TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {column.type === "dropdown" && (
                        <input
                          type="text"
                          value={(column.options || []).join(", ")}
                          onChange={(event) => {
                            updateColumnMeta(column.id, {
                              options: parseOptionsText(event.target.value)
                            });
                          }}
                          placeholder="Dropdown values (comma separated)"
                        />
                      )}
                      {column.type === "list" && (
                        <p className="idp-col-help">Use comma-separated text like: Math, Physics, Algorithms</p>
                      )}
                      <button
                        type="button"
                        className="idp-remove-column"
                        onClick={() => removeColumn(column.id)}
                        title="Remove this column"
                        aria-label="Remove this column"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="idp-actions-col">Remove Row</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => {
                const rowStatus = rowStatusMap[row.id];

                return (
                  <tr
                    key={row.id}
                    className={
                      rowStatus === "duplicate"
                        ? "idp-row-duplicate"
                        : rowStatus === "invalid"
                          ? "idp-row-invalid"
                          : rowStatus === "warning"
                            ? "idp-row-warning"
                            : ""
                    }
                  >
                    <td className="idp-index-cell">
                      {(pagination.currentPage - 1) * pagination.rowsPerPage + index + 1}
                    </td>
                    {columns.map((column) => (
                      <td key={`${row.id}-${column.id}`}>
                        {column.type === "dropdown" ? (
                          <select
                            value={row.values[column.id] ?? ""}
                            onChange={(event) => updateCell(row.id, column.id, event.target.value)}
                          >
                            <option value="">Select...</option>
                            {(column.options || []).map((optionValue) => (
                              <option key={optionValue} value={optionValue}>
                                {optionValue}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={row.values[column.id] ?? ""}
                            onChange={(event) => updateCell(row.id, column.id, event.target.value)}
                            placeholder={column.type === "list" ? "item1, item2" : ""}
                          />
                        )}
                      </td>
                    ))}
                    <td className="idp-row-action">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="idp-remove-row"
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

      <div className="idp-legend">
        <div>
          <span className="idp-chip idp-chip-dark-red" /> Duplicate row (email or ID exists)
        </div>
        <div>
          <span className="idp-chip idp-chip-red" /> Invalid row (wrong type)
        </div>
        <div>
          <span className="idp-chip idp-chip-yellow" /> Warning row (has empty values)
        </div>
      </div>

      {!canImport && (
        <div className="idp-alert idp-alert-neutral">
          <AlertTriangle size={16} />
          <span>
            Import is disabled. You need at least 1 row and 1 column, and all invalid rows must be fixed.
          </span>
        </div>
      )}

      {confirmIntent && (
        <div className="idp-confirm-bar">
          {confirmIntent === "import" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>
            {confirmIntent === "import"
              ? "Confirm import? This will import the currently edited dataset."
              : "Confirm cancel? Your current import edits will be discarded."}
          </span>
          <button type="button" className="idp-btn idp-btn-primary" onClick={confirmAction}>
            Confirm
          </button>
          <button
            type="button"
            className="idp-btn idp-btn-secondary"
            onClick={() => setConfirmIntent(null)}
          >
            Keep Editing
          </button>
        </div>
      )}

      <div className="idp-actions">
        <button type="button" className="idp-btn idp-btn-secondary" onClick={handleCancelClick}>
          Cancel Import
        </button>
        <button type="button" className="idp-btn idp-btn-primary" onClick={handleImportClick} disabled={!canImport}>
          Confirm Import
        </button>
      </div>

      {dragActive && (
        <div className="idp-drag-modal">
          <div className="idp-drag-modal-content">
            <Upload size={48} />
            <h2>Drop your file here</h2>
            <p>Release to import CSV or Excel file</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ImportDataPage;
