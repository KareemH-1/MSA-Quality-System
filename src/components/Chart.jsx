import React from "react";
import "../styles/Chart.css";

const EMPTY_FILTERS = [];

const isValidDate = (value) => {
        const parsedDate = new Date(value);
        return !Number.isNaN(parsedDate.getTime());
};

const toDate = (value) => {
        if (!value || !isValidDate(value)) {
                return null;
        }

        const parsedDate = new Date(value);
        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate;
};

const uniqueOptions = (records, field) => {
        const values = records
                .map((record) => record?.[field])
                .filter((value) => value !== undefined && value !== null && value !== "");

        return Array.from(new Set(values));
};

const normalizeOptions = (filter, records) => {
        if (typeof filter.options === "function") {
                return filter.options(records);
        }

        if (Array.isArray(filter.options)) {
                return filter.options;
        }

        return uniqueOptions(records, filter.field || filter.key).map((value) => ({
                label: String(value),
                value,
        }));
};

const getOptionValue = (option) => {
        if (option && typeof option === "object") {
                return option.value ?? option.label ?? "";
        }

        return option;
};

const getOptionLabel = (option) => {
        if (option && typeof option === "object") {
                return option.label ?? option.value ?? "";
        }

        return option;
};

const buildInitialFilters = (filters) => {
        return filters.reduce((accumulator, filter) => {
                if (filter.type === "date-range") {
                        accumulator[`${filter.key}Start`] = filter.defaultStart ?? "";
                        accumulator[`${filter.key}End`] = filter.defaultEnd ?? "";
                        return accumulator;
                }

                if (filter.multi) {
                        accumulator[filter.key] = Array.isArray(filter.defaultValue)
                                ? filter.defaultValue
                                : [];
                        return accumulator;
                }

                accumulator[filter.key] = filter.defaultValue ?? "";
                return accumulator;
        }, {});
};

const hasFilterValue = (value) => {
        if (Array.isArray(value)) {
                return value.length > 0;
        }

        return Boolean(value);
};

