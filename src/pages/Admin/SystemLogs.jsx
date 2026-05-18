import React from 'react'
import "../../styles/SystemLogs.css"
import { AppWindow, Badge, Bug, Check, ChevronRight, GlobeLock, FileUp, User, Clock, ExternalLink } from 'lucide-react';
import api from '../../api/axios';

const SystemLogs = () => {
  const [systemData, setSystemData] = React.useState({ systemOnline: false });
  const [currentTab, setCurrentTab] = React.useState("All");
  const [logs, setLogs] = React.useState([]);
  const [fileImports, setFileImports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const setAllLogs = (dataSource = systemData) => {
    const allLogs = [];
    if (dataSource.ErrorLogs && Array.isArray(dataSource.ErrorLogs)) {
      dataSource.ErrorLogs.forEach(log => {
        allLogs.push({ ...log, type: "Error" });
      });
    }
    if (dataSource.SecurityLogs && Array.isArray(dataSource.SecurityLogs)) {
      dataSource.SecurityLogs.forEach(log => {
        allLogs.push({ ...log, type: "Security" });
      });
    }
    if (dataSource.AppLogs && Array.isArray(dataSource.AppLogs)) {
      dataSource.AppLogs.forEach(log => {
        allLogs.push({ ...log, type: "Info" });
      });
    }
    allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (allLogs.length > 0) {
      setLogs(allLogs);
    } else {
      setLogs([]);
    }
  };

  const setErrorLogs = (dataSource = systemData) => {
    if (dataSource.ErrorLogs && Array.isArray(dataSource.ErrorLogs)) {
      const sortedErrorLogs = [...dataSource.ErrorLogs]
        .map(log => ({ ...log, type: "Error" }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setLogs(sortedErrorLogs);
    } else {
      setLogs([]);
    }
  };

  const setSecurityLogs = (dataSource = systemData) => {
    if (dataSource.SecurityLogs && Array.isArray(dataSource.SecurityLogs)) {
      const sortedSecurityLogs = [...dataSource.SecurityLogs]
        .map(log => ({ ...log, type: "Security" }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setLogs(sortedSecurityLogs);
    } else {
      setLogs([]);
    }
  };

  React.useEffect(() => {
    setLoading(true);
    api.get('/View/LogsView.php')
      .then(response => {
        console.log('Logs response:', response.data);
        if (response.data && response.data.status === 'success') {
          const data = {
            ErrorLogs: response.data.ErrorLogs || [],
            SecurityLogs: response.data.SecurityLogs || [],
            AppLogs: response.data.AppLogs || [],
            serverConn: response.data.serverConn || 'ERROR',
            databaseConn: response.data.databaseConn || 'ERROR',
            fileSystem: response.data.fileSystem || 'ERROR',
            systemOnline: true
          };
          setSystemData(data);
          setAllLogs(data);
          setError(null);
        } else {
          console.error('Response format check failed:', response.data);
          throw new Error(response.data?.message || 'Invalid response format');
        }
      })
      .catch(error => {
        console.error('Error fetching logs data:', error);
        if (error.response?.status === 401) {
          setError('Unauthorized: Please log in again');
        } else if (error.response?.status === 403) {
          setError('Forbidden: You do not have permission to view logs');
        } else {
          setError(error.message || 'Failed to load system logs');
        }
        setSystemData({ systemOnline: false });
        setLogs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logsContentRef = React.useRef(null);

  React.useEffect(() => {
    if (logsContentRef.current) {
      logsContentRef.current.scrollTop = logsContentRef.current.scrollHeight;
    }
  }, [logs]);

  function returnStatusString(server, database, filesystem) {
    if (server === "OK" && database === "OK" && filesystem === "OK") {
      return "Excellent";
    } else {
      return "System issues detected";
    }
  }

  return (
    <div style={{ padding: "10px 40px 40px 40px", marginTop: "20px" }}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading system logs...</p>
        </div>
      )}
      {error && !loading && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #f88', 
          color: '#a00', 
          padding: '12px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      {!loading && (
      <>
      <div className="admin-header">
        <p>System Logs & Monitoring</p>
        <h1>System Monitoring</h1>
        <div className="heading">
          <p className="description">
            View and manage system logs, monitor performance, and track user activity.
          </p>
          <div className="systemOnline">
            <div className={`indicator ${systemData.systemOnline ? "online" : "offline"}`}> </div>
            <span style={{ marginRight: "4px" }}>System </span>
            {systemData.systemOnline ? (
              <span className="online">Online</span>
            ) : (
              <span className="offline">Offline</span>
            )}
          </div>
        </div>
      </div>

      <div className="logs-section">
        <div className="logsContainer">
          <div className="logsHeader">
            <div
              className={`errors ${currentTab === "Errors" ? "active" : ""}`}
              onClick={() => {
                setCurrentTab("Errors");
                setErrorLogs();
              }}
              title="Open Error Logs"
            >
              <Bug size={12} />
            </div>

            <div
              className={`Security ${currentTab === "Security" ? "active" : ""}`}
              onClick={() => {
                setCurrentTab("Security");
                setSecurityLogs();
              }}
              title="Open Security Logs"
            >
              <GlobeLock size={12} />
            </div>
            <div
              className={`App ${currentTab === "All" ? "active" : ""}`}
              onClick={() => {
                setCurrentTab("All");
                setAllLogs();
              }}
              title="Open Application Logs"
            >
              <AppWindow size={12} />
            </div>
          </div>

          <div className="logsContent" ref={logsContentRef}>
            {logs.length === 0 ? (
              <p className="noLogs">No logs available.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="logEntry">
                  <p className="time">[ {new Date(log.timestamp).toLocaleString()} ]</p>
                  <span className={`logType ${log.type.toLowerCase()}`}>{log.type}</span>
                  <p>{log.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="logsFooter">
            <ChevronRight size={18} />
            <p>Total Logs: {logs.length}</p>
          </div>
        </div>

        <div className="SystemHealth">
          <div className="healthHeader">
            <div className="title">
              <h2>System Status</h2>
              <p>{returnStatusString(systemData.serverConn, systemData.databaseConn, systemData.fileSystem)}</p>
            </div>
            <div className="iconCont">
              <Badge className="statusIcon" size={28} />
              <Check className="checkIcon" size={16} />
            </div>
          </div>

          <div className="serverStatus">
            <p>Server: </p>
            <span className={`statusIndicator ${systemData.serverConn === "OK" ? "OK" : "error"}`}>
              {systemData.serverConn === "OK" ? "Operational" : "Down"}
            </span>
          </div>

          <div className="databaseStatus">
            <p>Database:</p>
            <span className={`statusIndicator ${systemData.databaseConn === "OK" ? "OK" : "error"}`}>
              {systemData.databaseConn === "OK" ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div className="fileSystemStatus">
            <p>File System:</p>
            <span className={`statusIndicator ${systemData.fileSystem === "OK" ? "OK" : "error"}`}>
              {systemData.fileSystem === "OK" ? "Healthy" : "Error"}
            </span>
          </div>
        </div>
      </div>

      {/* ========== Recent File Imports Section ========== */}
      <div className="fileImportsSection">
        <div className="fileImportsHeader">
          <FileUp size={18} />
          <h2>Recent File Imports</h2>
          <span className="importsCount">{fileImports.length} files</span>
        </div>

        <div className="fileImportsTable">
          <div className="fileImportsTableHead">
            <div className="col-file">File Name</div>
            <div className="col-user"><User size={12} /> Imported By</div>
            <div className="col-date"><Clock size={12} /> Imported At</div>
            <div className="col-size">Size</div>
          </div>

          {fileImports.length === 0 ? (
            <p className="noImports">No file imports available.</p>
          ) : (
            fileImports.map((file, index) => (
              <div key={index} className="fileImportRow">
                <div className="col-file">
                  <a
                    href={file.destination}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fileLink"
                    title={`Open ${file.fileName}`}
                  >
                    {file.fileName}
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div className="col-user">{file.importedBy}</div>
                <div className="col-date">{new Date(file.timestamp).toLocaleString()}</div>
                <div className="col-size">{file.size || "—"}</div>
              </div>
            ))
          )}
        </div>
      </div>
      </>
      )}
    </div>
  )
}

export default SystemLogs