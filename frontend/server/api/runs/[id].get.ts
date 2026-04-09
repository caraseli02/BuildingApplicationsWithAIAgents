import { getRun } from '../../utils/run-store'

export default defineEventHandler((event) => {
  const run = getRun(getRouterParam(event, 'id') || '')

  if (!run) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Run not found'
    })
  }

  return run
})
