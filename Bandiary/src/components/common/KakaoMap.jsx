import { useEffect, useRef } from 'react'

import restaurantMarkerIcon from '../../assets/images/place-restaurant-marker.svg'
import studioMarkerIcon from '../../assets/images/place-studio-marker.svg'
import styles from './KakaoMap.module.css'

const seoulCenter = {
  latitude: 37.566826,
  longitude: 126.9786567,
}

const getPlaceKey = (place) => `${place.type}-${place.id}`

function KakaoMap({
  places,
  selectedPlace,
  onSelectPlace,
  onClearSelection,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const clearSelectionRef = useRef(onClearSelection)

  useEffect(() => {
    clearSelectionRef.current = onClearSelection
  }, [onClearSelection])

  // 페이지 진입 시 서울권 전체가 보이는 지도를 한 번만 생성합니다.
  useEffect(() => {
    const kakao = window.kakao

    if (!kakao || !kakao.maps) {
      console.error('카카오맵 SDK가 로드되지 않았습니다.')
      return undefined
    }

    const centerPosition = new kakao.maps.LatLng(
      seoulCenter.latitude,
      seoulCenter.longitude
    )

    const map = new kakao.maps.Map(
      mapContainerRef.current,
      {
        center: centerPosition,
        level: 9,
      }
    )

    const handleMapClick = () => {
      clearSelectionRef.current?.()
    }

    mapInstanceRef.current = map
    kakao.maps.event.addListener(map, 'click', handleMapClick)

    return () => {
      kakao.maps.event.removeListener(map, 'click', handleMapClick)
      markersRef.current.forEach(({ marker }) => marker.setMap(null))
      markersRef.current = []
      mapInstanceRef.current = null
    }
  }, [])

  // 현재 검색 및 유형 필터에 포함된 모든 장소를 마커로 출력합니다.
  useEffect(() => {
    const kakao = window.kakao
    const map = mapInstanceRef.current

    if (!kakao || !kakao.maps || !map) return

    markersRef.current.forEach(({ marker }) => marker.setMap(null))

    const markerSize = new kakao.maps.Size(40, 50)
    const markerOptions = {
      offset: new kakao.maps.Point(20, 50),
    }

    markersRef.current = places
      .filter((place) => {
        return (
          Number.isFinite(Number(place.latitude)) &&
          Number.isFinite(Number(place.longitude))
        )
      })
      .map((place) => {
        const position = new kakao.maps.LatLng(
          Number(place.latitude),
          Number(place.longitude)
        )

        const markerImage = new kakao.maps.MarkerImage(
          place.type === 'restaurant'
            ? restaurantMarkerIcon
            : studioMarkerIcon,
          markerSize,
          markerOptions
        )

        const marker = new kakao.maps.Marker({
          map,
          position,
          image: markerImage,
          title: place.name,
        })

        kakao.maps.event.addListener(marker, 'click', () => {
          onSelectPlace(place)
        })

        return {
          key: getPlaceKey(place),
          marker,
        }
      })
  }, [onSelectPlace, places])

  // 카드 또는 마커를 선택하면 해당 좌표를 확대해 보여줍니다.
  useEffect(() => {
    const kakao = window.kakao
    const map = mapInstanceRef.current

    if (!kakao || !kakao.maps || !map) return

    if (!selectedPlace) {
      markersRef.current.forEach(({ marker }) => marker.setZIndex(1))
      return
    }

    const selectedPosition = new kakao.maps.LatLng(
      Number(selectedPlace.latitude),
      Number(selectedPlace.longitude)
    )

    map.setLevel(4)
    map.panTo(selectedPosition)

    const selectedKey = getPlaceKey(selectedPlace)

    markersRef.current.forEach(({ key, marker }) => {
      marker.setZIndex(key === selectedKey ? 10 : 1)
    })
  }, [selectedPlace])

  return (
    <div className={styles.wrap}>
      <div ref={mapContainerRef} className={styles.map} />

      {!selectedPlace && (
        <div className={styles.legend} aria-label="지도 마커 안내">
          <span>
            <i className={styles.studioColor} />
            합주실
          </span>
          <span>
            <i className={styles.restaurantColor} />
            주변 맛집
          </span>
        </div>
      )}
    </div>
  )
}

export default KakaoMap
