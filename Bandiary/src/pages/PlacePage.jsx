import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import KakaoMap from '../components/common/KakaoMap'
import PlaceFilterTabs from '../components/place/PlaceFilterTabs'
import PlaceModal from '../components/place/PlaceModal'
import PlaceResultModal from '../components/place/PlaceResultModal'
import useToast from '../components/common/useToast'
import addIcon from '../assets/images/add.svg'
import filterIcon from '../assets/images/filter.svg'
import parkingPlaceIcon from '../assets/images/place-parking.svg'
import restaurantPlaceIcon from '../assets/images/place-restaurant.svg'
import searchIcon from '../assets/images/search.svg'
import studioPlaceIcon from '../assets/images/place-studio.svg'
import supabase from '../api/supabase'
import { getLoginUserId } from '../features/session'
import styles from './PlacePage.module.css'

// 초기 입력 데이터 초기화
const initialForm = {
  name: '',
  category: '',
  address: '',
  price: '',
  latitude: '',
  longitude: '',
  tags: '',
  favorite: false,
}

const getPlaceKey = (place) => `${place.type}-${place.id}`

const placeLabels = {
  all: '전체',
  studio: '합주실',
  restaurant: '주변 맛집',
  parking: '주차장',
}

const nearbyRestaurantRadius = 1000
const nearbyRestaurantLimit = 5

const getPlaceIcon = (placeType) => {
  if (placeType === 'restaurant') return restaurantPlaceIcon
  if (placeType === 'parking') return parkingPlaceIcon

  return studioPlaceIcon
}

