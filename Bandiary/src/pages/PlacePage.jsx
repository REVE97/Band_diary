import { useMemo, useState } from 'react'

import KakaoMap from '../components/common/KakaoMap'

import { studioMockList } from '../mocks/studioMock'
import { restaurantMockList } from '../mocks/restaurantMock'

function PlacePage() {
  const [activeTab, setActiveTab] = useState('studio')
  const [selectedPlace, setSelectedPlace] = useState(null)

  const currentList = useMemo(() => {
    return activeTab === 'studio' ? studioMockList : restaurantMockList
  }, [activeTab])

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    setSelectedPlace(null)
  }

  const handlePlaceClick = (place) => {
    setSelectedPlace(place)
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

      <div className="studio-list">
        {currentList.map((place) => (
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

      <div className="map-box">
        <KakaoMap place={selectedPlace} />
      </div>
    </div>
  )
}

export default PlacePage