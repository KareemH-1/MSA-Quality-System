import Overview from "../../components/QaDashboard_components/Overview";
import Appeals from "../../components/QaDashboard_components/Appeals";
import Surveys from "../../components/QaDashboard_components/Surveys";
import Header from "../../components/QaDashboard_components/Header";
const QaDashboard = ({ currentNavItem }) => {
    return (
        <div style={{padding: "20px 40px 20px 40px"}}>
            <Header/>
            {currentNavItem === "Overview" && <Overview />}
            {currentNavItem === "Appeals" && <Appeals />}
            {currentNavItem === "Surveys" && <Surveys />}
        </div>
    );
        
};

export default QaDashboard;