import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, SparklesIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agent, setAgent] = useState("company_tax");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const textareaRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const agents = {
    company_tax: { name: "Company Tax", icon: "🏢", description: "Corporation tax, rates, and compliance" },
    vat: { name: "VAT", icon: "💰", description: "Value Added Tax guidance" },
    payroll: { name: "Payroll", icon: "👥", description: "PAYE, NI, and payroll taxes" },
    general: { name: "General Tax", icon: "📋", description: "General tax enquiries" }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [question]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");

    const newQuestion = { type: 'question', content: question, agent: agents[agent].name, timestamp: new Date() };
    setConversationHistory(prev => [...prev, newQuestion]);

    try {
      const response = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, agent }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      const newAnswer = {
        type: 'answer',
        content: data.answer,
        sources: data.sources || [],
        confidence: data.confidence,
        timestamp: new Date()
      };

      setConversationHistory(prev => [...prev, newAnswer]);
      setAnswer(data.answer);
      setSources(data.sources || []);

    } catch (err) {
      const errorMsg = "Unable to connect to the tax assistant. Please try again.";
      setError(errorMsg);
      setConversationHistory(prev => [...prev, { type: 'error', content: errorMsg, timestamp: new Date() }]);
    }

    setLoading(false);
    setQuestion("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const formatAnswer = (content) => {
    // Convert markdown-style formatting to HTML
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h4 class="text-md font-medium mt-3 mb-1">$1</h4>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">UK Tax Assistant</h1>
              <p className="text-slate-600 text-sm">Professional tax guidance powered by AI</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Agent Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Select Tax Specialist
          </label>
          <div className="relative">
            <button
              onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-left shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{agents[agent].icon}</span>
                  <div>
                    <div className="font-medium text-slate-900">{agents[agent].name}</div>
                    <div className="text-sm text-slate-500">{agents[agent].description}</div>
                  </div>
                </div>
                <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isAgentDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg">
                {Object.entries(agents).map(([key, agentInfo]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setAgent(key);
                      setIsAgentDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      agent === key ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{agentInfo.icon}</span>
                      <div>
                        <div className="font-medium text-slate-900">{agentInfo.name}</div>
                        <div className="text-sm text-slate-500">{agentInfo.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Question Input */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Ask your tax question
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., What are the current corporation tax rates for 2024?"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[100px] transition-colors"
                disabled={loading}
              />
              <div className="flex justify-between items-center mt-4">
                <div className="text-xs text-slate-500">
                  Press Enter to send, Shift+Enter for new line
                </div>
                <button
                  onClick={askQuestion}
                  disabled={loading || !question.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" />
                      <span>Ask Question</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Conversation</span>
            </h2>

            {conversationHistory.map((item, index) => (
              <div key={index} className={`rounded-xl p-6 ${
                item.type === 'question' ? 'bg-blue-50 border border-blue-200' :
                item.type === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-white border border-slate-200 shadow-sm'
              }`}>
                {item.type === 'question' && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-blue-700">You asked {item.agent}:</span>
                      <span className="text-xs text-slate-500">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-900">{item.content}</p>
                  </div>
                )}

                {item.type === 'answer' && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <SparklesIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Tax Assistant:</span>
                      <span className="text-xs text-slate-500">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                      {item.confidence && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <div 
                      className="prose prose-slate max-w-none text-slate-900"
                      dangerouslySetInnerHTML={{ __html: `<p>${formatAnswer(item.content)}</p>` }}
                    />
                    {item.sources && item.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Sources:</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.sources.map((source, idx) => (
                            <a
                              key={idx}
                              href={`https://www.gov.uk/hmrc-internal-manuals/${source.replace(/ /g, '-').toLowerCase()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              <DocumentTextIcon className="h-3 w-3 mr-1" />
                              {source}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {item.type === 'error' && (
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{item.content}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Welcome Message */}
        {conversationHistory.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Welcome to UK Tax Assistant
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Get professional tax guidance powered by AI. Select a specialist above and ask your question to get started.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-1">Example Questions</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• What are the corporation tax rates?</li>
                  <li>• How do I claim R&D tax credits?</li>
                  <li>• When is my VAT return due?</li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-1">Features</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• HMRC-cited responses</li>
                  <li>• Multiple tax specialists</li>
                  <li>• Real-time guidance</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              <p>© 2024 UK Tax Assistant. Professional tax guidance powered by AI.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
