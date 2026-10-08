import type {
  ExploreRequest,
  GeneratedReading,
  ReadingSection,
} from '@/types/explore'

const API_URL = 'http://localhost:8787'

interface ExploreApiResponse {
  reading: {
    title: string
    content: string
    sources: {
      title: string
      url: string
    }[]
  }
}

export const generateExploreReading = async (
  request: ExploreRequest,
  language: 'it' | 'en',
): Promise<GeneratedReading> => {
  const response = await fetch(`${API_URL}/api/explore`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      ...request,
      language,
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to generate reading')
  }

  const data: ExploreApiResponse = await response.json()

  return {
    title: data.reading.title,

    sections: [
      {
        id: 'initial',
        content: data.reading.content,
      },
    ],

    sources: data.reading.sources,
  }
}

// Per ora Tell me more resta mock.
export const continueExploreReading = async (): Promise<ReadingSection> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    id: `continuation-${Date.now()}`,
    content: `
And there is still more to discover.

Sometimes the most interesting part of a subject begins just after the obvious facts end. A small detail can open another path, and that path can lead somewhere completely unexpected.
    `.trim(),
  }
}