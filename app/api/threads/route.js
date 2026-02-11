import store from '../../../lib/store'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const parentId = searchParams.get('parentId')
  
  if (!parentId) {
    return Response.json({ error: 'Missing parentId' }, { status: 400 })
  }
  
  const threads = store.threads.get(parentId) || []
  return Response.json({ messages: threads })
}

export async function POST(request) {
  const body = await request.json()
  const { parentId, channel, username, text, isAi = false } = body
  
  if (!parentId || !channel || !username || !text) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }
  
  const message = {
    id: Date.now().toString(),
    parentId,
    channel,
    username,
    text,
    timestamp: Date.now(),
    isAi,
  }
  
  // Add to threads
  const threads = store.threads.get(parentId) || []
  threads.push(message)
  store.threads.set(parentId, threads)
  
  // Update parent message thread count
  const messages = store.messages.get(channel) || []
  const parentMsg = messages.find(m => m.id === parentId)
  if (parentMsg) {
    parentMsg.threadCount = (parentMsg.threadCount || 0) + 1
  }
  
  return Response.json({ message })
}
