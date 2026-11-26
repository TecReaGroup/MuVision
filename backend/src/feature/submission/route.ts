import type { FastifyInstance } from 'fastify'
import { HttpError } from '../../shared/httpError'
import { NAME_FIELD_SCHEMA } from '../../shared/schema'
import type { SubmissionJob, SubmissionQueue } from './submissionQueue'
import { fetchThumbnail, fetchYouTubePreview, requireYouTubeId, type YouTubePreview } from './youtube'

type PreviewRoute = { Querystring: { url: string } }
type SubmitRoute = { Body: { url: string; title: string; creator: string; album: string } }
type JobRoute = { Params: { jobId: string } }
type ThumbnailRoute = { Params: { videoId: string } }

const VIDEO_ID_PATTERN = String.raw`^[\w-]{11}$`

export function registerSubmissionRoutes(app: FastifyInstance, queue: SubmissionQueue): void {
  app.get<PreviewRoute>(
    '/api/submission/preview',
    { schema: { querystring: { type: 'object', required: ['url'], properties: { url: { type: 'string' } } } } },
    async (request): Promise<YouTubePreview> => fetchYouTubePreview(requireYouTubeId(request.query.url)),
  )

  app.get<ThumbnailRoute>(
    '/api/submission/thumbnail/:videoId',
    {
      schema: {
        params: { type: 'object', properties: { videoId: { type: 'string', pattern: VIDEO_ID_PATTERN } } },
      },
    },
    async (request, reply) => {
      const thumbnail = await fetchThumbnail(request.params.videoId)
      if (!thumbnail) throw new HttpError(404, `No thumbnail for ${request.params.videoId}`)
      return reply.type(thumbnail.mediaType).send(Buffer.from(thumbnail.bytes))
    },
  )

  app.post<SubmitRoute>(
    '/api/submission',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url', 'title', 'creator', 'album'],
          properties: {
            url: { type: 'string' },
            title: NAME_FIELD_SCHEMA,
            creator: NAME_FIELD_SCHEMA,
            album: NAME_FIELD_SCHEMA,
          },
        },
      },
    },
    async (request, reply): Promise<SubmissionJob> => {
      const { url, title, creator, album } = request.body
      const job = queue.submit({
        videoId: requireYouTubeId(url),
        title: title.trim(),
        creator: creator.trim(),
        album: album.trim(),
      })
      return reply.status(202).send(job)
    },
  )

  app.get<JobRoute>('/api/submission/:jobId', async (request): Promise<SubmissionJob> => {
    const job = queue.find(request.params.jobId)
    if (!job) throw new HttpError(404, `Submission not found: ${request.params.jobId}`)
    return job
  })
}