const Chart = ({
        ChartComponent,
        data,
        sourceData = [],
        buildChartData,
        filters = EMPTY_FILTERS,
        title,
        subtitle,
        emptyMessage = "No chart data matches the current filters.",
        chartProps = {},
        className = "",
        defaultFiltersOpen = false,
}) => {
        const [filterState, setFilterState] = React.useState(() =>
                buildInitialFilters(filters),
        );
        const [multiDraftState, setMultiDraftState] = React.useState({});
        const [filtersOpen, setFiltersOpen] = React.useState(defaultFiltersOpen);

        React.useEffect(() => {
                setFilterState(buildInitialFilters(filters));
                const initialDraftState = filters.reduce((accumulator, filter) => {
                        if (filter.multi) {
                                accumulator[filter.key] = "";
                        }
                        return accumulator;
                }, {});
                setMultiDraftState(initialDraftState);
        }, [filters]);

        React.useEffect(() => {
                setFiltersOpen(defaultFiltersOpen);
        }, [defaultFiltersOpen]);

        const filteredRecords = React.useMemo(() => {
                if (!Array.isArray(sourceData) || sourceData.length === 0) {
                        return [];
                }

                return sourceData.filter((record) => {
                        return filters.every((filter) => {
                                const currentValue = filterState[filter.key];

                                if (filter.type === "date-range") {
                                        const recordDate = toDate(record?.[filter.field || filter.key]);

                                        if (!recordDate) {
                                                return false;
                                        }

                                        const startDate = toDate(filterState[`${filter.key}Start`]);
                                        const endDate = toDate(filterState[`${filter.key}End`]);

                                        if (startDate && recordDate < startDate) {
                                                return false;
                                        }

                                        if (endDate && recordDate > endDate) {
                                                return false;
                                        }

                                        return true;
                                }

                                if (filter.multi) {
                                        const selectedValues = Array.isArray(currentValue) ? currentValue : [];

                                        if (selectedValues.length === 0) {
                                                return true;
                                        }

                                        const recordValue = record?.[filter.field || filter.key];

                                        if (typeof filter.predicate === "function") {
                                                return filter.predicate(record, selectedValues, filterState);
                                        }

                                        return selectedValues.some(
                                                (selectedValue) =>
                                                        String(recordValue) === String(selectedValue),
                                        );
                                }

                                if (!currentValue) {
                                        return true;
                                }

                                const recordValue = record?.[filter.field || filter.key];

                                if (typeof filter.predicate === "function") {
                                        return filter.predicate(record, currentValue, filterState);
                                }

                                return String(recordValue) === String(currentValue);
                        });
                });
        }, [filterState, filters, sourceData]);

        const hasFilters = filters.length > 0;
        const regularFilters = React.useMemo(
                () => filters.filter((filter) => filter.type !== "date-range"),
                [filters],
        );
        const dateRangeFilters = React.useMemo(
                () => filters.filter((filter) => filter.type === "date-range"),
                [filters],
        );
        const hasActiveFilters = Object.values(filterState).some(hasFilterValue);
        const resolvedChartData = React.useMemo(() => {
                if (Array.isArray(sourceData) && typeof buildChartData === "function") {
                        return buildChartData(filteredRecords, filterState);
                }

                return data;
        }, [buildChartData, data, filterState, filteredRecords, sourceData]);

        const activeFilterCount = Object.values(filterState).filter(hasFilterValue).length;

        const handleChange = (key, value) => {
                setFilterState((currentState) => ({
                        ...currentState,
                        [key]: value,
                }));
        };

        const addMultiValue = (key, value) => {
                if (!value) {
                        return;
                }

                setFilterState((currentState) => {
                        const currentValues = Array.isArray(currentState[key])
                                ? currentState[key]
                                : [];

                        if (currentValues.some((currentValue) => String(currentValue) === String(value))) {
                                return currentState;
                        }

                        return {
                                ...currentState,
                                [key]: [...currentValues, value],
                        };
                });
                setMultiDraftState((currentState) => ({
                        ...currentState,
                        [key]: "",
                }));
        };

        const removeMultiValue = (key, valueToRemove) => {
                setFilterState((currentState) => {
                        const currentValues = Array.isArray(currentState[key])
                                ? currentState[key]
                                : [];

                        return {
                                ...currentState,
                                [key]: currentValues.filter(
                                        (currentValue) =>
                                                String(currentValue) !== String(valueToRemove),
                                ),
                        };
                });
        };

        const clearFilters = () => {
                setFilterState(buildInitialFilters(filters));
                const clearedDraftState = filters.reduce((accumulator, filter) => {
                        if (filter.multi) {
                                accumulator[filter.key] = "";
                        }
                        return accumulator;
                }, {});
                setMultiDraftState(clearedDraftState);
        };

        if (!ChartComponent) {
                return null;
        }

        return (
                <section className={`chart-container ${className}`.trim()}>
                        {(title || subtitle || hasFilters) && (
                                <header className="chart-header">
                                        <div className="chart-heading">
                                                {title && <h2 className="chart-title">{title}</h2>}
                                                {subtitle && <p className="chart-subtitle">{subtitle}</p>}
                                        </div>

                                        {hasFilters && (
                                                <div className="chart-meta">
                                                        <span className="chart-count">
                                                                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
                                                        </span>
                                                        <button
                                                                type="button"
                                                                className="chart-toggle"
                                                                onClick={() => setFiltersOpen((isOpen) => !isOpen)}
                                                        >
                                                                {filtersOpen ? "Hide Filters" : "Show Filters"}
                                                        </button>
                                                        {hasActiveFilters && (
                                                                <button
                                                                        type="button"
                                                                        className="chart-reset"
                                                                        onClick={clearFilters}
                                                                >
                                                                        Reset filters
                                                                </button>
                                                        )}
                                                </div>
                                        )}
                                </header>
                        )}

                        {hasFilters && filtersOpen && (
                                <div className="chart-filters" aria-label="Chart filters">
                                                {regularFilters.length > 0 && (
                                                        <div className="chart-filters-main">
                                                                {regularFilters.map((filter) => {
                                                                        const normalizedOptions = normalizeOptions(filter, sourceData);

                                                                        if (filter.multi) {
                                                                                const selectedValues = Array.isArray(filterState[filter.key])
                                                                                        ? filterState[filter.key]
                                                                                        : [];
                                                                                const availableOptions = normalizedOptions.filter((option) => {
                                                                                        const optionValue = getOptionValue(option);
                                                                                        return !selectedValues.some(
                                                                                                (selectedValue) =>
                                                                                                        String(selectedValue) === String(optionValue),
                                                                                        );
                                                                                });

                                                                                return (
                                                                                        <div className="chart-field" key={filter.key}>
                                                                                                <span className="chart-field-label">{filter.label}</span>
                                                                                                <div className="chart-multi-control">
                                                                                                        <select
                                                                                                                value={multiDraftState[filter.key] ?? ""}
                                                                                                                onChange={(event) =>
                                                                                                                        setMultiDraftState((currentState) => ({
                                                                                                                                ...currentState,
                                                                                                                                [filter.key]: event.target.value,
                                                                                                                        }))
                                                                                                                }
                                                                                                        >
                                                                                                                <option value="">
                                                                                                                        {filter.placeholder ?? `Choose ${filter.label}`}
                                                                                                                </option>
                                                                                                                {availableOptions.map((option) => {
                                                                                                                        const optionValue = getOptionValue(option);

                                                                                                                        return (
                                                                                                                                <option
                                                                                                                                        key={String(optionValue)}
                                                                                                                                        value={optionValue}
                                                                                                                                >
                                                                                                                                        {getOptionLabel(option)}
                                                                                                                                </option>
                                                                                                                        );
                                                                                                                })}
                                                                                                        </select>
                                                                                                        <button
                                                                                                                type="button"
                                                                                                                className="chart-add-button"
                                                                                                                onClick={() =>
                                                                                                                        addMultiValue(
                                                                                                                                filter.key,
                                                                                                                                multiDraftState[filter.key],
                                                                                                                        )
                                                                                                                }
                                                                                                                aria-label={`Add ${filter.label} filter`}
                                                                                                        >
                                                                                                                +
                                                                                                        </button>
                                                                                                </div>
                                                                                                {selectedValues.length > 0 && (
                                                                                                        <div className="chart-selected-list">
                                                                                                                {selectedValues.map((selectedValue) => (
                                                                                                                        <button
                                                                                                                                type="button"
                                                                                                                                key={String(selectedValue)}
                                                                                                                                className="chart-selected-item"
                                                                                                                                onClick={() =>
                                                                                                                                        removeMultiValue(
                                                                                                                                                filter.key,
                                                                                                                                                selectedValue,
                                                                                                                                        )
                                                                                                                                }
                                                                                                                        >
                                                                                                                                {String(selectedValue)} <span>x</span>
                                                                                                                        </button>
                                                                                                                ))}
                                                                                                        </div>
                                                                                                )}
                                                                                        </div>
                                                                                );
                                                                        }

                                                                        return (
                                                                                <label className="chart-field" key={filter.key}>
                                                                                        <span className="chart-field-label">{filter.label}</span>
                                                                                        <select
                                                                                                value={filterState[filter.key] ?? ""}
                                                                                                onChange={(event) => handleChange(filter.key, event.target.value)}
                                                                                        >
                                                                                                <option value="">{filter.placeholder ?? `All ${filter.label}`}</option>
                                                                                                {normalizedOptions.map((option) => {
                                                                                                        const optionValue = getOptionValue(option);

                                                                                                        return (
                                                                                                                <option key={String(optionValue)} value={optionValue}>
                                                                                                                        {getOptionLabel(option)}
                                                                                                                </option>
                                                                                                        );
                                                                                                })}
                                                                                        </select>
                                                                                </label>
                                                                        );
                                                                })}
                                                        </div>
                                                )}

                                                {dateRangeFilters.length > 0 && (
                                                        <div className="chart-filters-date">
                                                                {dateRangeFilters.map((filter) => (
                                                                        <div className="chart-filter-group" key={filter.key}>
                                                                                <span className="chart-filter-label">{filter.label}</span>
                                                                                <div className="chart-date-range">
                                                                                        <label className="chart-field">
                                                                                                <span className="chart-field-label">From</span>
                                                                                                <input
                                                                                                        type="date"
                                                                                                        value={filterState[`${filter.key}Start`] ?? ""}
                                                                                                        onChange={(event) =>
                                                                                                                handleChange(`${filter.key}Start`, event.target.value)
                                                                                                        }
                                                                                                />
                                                                                        </label>
                                                                                        <label className="chart-field">
                                                                                                <span className="chart-field-label">To</span>
                                                                                                <input
                                                                                                        type="date"
                                                                                                        value={filterState[`${filter.key}End`] ?? ""}
                                                                                                        onChange={(event) =>
                                                                                                                handleChange(`${filter.key}End`, event.target.value)
                                                                                                        }
                                                                                                />
                                                                                        </label>
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                )}
                                </div>
                        )}

                        <div className="chart-body">
                                {resolvedChartData ? (
                                        <ChartComponent {...chartProps} data={resolvedChartData} />
                                ) : (
                                        <div className="chart-empty">{emptyMessage}</div>
                                )}
                        </div>
                </section>
        );
};

export default Chart;
