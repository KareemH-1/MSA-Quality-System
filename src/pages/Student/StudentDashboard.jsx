import StudentHome from "../../components/Student/StudentHome";
import StudentAppeals from "../../components/Student/StudentAppeals";
import StudentSurveys from "../../components/Student/StudentSurveys";

export default function StudentDashboard({ currentNavItem }) {
  if (currentNavItem === "Appeals") return <StudentAppeals />;
  if (currentNavItem === "Surveys") return <StudentSurveys />;
  return <StudentHome />;
}