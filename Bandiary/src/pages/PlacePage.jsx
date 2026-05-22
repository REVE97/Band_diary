import { useMemo, useState, useEffect } from 'react'

import KakaoMap from '../components/common/KakaoMap'
import PlaceModal from '../components/place/PlaceModal'
import PlaceResultModal from '../components/place/PlaceResultModal'
import supabase from '../api/supabase'

// 초기 입력 데이터 초기화
const initialForm = {
  name: '',
  category: '',
  address: '',
  price: '',
  latitude: '',
  longitude: '',
  tags: '',
}

function PlacePage() {
  const [activeTab, setActiveTab] = useState('studio')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

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
    const { data, error } = await supabase.from('studio').select('*')

    if (error) {
      console.error(error)
    } else {
      setStudioList(data)
    }
  }

  // Supabase restaurant 테이블 데이터 API 호출
  const getRestaurant = async () => {
    const { data, error } = await supabase.from('restaurant').select('*')

    if (error) {
      console.error(error)
    } else {
      setRestaurantList(data)
    }
  }

  useEffect(() => {
    getStudio()
    getRestaurant()
  }, [])

  // 페이지네이션 목록 갯수
  const itemsPerPage = 2

  const currentList = useMemo(() => {
    return activeTab === 'studio' ? studioList : restaurantList
  }, [activeTab, studioList, restaurantList])

  const totalPages = Math.ceil(currentList.length / itemsPerPage)

  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    return currentList.slice(startIndex, endIndex)
  }, [currentList, currentPage])

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }, [totalPages])

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    setSelectedPlace(null)
    setCurrentPage(1)
  }

  const handlePlaceClick = (place) => {
    setSelectedPlace(place)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedPlace(null)
  }

  const handlePrevPage = () => {
    if (currentPage === 1) return

    setCurrentPage((prev) => prev - 1)
    setSelectedPlace(null)
  }

  const handleNextPage = () => {
    if (currentPage === totalPages) return

    setCurrentPage((prev) => prev + 1)
    setSelectedPlace(null)
  }

  const handleOpenModal = () => {
    setFormType(activeTab)
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
    const { name, value } = event.target

    setPlaceForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrorMessage('')
  }

  // 카카오 장소명 검색
  const searchPlacesByKeyword = (keyword) => {
    return new Promise((resolve, reject) => {
      const kakao = window.kakao

      if (!kakao || !kakao.maps || !kakao.maps.services) {
        reject(new Error('카카오맵 services 라이브러리가 로드되지 않았습니다.'))
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
    setDeleteTarget(place)
  }

  // 삭제 확인 모달 닫기
  const handleCloseDeleteModal = () => {
    setDeleteTarget(null)
  }

  // 입력 데이터 타입 검증
  const validateForm = () => {
    const { name, category, address, price, latitude, longitude, tags } =
      placeForm

    if (!name.trim()) return '장소를 검색하고 선택해주세요.'
    if (!address.trim()) return '장소 검색 결과에서 주소를 선택해주세요.'
    if (!latitude || !longitude) {
      return '장소 검색 결과를 선택해야 지도 위치가 등록됩니다.'
    }

    if (formType === 'restaurant' && !category.trim()) {
      return '음식점 카테고리를 입력해주세요.'
    }

    if (!price.trim()) return '가격을 입력해주세요.'
    if (!tags.trim()) return '태그를 입력해주세요.'

    if (Number.isNaN(Number(price))) {
      return '가격은 숫자로 입력해주세요.'
    }

    if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
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
      setActiveTab('studio')
    } else {
      await getRestaurant()
      setActiveTab('restaurant')
    }

    setCurrentPage(1)
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
    if (!deleteTarget) return

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
      selectedPlace?.id === deleteTarget.id &&
      selectedPlace?.type === deleteTarget.type
    ) {
      setSelectedPlace(null)
    }

    const nextTotalItems = currentList.length - 1
    const nextTotalPages = Math.ceil(nextTotalItems / itemsPerPage)

    if (currentPage > nextTotalPages && currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }

    setResultModal({
      isOpen: true,
      type: 'success',
      title: '삭제 완료',
      message: `${deleteTarget.name} 데이터가 삭제되었습니다.`,
    })

    setDeleteTarget(null)
  }

  return (
    <div className="page studio-page">
      <div className="tab-row">
        <button
          type="button"
          className={activeTab === 'studio' ? 'active' : ''}
          onClick={() => handleTabClick('studio')}
        >
          합주실
        </button>

        <button
          type="button"
          className={activeTab === 'restaurant' ? 'active' : ''}
          onClick={() => handleTabClick('restaurant')}
        >
          주변 맛집
        </button>
      </div>

      <button
        type="button"
        className="place-add-button"
        onClick={handleOpenModal}
        aria-label="장소 추가"
      >
        +
      </button>

      <div className="studio-list">
        {paginatedList.map((place) => (
          <div
            key={`${place.type}-${place.id}`}
            role="button"
            tabIndex={0}
            className={
              selectedPlace?.id === place.id &&
              selectedPlace?.type === place.type
                ? 'studio-card active'
                : 'studio-card'
            }
            onClick={() => handlePlaceClick(place)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handlePlaceClick(place)
              }
            }}
          >
            <button
              type="button"
              className="studio-delete-button"
              onClick={(event) => handleOpenDeleteModal(event, place)}
              aria-label={`${place.name} 삭제`}
            >
              -
            </button>

            <div className="studio-info">
              <strong>{place.name}</strong>

              {activeTab === 'studio' ? (
                <span>
                  ₩ {place.price.toLocaleString()} / {place.timeUnit}
                </span>
              ) : (
                <span>
                  {place.category} · 평균 ₩ {place.price.toLocaleString()}
                </span>
              )}

              <div className="tag-row">
                {place.tags?.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={handlePrevPage}
          >
            이전
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              className={currentPage === page ? 'active' : ''}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={handleNextPage}
          >
            다음
          </button>
        </div>
      )}

      {/* 카카오맵 */}
      <div className="map-box">
        <KakaoMap place={selectedPlace} />
      </div>

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
      {deleteTarget && (
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