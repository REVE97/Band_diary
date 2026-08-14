import { useEffect, useRef } from 'react'
import mapIcon from '../../assets/images/map_purple.svg'
import styles from './KakaoMap.module.css'

function KakaoMap({ place }) {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!place) return

    const kakao = window.kakao

    if (!kakao || !kakao.maps) {
      console.error('카카오맵 SDK가 로드되지 않았습니다.')
      return
    }

    const container = mapRef.current

    const centerPosition = new kakao.maps.LatLng(
      place.latitude,
      place.longitude
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
  }, [place])

  const handleOpenKakaoRoute = () => {
    if (!place) return

    const routeUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
      place.name
    )},${place.latitude},${place.longitude}`

    window.location.href = routeUrl
  }

  if (!place) {
    return (
      <div className={styles.empty}>
        <img src={mapIcon} alt="" className={styles.emptyIcon} />
        <p>장소를 선택하면 지도가 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <strong>{place.name}</strong>
          <span>{place.address}</span>
        </div>

        <button
          type="button"
          className={styles.routeButton}
          onClick={handleOpenKakaoRoute}
        >
          길찾기
        </button>
      </div>

      <div ref={mapRef} className={styles.map} />
    </div>
  )
}

export default KakaoMap
