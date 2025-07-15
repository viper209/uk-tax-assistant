import { useState } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agent, setAgent] = useState("company_tax");
  const apiUrl = import.meta.env.VITE_API_URL;

  const askQuestion = async () => {
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    try {
      const response = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, agent }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setError("Sorry, there was an error contacting the tax assistant.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">UK Tax Assistant</h1>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Agent:</label>
        <select
          className="border p-2 rounded w-full"
          value={agent}
          onChange={e => setAgent(e.target.value)}
        >
          <option value="company_tax">Company Tax</option>
          <option value="vat">VAT</option>
        </select>
      </div>
      <input
        className="border p-2 w-full mb-2"
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask a UK company tax question..."
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={askQuestion}
        disabled={loading}
      >
        Ask
      </button>
      {loading && (
        <div className="flex items-center mt-4">
          <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Thinking...</span>
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-600 font-semibold">
          {error}
        </div>
      )}
      {answer && (
        <div className="mt-6">
          <h2 className="font-semibold">Answer:</h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: answer }} />
          {sources.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              <strong>Sources:</strong> {sources.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
