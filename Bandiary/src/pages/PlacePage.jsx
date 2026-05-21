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
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
  })

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
    setErrorMessage('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setPlaceForm(initialForm)
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

  // 입력 데이터 타입 검증
  const validateForm = () => {
    const { name, category, address, price, latitude, longitude, tags } =
      placeForm

    if (!name.trim()) return '이름을 입력해주세요.'
    if (formType === 'restaurant' && !category.trim()) {
      return '음식점 카테고리를 입력해주세요.'
    }
    if (!address.trim()) return '주소를 입력해주세요.'
    if (!price.trim()) return '가격을 입력해주세요.'
    if (!latitude.trim()) return '위도를 입력해주세요.'
    if (!longitude.trim()) return '경도를 입력해주세요.'
    if (!tags.trim()) return '태그를 입력해주세요.'

    if (Number.isNaN(Number(price))) {
      return '가격은 숫자로 입력해주세요.'
    }

    if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      return '위도와 경도는 숫자로 입력해주세요.'
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
        message: '장소 등록 중 오류가 발생했습니다. 입력값 또는 Supabase 설정을 확인해주세요.',
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
          <button
            key={`${place.type}-${place.id}`}
            type="button"
            className={
              selectedPlace?.id === place.id &&
              selectedPlace?.type === place.type
                ? 'studio-card active'
                : 'studio-card'
            }
            onClick={() => handlePlaceClick(place)}
          >
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
          </button>
        ))}
      </div>

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

      <div className="map-box">
        <KakaoMap place={selectedPlace} />
      </div>

      {/* 합주실, 주변 맛집 추가 Modal */}
      {isModalOpen && (
        <PlaceModal
          formType={formType}
          placeForm={placeForm}
          errorMessage={errorMessage}
          onClose={handleCloseModal}
          onSubmit={handleAddPlace}
          onFormTypeChange={handleFormTypeChange}
          onInputChange={handleInputChange}
        />
      )}

      {/* 추가 결과 Modal */}
      {resultModal.isOpen && (
        <PlaceResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={handleCloseResultModal}
        />
      )}
    </div>
  )
}

export default PlacePage