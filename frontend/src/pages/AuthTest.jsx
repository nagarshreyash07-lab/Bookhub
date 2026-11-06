
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AuthTest() {
  const { currentUser, loading } = useAuth();
  const [result, setResult] = useState("");
  const [testing, setTesting] = useState(false);

  async function testAuthentication() {
    if (!currentUser) {
      setResult("Please log in first.");
      return;
    }

    try {
      setTesting(true);

      const token = await currentUser.getIdToken();

      const response = await fetch(
         `${import.meta.env.VITE_API_URL}/api/auth/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult("Error: " + error.message);
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "40px" }}>
      <h1>Firebase Authentication Test</h1>

      <p>
        Logged in as: {currentUser?.email || "Not logged in"}
      </p>

      <button
        onClick={testAuthentication}
        disabled={testing}
      >
        {testing ? "Verifying..." : "Test Authentication"}
      </button>

      <pre style={{ marginTop: "20px" }}>
        {result}
      </pre>
    </div>
  );
}

export default AuthTest;
