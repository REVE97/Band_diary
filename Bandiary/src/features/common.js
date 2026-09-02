export const formatDate = (date) => {
  if (!date) return "";

  return date.slice(0,10);
}

export const extractYoutubeVideoId = (youtubeUrl) => {
  try {
    const parsedUrl = new URL(youtubeUrl.trim())
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')
    const allowedHostnames = new Set([
      'youtube.com',
      'm.youtube.com',
      'music.youtube.com',
      'youtu.be',
    ])

    if (!allowedHostnames.has(hostname)) return ''

    let videoId = ''

    if (hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.split('/').filter(Boolean)[0] || ''
    } else if (parsedUrl.pathname === '/watch') {
      videoId = parsedUrl.searchParams.get('v') || ''
    } else {
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)

      if (['embed', 'live', 'shorts'].includes(pathSegments[0])) {
        videoId = pathSegments[1] || ''
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : ''
  } catch {
    return ''
  }
}
