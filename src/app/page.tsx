'use client'

import { ApiKeyCard, localStorageKey } from '@/components/api-key-card'
import { ConversationCard } from '@/components/conversation-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { instructions } from '@/lib/config'
import { RealtimeClient } from '@openai/realtime-api-beta'
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js'
import { Mic, MicOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js'

export default function Home() {
  // OpenAIの音声入出力ライブラリを初期化
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

  // 会話ログのスクロールを最下部に移動
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

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4 text-center'>
        Carepost Voice Chat Demo
      </h1>
      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2'>
          <ConversationCard items={items} />
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
        </div>
      </div>
    </div>
  )
}

interface RealtimeEvent {
  time: string
  source: 'client' | 'server'
  count?: number
  event: { [key: string]: any }
}
