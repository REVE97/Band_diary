import { useMemo, useState } from 'react'

import KakaoMap from '../components/common/KakaoMap'

import { studioMockList } from '../mocks/studioMock'
import { restaurantMockList } from '../mocks/restaurantMock'

function PlacePage() {
  const [activeTab, setActiveTab] = useState('studio')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // 페이지네이션 데이터 갯수
  const itemsPerPage = 2

  const currentList = useMemo(() => {
    return activeTab === 'studio' ? studioMockList : restaurantMockList
  }, [activeTab])

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

  return (
    <div className="page studio-page">
      {/* 탭 버튼 */}
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

      {/* 데이터 리스트 */}
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
                {place.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 페이지네이션  */}
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
    </div>
  )
}

export default PlacePage