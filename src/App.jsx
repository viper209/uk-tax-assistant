import { useState } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const askQuestion = async () => {
    setLoading(true);
    setAnswer("");
    setSources([]);
    try {
      const response = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setAnswer("Sorry, there was an error contacting the tax assistant.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">UK Tax Assistant</h1>
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
        {loading ? "Thinking..." : "Ask"}
      </button>
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
