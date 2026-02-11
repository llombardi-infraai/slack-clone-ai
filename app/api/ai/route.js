import store from '../../../lib/store'

const AI_BOT = {
  username: 'AI Assistant',
  isAi: true,
}

async function generateAIResponse(messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    return "I'm not configured yet. Add ANTHROPIC_API_KEY to environment variables."
  }
  
  // Only send user messages to AI, format properly
  const userMessages = messages.filter(m => !m.isAi)
  if (userMessages.length === 0) {
    return "Hello! I'm your AI assistant. How can I help you today?"
  }
  
  const lastMessage = userMessages[userMessages.length - 1]
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        messages: [{ role: 'user', content: lastMessage.text }],
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', response.status, errorData)
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.content[0]?.text || "I'm thinking..."
  } catch (error) {
    console.error('AI error:', error)
    return `Error: ${error.message}`
  }
}

export async function POST(request) {
  const { channel } = await request.json()
  
  if (channel !== 'ai-bot') {
    return Response.json({ error: 'AI only responds in ai-bot channel' }, { status: 400 })
  }
  
  const messages = store.messages.get(channel) || []
  const aiResponse = await generateAIResponse(messages)
  
  const message = {
    id: Date.now().toString(),
    channel,
    username: AI_BOT.username,
    text: aiResponse,
    timestamp: Date.now(),
    isAi: true,
  }
  
  messages.push(message)
  store.messages.set(channel, messages)
  
  return Response.json({ message })
}
