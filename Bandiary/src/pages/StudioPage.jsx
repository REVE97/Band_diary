import { useState } from 'react'

import KakaoMap from '../components/common/KakaoMap'
import { studioMockList } from '../mocks/studioMock'

function StudioPage() {
  const [selectedStudio, setSelectedStudio] = useState(studioMockList[0])

  const handleStudioClick = (studio) => {
    setSelectedStudio(studio)
  }

  return (
    <div className="page studio-page">
      <div className="tab-row">
        <button className="active">합주실</button>
        <button>주변 맛집</button>
      </div>

      <div className="studio-list">
        {studioMockList.map((studio) => (
          <button
            key={studio.id}
            type="button"
            className={
              selectedStudio.id === studio.id
                ? 'studio-card active'
                : 'studio-card'
            }
            onClick={() => handleStudioClick(studio)}
          >
            
            <div className="studio-info">
              <strong>{studio.name}</strong>
              <span>
                ₩ {studio.price.toLocaleString()} / {studio.timeUnit}
              </span>

              <div className="tag-row">
                {studio.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              
            </div>
          </button>
        ))}
      </div>

      <div className="map-box">
        <KakaoMap studio={selectedStudio} />
      </div>
    </div>
  )
}

export default StudioPage