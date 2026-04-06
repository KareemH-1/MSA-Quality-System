import React from 'react'

const Loader = () => {
    const spinKeyframes = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    return (
        <>
            <style>{spinKeyframes}</style>
            <div className="loader-container" style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 9999
            }}>
                <div className="loader" style={{
                    border: "8px solid #edebeb",
                    borderTop: "8px solid #002147",
                    borderRadius: "50%",
                    width: "80px",
                    height: "80px",
                    animation: "spin 2s linear infinite"
                }}></div>
            </div>
        </>
    )
}

export default Loader
