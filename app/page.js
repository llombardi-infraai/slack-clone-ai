'use client'

import { useState, useEffect, useRef } from 'react'

const CHANNELS = [
  { id: 'general', name: 'general', topic: 'General discussion for the team' },
  { id: 'random', name: 'random', topic: 'Random stuff and water cooler chat' },
  { id: 'ai-bot', name: 'ai-bot', topic: 'Chat with AI assistant' },
]

export default function Home() {
  const [username, setUsername] = useState('')
  const [inputUsername, setInputUsername] = useState('')
  const [currentChannel, setCurrentChannel] = useState('general')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeThread, setActiveThread] = useState(null)
  const [threadMessages, setThreadMessages] = useState([])
  const [threadInput, setThreadInput] = useState('')
  const messagesEndRef = useRef(null)
  const threadEndRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('slack-username')
    if (saved) setUsername(saved)
  }, [])

  const handleSetUsername = () => {
    if (inputUsername.trim()) {
      localStorage.setItem('slack-username', inputUsername)
      setUsername(inputUsername)
    }
  }

  const loadMessages = async () => {
    const res = await fetch(`/api/messages?channel=${currentChannel}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [currentChannel])

  useEffect(() => {
    if (activeThread) {
      loadThreadMessages(activeThread.id)
    }
  }, [activeThread])

  const loadThreadMessages = async (parentId) => {
    const res = await fetch(`/api/threads?parentId=${parentId}`)
    const data = await res.json()
    setThreadMessages(data.messages || [])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages])

  const sendMessage = async () => {
    if (!inputText.trim() || !username) return
    setLoading(true)
    
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: currentChannel,
        username,
        text: inputText,
      }),
    })

    setInputText('')
    await loadMessages()

    if (currentChannel === 'ai-bot') {
      await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: currentChannel }),
      })
      await loadMessages()
    }

    setLoading(false)
  }

  const sendThreadReply = async () => {
    if (!threadInput.trim() || !username || !activeThread) return
    
    await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: activeThread.id,
        channel: currentChannel,
        username,
        text: threadInput,
      }),
    })

    setThreadInput('')
    await loadThreadMessages(activeThread.id)
    await loadMessages()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleThreadKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendThreadReply()
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const groupMessagesByDate = (msgs) => {
    const groups = {}
    msgs.forEach(msg => {
      const date = new Date(msg.timestamp).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  const getAvatarColor = (name) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500']
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1d21]">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#4a154b] rounded-lg flex items-center justify-center">
              <span className="text-white text-3xl font-bold">#</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">Sign in to Slack Clone</h1>
          <p className="text-gray-500 mb-6 text-center">Enter your workspace</p>
          <input
            type="text"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
            placeholder="Your username"
            className="w-full p-3 border border-gray-300 rounded text-gray-900 focus:border-[#4a154b] focus:ring-2 focus:ring-[#4a154b] focus:ring-opacity-20 focus:outline-none mb-4"
            autoFocus
          />
          <button
            onClick={handleSetUsername}
            className="w-full p-3 bg-[#4a154b] hover:bg-[#611f64] text-white rounded font-semibold transition"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  const currentChannelData = CHANNELS.find(c => c.id === currentChannel)
  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex h-screen bg-[#1a1d21] text-[#d1d2d3]">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#1a1d21] flex flex-col border-r border-gray-800">
        {/* Workspace Header */}
        <div className="h-16 px-4 flex items-center border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-lg">Infrastrutture AI</h2>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-2 py-2">
          <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Threads</span>
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Direct messages</span>
          </button>
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <div className="flex items-center gap-1 text-gray-400 text-sm font-semibold mb-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Channels</span>
            </div>
            {CHANNELS.map(channel => (
              <button
                key={channel.id}
                onClick={() => { setCurrentChannel(channel.id); setActiveThread(null) }}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition ${
                  currentChannel === channel.id
                    ? 'bg-[#1164a3] text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-gray-500">#</span>
                <span>{channel.name}</span>
                {channel.id === 'ai-bot' && (
                  <span className="ml-auto text-xs bg-purple-600 px-1.5 py-0.5 rounded text-white">AI</span>
                )}
              </button>
            ))}
          </div>

          {/* Direct Messages Section */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-1 text-gray-400 text-sm font-semibold mb-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Direct messages</span>
            </div>
            <button className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>slackbot</span>
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm bg-[#1164a3] text-white">
              <span className="w-2 h-2 rounded-full bg-green-500 border-2 border-[#1164a3]"></span>
              <span>{username} (you)</span>
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="h-16 px-4 flex items-center gap-3 border-t border-gray-800 hover:bg-gray-800 cursor-pointer transition">
          <div className={`w-8 h-8 rounded-md ${getAvatarColor(username)} flex items-center justify-center text-white font-bold text-sm`}>
            {username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{username}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="h-16 border-b border-gray-800 flex items-center px-6 bg-[#1a1d21]">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xl">#</span>
            <h2 className="text-lg font-bold text-white">{currentChannelData?.name}</h2>
          </div>
          <div className="ml-4 text-gray-400 text-sm truncate">{currentChannelData?.topic}</div>
          <div className="ml-auto flex items-center gap-4 text-gray-400">
            <button className="hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Welcome to #{currentChannelData?.name}</h3>
              <p>This is the start of the #{currentChannelData?.name} channel.</p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-gray-700"></div>
                  <span className="text-xs text-gray-500 font-semibold">{formatDate(dateMessages[0].timestamp)}</span>
                  <div className="flex-1 h-px bg-gray-700"></div>
                </div>
                {dateMessages.map((msg, index) => {
                  const prevMsg = index > 0 ? dateMessages[index - 1] : null
                  const showHeader = !prevMsg || prevMsg.username !== msg.username || (msg.timestamp - prevMsg.timestamp) > 300000
                  
                  return (
                    <div key={msg.id} className="group flex gap-3 py-1 px-2 -mx-2 hover:bg-gray-800 rounded transition">
                      <div className="w-9 flex-shrink-0">
                        {showHeader ? (
                          <div className={`w-9 h-9 rounded-md ${msg.isAi ? 'bg-purple-600' : getAvatarColor(msg.username)} flex items-center justify-center text-white font-bold text-sm`}>
                            {msg.isAi ? '🤖' : msg.username[0].toUpperCase()}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        {showHeader ? (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className={`font-bold ${msg.isAi ? 'text-purple-400' : 'text-white'}`}>
                              {msg.username}
                            </span>
                            <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                          </div>
                        ) : null}
                        <p className="text-[#d1d2d3] whitespace-pre-wrap break-words">{msg.text}</p>
                        
                        {/* Thread replies indicator */}
                        {msg.threadCount > 0 && (
                          <button 
                            onClick={() => setActiveThread(msg)}
                            className="mt-1 flex items-center gap-2 text-xs text-[#1d9bd1] hover:underline"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {msg.threadCount} {msg.threadCount === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                        
                        {/* Reply button */}
                        {!msg.parentId && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 mt-1 transition">
                            <button 
                              onClick={() => setActiveThread(msg)}
                              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Reply in thread
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200">
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <div className="w-px h-5 bg-gray-300"></div>
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${currentChannel}`}
              className="w-full p-4 text-gray-900 placeholder-gray-400 resize-none focus:outline-none"
              rows={2}
              style={{ minHeight: '60px', maxHeight: '200px' }}
            />
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <span className="font-medium">Bold</span>
                <span>•</span>
                <span className="italic">Italic</span>
                <span>•</span>
                <span className="font-mono">Code</span>
              </div>
              <button
                onClick={sendMessage}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2 bg-[#007a5a] hover:bg-[#148567] disabled:bg-gray-300 text-white rounded font-medium text-sm transition"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thread Sidebar */}
      {activeThread && (
        <div className="w-96 bg-[#1a1d21] border-l border-gray-800 flex flex-col">
          {/* Thread Header */}
          <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">Thread</h3>
              <span className="text-gray-400">in #{currentChannel}</span>
            </div>
            <button 
              onClick={() => setActiveThread(null)}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Thread Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Parent Message */}
            <div className="flex gap-3 pb-4 border-b border-gray-700">
              <div className={`w-9 h-9 rounded-md ${activeThread.isAi ? 'bg-purple-600' : getAvatarColor(activeThread.username)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {activeThread.isAi ? '🤖' : activeThread.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`font-bold ${activeThread.isAi ? 'text-purple-400' : 'text-white'}`}>
                    {activeThread.username}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(activeThread.timestamp)}</span>
                </div>
                <p className="text-[#d1d2d3]">{activeThread.text}</p>
              </div>
            </div>

            {/* Replies */}
            <div className="mt-4 space-y-4">
              {threadMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className={`w-9 h-9 rounded-md ${msg.isAi ? 'bg-purple-600' : getAvatarColor(msg.username)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {msg.isAi ? '🤖' : msg.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`font-bold ${msg.isAi ? 'text-purple-400' : 'text-white'}`}>
                        {msg.username}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-[#d1d2d3]">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>
          </div>

          {/* Thread Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={threadInput}
                onChange={(e) => setThreadInput(e.target.value)}
                onKeyPress={handleThreadKeyPress}
                placeholder="Reply in thread..."
                className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-[#1d9bd1] focus:outline-none"
              />
              <button
                onClick={sendThreadReply}
                disabled={!threadInput.trim()}
                className="px-4 py-2 bg-[#007a5a] hover:bg-[#148567] disabled:bg-gray-600 text-white rounded font-medium transition"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
