import { ItemType } from '@openai/realtime-api-beta/dist/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const ConversationCard = ({ items }: { items: ItemType[] }) => {
  return (
    <Card
      className='h-[calc(100vh-8rem)] overflow-y-auto'
      data-conversation-content
    >
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
      </CardHeader>
      <CardContent>
        {items.map((item) => {
          return (
            <div
              className={`conversation-item mb-4 ${
                item.role === 'user' ? 'text-right' : 'text-left'
              }`}
              key={item.id}
            >
              <div className={`speaker ${item.role || ''}`}>
                <div>{(item.role || item.type).replaceAll('_', ' ')}</div>
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
                    {item.formatted.tool.name}({item.formatted.tool.arguments})
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
  )
}

export { ConversationCard }
