import React, { useState, useCallback } from 'react';
import backendApi from '../services/backendApi'; // Import backendApi

interface AskMeAnythingProps {
  influencerName: string;
  influencerBio: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
    <span className="text-sm text-[var(--text-secondary)]">Thinking...</span>
  </div>
);

const AskMeAnything: React.FC<AskMeAnythingProps> = ({ influencerName, influencerBio }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnswer('');

    try {
      const stream = await backendApi.ai.askQuestionStream(question, influencerName, influencerBio); // Use backendApi.ai
      
      // The first chunk is available, so we can stop showing the spinner.
      setIsLoading(false);

      for await (const chunk of stream) {
        setAnswer((prev) => prev + chunk.text);
      }

    } catch (err) {
      setError('Sorry, I had trouble thinking of an answer. Please try again later.');
      console.error(err);
      setIsLoading(false);
    } finally {
      // The streaming is complete, ensure loading is off.
      setIsLoading(false);
      setQuestion('');
    }
  }, [question, isLoading, influencerName, influencerBio]);

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Ask Me Anything!</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">Get an instant AI-powered response from my perspective.</p>
      
      <form onSubmit={handleSubmit} className="w-full flex space-x-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What's your favorite city?"
          className="flex-grow p-3 bg-[var(--input-background-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="bg-[var(--accent-color)] text-white font-semibold px-4 py-2 rounded-lg transition
                     hover:bg-[var(--accent-color-hover)]
                     disabled:bg-[var(--disabled-background-color)] disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Ask'}
        </button>
      </form>

      <div className="mt-4 w-full min-h-[6rem] p-4 bg-[var(--response-background-color)] rounded-lg">
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {answer && <p className="text-[var(--text-primary)] whitespace-pre-wrap">{answer}</p>}
      </div>
    </div>
  );
};

export default AskMeAnything;
