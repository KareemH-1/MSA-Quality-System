import { useState } from "react";
import api from "../../api/axios";

export default function StudentAppeals() {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const loadSessions = async () => {
    setLoading(true);
    setLastAction("sessions");
    try {
      const res = await api.get("/View/StudentAppealView.php?action=sessions");
      setOutput(res.data);
    } catch (e) {
      setOutput({ error: true, message: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    setLoading(true);
    setLastAction("enrolled-courses");
    try {
      const res = await api.get(
        "/View/StudentAppealView.php?action=enrolled-courses",
      );
      setOutput(res.data);
    } catch (e) {
      setOutput({ error: true, message: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const loadMyAppeals = async () => {
    setLoading(true);
    setLastAction("my-appeals");
    try {
      const res = await api.get(
        "/View/StudentAppealView.php?action=my-appeals",
      );
      setOutput(res.data);
    } catch (e) {
      setOutput({ error: true, message: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Appeals</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={loadSessions} disabled={loading}>
          {loading && lastAction === "sessions"
            ? "Loading…"
            : "Load appeal sessions"}
        </button>
        <button type="button" onClick={loadEnrolledCourses} disabled={loading}>
          {loading && lastAction === "enrolled-courses"
            ? "Loading…"
            : "Load my courses"}
        </button>
        <button type="button" onClick={loadMyAppeals} disabled={loading}>
          {loading && lastAction === "my-appeals"
            ? "Loading…"
            : "Load my appeals"}
        </button>
      </div>
      <pre>{JSON.stringify(output, null, 2)}</pre>
    </div>
  );
}
