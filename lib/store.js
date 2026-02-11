// In-memory store for messages
const store = {
  channels: [
    { id: 'general', name: 'general' },
    { id: 'random', name: 'random' },
    { id: 'ai-bot', name: 'ai-bot' },
  ],
  messages: new Map(), // channelId -> messages array
}

// Initialize with empty arrays
store.channels.forEach(ch => {
  store.messages.set(ch.id, [])
})

export default store
