import { useCallback, useEffect, useMemo, useState } from 'react'

import KakaoMap from '../components/common/KakaoMap'
import PlaceFilterTabs from '../components/place/PlaceFilterTabs'
import PlaceModal from '../components/place/PlaceModal'
import PlaceResultModal from '../components/place/PlaceResultModal'
import restaurantPlaceIcon from '../assets/images/place-restaurant.svg'
import searchIcon from '../assets/images/search.svg'
import studioPlaceIcon from '../assets/images/place-studio.svg'
import supabase from '../api/supabase'
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

function PlacePage() {
  // 유저 데이터 호출
  const storageInfo = JSON.parse(
    sessionStorage.getItem('bandiaryLoginUser')
  )

  // 관리자 여부 확인
  const isAdmin = storageInfo?.userId === 'admin'

  const [activeFilter, setActiveFilter] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)

  const [studioList, setStudioList] = useState([])
  const [restaurantList, setRestaurantList] = useState([])

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
  const getStudio = async () => {
    const { data, error } = await supabase
      .from('studio')
      .select('*')

    if (error) {
      console.error(error)
    } else {
      setStudioList(data || [])
    }
  }

  // Supabase restaurant 테이블 데이터 API 호출
  const getRestaurant = async () => {
    const { data, error } = await supabase
      .from('restaurant')
      .select('*')

    if (error) {
      console.error(error)
    } else {
      setRestaurantList(data || [])
    }
  }

  useEffect(() => {
    // Supabase의 초기 장소 목록을 페이지 진입 시 한 번만 조회합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getStudio()
    getRestaurant()
  }, [])

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
    ]
  }, [restaurantList, studioList])

  const placeCounts = useMemo(() => {
    return {
      all: allPlaces.length,
      studio: studioList.length,
      restaurant: restaurantList.length,
    }
  }, [allPlaces.length, restaurantList.length, studioList.length])

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
    activeFilter === 'studio'
      ? '합주실'
      : activeFilter === 'restaurant'
        ? '주변 맛집'
        : '전체 장소'

  const handleFilterChange = (filterValue) => {
    setActiveFilter(filterValue)
    setSelectedPlace(null)
  }

  const handleSearchKeywordChange = (event) => {
    setSearchKeyword(event.target.value)
    setSelectedPlace(null)
  }

  const handlePlaceClick = useCallback((place) => {
    setSelectedPlace(place)
  }, [])

  const handleOpenKakaoRoute = (event, place) => {
    event.stopPropagation()

    const routeUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
      place.name
    )},${place.latitude},${place.longitude}`

    window.location.href = routeUrl
  }

  const handleOpenModal = () => {
    setFormType(activeFilter === 'restaurant' ? 'restaurant' : 'studio')
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

  // 합주실, 주변 맛집 데이터 입력 API 호출
  const handleAddPlace = async () => {
    const validationMessage = validateForm()

    if (validationMessage) {
      setErrorMessage(validationMessage)
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
    }

    const payload =
      formType === 'studio'
        ? {
            ...commonPayload,
            timeUnit: '1시간',
          }
        : {
            ...commonPayload,
            category: placeForm.category.trim(),
          }

    const tableName = formType === 'studio' ? 'studio' : 'restaurant'

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
    } else {
      await getRestaurant()
    }

    setActiveFilter(formType)
    setSearchKeyword('')
    setSelectedPlace(null)
    handleCloseModal()

    setResultModal({
      isOpen: true,
      type: 'success',
      title: '등록 완료',
      message:
        formType === 'studio'
          ? '합주실 데이터가 성공적으로 등록되었습니다.'
          : '주변 맛집 데이터가 성공적으로 등록되었습니다.',
    })
  }

  // 합주실, 주변 맛집 데이터 삭제 API 호출
  const handleDeletePlace = async () => {
    // 관리자만 삭제 가능
    if (!isAdmin || !deleteTarget) return

    const tableName =
      deleteTarget.type === 'studio' ? 'studio' : 'restaurant'

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
    } else {
      await getRestaurant()
    }

    if (
      selectedPlace &&
      getPlaceKey(selectedPlace) === getPlaceKey(deleteTarget)
    ) {
      setSelectedPlace(null)
    }

    setResultModal({
      isOpen: true,
      type: 'success',
      title: '삭제 완료',
      message: `${deleteTarget.name} 데이터가 삭제되었습니다.`,
    })

    setDeleteTarget(null)
  }

  const getPlacePriceText = (place) => {
    const price = Number(place.price || 0).toLocaleString()

    if (place.type === 'studio') {
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
        } ${isFavoriteSection ? styles.favoriteCard : ''}`}
      >
        <button
          type="button"
          className={styles.cardSelectButton}
          onClick={() => handlePlaceClick(place)}
          aria-label={`${place.name} 지도에서 보기`}
        >
          <span
            className={`${styles.placeIcon} ${
              place.type === 'restaurant' ? styles.restaurantIcon : ''
            }`}
            aria-hidden="true"
          >
            <img
              src={
                place.type === 'restaurant'
                  ? restaurantPlaceIcon
                  : studioPlaceIcon
              }
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

        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.routeButton}
            onClick={(event) => handleOpenKakaoRoute(event, place)}
            aria-label={`${place.name} 카카오맵 길찾기`}
          >
            길찾기
          </button>

          {isAdmin && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={(event) => handleOpenDeleteModal(event, place)}
              aria-label={`${place.name} 삭제`}
            >
              삭제
            </button>
          )}
        </div>
      </article>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.mapExplorer} aria-label="장소 지도 탐색">
        <div className={styles.mapControls}>
          <label className={styles.searchField}>
            <img src={searchIcon} alt="" aria-hidden="true" />
            <input
              type="search"
              value={searchKeyword}
              placeholder="합주실 또는 주변 맛집 검색"
              aria-label="장소명, 주소 또는 태그 검색"
              onChange={handleSearchKeywordChange}
            />
          </label>

          <PlaceFilterTabs
            activeFilter={activeFilter}
            counts={placeCounts}
            onChange={handleFilterChange}
          />
        </div>

        <div className={styles.mapBox}>
          <KakaoMap
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handlePlaceClick}
          />
        </div>
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
        onClick={handleOpenModal}
        aria-label="장소 추가"
      >
        +
      </button>

      {/* 합주실, 주변 맛집 추가 Modal */}
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
