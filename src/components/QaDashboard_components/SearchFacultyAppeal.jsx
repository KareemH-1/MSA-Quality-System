import React from "react";

const SearchFacultyAppeal = ({ faculty, onBack, courseCatalog = [], appealsData = {} }) => {
  const list = (courseCatalog || []).filter((c) => (faculty ? c.faculty === faculty : true));
  const total = list.reduce((s, c) => s + (Number(c.totalAppeals) || 0), 0);
  const open = list.reduce((s, c) => s + (Number(c.openAppeals) || 0), 0);

  return (
    <div className="search-appeal-page">
      <div className="search-appeal-header">
        <button type="button" onClick={onBack} className="btn-back">← Back</button>
        <h2>Faculty appeal results</h2>
      </div>
      <section className="search-appeal-body">
        <h3>{faculty ? `${faculty}` : "All faculties"}</h3>
        <p>Total appeals: <strong>{total.toLocaleString()}</strong></p>
        <p>Open appeals: <strong>{open.toLocaleString()}</strong></p>
        <div className="search-appeal-course-list">
          <h4>Top courses</h4>
          {list.length === 0 ? (
            <p className="muted">No courses found for this faculty.</p>
          ) : (
            <ul>
              {list.slice(0, 12).map((c) => (
                <li key={c.id}>{c.code} · {c.name} — {Number(c.totalAppeals || 0).toLocaleString()} appeals</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchFacultyAppeal;
