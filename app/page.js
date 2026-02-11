'use client'

import { useState, useEffect, useRef } from 'react'

const CHANNELS = [
  { id: 'general', name: 'general' },
  { id: 'random', name: 'random' },
  { id: 'ai-bot', name: 'ai-bot' },
]

export default function Home() {
  const [username, setUsername] = useState('')
  const [inputUsername, setInputUsername] = useState('')
  const [currentChannel, setCurrentChannel] = useState('general')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Load username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('slack-username')
    if (saved) setUsername(saved)
  }, [])

  // Save username
  const handleSetUsername = () => {
    if (inputUsername.trim()) {
      localStorage.setItem('slack-username', inputUsername)
      setUsername(inputUsername)
    }
  }

  // Load messages
  const loadMessages = async () => {
    const res = await fetch(`/api/messages?channel=${currentChannel}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 2000) // Poll every 2s
    return () => clearInterval(interval)
  }, [currentChannel])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim() || !username) return

    setLoading(true)
    
    // Send user message
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

    // Trigger AI response if in ai-bot channel
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Username setup screen
  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-white">Welcome to Slack Clone</h1>
          <p className="text-gray-400 mb-4">Enter your username to get started</p>
          <input
            type="text"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
            placeholder="Your username"
            className="w-full p-3 bg-gray-700 text-white rounded mb-4 border border-gray-600 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleSetUsername}
            className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
          >
            Join
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Slack Clone</h2>
          <p className="text-sm text-gray-400">@{username}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Channels
          </div>
          {CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => setCurrentChannel(channel.id)}
              className={`w-full text-left px-4 py-2 text-sm transition ${
                currentChannel === channel.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              # {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="h-16 border-b border-gray-700 flex items-center px-6">
          <h2 className="text-lg font-bold text-white"># {currentChannel}</h2>
          {currentChannel === 'ai-bot' && (
            <span className="ml-3 px-2 py-1 bg-purple-600 text-xs rounded text-white">AI Enabled</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  msg.isAi ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {msg.isAi ? '🤖' : msg.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-bold ${msg.isAi ? 'text-purple-400' : 'text-white'}`}>
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-gray-200 mt-1 whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${currentChannel}`}
              className="flex-1 p-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !inputText.trim()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-medium transition"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
