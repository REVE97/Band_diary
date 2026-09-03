import { useEffect, useState } from 'react'

import ModalPortal from '../common/ModalPortal'

import styles from './PlaceModal.module.css'

function PlaceModal({
  formType,
  placeForm,
  placeSearchResults,
  isSearchingPlace,
  errorMessage,
  onClose,
  onSubmit,
  onFormTypeChange,
  onInputChange,
  onSearchPlace,
  onSelectSearchPlace,
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepErrorMessage, setStepErrorMessage] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const isStudio = formType === 'studio'
  const isRestaurant = formType === 'restaurant'
  const isParking = formType === 'parking'

  const hasSelectedPlace =
    placeForm.name.trim() &&
    placeForm.address.trim() &&
    placeForm.latitude &&
    placeForm.longitude

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return Boolean(hasSelectedPlace)
    }

    return true
  }

  const getStepErrorMessage = () => {
    if (currentStep === 1) {
      if (!hasSelectedPlace) {
        return '장소명을 검색한 뒤 검색 결과에서 장소를 선택해주세요.'
      }
    }

    return ''
  }

  useEffect(() => {
    // 장소 유형을 변경하면 단계별 입력 상태를 처음부터 다시 시작합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentStep(1)
    setStepErrorMessage('')
    setSearchKeyword('')
  }, [formType])

  const handleNextStep = () => {
    const validationMessage = getStepErrorMessage()

    if (validationMessage) {
      setStepErrorMessage(validationMessage)
      return
    }

    setStepErrorMessage('')

    setCurrentStep((prev) => {
      if (prev >= 2) return prev
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

  const handleSearchKeywordChange = (event) => {
    setSearchKeyword(event.target.value)
    setStepErrorMessage('')
  }

  const handleSearchButtonClick = () => {
    onSearchPlace(searchKeyword)
  }

  const handleSelectPlace = (searchedPlace) => {
    onSelectSearchPlace(searchedPlace)
    setSearchKeyword(searchedPlace.place_name)
    setStepErrorMessage('')
  }

  const getStepClassName = (step) => {
    if (currentStep === step) {
      return `${styles.placeStepItem} ${styles.active}`
    }

    if (currentStep > step) {
      return `${styles.placeStepItem} ${styles.complete}`
    }

    return styles.placeStepItem
  }

  const getStepTitle = () => {
    if (currentStep === 1) return '장소를 검색하고 선택해주세요.'
    return '입력한 정보를 확인해주세요.'
  }

  return (
    <ModalPortal onEscapeKey={onClose}>
      <div
        className={styles.placeModalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-add-modal-title"
      >
        <div className={styles.placeModalHeader}>
          <div>
            <h2 id="place-add-modal-title">장소 추가</h2>
            <p>{getStepTitle()}</p>
          </div>

          <button
            type="button"
            className={styles.placeModalClose}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.placeTypeRow}>
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

          <label>
            <input
              type="radio"
              name="formType"
              value="parking"
              checked={isParking}
              onChange={onFormTypeChange}
            />
            주차장
          </label>
        </div>

        <div className={styles.placeStepRow} aria-label="장소 등록 단계">
          <span
            className={getStepClassName(1)}
            aria-current={currentStep === 1 ? 'step' : undefined}
          >
            1
          </span>
          <span
            className={getStepClassName(2)}
            aria-current={currentStep === 2 ? 'step' : undefined}
          >
            완료
          </span>
        </div>

        <div className={`${styles.loginForm} ${styles.placeForm}`}>
          {currentStep === 1 && (
            <>
              <div className={styles.placeSearchRow}>
                <input
                  type="text"
                  value={searchKeyword}
                  placeholder={
                    isStudio
                      ? '합주실 장소명 검색 예: 홍대 합주실'
                      : isParking
                        ? '주차장 장소명 검색 예: 홍대 주차장'
                        : '맛집 장소명 검색 예: 홍대 맛집'
                  }
                  onChange={handleSearchKeywordChange}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearchButtonClick()
                    }
                  }}
                />

                <button
                  type="button"
                  className={styles.placeSearchButton}
                  onClick={handleSearchButtonClick}
                  disabled={isSearchingPlace}
                >
                  {isSearchingPlace ? '검색중' : '검색'}
                </button>
              </div>

              {placeSearchResults.length > 0 && (
                <div className={styles.placeSearchResultList}>
                  {placeSearchResults.map((searchedPlace) => (
                    <button
                      key={searchedPlace.id}
                      type="button"
                      className={styles.placeSearchResultItem}
                      onClick={() => handleSelectPlace(searchedPlace)}
                    >
                      <strong>{searchedPlace.place_name}</strong>
                      <span>
                        {searchedPlace.road_address_name ||
                          searchedPlace.address_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {hasSelectedPlace && (
                <div className={styles.selectedPlaceBox}>
                  <strong>{placeForm.name}</strong>
                  <span>{placeForm.address}</span>
                </div>
              )}

              <label className={styles.favoriteToggle}>
                <input
                  type="checkbox"
                  name="favorite"
                  checked={placeForm.favorite}
                  onChange={handleChangeInput}
                />

                <span>
                  <strong>자주 이용하는 장소</strong>
                  <small>장소 페이지 상단에 먼저 표시합니다.</small>
                </span>
              </label>
            </>
          )}

          {currentStep === 2 && (
            <div className={styles.placeSubmitSummary}>
              <strong>{placeForm.name}</strong>

              <span>{placeForm.address}</span>

              {placeForm.favorite && (
                <span>자주 이용하는 장소로 표시</span>
              )}
            </div>
          )}
        </div>

        {(stepErrorMessage || errorMessage) && (
          <p className={styles.loginError}>{stepErrorMessage || errorMessage}</p>
        )}

        <div className={styles.placeModalButtonRow}>
          {currentStep > 1 && (
            <button
              type="button"
              className={styles.placePrevButton}
              onClick={handlePrevStep}
            >
              이전
            </button>
          )}

          {currentStep < 2 && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleNextStep}
              disabled={!isCurrentStepValid()}
            >
              다음
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onSubmit}
            >
              등록하기
            </button>
          )}
        </div>
      </div>
    </ModalPortal>
  )
}

export default PlaceModal
