let sdkPromise

// 지도와 검색이 같은 로딩 작업을 공유하고, services까지 준비된 뒤 사용합니다.
export function loadKakaoMaps() {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const kakao = window.kakao

      if (typeof kakao?.maps?.load !== 'function') {
        reject(new Error('카카오 지도를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'))
        return
      }

      const timeout = window.setTimeout(() => {
        reject(new Error('카카오 지도 로딩 시간이 초과되었습니다. 다시 시도해주세요.'))
      }, 15000)

      try {
        kakao.maps.load(() => {
          window.clearTimeout(timeout)

          if (!kakao.maps.Map || !kakao.maps.services?.Places) {
            reject(new Error('카카오 지도와 장소 검색 기능을 불러오지 못했습니다.'))
            return
          }

          resolve(kakao)
        })
      } catch (error) {
        window.clearTimeout(timeout)
        reject(error)
      }
    }).catch((error) => {
      sdkPromise = undefined
      throw error
    })
  }

  return sdkPromise
}
