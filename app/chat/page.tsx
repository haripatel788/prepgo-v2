'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePic: number;
}

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  messageText: string;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
  senderPic?: number;
}

interface Conversation {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePic: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);


  useEffect(() => {
    if (!currentUser) return;

    const fetchConversations = () => {
      fetch('/api/chat/conversations')
        .then(res => res.json())
        .then(data => {
          if (data.conversations) {
            setConversations(data.conversations);
          }
        })
        .catch(console.error);
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = () => {
      fetch(`/api/chat/messages?userId=${selectedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(console.error);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); 

    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    if (!currentUser) return;

    fetch('/api/chat/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setAllUsers(data.users.filter((u: User) => u.id !== currentUser.id));
        }
      })
      .catch(console.error);
  }, [currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    const messageText = newMessage;
    setNewMessage(''); 

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          messageText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText); 
    } finally {
      setSending(false);
    }
  };

  const startConversation = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
  };

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="inline-block mb-4">
            <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-semibold inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-3">
            Chat
          </h1>
          <p className="text-xl text-slate-600">
            Connect with other PrepGo students
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" style={{ height: '600px' }}>
          <div className="grid grid-cols-3 h-full">

            <div className="col-span-1 border-r border-slate-200 flex flex-col">

              <div className="p-4 border-b border-slate-200">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900"
                />
              </div>


              <div className="flex-1 overflow-y-auto">
                {searchQuery ? (

                  filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => startConversation(user)}
                        className="w-full p-4 hover:bg-slate-50 border-b border-slate-100 text-left transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Image
                            src={`/pfp${user.profilePic}.png`}
                            alt={user.username}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-slate-500 truncate">@{user.username}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      No users found
                    </div>
                  )
                ) : (

                  conversations.length > 0 ? (
                    conversations.map(conv => (
                      <button
                        key={conv.userId}
                        onClick={() => setSelectedUser({
                          id: conv.userId,
                          username: conv.username,
                          firstName: conv.firstName,
                          lastName: conv.lastName,
                          profilePic: conv.profilePic,
                        })}
                        className={`w-full p-4 hover:bg-slate-50 border-b border-slate-100 text-left transition-colors ${
                          selectedUser?.id === conv.userId ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Image
                              src={`/pfp${conv.profilePic}.png`}
                              alt={conv.username}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                            {conv.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{conv.unreadCount}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {conv.firstName} {conv.lastName}
                            </div>
                            <div className="text-sm text-slate-500 truncate">{conv.lastMessage}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-slate-500 mb-2">No conversations yet</p>
                      <p className="text-sm text-slate-400">Search for users above to start chatting</p>
                    </div>
                  )
                )}
              </div>
            </div>


            <div className="col-span-2 flex flex-col">
              {selectedUser ? (
                <>

                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Image
                        src={`/pfp${selectedUser.profilePic}.png`}
                        alt={selectedUser.username}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-bold text-slate-900">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </div>
                        <div className="text-sm text-slate-500">@{selectedUser.username}</div>
                      </div>
                    </div>
                  </div>


                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length > 0 ? (
                      messages.map(message => {
                        const isOwn = message.senderId === currentUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-2' : 'order-1'}`}>
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-900'
                                }`}
                              >
                                <p className="break-words">{message.messageText}</p>
                              </div>
                              <div className={`text-xs text-slate-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-slate-400">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-slate-200">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-24 h-24 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-slate-400 text-lg">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}