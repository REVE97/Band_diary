const draftKey = (userId) => `bandiaryMusicsheetDraft:${userId}`
const sessions = ['Vocal', 'Guitar', 'Bass', 'Keyboard', 'Drum']

export const readMusicsheetDraft = (userId) => {
  if (!userId) return null

  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey(userId)))
    if (
      !sessions.includes(draft?.form?.session) ||
      typeof draft.form.title !== 'string' ||
      typeof draft.form.description !== 'string'
    ) return null

    const form = {
      session: draft.form.session,
      title: draft.form.title,
      description: draft.form.description,
    }

    // File objects cannot be restored: return to file selection after a reload.
    const step = form.title.trim() && form.description.trim() && draft.step >= 2
      ? 2
      : 1
    return { form, step }
  } catch {
    return null
  }
}

export const saveMusicsheetDraft = (userId, form, step) => {
  if (!userId) return
  try {
    sessionStorage.setItem(draftKey(userId), JSON.stringify({ form, step }))
  } catch {
    // Storage restrictions must not prevent file selection or navigation.
  }
}

export const clearMusicsheetDraft = (userId) => {
  if (!userId) return
  try {
    sessionStorage.removeItem(draftKey(userId))
  } catch {
    // The form can still be closed when session storage is unavailable.
  }
}
