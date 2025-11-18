import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecallSdk } from '../src'

const realFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

describe('pagination cursor normalization', () => {
  it('parses cursor tokens from pagination URLs', async () => {
    const page1Next =
      'https://us-east-1.recall.ai/api/v2/calendar-events/?calendar_id=684a3c00-4dc7-4973-91d6-237c6653ada8&cursor=cD0yMDI1LTEyLTEwKzA5JTNBMTUlM0EwMCUyQjAwJTNBMDA%3D&limit=100&updated_at__gte=2025-11-18T13%3A21%3A01.668Z'
    const page2Previous =
      'https://us-east-1.recall.ai/api/v2/calendar-events/?calendar_id=684a3c00-4dc7-4973-91d6-237c6653ada8&cursor=cj0xJnA9MjAyNS0xMi0xMCsxOSUzQTAwJTNBMDAlMkIwMCUzQTAw&limit=100&updated_at__gte=2025-11-18T13%3A21%3A01.668Z'

    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [],
            next: page1Next,
            previous: null,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [],
            next: null,
            previous: page2Previous,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    globalThis.fetch = fetchMock as typeof fetch

    const sdk = new RecallSdk({
      apiKey: 'test-api-key',
      baseUrl: 'https://us-east-1.recall.ai',
    })

    const baseQuery = {
      calendar_id: '684a3c00-4dc7-4973-91d6-237c6653ada8',
      updated_at__gte: '2025-11-18T13:21:01.668Z',
      limit: 100,
    }

    const page1 = await sdk.calendar.listEvents(baseQuery)
    expect(page1.results).toEqual([])
    expect(page1.next).toBe('cD0yMDI1LTEyLTEwKzA5JTNBMTUlM0EwMCUyQjAwJTNBMDA=')
    expect(page1.previous).toBeNull()

    const page2 = await sdk.calendar.listEvents({
      ...baseQuery,
      cursor: page1.next ?? undefined,
    })

    expect(page2.results).toEqual([])
    expect(page2.next).toBeNull()
    expect(page2.previous).toBe(
      'cj0xJnA9MjAyNS0xMi0xMCsxOSUzQTAwJTNBMDAlMkIwMCUzQTAw',
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
