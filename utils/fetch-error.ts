export function getFetchStatusMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const fetchError = error as {
    statusMessage?: string
    data?: {
      statusMessage?: string
      message?: string
    }
    message?: string
  }

  return (
    fetchError.statusMessage ||
    fetchError.data?.statusMessage ||
    fetchError.data?.message ||
    fetchError.message ||
    ''
  )
}
