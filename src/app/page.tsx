'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, MicOff } from 'lucide-react'
import { useState } from 'react'

type Message = {
  type: 'user' | 'ai'
  content: string
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  const toggleListening = () => {
    setIsListening(!isListening)
    // ここで実際の音声認識の開始/停止ロジックを実装します
  }

  // デモ用のメッセージ追加関数
  const addMessage = (type: 'user' | 'ai', content: string) => {
    setMessages((prevMessages) => [...prevMessages, { type, content }])
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4 text-center'>
        OpenAI Realtime API Demo
      </h1>
      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2'>
          <Card className='h-[calc(100vh-8rem)] overflow-y-auto'>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <span
                    className={`inline-block p-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    {message.content}
                  </span>
                </div>
              ))}
              {messages.length === 0 && (
                <p className='text-center text-muted-foreground'>
                  会話が開始されるとここに表示されます...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col items-center'>
                <Button
                  onClick={toggleListening}
                  variant={isListening ? 'destructive' : 'default'}
                  className='mb-4 w-full'
                >
                  {isListening ? (
                    <MicOff className='mr-2' />
                  ) : (
                    <Mic className='mr-2' />
                  )}
                  {isListening ? 'Stop Listening' : 'Start Listening'}
                </Button>
                <div className='text-center text-sm text-muted-foreground'>
                  {isListening ? (
                    <span className='flex items-center justify-center'>
                      <span className='animate-pulse mr-2'>●</span>{' '}
                      音声認識中...
                    </span>
                  ) : (
                    '音声認識を開始するには「Start Listening」をクリックしてください'
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* デモ用のボタン */}
          <div className='mt-4 space-y-2'>
            <Button
              onClick={() =>
                addMessage('user', 'これは音声認識されたテキストです。')
              }
              className='w-full'
            >
              Add User Message
            </Button>
            <Button
              onClick={() => addMessage('ai', 'これはAIの応答です。')}
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
