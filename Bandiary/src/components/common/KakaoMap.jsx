import { useEffect, useRef } from 'react'

function KakaoMap({ studio }) {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!studio) return

    const kakao = window.kakao

    if (!kakao || !kakao.maps) {
      console.error('카카오맵 SDK가 로드되지 않았습니다.')
      return
    }

    const container = mapRef.current

    const centerPosition = new kakao.maps.LatLng(
      studio.latitude,
      studio.longitude
    )

    const options = {
      center: centerPosition,
      level: 4,
    }

    const map = new kakao.maps.Map(container, options)

    const marker = new kakao.maps.Marker({
      position: centerPosition,
    })

    marker.setMap(map)
  }, [studio])

  if (!studio) {
    return (
      <div className="kakao-map-empty">
        장소를 선택하면 지도가 표시됩니다.
      </div>
    )
  }

  return (
    <div className="kakao-map-wrap">
      <div className="kakao-map-header">
        <strong>{studio.name}</strong>
        <span>{studio.address}</span>
      </div>

      <div ref={mapRef} className="kakao-map" />
    </div>
  )
}

export default KakaoMap