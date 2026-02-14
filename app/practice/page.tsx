'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
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

function PracticePageContent() {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-slate-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PrepGo
            </span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/home')}
              className="px-5 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors rounded-lg hover:bg-blue-50"
            >
              Back to Home
            </button>
            <button
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
              }}
              className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!sessionStarted ? (
          /* Subject Selection Screen */
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  Practice Session
                </div>
              </div>
              <h1 className="text-5xl font-black text-slate-900 mb-4">
                Choose Your Subject
              </h1>
              <p className="text-xl text-slate-600">
                Select a subject to start your 10-question practice session
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Reading/Writing Card */}
              <button
                onClick={() => setSubject('reading-writing')}
                className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  subject === 'reading-writing'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/50'
                    : 'bg-white border-2 border-slate-200 hover:border-blue-500 shadow-lg'
                }`}
              >
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all ${
                  subject === 'reading-writing'
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}>
                  <svg className={`w-8 h-8 ${subject === 'reading-writing' ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${subject === 'reading-writing' ? 'text-white' : 'text-slate-900'}`}>
                  Reading/Writing
                </h3>
                <p className={`text-base leading-relaxed ${subject === 'reading-writing' ? 'text-blue-100' : 'text-slate-600'}`}>
                  SAT verbal practice with reading comprehension and grammar
                </p>
                {subject === 'reading-writing' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>

              {/* Math Card */}
              <button
                onClick={() => setSubject('math')}
                className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  subject === 'math'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl shadow-purple-500/50'
                    : 'bg-white border-2 border-slate-200 hover:border-purple-500 shadow-lg'
                }`}
              >
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all ${
                  subject === 'math'
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  <svg className={`w-8 h-8 ${subject === 'math' ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${subject === 'math' ? 'text-white' : 'text-slate-900'}`}>
                  Math
                </h3>
                <p className={`text-base leading-relaxed ${subject === 'math' ? 'text-purple-100' : 'text-slate-600'}`}>
                  Algebra, geometry, statistics, and problem-solving
                </p>
                {subject === 'math' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            </div>

            <button
              onClick={fetchQuestions}
              disabled={loadingQuestions}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loadingQuestions ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading Questions...
                </span>
              ) : (
                'Start Practice Session'
              )}
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        ) : isSessionComplete ? (
          /* Session Complete Screen */
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-2xl p-12 border border-slate-100">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-3">
                  Session Complete!
                </h2>
                <p className="text-lg text-slate-600">
                  Great effort! Here&apos;s how you did:
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-100">
                <div className="text-6xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  {score}/{questions.length}
                </div>
                <div className="text-lg font-semibold text-slate-700 mb-2">Correct Answers</div>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round((score / Math.max(questions.length, 1)) * 100)}%
                </div>
              </div>

              {savedScore !== null && (
                <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Saved to your progress: {savedScore}%</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={resetSession} 
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/40 transition-all transform hover:scale-105"
                >
                  Start New Session
                </button>
                <button 
                  onClick={() => router.push('/home')} 
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all transform hover:scale-105"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Question Screen */
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {subject === 'math' ? 'Math' : 'Reading/Writing'}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    Question {progressLabel}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Current Score
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {score}/{questions.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
              <div className="mb-8">
                <p className="text-xl font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {activeQuestion?.questionText}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-8">
                {activeQuestion?.options.map((option) => {
                  const isSelected = selectedAnswer === option.label;
                  const isSubmitted = submittedAnswer !== null;
                  const isCorrect = option.label === activeQuestion.correctAnswer;
                  const isWrongChoice = option.label === submittedAnswer && !isCorrect;

                  return (
                    <button
                      key={option.label}
                      onClick={() => !submittedAnswer && setSelectedAnswer(option.label)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all font-medium ${
                        isSubmitted && isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : isSubmitted && isWrongChoice
                            ? 'border-red-500 bg-red-50 text-red-900'
                            : isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-lg shadow-blue-500/20'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100">
                          {option.label}
                        </span>
                        <span className="flex-1 pt-1">{option.text}</span>
                        {isSubmitted && isCorrect && (
                          <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isSubmitted && isWrongChoice && (
                          <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || !!submittedAnswer}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>

                <button
                  onClick={() => setShowHint((prev) => !prev)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                >
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>

                <button
                  onClick={handleNextQuestion}
                  disabled={!submittedAnswer}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  {activeIndex === questions.length - 1 ? 'Finish Session' : 'Next Question'}
                </button>
              </div>

              {/* Hint */}
              {showHint && activeQuestion?.hint && (
                <div className="mt-6 p-4 rounded-xl border-2 border-amber-300 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-amber-900 mb-1">Hint</div>
                      <div className="text-amber-800">{activeQuestion.hint}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {submittedAnswer && activeQuestion?.explanation && (
                <div className="mt-6 p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-blue-900 mb-1">Explanation</div>
                      <div className="text-blue-800">{activeQuestion.explanation}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-slate-700">Loading...</div>
        </div>
      </div>
    }>
      <PracticePageContent />
    </Suspense>
  );
}