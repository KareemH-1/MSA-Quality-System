import React from 'react'
import "../../styles/SystemLogs.css"
import { AppWindow, Badge, Bug, Check, ChevronRight, GlobeLock} from 'lucide-react';
const SystemLogs = () => {
  const [systemData, setSystemData] = React.useState({ systemOnline: false });
  const [currentTab, setCurrentTab] = React.useState("All");
  const [logs, setLogs] = React.useState([]);

  const setAllLogs = (dataSource = systemData) => {
    const allLogs = [];
        if (dataSource.ErrorLogs) {
            dataSource.ErrorLogs.forEach(log => log.type = "Error");
            allLogs.push(...dataSource.ErrorLogs);
        }
        if (dataSource.SecurityLogs) {
            dataSource.SecurityLogs.forEach(log => log.type = "Security");
            allLogs.push(...dataSource.SecurityLogs);
        }
        if (dataSource.AppLogs) {
            dataSource.AppLogs.forEach(log => log.type = "Info");
            allLogs.push(...dataSource.AppLogs);
        }
        //sort by date from oldest to newest
        allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if(allLogs.length > 0) {
            setLogs(allLogs);
        } else {
            setLogs([]);
        }
  };

  const setErrorLogs = (dataSource = systemData) => {
    if (dataSource.ErrorLogs) {
      const sortedErrorLogs = [...dataSource.ErrorLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      sortedErrorLogs.forEach(log => log.type = "Error");  
      setLogs(sortedErrorLogs);  
    } else {
      setLogs([]);
    }
  };

  const setSecurityLogs = (dataSource = systemData) => {
    if (dataSource.SecurityLogs) {
    dataSource.SecurityLogs.forEach(log => log.type = "Security");
      const sortedSecurityLogs = [...dataSource.SecurityLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setLogs(sortedSecurityLogs);
    } else {
      setLogs([]);
    }
  };


  React.useEffect(() => {
    fetch('/systemHealth.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch system health data');
        }
        return response.json();
      })
      .then(data => {
        data.systemOnline = true; // Assuming the system is online if data is fetched successfully
        setSystemData(data);
        setAllLogs(data);
      })
      .catch( error => {
        console.error('Error fetching system health data:', error);
        setSystemData({ systemOnline: false });
      });

  }, []);

const logsContentRef = React.useRef(null);

React.useEffect(() => {
    if (logsContentRef.current) {
        logsContentRef.current.scrollTop = logsContentRef.current.scrollHeight;
    }
}, [logs]);

function returnStatusString(server , database , filesystem){
    if(server === "OK" && database === "OK" && filesystem === "OK"){
        return "Excellent";
    } else {
        return "System issues detected";
    }
}

return (
    <div style={{ padding: "10px 40px 40px 40px", marginTop: "20px" }}>
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
                        <Badge className="statusIcon" size={28}/>
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
    </div>
)
}

export default SystemLogs
