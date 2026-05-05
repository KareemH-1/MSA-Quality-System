import { useState } from "react";

export default function StudentAppeals() {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/appealsMockData.json");
      const data = await res.json();
      setOutput(data);
    } catch (e) {
      setOutput({ error: true, message: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Appeals</h1>
      <button type="button" onClick={loadSessions} disabled={loading}>
        {loading ? "Loading…" : "Load appeals (mock)"}
      </button>
      <pre>{JSON.stringify(output, null, 2)}</pre>
    </div>
  );
}
