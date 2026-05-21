import { useEffect, useState } from 'react'

function PlaceModal({
  formType,
  placeForm,
  errorMessage,
  onClose,
  onSubmit,
  onFormTypeChange,
  onInputChange,
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepErrorMessage, setStepErrorMessage] = useState('')

  const isStudio = formType === 'studio'
  const isRestaurant = formType === 'restaurant'

  const isBasicInfoFilled = isStudio
    ? placeForm.name.trim() && placeForm.address.trim()
    : placeForm.name.trim() &&
      placeForm.category.trim() &&
      placeForm.address.trim()

  const isPriceFilled = placeForm.price.trim()

  const isLocationFilled =
    placeForm.latitude.trim() && placeForm.longitude.trim()

  const isTagsFilled = placeForm.tags.trim()

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return Boolean(isBasicInfoFilled)
    }

    if (currentStep === 2) {
      return Boolean(isPriceFilled)
    }

    if (currentStep === 3) {
      return Boolean(isLocationFilled)
    }

    if (currentStep === 4) {
      return Boolean(isTagsFilled)
    }

    return true
  }

  const getStepErrorMessage = () => {
    if (currentStep === 1) {
      if (!placeForm.name.trim()) {
        return isStudio ? '합주실 이름을 입력해주세요.' : '맛집 이름을 입력해주세요.'
      }

      if (isRestaurant && !placeForm.category.trim()) {
        return '카테고리를 입력해주세요.'
      }

      if (!placeForm.address.trim()) {
        return '주소를 입력해주세요.'
      }
    }

    if (currentStep === 2) {
      if (!placeForm.price.trim()) {
        return isStudio ? '시간당 가격을 입력해주세요.' : '평균 가격을 입력해주세요.'
      }

      if (Number.isNaN(Number(placeForm.price))) {
        return '가격은 숫자로 입력해주세요.'
      }
    }

    if (currentStep === 3) {
      if (!placeForm.latitude.trim()) {
        return '위도를 입력해주세요.'
      }

      if (!placeForm.longitude.trim()) {
        return '경도를 입력해주세요.'
      }

      if (
        Number.isNaN(Number(placeForm.latitude)) ||
        Number.isNaN(Number(placeForm.longitude))
      ) {
        return '위도와 경도는 숫자로 입력해주세요.'
      }
    }

    if (currentStep === 4) {
      if (!placeForm.tags.trim()) {
        return '태그를 입력해주세요. (,로 구분) ex) 주차 가능,직원 상주'
      }
    }

    return ''
  }

  useEffect(() => {
    setCurrentStep(1)
    setStepErrorMessage('')
  }, [formType])

  const handleNextStep = () => {
    const validationMessage = getStepErrorMessage()

    if (validationMessage) {
      setStepErrorMessage(validationMessage)
      return
    }

    setStepErrorMessage('')

    setCurrentStep((prev) => {
      if (prev >= 5) return prev
      return prev + 1
    })
  }

  const handlePrevStep = () => {
    setStepErrorMessage('')

    setCurrentStep((prev) => {
      if (prev <= 1) return prev
      return prev - 1
    })
  }

  const handleChangeInput = (event) => {
    onInputChange(event)
    setStepErrorMessage('')
  }

  const getStepTitle = () => {
    if (currentStep === 1) return '기본 정보를 입력해주세요.'
    if (currentStep === 2) return '가격 정보를 입력해주세요.'
    if (currentStep === 3) return '위치 정보를 입력해주세요.'
    if (currentStep === 4) return '태그를 입력해주세요.'
    return '입력한 정보를 확인해주세요.'
  }

  return (
    <div className="place-modal-overlay">
      <div className="place-modal-card">
        <div className="place-modal-header">
          <div>
            <h2>장소 추가</h2>
            <p>{getStepTitle()}</p>
          </div>

          <button
            type="button"
            className="place-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="place-type-row">
          <label>
            <input
              type="radio"
              name="formType"
              value="studio"
              checked={isStudio}
              onChange={onFormTypeChange}
            />
            합주실
          </label>

          <label>
            <input
              type="radio"
              name="formType"
              value="restaurant"
              checked={isRestaurant}
              onChange={onFormTypeChange}
            />
            주변 맛집
          </label>
        </div>

        <div className="place-step-row">
          <span className={currentStep === 1 ? 'active' : ''}>1</span>
          <span className={currentStep === 2 ? 'active' : ''}>2</span>
          <span className={currentStep === 3 ? 'active' : ''}>3</span>
          <span className={currentStep === 4 ? 'active' : ''}>4</span>
          <span className={currentStep === 5 ? 'active' : ''}>완료</span>
        </div>

        <div className="login-form place-form">
          {currentStep === 1 && (
            <>
              <input
                type="text"
                name="name"
                value={placeForm.name}
                placeholder={isStudio ? '합주실 이름' : '맛집 이름'}
                onChange={handleChangeInput}
              />

              {isRestaurant && (
                <input
                  type="text"
                  name="category"
                  value={placeForm.category}
                  placeholder="카테고리 예: 한식, 양식, 카페"
                  onChange={handleChangeInput}
                />
              )}

              <input
                type="text"
                name="address"
                value={placeForm.address}
                placeholder="주소"
                onChange={handleChangeInput}
              />
            </>
          )}

          {currentStep === 2 && (
            <input
              type="number"
              inputMode="numeric"
              name="price"
              value={placeForm.price}
              placeholder={isStudio ? '시간당 가격' : '평균 가격'}
              onChange={handleChangeInput}
            />
          )}

          {currentStep === 3 && (
            <>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                name="latitude"
                value={placeForm.latitude}
                placeholder="위도 예: 37.5665"
                onChange={handleChangeInput}
              />

              <input
                type="number"
                inputMode="decimal"
                step="any"
                name="longitude"
                value={placeForm.longitude}
                placeholder="경도 예: 126.9780"
                onChange={handleChangeInput}
              />
            </>
          )}

          {currentStep === 4 && (
            <input
              type="text"
              name="tags"
              value={placeForm.tags}
              placeholder="태그 예: 주차 가능, 넓은 공간"
              onChange={handleChangeInput}
            />
          )}

          {currentStep === 5 && (
            <div className="place-submit-summary">
              <strong>{placeForm.name}</strong>

              <span>{placeForm.address}</span>

              <span>
                {isStudio
                  ? `시간당 ₩ ${Number(placeForm.price).toLocaleString()}`
                  : `${placeForm.category} · 평균 ₩ ${Number(
                      placeForm.price
                    ).toLocaleString()}`}
              </span>

              <span>
                위도 {placeForm.latitude} · 경도 {placeForm.longitude}
              </span>

              <span>태그: {placeForm.tags}</span>
            </div>
          )}
        </div>

        {(stepErrorMessage || errorMessage) && (
          <p className="login-error">{stepErrorMessage || errorMessage}</p>
        )}

        <div className="place-modal-button-row">
          {currentStep > 1 && (
            <button
              type="button"
              className="place-prev-button"
              onClick={handlePrevStep}
            >
              이전
            </button>
          )}

          {currentStep < 5 && (
            <button
              type="button"
              className="primary-button"
              onClick={handleNextStep}
              disabled={!isCurrentStepValid()}
            >
              다음
            </button>
          )}

          {currentStep === 5 && (
            <button
              type="button"
              className="primary-button"
              onClick={onSubmit}
            >
              등록하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlaceModal