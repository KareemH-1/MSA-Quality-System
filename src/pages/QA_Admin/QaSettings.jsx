import { useState } from "react";
import qaOptionsDefaults from "../../services/QAHelpers/QAOptions.json";
import "../../styles/QaSettings.css";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setValueByPath(source, path, nextValue) {
  const cloned = deepClone(source);
  let cursor = cloned;

  for (let i = 0; i < path.length - 1; i += 1) {
    cursor = cursor[path[i]];
  }

  cursor[path[path.length - 1]] = nextValue;
  return cloned;
}

function renderFields({ data, path = [], onChange }) {
  return Object.entries(data).map(([key, value]) => {
    const fieldPath = [...path, key];
    const fieldKey = fieldPath.join(".");

    if (isObject(value)) {
      return (
        <section className="qa-settings-section" key={fieldKey}>
          <h2>{key}</h2>
          <div className="qa-settings-section-body">
            {renderFields({ data: value, path: fieldPath, onChange })}
          </div>
        </section>
      );
    }

    if (typeof value === "boolean") {
      return (
        <div className="qa-settings-toggle" key={fieldKey}>
          <span>{key}</span>
          <input
            type="checkbox"
            checked={value}
            onChange={(event) => onChange(fieldPath, event.target.checked)}
          />
        </div>
      );
    }

    return (
      <div className="qa-settings-field" key={fieldKey}>
        <label htmlFor={fieldKey}>{key}</label>
        <input
          id={fieldKey}
          type="number"
          step="any"
          value={value}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange(fieldPath, Number.isNaN(parsed) ? 0 : parsed);
          }}
        />
      </div>
    );
  });
}

const QaSettings = () => {
  const [savedOptions, setSavedOptions] = useState(() => deepClone(qaOptionsDefaults));
  const [optionsDraft, setOptionsDraft] = useState(() => deepClone(qaOptionsDefaults));
  const [status, setStatus] = useState({ type: "", message: "" });

  const updateField = (path, value) => {
    setOptionsDraft((current) => setValueByPath(current, path, value));
    setStatus({ type: "", message: "" });
  };

  const handleSave = () => {
    const confirmed = window.confirm("Save the current settings?");
    if (!confirmed) {
      setStatus({ type: "", message: "Save cancelled." });
      return;
    }

    setSavedOptions(deepClone(optionsDraft));
    setStatus({ type: "success", message: "Settings saved successfully." });
  };

  const handleResetSaved = () => {
    const confirmed = window.confirm("Discard current edits and restore saved values?");
    if (!confirmed) {
      setStatus({ type: "", message: "Reset cancelled." });
      return;
    }

    setOptionsDraft(deepClone(savedOptions));
    setStatus({ type: "success", message: "Saved values restored." });
  };

  const handleLoadDefaults = () => {
    const confirmed = window.confirm("Reset everything to default values?");
    if (!confirmed) {
      setStatus({ type: "", message: "Load defaults cancelled." });
      return;
    }

    const defaults = deepClone(qaOptionsDefaults);
    setOptionsDraft(defaults);
    setStatus({ type: "success", message: "All settings were reset to defaults." });
  };

  return (
    <div className="qa-settings-page">
      <header className="qa-settings-header">
        <div>
          <h1>QA Options Settings</h1>
          <p className="qa-settings-subtitle">
            This page is currently standalone for UI work. Changes here are not connected to the
            dashboard yet and will be integrated later with backend support.
          </p>
        </div>
        <div className="qa-settings-actions">
          <button type="button" className="qa-settings-btn primary" onClick={handleSave}>
            Save Changes
          </button>
          <button type="button" className="qa-settings-btn" onClick={handleLoadDefaults}>
            Load Defaults
          </button>
          <button type="button" className="qa-settings-btn" onClick={handleResetSaved}>
            Reset Saved
          </button>
        </div>
      </header>

      <p className={`qa-settings-status ${status.type}`}>{status.message || " "}</p>

      <div className="qa-settings-grid">
        {renderFields({ data: optionsDraft, onChange: updateField })}
      </div>
    </div>
  );
};

export default QaSettings;
