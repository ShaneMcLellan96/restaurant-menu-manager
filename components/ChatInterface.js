'use client';

import { useState, useRef, useEffect } from 'react';

function Message({ role, text }) {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-lg">
          🤖
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          role === 'user'
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        {text}
      </div>
      {role === 'user' && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg">
          👤
        </div>
      )}
    </div>
  );
}

export default function ChatInterface({ restaurantId }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setStreaming(true);

    // Add an empty assistant message to stream into
    setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);

    try {
      const res = await fetch('/api/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, question }),
      });

      if (!res.ok) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') continue;

          try {
            const { text, error } = JSON.parse(raw);
            if (error) throw new Error(error);
            if (text) {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  ...copy[copy.length - 1],
                  text: copy[copy.length - 1].text + text,
                };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          text: '⚠️ Sorry, something went wrong. Please try again.',
        };
        return copy;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="font-medium">Ask me anything about the menu</p>
            <p className="text-sm mt-1">e.g. "What vegan options do you have?" or "List items under $15"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} text={msg.text} />
        ))}
        {streaming && messages[messages.length - 1]?.text === '' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">🤖</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                {[0,1,2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white p-4 flex gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the menu…"
          disabled={streaming}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
