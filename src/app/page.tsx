'use client'

import { ApiKeyCard, localStorageKey } from '@/components/api-key-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RealtimeClient } from '@openai/realtime-api-beta'
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js'
import { Mic, MicOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js'

const instructions = 'This is a demo of the OpenAI Realtime API.'

export default function Home() {
  // OpenAIの音声入出力ライブラリを初期化
  // WavRecorder: 音声入力
  // WavStreamPlayer: 音声出力
  // RealtimeClient: OpenAI APIクライアント
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  )
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  )
  const clientRef = useRef<RealtimeClient>(new RealtimeClient({}))
  // localStorageはクライアントサイドレンダリング完了後に安全に参照しclientRefを初期化
  useEffect(() => {
    const apiKey = localStorage.getItem(localStorageKey) || ''
    clientRef.current = new RealtimeClient({
      apiKey: apiKey,
      dangerouslyAllowAPIKeyInBrowser: true,
    })
  }, [])

  const startTimeRef = useRef<string>(new Date().toISOString())

  const [items, setItems] = useState<ItemType[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const connectConversation = useCallback(async () => {
    const client = clientRef.current
    const wavRecorder = wavRecorderRef.current
    const wavStreamPlayer = wavStreamPlayerRef.current

    // Set state variables
    startTimeRef.current = new Date().toISOString()
    setIsConnected(true)
    setItems(client.conversation.getItems())

    // Connect to microphone
    await wavRecorder.begin()

    // Connect to audio output
    await wavStreamPlayer.connect()

    // Connect to realtime API
    await client.connect()

    // メッセージを入れておくと会話開始時に挨拶から始めてくれる
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello!`,
      },
    ])
    await wavRecorder.clear()
    await wavRecorder.record((data) => client.appendInputAudio(data.mono))
  }, [])

  const disconnectConversation = useCallback(async () => {
    setIsConnected(false)
    setItems([])

    const client = clientRef.current
    client.disconnect()

    const wavRecorder = wavRecorderRef.current
    await wavRecorder.end()

    const wavStreamPlayer = wavStreamPlayerRef.current
    await wavStreamPlayer.interrupt()
  }, [])

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current
    client.deleteItem(id)
  }, [])

  /**
   * 会話ログのスクロールを最下部に移動
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    )
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement
      conversationEl.scrollTop = conversationEl.scrollHeight
    }
  }, [items])

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current
    const client = clientRef.current

    client.updateSession({
      instructions: instructions,
      // Voice Optionsを指定
      voice: 'shimmer',
      // VADをデフォルト設定にする
      turn_detection: { type: 'server_vad' },
      input_audio_transcription: { model: 'whisper-1' },
    })

    // イベントログの取得
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      console.log(`${realtimeEvent.time}: ${realtimeEvent.event.type}`)
    })
    client.on('error', (event: any) => console.error(event))

    // 会話中に発話がはさまれた場合の処理
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt()
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset
        await client.cancelResponse(trackId, offset)
      }
    })
    // 会話が更新された場合の処理（これがコア実装）
    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems()
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id)
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        )
        item.formatted.file = wavFile
      }

      // 会話の更新がある度にitemsをどんどん更新していく
      setItems(items)
    })

    setItems(client.conversation.getItems())

    return () => {
      // cleanup; resets to defaults
      client.reset()
    }
  }, [])

  // デモ用のメッセージ追加関数
  const addMessage = (
    text: string,
    role?: 'user' | 'assistant' | 'system' | undefined
  ) => {
    const item: ItemType = {
      id: Math.random().toString(36).substring(7),
      object: 'item',
      role: role,
      formatted: { text },
      type: 'function_call',
      status: 'in_progress',
      call_id: 'call_id_example',
      name: 'function_name',
      arguments: '',
    }
    setItems((prevItems) => [...prevItems, item])
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4 text-center'>
        Carepost Voice Chat Demo
      </h1>
      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2'>
          <Card
            className='h-[calc(100vh-8rem)] overflow-y-auto'
            data-conversation-content
          >
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              {items.map((item, i) => {
                return (
                  <div
                    className={`conversation-item mb-4 ${
                      item.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                    key={item.id}
                  >
                    <div className={`speaker ${item.role || ''}`}>
                      <div>{(item.role || item.type).replaceAll('_', ' ')}</div>
                      <div
                        className='close'
                        onClick={() => deleteConversationItem(item.id)}
                      >
                        <div />
                      </div>
                    </div>
                    <div
                      className={`speaker-content inline-block p-2 rounded-lg ${
                        item.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      {/* tool response */}
                      {item.type === 'function_call_output' && (
                        <div>{item.formatted.output}</div>
                      )}
                      {/* tool call */}
                      {!!item.formatted.tool && (
                        <div>
                          {item.formatted.tool.name}(
                          {item.formatted.tool.arguments})
                        </div>
                      )}
                      {!item.formatted.tool && item.role === 'user' && (
                        <div>
                          {item.formatted.transcript ||
                            (item.formatted.audio?.length
                              ? '(awaiting transcript)'
                              : item.formatted.text || '(item sent)')}
                        </div>
                      )}
                      {!item.formatted.tool && item.role === 'assistant' && (
                        <div>
                          {item.formatted.transcript ||
                            item.formatted.text ||
                            '(truncated)'}
                        </div>
                      )}
                    </div>
                    {/* 各会話の音声ファイルも取得可能 */}
                    {/* {item.formatted.file && (
                      <audio src={item.formatted.file.url} controls />
                    )} */}
                  </div>
                )
              })}
              {items.length === 0 && (
                <p className='text-center text-muted-foreground'>
                  会話が開始されるとここに表示されます...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <ApiKeyCard />
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col items-center'>
                <Button
                  onClick={
                    isConnected ? disconnectConversation : connectConversation
                  }
                  variant={isConnected ? 'destructive' : 'default'}
                  className='mb-4 w-full'
                >
                  {isConnected ? (
                    <MicOff className='mr-2' />
                  ) : (
                    <Mic className='mr-2' />
                  )}
                  {isConnected ? 'Finish Conversation' : 'Start Conversation'}
                </Button>
                <div className='text-center text-sm text-muted-foreground'>
                  {isConnected ? (
                    <span className='flex items-center justify-center'>
                      <span className='animate-pulse mr-2'>●</span> 会話中...
                    </span>
                  ) : (
                    '会話を開始するには「Start Conversation」をクリックしてください'
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* デモ用のボタン */}
          <div className='mt-4 space-y-2'>
            <Button
              onClick={() =>
                addMessage('これは音声認識されたテキストです。', 'user')
              }
              className='w-full'
            >
              Add User Message
            </Button>
            <Button
              onClick={() =>
                addMessage('これはアシスタントの応答です。', 'assistant')
              }
              className='w-full'
            >
              Add AI Response
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string
  source: 'client' | 'server'
  count?: number
  event: { [key: string]: any }
}
