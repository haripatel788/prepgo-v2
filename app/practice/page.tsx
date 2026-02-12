'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type SubjectType = 'reading-writing' | 'math';

type PracticeQuestion = {
  id: number;
  questionText: string;
  subject: string;
  options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: string;
  explanation: string | null;
  hint: string | null;
};

const SESSION_LENGTH = 10;

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authLoading, setAuthLoading] = useState(true);
  const [subject, setSubject] = useState<SubjectType>('reading-writing');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
          return;
        }

        const subjectParam = searchParams.get('subject');
        if (subjectParam === 'math' || subjectParam === 'reading-writing') {
          setSubject(subjectParam);
        }

        setAuthLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router, searchParams]);

  const activeQuestion = questions[activeIndex];
  const isSessionComplete = sessionStarted && activeIndex >= questions.length;

  const progressLabel = useMemo(() => {
    if (!sessionStarted || questions.length === 0 || isSessionComplete) {
      return '0 / 0';
    }

    return `${activeIndex + 1} / ${questions.length}`;
  }, [activeIndex, isSessionComplete, questions.length, sessionStarted]);

  const fetchQuestions = async () => {
    setError('');
    setLoadingQuestions(true);
    setQuestions([]);
    setActiveIndex(0);
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
    setShowHint(false);
    setScore(0);
    setSavedScore(null);

    try {
      const response = await fetch(`/api/practice/questions?subject=${subject}&limit=${SESSION_LENGTH}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to load questions.');
        return;
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        setError(`No ${subject === 'math' ? 'Math' : 'Reading/Writing'} questions found in DB yet.`);
        return;
      }

      setQuestions(data.questions);
      setSessionStarted(true);
    } catch {
      setError('Unable to load questions right now.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!activeQuestion || !selectedAnswer || submittedAnswer) {
      return;
    }

    setSubmittedAnswer(selectedAnswer);

    if (selectedAnswer === activeQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (!activeQuestion) {
      return;
    }

    const nextIndex = activeIndex + 1;
    const finalScore = score;

    setActiveIndex(nextIndex);
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
    setShowHint(false);

    if (nextIndex >= questions.length) {
      try {
        const response = await fetch('/api/practice/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subject === 'math' ? 'Math' : 'Reading/Writing',
            correctCount: finalScore,
            totalQuestions: questions.length,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSavedScore(data.score);
        }
      } catch {
        // If score save fails, user still sees local result.
      }
    }
  };

  const resetSession = () => {
    setSessionStarted(false);
    setQuestions([]);
    setActiveIndex(0);
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
    setShowHint(false);
    setScore(0);
    setSavedScore(null);
    setError('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Practice Session</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/home')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Back to Home
            </button>
            <button
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!sessionStarted ? (
          <div className="bg-white rounded-xl shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start a 10-question session</h2>
            <p className="text-gray-600 mb-6">DB-only mode for now. AI personalization can be layered in next.</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSubject('reading-writing')}
                className={`rounded-lg border p-4 text-left transition ${
                  subject === 'reading-writing' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-semibold text-lg">Reading/Writing</div>
                <div className="text-sm text-gray-600">SAT verbal practice mix</div>
              </button>

              <button
                onClick={() => setSubject('math')}
                className={`rounded-lg border p-4 text-left transition ${
                  subject === 'math' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-semibold text-lg">Math</div>
                <div className="text-sm text-gray-600">Algebra, geometry, and problem solving</div>
              </button>
            </div>

            <button
              onClick={fetchQuestions}
              disabled={loadingQuestions}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loadingQuestions ? 'Loading Questions...' : 'Start Practice'}
            </button>

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>
        ) : isSessionComplete ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Session Complete 🎉</h2>
            <p className="text-gray-600 mb-6">Great effort. Here is your result:</p>

            <div className="inline-flex flex-col items-center bg-blue-50 rounded-xl p-6 mb-6">
              <div className="text-4xl font-extrabold text-blue-700">{score}/{questions.length}</div>
              <div className="text-gray-700">Correct Answers</div>
              <div className="text-sm text-gray-600 mt-1">{Math.round((score / Math.max(questions.length, 1)) * 100)}%</div>
            </div>

            {savedScore !== null && (
              <p className="text-sm text-green-700 mb-6">Saved to progress as: {savedScore}%</p>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={resetSession} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                New Session
              </button>
              <button onClick={() => router.push('/home')} className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700">
                Go Home
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-wide text-gray-500">{subject === 'math' ? 'Math' : 'Reading/Writing'}</div>
                <div className="font-semibold text-gray-800">Question {progressLabel}</div>
              </div>
              <div className="text-lg font-bold text-blue-700">Score: {score}</div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-lg font-medium text-gray-900 mb-6">{activeQuestion?.questionText}</p>

              <div className="space-y-3">
                {activeQuestion?.options.map((option) => {
                  const isSelected = selectedAnswer === option.label;
                  const isSubmitted = submittedAnswer !== null;
                  const isCorrect = option.label === activeQuestion.correctAnswer;
                  const isWrongChoice = option.label === submittedAnswer && !isCorrect;

                  return (
                    <button
                      key={option.label}
                      onClick={() => !submittedAnswer && setSelectedAnswer(option.label)}
                      className={`w-full text-left border rounded-lg p-4 transition ${
                        isSubmitted && isCorrect
                          ? 'border-green-500 bg-green-50'
                          : isSubmitted && isWrongChoice
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold mr-2">{option.label}.</span>
                      <span>{option.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || !!submittedAnswer}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  Submit Answer
                </button>

                <button
                  onClick={() => setShowHint((prev) => !prev)}
                  className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300"
                >
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>

                <button
                  onClick={handleNextQuestion}
                  disabled={!submittedAnswer}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                  {activeIndex === questions.length - 1 ? 'Finish Session' : 'Next Question'}
                </button>
              </div>

              {showHint && activeQuestion?.hint && (
                <div className="mt-4 p-3 rounded border border-amber-300 bg-amber-50 text-amber-900">
                  <strong>Hint:</strong> {activeQuestion.hint}
                </div>
              )}

              {submittedAnswer && activeQuestion?.explanation && (
                <div className="mt-4 p-3 rounded border border-blue-300 bg-blue-50 text-blue-900">
                  <strong>Explanation:</strong> {activeQuestion.explanation}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
