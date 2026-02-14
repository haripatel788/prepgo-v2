'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  interface User {
    firstName?: string;
    username?: string;
    id?: number;
  }

  interface UserStats {
    questionsAnswered: number;
    averageScore: number;
    currentStreak: number;
    xpPoints: number;
    level: number;
  }

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>({
    questionsAnswered: 0,
    averageScore: 0,
    currentStreak: 0,
    xpPoints: 0,
    level: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          return fetch('/api/stats/user');
        } else {
          router.push('/login');
          return null;
        }
      })
      .then(res => {
        if (res) {
          return res.json();
        }
        return null;
      })
      .then(statsData => {
        if (statsData && statsData.stats) {
          setStats(statsData.stats);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  if (loading) {
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
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
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
              onClick={() => router.push('/profile')}
              className="px-5 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors rounded-lg hover:bg-blue-50"
            >
              Profile
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="px-5 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors rounded-lg hover:bg-blue-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
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

      <main className="max-w-7xl mx-auto px-6 py-12">

        <div className="mb-12">
          <div className="inline-block mb-4">
            <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-semibold inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              Dashboard
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-3">
            Welcome back, {user?.firstName || user?.username}! 👋
          </h1>
          <p className="text-xl text-slate-600">
            Ready to continue your SAT prep journey?
          </p>
        </div>
        <div className="mb-8 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-900 mb-1">Your Level</div>
              <div className="text-4xl font-black text-white">{stats.level}</div>
            </div>
            <div className="flex-1 mx-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-amber-900">XP Progress</span>
                <span className="text-sm font-bold text-white">{stats.xpPoints} / {stats.level * 1000} XP</span>
              </div>
              <div className="h-4 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.xpPoints / (stats.level * 1000)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Practice Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100 overflow-hidden">
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Reading & Writing</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Practice reading comprehension, grammar, and SAT verbal skills
                </p>
                <button
                  onClick={() => router.push('/practice?subject=reading-writing')}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/40 transition-all transform hover:scale-105"
                >
                  Start Practice
                </button>
              </div>
              <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100 overflow-hidden">
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Math</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Master algebra, geometry, statistics, and problem-solving
                </p>
                <button
                  onClick={() => router.push('/practice?subject=math')}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/40 transition-all transform hover:scale-105"
                >
                  Start Practice
                </button>
              </div>
              <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
              <div className="relative">
                <div className="text-4xl font-black text-blue-600 mb-2">{stats.questionsAnswered}</div>
                <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Questions Answered</div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 border border-emerald-200">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-200 rounded-full opacity-20"></div>
              <div className="relative">
                <div className="text-4xl font-black text-emerald-600 mb-2">{stats.averageScore}%</div>
                <div className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Average Score</div>
              </div>
            </div>


            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 border border-amber-200">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-200 rounded-full opacity-20"></div>
              <div className="relative">
                <div className="text-4xl font-black text-amber-600 mb-2 flex items-center gap-2">
                  {stats.currentStreak}
                  {stats.currentStreak > 0 && <span className="text-2xl">🔥</span>}
                </div>
                <div className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Day Streak</div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-lg mb-1">
                  {stats.currentStreak > 0 ? `Amazing! ${stats.currentStreak} day streak!` : 'Keep Up the Great Work!'}
                </div>
                <div className="text-blue-100 text-sm">
                  {stats.currentStreak > 0 
                    ? `Don't break your streak! Practice today to keep it going.`
                    : 'Start a practice session to build your streak and track your improvement.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}