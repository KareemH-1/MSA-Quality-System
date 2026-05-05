import { useState } from "react";
import api from "../../api/axios";

export default function StudentHome() {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSession = async () => {
    setLoading(true);
    try {
      const res = await api.get("/View/SessionView.php");
      setOutput(res.data);
    } catch (e) {
      setOutput({ error: true, message: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1>Student</h1>
      <p>Use this page to verify your login/session.</p>

      <button type="button" onClick={loadSession} disabled={loading}>
        {loading ? "Loading…" : "Load my session"}
      </button>

      <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
        {output ? JSON.stringify(output, null, 2) : ""}
      </pre>
    </section>
  );
}
