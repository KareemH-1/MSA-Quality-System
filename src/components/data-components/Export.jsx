import React from 'react'
import { Download, ChevronDown} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import './Export.css'

const Export = ({data , title}) => {
  const [currentDataType, setCurrentDataType] = React.useState('CSV');
  const [isFormatMenuOpen, setIsFormatMenuOpen] = React.useState(false);
  const formatMenuRef = React.useRef(null);
  const formatOptions = ['CSV', 'Excel', 'PDF'];

  const fileName = title ? title : 'exported_data';

  const normalizedRows = React.useMemo(() => {
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === 'object') {
      if (Array.isArray(data.users)) {
        return data.users;
      }

      const firstArrayValue = Object.values(data).find((value) => Array.isArray(value));
      if (Array.isArray(firstArrayValue)) {
        return firstArrayValue;
      }

      return [data];
    }

    return [];
  }, [data]);

  const normalizedColumns = React.useMemo(() => {
    return normalizedRows.reduce((columns, row) => {
      if (!row || typeof row !== 'object') {
        return columns;
      }

      Object.keys(row).forEach((key) => {
        if (!columns.includes(key)) {
          columns.push(key);
        }
      });

      return columns;
    }, []);
  }, [normalizedRows]);

  const rowsForExport = React.useMemo(() => {
    const normalizeExportValue = (value) => {
      if (value === null || value === undefined) {
        return '';
      }

      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (item === null || item === undefined) {
              return '';
            }

            return typeof item === 'object' ? JSON.stringify(item) : String(item);
          })
          .filter((item) => item !== '')
          .join(', ');
      }

      if (typeof value === 'object') {
        return JSON.stringify(value, (_, innerValue) => {
          if (Array.isArray(innerValue)) {
            return innerValue.join(', ');
          }

          return innerValue;
        });
      }

      return String(value);
    };

    return normalizedRows.map((row) => {
      const normalizedRow = {};

      normalizedColumns.forEach((column) => {
        const value = row?.[column];
        normalizedRow[column] = normalizeExportValue(value);
      });

      return normalizedRow;
    });
  }, [normalizedColumns, normalizedRows]);

  const downloadBlob = (blob, extension) => {
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const escapeCsvValue = (value) => {
    const escaped = String(value).replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const exportCsv = () => {
    const header = normalizedColumns.join(',');
    const rows = rowsForExport.map((row) => {
      return normalizedColumns.map((column) => escapeCsvValue(row[column])).join(',');
    });

    const csvString = [header, ...rows].join('\n');
    const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(csvBlob, 'csv');
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rowsForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [normalizedColumns],
      body: rowsForExport.map((row) => normalizedColumns.map((column) => row[column])),
      styles: { fontSize: 9 }
    });
    doc.save(`${fileName}.pdf`);
  };

  const handleExport = () => {
    if (!rowsForExport.length || !normalizedColumns.length) {
      console.warn('No data available to export.');
      return;
    }

    if (currentDataType === 'CSV') {
      exportCsv();
      return;
    }

    if (currentDataType === 'Excel') {
      exportExcel();
      return;
    }

    if (currentDataType === 'PDF') {
      exportPdf();
    }
  };

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!formatMenuRef.current || formatMenuRef.current.contains(event.target)) {
        return;
      }

      setIsFormatMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleFormatSelect = (format) => {
    setCurrentDataType(format);
    setIsFormatMenuOpen(false);
  };

  return (
    <div className="export">
        <button className="export-btn-area" onClick={handleExport}>
            <Download size={20} />
            <span>Export {currentDataType}</span>
        </button>

        <div className="separator"></div>
        <div className="format-select-wrap" ref={formatMenuRef}>
          <button
            className="format-menu-toggle"
            type="button"
            aria-label="Choose export format"
            aria-haspopup="menu"
            aria-expanded={isFormatMenuOpen}
            onClick={() => setIsFormatMenuOpen((open) => !open)}
          >
            <ChevronDown size={24} />
          </button>

          {isFormatMenuOpen && (
            <div className="format-menu" role="menu">
              {formatOptions.map((format) => (
                <button
                  key={format}
                  type="button"
                  role="menuitemradio"
                  aria-checked={currentDataType === format}
                  className={`format-menu-item ${currentDataType === format ? 'active' : ''}`}
                  onClick={() => handleFormatSelect(format)}
                >
                  {format}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
  )
}

export default Export
