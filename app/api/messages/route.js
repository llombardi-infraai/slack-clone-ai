import store from '../../../lib/store'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel') || 'general'
  
  const messages = store.messages.get(channel) || []
  return Response.json({ messages })
}

export async function POST(request) {
  const body = await request.json()
  const { channel, username, text, isAi = false } = body
  
  if (!channel || !username || !text) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }
  
  const message = {
    id: Date.now().toString(),
    channel,
    username,
    text,
    timestamp: Date.now(),
    isAi,
  }
  
  const messages = store.messages.get(channel) || []
  messages.push(message)
  store.messages.set(channel, messages)
  
  return Response.json({ message })
}
