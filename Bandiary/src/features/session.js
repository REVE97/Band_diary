const LOGIN_USER_SESSION_KEY = 'bandiaryLoginUser'

export const getLoginUser = () => {
  try {
    const loginUser = JSON.parse(
      sessionStorage.getItem(LOGIN_USER_SESSION_KEY)
    )

    return loginUser?.isLoggedIn ? loginUser : null
  } catch {
    return null
  }
}

export const getLoginUserId = () => {
  const userId = getLoginUser()?.userId

  return typeof userId === 'string' ? userId.trim() : ''
}
