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
  
  const conversation = messages.map(m => ({
    role: m.isAi ? 'assistant' : 'user',
    content: `${m.username}: ${m.text}`
  }))
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: conversation.slice(-10), // Last 10 messages for context
      }),
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.content[0]?.text || "I'm thinking..."
  } catch (error) {
    console.error('AI error:', error)
    return "Sorry, I'm having trouble thinking right now. Try again in a moment."
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