function PlacePage() {
  const { showToast } = useToast()
  // 유저 데이터 호출
  const userId = getLoginUserId()

  // 관리자 여부 확인
  const isAdmin = userId === 'admin'

  const [activeFilter, setActiveFilter] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const mapExplorerRef = useRef(null)
  const searchInputRef = useRef(null)
  const nearbyRequestIdRef = useRef(0)

  const [isNearbyRestaurantsOpen, setIsNearbyRestaurantsOpen] =
    useState(false)
  const [nearbyRestaurantList, setNearbyRestaurantList] = useState([])
  const [isLoadingNearbyRestaurants, setIsLoadingNearbyRestaurants] =
    useState(false)
  const [nearbyRestaurantError, setNearbyRestaurantError] = useState('')

  const [studioList, setStudioList] = useState([])
  const [restaurantList, setRestaurantList] = useState([])
  const [parkingList, setParkingList] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formType, setFormType] = useState('studio')
  const [placeForm, setPlaceForm] = useState(initialForm)
  const [errorMessage, setErrorMessage] = useState('')

  const [placeSearchResults, setPlaceSearchResults] = useState([])
  const [isSearchingPlace, setIsSearchingPlace] = useState(false)

  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
  })

  const [deleteTarget, setDeleteTarget] = useState(null)

  // Supabase studio 테이블 데이터 API 호출
  const getStudio = useCallback(async () => {
    if (!userId) {
      setStudioList([])
      return
    }

    let studioQuery = supabase
      .from('studio')
      .select('*')

    // 관리자는 전체 합주실을 조회하고 일반 사용자는 자신의 합주실만 조회합니다.
    if (!isAdmin) {
      studioQuery = studioQuery.eq('user_id', userId)
    }

    const { data, error } = await studioQuery

    if (error) {
      console.error(error)
    } else {
      setStudioList(data || [])
    }
  }, [isAdmin, userId])

  // Supabase restaurant 테이블 데이터 API 호출
  const getRestaurant = useCallback(async () => {
    if (!userId) {
      setRestaurantList([])
      return
    }

    let restaurantQuery = supabase
      .from('restaurant')
      .select('*')

    // 관리자는 전체 맛집을 조회하고 일반 사용자는 자신의 맛집만 조회합니다.
    if (!isAdmin) {
      restaurantQuery = restaurantQuery.eq('user_id', userId)
    }

    const { data, error } = await restaurantQuery

    if (error) {
      console.error(error)
    } else {
      setRestaurantList(data || [])
    }
  }, [isAdmin, userId])

  // Supabase parking 테이블 데이터 API 호출
  const getParking = useCallback(async () => {
    if (!userId) {
      setParkingList([])
      return
    }

    let parkingQuery = supabase
      .from('parking')
      .select('*')

    // 관리자는 전체 주차장을 조회하고 일반 사용자는 자신의 주차장만 조회합니다.
    if (!isAdmin) {
      parkingQuery = parkingQuery.eq('user_id', userId)
    }

    const { data, error } = await parkingQuery

    if (error) {
      console.error(error)
    } else {
      setParkingList(data || [])
    }
  }, [isAdmin, userId])

  useEffect(() => {
    // Supabase의 초기 장소 목록을 페이지 진입 시 한 번만 조회합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getStudio()
    getRestaurant()
    getParking()
  }, [getParking, getRestaurant, getStudio])

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])

  // 서로 다른 테이블의 데이터를 지도와 목록에서 사용할 공통 형태로 합칩니다.
  const allPlaces = useMemo(() => {
    return [
      ...studioList.map((place) => ({
        ...place,
        type: 'studio',
      })),
      ...restaurantList.map((place) => ({
        ...place,
        type: 'restaurant',
      })),
      ...parkingList.map((place) => ({
        ...place,
        type: 'parking',
      })),
    ]
  }, [parkingList, restaurantList, studioList])

  const placeCounts = useMemo(() => {
    return {
      all: allPlaces.length,
      studio: studioList.length,
      restaurant: restaurantList.length,
      parking: parkingList.length,
    }
  }, [allPlaces.length, parkingList.length, restaurantList.length, studioList.length])

  // 검색어와 장소 유형 필터를 카드 목록과 지도 마커에 함께 적용합니다.
  const filteredPlaces = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLocaleLowerCase()

    return allPlaces.filter((place) => {
      const matchesType =
        activeFilter === 'all' || place.type === activeFilter

      const tagText = Array.isArray(place.tags)
        ? place.tags.join(' ')
        : place.tags || ''

      const searchableText = [
        place.name,
        place.address,
        place.category,
        tagText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()

      const matchesKeyword =
        !normalizedKeyword || searchableText.includes(normalizedKeyword)

      return matchesType && matchesKeyword
    })
  }, [activeFilter, allPlaces, searchKeyword])

  const favoritePlaces = useMemo(() => {
    return filteredPlaces.filter((place) => place.favorite === true)
  }, [filteredPlaces])

  const listTitle =
    activeFilter === 'all' ? '전체 장소' : placeLabels[activeFilter]

  const resetNearbyRestaurants = useCallback(() => {
    nearbyRequestIdRef.current += 1
    setIsNearbyRestaurantsOpen(false)
    setNearbyRestaurantList([])
    setIsLoadingNearbyRestaurants(false)
    setNearbyRestaurantError('')
  }, [])

  const handleFilterChange = (filterValue) => {
    setActiveFilter(filterValue)
    setSelectedPlace(null)
    setIsFilterOpen(false)
    resetNearbyRestaurants()
  }

  const handleSearchKeywordChange = (event) => {
    setSearchKeyword(event.target.value)
    setSelectedPlace(null)
    resetNearbyRestaurants()
  }

  const handleToggleSearch = () => {
    setIsFilterOpen(false)
    setIsSearchOpen((prev) => !prev)
  }

  const handleToggleFilter = () => {
    setIsSearchOpen(false)
    setIsFilterOpen((prev) => !prev)
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsSearchOpen(false)
    }
  }

  const handlePlaceClick = useCallback(
    (place) => {
      setSelectedPlace(place)
      resetNearbyRestaurants()
    },
    [resetNearbyRestaurants]
  )

  // 목록에서 장소를 선택하면 해당 마커를 표시하고 지도 영역으로 이동합니다.
  const handlePlaceCardClick = useCallback(
    (place) => {
      setSelectedPlace(place)
      resetNearbyRestaurants()
      mapExplorerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    },
    [resetNearbyRestaurants]
  )

  const handleClearSelectedPlace = useCallback(() => {
    setSelectedPlace(null)
    resetNearbyRestaurants()
  }, [resetNearbyRestaurants])

  const handleOpenKakaoRoute = (event, place) => {
    event.stopPropagation()

    const routeUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
      place.name
    )},${place.latitude},${place.longitude}`

    window.location.href = routeUrl
  }

  const searchNearbyRestaurants = (place) => {
    return new Promise((resolve, reject) => {
      const kakao = window.kakao

      if (!kakao || !kakao.maps || !kakao.maps.services) {
        reject(
          new Error(
            '카카오맵 services 라이브러리가 로드되지 않았습니다.'
          )
        )
        return
      }

      const latitude = Number(place.latitude)
      const longitude = Number(place.longitude)

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        reject(new Error('선택한 장소의 위치 정보가 올바르지 않습니다.'))
        return
      }

      const places = new kakao.maps.services.Places()
      const location = new kakao.maps.LatLng(latitude, longitude)

      places.categorySearch(
        'FD6',
        (result, status) => {
          if (status === kakao.maps.services.Status.OK) {
            resolve(result.slice(0, nearbyRestaurantLimit))
            return
          }

          if (status === kakao.maps.services.Status.ZERO_RESULT) {
            resolve([])
            return
          }

          reject(new Error('주변 맛집을 불러오지 못했습니다.'))
        },
        {
          location,
          radius: nearbyRestaurantRadius,
          size: nearbyRestaurantLimit,
          sort: kakao.maps.services.SortBy.DISTANCE,
        }
      )
    })
  }

  const handleToggleNearbyRestaurants = async () => {
    if (!selectedPlace) return

    if (isNearbyRestaurantsOpen) {
      nearbyRequestIdRef.current += 1
      setIsNearbyRestaurantsOpen(false)
      setIsLoadingNearbyRestaurants(false)
      return
    }

    setIsNearbyRestaurantsOpen(true)
    setNearbyRestaurantError('')

    if (nearbyRestaurantList.length > 0) return

    const requestId = nearbyRequestIdRef.current + 1
    nearbyRequestIdRef.current = requestId
    setIsLoadingNearbyRestaurants(true)

    try {
      const results = await searchNearbyRestaurants(selectedPlace)

      if (nearbyRequestIdRef.current !== requestId) return

      setNearbyRestaurantList(results)
    } catch (error) {
      if (nearbyRequestIdRef.current !== requestId) return

      console.error(error)
      setNearbyRestaurantList([])
      setNearbyRestaurantError(error.message)
    } finally {
      if (nearbyRequestIdRef.current === requestId) {
        setIsLoadingNearbyRestaurants(false)
      }
    }
  }

  const getNearbyRestaurantCategory = (restaurant) => {
    const categories = restaurant.category_name?.split(' > ') || []

    return categories.at(-1) || '음식점'
  }

  const getNearbyRestaurantDistance = (restaurant) => {
    const distance = Number(restaurant.distance)

    if (!Number.isFinite(distance)) return ''
    if (distance < 1000) return `${distance.toLocaleString()}m`

    return `${(distance / 1000).toFixed(1)}km`
  }

  const handleOpenNearbyRestaurant = (event, restaurant) => {
    event.stopPropagation()

    if (!restaurant.place_url) return

    window.open(restaurant.place_url, '_blank', 'noopener,noreferrer')
  }

  const handleOpenModal = () => {
    setFormType(activeFilter === 'all' ? 'studio' : activeFilter)
    setPlaceForm(initialForm)
    setPlaceSearchResults([])
    setErrorMessage('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setPlaceForm(initialForm)
    setPlaceSearchResults([])
    setErrorMessage('')
  }

  const handleCloseResultModal = () => {
    setResultModal({
      isOpen: false,
      type: '',
      title: '',
      message: '',
    })
  }

  const handleFormTypeChange = (event) => {
    setFormType(event.target.value)
    setPlaceForm(initialForm)
    setPlaceSearchResults([])
    setErrorMessage('')
  }

  const handleInputChange = (event) => {
    const { checked, name, type, value } = event.target

    setPlaceForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setErrorMessage('')
  }

  // 카카오 장소명 검색
  const searchPlacesByKeyword = (keyword) => {
    return new Promise((resolve, reject) => {
      const kakao = window.kakao

      if (
        !kakao ||
        !kakao.maps ||
        !kakao.maps.services
      ) {
        reject(
          new Error(
            '카카오맵 services 라이브러리가 로드되지 않았습니다.'
          )
        )

        return
      }

      const places = new kakao.maps.services.Places()

      places.keywordSearch(keyword, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          resolve(result)
          return
        }

        if (status === kakao.maps.services.Status.ZERO_RESULT) {
          reject(new Error('검색 결과가 없습니다.'))
          return
        }

        reject(new Error('장소 검색 중 오류가 발생했습니다.'))
      })
    })
  }

  // 장소명 검색 버튼 클릭
  const handleSearchPlaceKeyword = async (keyword) => {
    if (!keyword.trim()) {
      setErrorMessage('검색할 장소명을 입력해주세요.')
      return
    }

    setIsSearchingPlace(true)
    setErrorMessage('')

    try {
      const results = await searchPlacesByKeyword(keyword.trim())

      setPlaceSearchResults(results.slice(0, 5))
    } catch (error) {
      console.error(error)

      setPlaceSearchResults([])
      setErrorMessage(error.message)
    } finally {
      setIsSearchingPlace(false)
    }
  }

  // 카카오 검색 결과 선택
  const handleSelectSearchPlace = (searchedPlace) => {
    const address =
      searchedPlace.road_address_name || searchedPlace.address_name || ''

    setPlaceForm((prev) => ({
      ...prev,
      name: searchedPlace.place_name,
      address,
      latitude: searchedPlace.y,
      longitude: searchedPlace.x,
    }))

    setPlaceSearchResults([])
    setErrorMessage('')
  }

  // 삭제 확인 모달 열기
  const handleOpenDeleteModal = (event, place) => {
    event.stopPropagation()

    // 관리자만 삭제 가능
    if (!isAdmin) return

    setDeleteTarget(place)
  }

  // 삭제 확인 모달 닫기
  const handleCloseDeleteModal = () => {
    setDeleteTarget(null)
  }

  // 입력 데이터 타입 검증
  const validateForm = () => {
    const {
      name,
      category,
      address,
      price,
      latitude,
      longitude,
      tags,
    } = placeForm

    if (!name.trim()) {
      return '장소를 검색하고 선택해주세요.'
    }

    if (!address.trim()) {
      return '장소 검색 결과에서 주소를 선택해주세요.'
    }

    if (!latitude || !longitude) {
      return '장소 검색 결과를 선택해야 지도 위치가 등록됩니다.'
    }

    if (formType === 'restaurant' && !category.trim()) {
      return '음식점 카테고리를 입력해주세요.'
    }

    if (!price.trim()) {
      return '가격을 입력해주세요.'
    }

    if (!tags.trim()) {
      return '태그를 입력해주세요.'
    }

    if (Number.isNaN(Number(price))) {
      return '가격은 숫자로 입력해주세요.'
    }

    if (
      Number.isNaN(Number(latitude)) ||
      Number.isNaN(Number(longitude))
    ) {
      return '선택한 장소의 위도와 경도 값이 올바르지 않습니다.'
    }

    return ''
  }

  // 합주실, 주변 맛집, 주차장 데이터 입력 API 호출
  const handleAddPlace = async () => {
    const validationMessage = validateForm()

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    if (!userId) {
      setErrorMessage('로그인 사용자 정보를 찾을 수 없습니다.')
      return
    }

    const tags = placeForm.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    const commonPayload = {
      type: formType,
      name: placeForm.name.trim(),
      address: placeForm.address.trim(),
      price: Number(placeForm.price),
      latitude: Number(placeForm.latitude),
      longitude: Number(placeForm.longitude),
      tags,
      favorite: Boolean(placeForm.favorite),
      user_id: userId,
    }

    const payload =
      formType === 'restaurant'
        ? {
            ...commonPayload,
            category: placeForm.category.trim(),
          }
        : {
            ...commonPayload,
            timeUnit: '1시간',
          }

    const tableName = formType

    const { error } = await supabase.from(tableName).insert([payload])

    if (error) {
      console.error(error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '등록 실패',
        message:
          '장소 등록 중 오류가 발생했습니다. 입력값 또는 Supabase 설정을 확인해주세요.',
      })

      return
    }

    if (formType === 'studio') {
      await getStudio()
    } else if (formType === 'restaurant') {
      await getRestaurant()
    } else {
      await getParking()
    }

    setActiveFilter(formType)
    setSearchKeyword('')
    setSelectedPlace(null)
    resetNearbyRestaurants()
    handleCloseModal()

    showToast(`${placeLabels[formType]}이 등록되었습니다.`)
  }

  // 합주실, 주변 맛집, 주차장 데이터 삭제 API 호출
  const handleDeletePlace = async () => {
    // 관리자만 삭제 가능
    if (!isAdmin || !deleteTarget) return

    const tableName = deleteTarget.type

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      console.error(error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '삭제 실패',
        message:
          '장소 삭제 중 오류가 발생했습니다. Supabase 설정을 확인해주세요.',
      })

      setDeleteTarget(null)
      return
    }

    if (deleteTarget.type === 'studio') {
      await getStudio()
    } else if (deleteTarget.type === 'restaurant') {
      await getRestaurant()
    } else {
      await getParking()
    }

    if (
      selectedPlace &&
      getPlaceKey(selectedPlace) === getPlaceKey(deleteTarget)
    ) {
      setSelectedPlace(null)
      resetNearbyRestaurants()
    }

    showToast('장소가 삭제되었습니다.')

    setDeleteTarget(null)
  }

  const getPlacePriceText = (place) => {
    const price = Number(place.price || 0).toLocaleString()

    if (place.type !== 'restaurant') {
      return `₩ ${price} / ${place.timeUnit || '1시간'}`
    }

    return `${place.category || '맛집'} · 평균 ₩ ${price}`
  }

  const renderPlaceCard = (place, isFavoriteSection = false) => {
    const isSelected =
      selectedPlace && getPlaceKey(selectedPlace) === getPlaceKey(place)

    return (
      <article
        key={`${isFavoriteSection ? 'favorite' : 'place'}-${getPlaceKey(
          place
        )}`}
        className={`${styles.placeCard} ${
          isSelected ? styles.active : ''
        } ${isFavoriteSection ? styles.favoriteCard : ''} ${
          isAdmin ? styles.placeCardWithActions : ''
        }`}
      >
        <button
          type="button"
          className={styles.cardSelectButton}
          onClick={() => handlePlaceCardClick(place)}
          aria-label={`${place.name} 지도에서 보기`}
        >
          <span
            className={`${styles.placeIcon} ${
              place.type === 'restaurant'
                ? styles.restaurantIcon
                : place.type === 'parking'
                  ? styles.parkingIcon
                  : ''
            }`}
            aria-hidden="true"
          >
            <img
              src={getPlaceIcon(place.type)}
              alt=""
              aria-hidden="true"
            />
          </span>

          <span className={styles.placeInfo}>
            <strong>{place.name}</strong>
            <span className={styles.price}>{getPlacePriceText(place)}</span>
            <span className={styles.address}>{place.address}</span>

            {Array.isArray(place.tags) && place.tags.length > 0 && (
              <span className={styles.tagRow}>
                {place.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </span>
            )}
          </span>
        </button>

        {isAdmin && (
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={(event) => handleOpenDeleteModal(event, place)}
              aria-label={`${place.name} 삭제`}
            >
              삭제
            </button>
          </div>
        )}
      </article>
    )
  }

  return (
    <div className={styles.page}>
      <section
        ref={mapExplorerRef}
        className={`${styles.mapExplorer} ${
          isNearbyRestaurantsOpen
            ? styles.mapExplorerRecommendationsOpen
            : ''
        }`}
        aria-label="장소 지도 탐색"
      >
        <div className={styles.mapControls}>
          {isSearchOpen ? (
            <div className={styles.searchField}>
              <button
                type="button"
                className={styles.searchCollapseButton}
                onClick={handleToggleSearch}
                aria-label="장소 검색 닫기"
              >
                <img src={searchIcon} alt="" aria-hidden="true" />
              </button>

              <input
                ref={searchInputRef}
                type="search"
                value={searchKeyword}
                placeholder="장소명, 주소 또는 태그 검색"
                aria-label="장소명, 주소 또는 태그 검색"
                onChange={handleSearchKeywordChange}
                onKeyDown={handleSearchKeyDown}
              />

              <button
                type="button"
                className={styles.searchCloseButton}
                onClick={handleToggleSearch}
              >
                닫기
              </button>
            </div>
          ) : (
            <div
              className={styles.compactMapControls}
              aria-label="장소 검색 및 필터"
            >
              <button
                type="button"
                className={`${styles.mapControlIconButton} ${
                  searchKeyword.trim()
                    ? styles.mapControlIconButtonActive
                    : ''
                }`}
                onClick={handleToggleSearch}
                aria-label={
                  searchKeyword.trim()
                    ? `장소 검색 열기, 현재 검색어 ${searchKeyword}`
                    : '장소 검색 열기'
                }
                aria-expanded={false}
              >
                <img src={searchIcon} alt="" aria-hidden="true" />
              </button>

              <button
                type="button"
                className={styles.activeFilterButton}
                onClick={handleToggleFilter}
                aria-expanded={isFilterOpen}
                aria-controls="place-filter-popover"
              >
                <span>{placeLabels[activeFilter]}</span>
              </button>

              <button
                type="button"
                className={`${styles.mapControlIconButton} ${
                  isFilterOpen ? styles.filterButtonActive : ''
                }`}
                onClick={handleToggleFilter}
                aria-label="장소 유형 필터"
                aria-expanded={isFilterOpen}
                aria-controls="place-filter-popover"
              >
                <img
                  src={filterIcon}
                  className={styles.filterIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              {isFilterOpen && (
                <PlaceFilterTabs
                  id="place-filter-popover"
                  activeFilter={activeFilter}
                  counts={placeCounts}
                  onChange={handleFilterChange}
                />
              )}
            </div>
          )}
        </div>

        <div className={styles.mapBox}>
          <KakaoMap
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handlePlaceClick}
            onClearSelection={handleClearSelectedPlace}
          />
        </div>

        {selectedPlace && (
          <aside
            className={styles.selectedMapCard}
            aria-label="선택한 장소"
            aria-live="polite"
          >
            <div className={styles.selectedMapTopRow}>
              <div className={styles.selectedMapSummary}>
                <span
                  className={`${styles.selectedMapIcon} ${
                    selectedPlace.type === 'restaurant'
                      ? styles.restaurantIcon
                      : selectedPlace.type === 'parking'
                        ? styles.parkingIcon
                        : ''
                  }`}
                  aria-hidden="true"
                >
                  <img
                    src={getPlaceIcon(selectedPlace.type)}
                    alt=""
                    aria-hidden="true"
                  />
                </span>

                <div className={styles.selectedMapInfo}>
                  <strong>{selectedPlace.name}</strong>
                  <span>{getPlacePriceText(selectedPlace)}</span>
                  <small>{selectedPlace.address}</small>
                </div>
              </div>

              <div className={styles.selectedMapActions}>
                <button
                  type="button"
                  className={styles.selectedMapRouteButton}
                  onClick={(event) =>
                    handleOpenKakaoRoute(event, selectedPlace)
                  }
                >
                  길찾기
                </button>

                <button
                  type="button"
                  className={styles.selectedMapRecommendButton}
                  onClick={handleToggleNearbyRestaurants}
                  aria-expanded={isNearbyRestaurantsOpen}
                  aria-controls="nearby-restaurant-recommendations"
                >
                  {isNearbyRestaurantsOpen ? '추천 닫기' : '주변 맛집'}
                </button>
              </div>

              <button
                type="button"
                className={styles.selectedMapCloseButton}
                onClick={handleClearSelectedPlace}
                aria-label="선택한 장소 닫기"
              >
                ×
              </button>
            </div>

            {isNearbyRestaurantsOpen && (
              <section
                id="nearby-restaurant-recommendations"
                className={styles.nearbyRecommendations}
                aria-label="주변 맛집 추천"
                aria-live="polite"
              >
                <div className={styles.nearbyRecommendationsHeader}>
                  <strong>주변 맛집</strong>
                  <span>반경 1km · 거리순</span>
                </div>

                {isLoadingNearbyRestaurants && (
                  <div className={styles.nearbyRecommendationStatus}>
                    주변 맛집을 찾고 있습니다.
                  </div>
                )}

                {!isLoadingNearbyRestaurants && nearbyRestaurantError && (
                  <div
                    className={`${styles.nearbyRecommendationStatus} ${styles.nearbyRecommendationError}`}
                  >
                    {nearbyRestaurantError}
                  </div>
                )}

                {!isLoadingNearbyRestaurants &&
                  !nearbyRestaurantError &&
                  nearbyRestaurantList.length === 0 && (
                    <div className={styles.nearbyRecommendationStatus}>
                      반경 1km 안에 추천할 맛집이 없습니다.
                    </div>
                  )}

                {nearbyRestaurantList.length > 0 && (
                  <div className={styles.nearbyRecommendationList}>
                    {nearbyRestaurantList.map((restaurant, index) => (
                      <article
                        key={restaurant.id}
                        className={styles.nearbyRecommendationCard}
                      >
                        <div className={styles.nearbyRecommendationTitleRow}>
                          <span
                            className={styles.nearbyRecommendationNumber}
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          <strong>{restaurant.place_name}</strong>
                        </div>

                        <div className={styles.nearbyRecommendationMeta}>
                          <span>
                            {getNearbyRestaurantCategory(restaurant)}
                          </span>
                          {getNearbyRestaurantDistance(restaurant) && (
                            <span>
                              {getNearbyRestaurantDistance(restaurant)}
                            </span>
                          )}
                        </div>

                        <address>{
                          restaurant.road_address_name ||
                          restaurant.address_name
                        }</address>

                        <div className={styles.nearbyRecommendationActions}>
                          <button
                            type="button"
                            onClick={(event) =>
                              handleOpenNearbyRestaurant(event, restaurant)
                            }
                            disabled={!restaurant.place_url}
                          >
                            상세보기
                          </button>
                          <button
                            type="button"
                            onClick={(event) =>
                              handleOpenKakaoRoute(event, {
                                name: restaurant.place_name,
                                latitude: restaurant.y,
                                longitude: restaurant.x,
                              })
                            }
                          >
                            길찾기
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </aside>
        )}
      </section>

      <section className={styles.placeSheet} aria-label="장소 목록">
        <div className={styles.sheetHandle} aria-hidden="true" />

        <section className={styles.placeSection}>
          <div className={styles.sectionHeader}>
            <h2>자주 이용하는 장소</h2>
          </div>

          {favoritePlaces.length > 0 ? (
            <div className={styles.favoriteList}>
              {favoritePlaces.map((place) => renderPlaceCard(place, true))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              현재 조건에 맞는 자주 이용하는 장소가 없습니다.
            </div>
          )}
        </section>

        <section className={styles.placeSection}>
          <div className={styles.sectionHeader}>
            <h2>{listTitle}</h2>
          </div>

          {filteredPlaces.length > 0 ? (
            <div className={styles.placeList}>
              {filteredPlaces.map((place) => renderPlaceCard(place))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              검색 조건에 맞는 장소가 없습니다.
            </div>
          )}
        </section>
      </section>

      <button
        type="button"
        className={styles.placeAddButton}
        data-floating-add-button
        onClick={handleOpenModal}
        aria-label="장소 추가"
      >
        <img src={addIcon} alt="" aria-hidden="true" />
      </button>

      {/* 합주실, 주변 맛집, 주차장 추가 Modal */}
      {isModalOpen && (
        <PlaceModal
          formType={formType}
          placeForm={placeForm}
          placeSearchResults={placeSearchResults}
          isSearchingPlace={isSearchingPlace}
          errorMessage={errorMessage}
          onClose={handleCloseModal}
          onSubmit={handleAddPlace}
          onFormTypeChange={handleFormTypeChange}
          onInputChange={handleInputChange}
          onSearchPlace={handleSearchPlaceKeyword}
          onSelectSearchPlace={handleSelectSearchPlace}
        />
      )}

      {/* 추가/삭제 결과 Modal */}
      {resultModal.isOpen && (
        <PlaceResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={handleCloseResultModal}
        />
      )}

      {/* 삭제 확인 Modal */}
      {isAdmin && deleteTarget && (
        <PlaceResultModal
          type="confirm"
          title="삭제 확인"
          message={`${deleteTarget.name} 데이터를 삭제하시겠습니까?`}
          confirmText="삭제"
          cancelText="취소"
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeletePlace}
        />
      )}
    </div>
  )
}

export default PlacePage
