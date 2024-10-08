import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const localStorageKey = 'tmp::OPENAI_API_KEY'

const ApiKeyCard = () => {
  const [apiKey, setApiKey] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    const apiKey = localStorage.getItem(localStorageKey)
    if (apiKey) {
      setSavedApiKey(apiKey ?? '')
    }
  }, [])

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value)
  }

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey)
  }

  const saveApiKey = () => {
    localStorage.setItem(localStorageKey, apiKey)
    setSavedApiKey(apiKey)
    setApiKey('')
    alert('API Key has been saved!')
  }

  return (
    <Card className='mb-4'>
      <CardHeader>
        <CardTitle>API Key</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center space-x-2 mb-2'>
          <div className='w-full break-words overflow-hidden'>
            {savedApiKey && savedApiKey.length > 0
              ? showApiKey
                ? savedApiKey
                : '********'
              : 'Please set your OpenAI API Key…'}
          </div>
          <Button
            onClick={toggleShowApiKey}
            variant='default'
            className='flex-shrink-0'
          >
            {showApiKey ? (
              <EyeOff className='w-4 h-4' />
            ) : (
              <Eye className='w-4 h-4' />
            )}
          </Button>
        </div>
        <input
          id='apiKey'
          value={apiKey}
          onChange={handleApiKeyChange}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder='Enter your OpenAI API key'
        />
        <Button onClick={saveApiKey} className='w-full mt-2'>
          Save API Key
        </Button>
      </CardContent>
    </Card>
  )
}

export { ApiKeyCard, localStorageKey }
