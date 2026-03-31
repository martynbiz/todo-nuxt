import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const config = useRuntimeConfig()
    _openai = new OpenAI({
      apiKey: config.openaiApiKey
    })
  }
  return _openai
}
