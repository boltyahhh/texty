import { useEffect, useRef, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface WebSocketMessage {
  type: 'transcription' | 'sentiment' | 'emotion' | 'response' | 'error'
  data: any
  timestamp: number
}

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus
  sendMessage: (message: any) => void
  lastMessage: WebSocketMessage | null
  reconnect: () => void
}

export function useWebSocket(): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const wsUrl = process.env.NEXT_PUBLIC_AWS_WEBSOCKET_URL

  const {
    sendMessage: wsSendMessage,
    lastMessage: wsLastMessage,
    readyState,
    getWebSocket
  } = useWebSocket(
    wsUrl || null,
    {
      onOpen: () => {
        console.log('WebSocket connected')
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
      },
      onClose: () => {
        console.log('WebSocket disconnected')
        setConnectionStatus('disconnected')
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current++
            console.log(`Reconnection attempt ${reconnectAttempts.current}`)
            getWebSocket()?.close()
          }, Math.pow(2, reconnectAttempts.current) * 1000) // Exponential backoff
        }
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      },
      shouldReconnect: () => reconnectAttempts.current < maxReconnectAttempts,
      reconnectInterval: (attemptNumber) => Math.pow(2, attemptNumber) * 1000,
      reconnectAttempts: maxReconnectAttempts,
    },
    !!wsUrl
  )

  useEffect(() => {
    switch (readyState) {
      case ReadyState.CONNECTING:
        setConnectionStatus('connecting')
        break
      case ReadyState.OPEN:
        setConnectionStatus('connected')
        break
      case ReadyState.CLOSING:
      case ReadyState.CLOSED:
        setConnectionStatus('disconnected')
        break
      default:
        setConnectionStatus('error')
    }
  }, [readyState])

  useEffect(() => {
    if (wsLastMessage?.data) {
      try {
        const message: WebSocketMessage = JSON.parse(wsLastMessage.data)
        setLastMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
  }, [wsLastMessage])

  const sendMessage = (message: any) => {
    if (readyState === ReadyState.OPEN) {
      wsSendMessage(JSON.stringify({
        ...message,
        timestamp: Date.now()
      }))
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message)
    }
  }

  const reconnect = () => {
    reconnectAttempts.current = 0
    getWebSocket()?.close()
  }

  return {
    connectionStatus,
    sendMessage,
    lastMessage,
    reconnect
  }
}