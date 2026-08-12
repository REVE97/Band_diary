import { useState } from 'react'

import PlaceResultModal from '../place/PlaceResultModal'

import supabase from '../../api/supabase'

function NoticeDetailModal({
  notice,
  onClose,
  onDeleted,
  onEdit
}) {
  const [deleting, setDeleting] =
    useState(false)

  const [resultModal, setResultModal] =
    useState(null)

  // created_at 날짜 출력
  const formatDateTime = (createdAt) => {
    if (!createdAt) {
      return '-'
    }

    const date =
      new Date(createdAt)

    if (
      Number.isNaN(date.getTime())
    ) {
      return '-'
    }

    return new Intl.DateTimeFormat(
      'ko-KR',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }
    ).format(date)
  }

  // 수정 Modal 열기
  const openEditModal = () => {
    onEdit?.(notice)
  }

  // 삭제 확인 Modal
  const openDeleteConfirm = () => {
    setResultModal({
      type: 'confirm',
      title: '게시글 삭제',
      message:
        '삭제한 공지 또는 메모는 다시 복구할 수 없습니다.'
    })
  }

  // 실제 삭제
  const deleteNotice = async () => {
    try {
      setDeleting(true)

      const {
        error
      } = await supabase
        .from('notice')
        .delete()
        .eq(
          'id',
          notice.id
        )

      if (error) {
        throw error
      }

      setResultModal({
        type: 'success',
        title: '삭제 완료',
        message:
          '게시글이 삭제되었습니다.'
      })
    } catch (error) {
      console.error(
        '공지 삭제 실패:',
        error
      )

      setResultModal({
        type: 'fail',
        title: '삭제 실패',
        message:
          '삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      })
    } finally {
      setDeleting(false)
    }
  }

  // 결과 Modal 닫기
  const closeResultModal = async () => {
    const isSuccess =
      resultModal?.type === 'success'

    setResultModal(null)

    if (isSuccess) {
      await onDeleted?.()
      onClose()
    }
  }

  return (
    <>
      <div
        className="place-modal-overlay"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !deleting
          ) {
            onClose()
          }
        }}
      >
        <article className="place-modal-card notice-detail-card">

          {/* 헤더 */}
          <header className="place-modal-header">
            <div>
              <h2 className="notice-detail-title">
                {notice.title}
              </h2>
            </div>

            <button
              type="button"
              className="place-modal-close"
              aria-label="닫기"
              onClick={onClose}
            >
              ×
            </button>
          </header>

          <div className="notice-detail-body">

            {/* 작성 정보 */}
            <div className="notice-detail-meta">
              <div>
                <span>작성자</span>
                <strong>
                  {notice.name || '-'}
                </strong>
              </div>

              <div>
                <span>등록 날짜</span>
                <strong>
                  {formatDateTime(
                    notice.created_at
                  )}
                </strong>
              </div>
            </div>

            {/* 내용 */}
            <section className="notice-detail-content-section">
              <span>내용</span>
              <p>
                {notice.content}
              </p>
            </section>

            {/* 이미지 */}
            {notice.imageUrl && (
              <section className="notice-detail-image-section">
                <span>첨부 이미지</span>
                <div className="notice-detail-image">
                  <img
                    src={notice.imageUrl}
                    alt={`${notice.title} 첨부 이미지`}
                  />
                </div>
              </section>
            )}

            {/* 세부 속성 */}
            <div className="notice-detail-properties">
              <div>
                <span>유형</span>
                <strong>
                  {notice.type}
                </strong>
              </div>

              <div>
                <span>중요 공지</span>
                <strong>
                  {notice.important
                    ? '설정'
                    : '미설정'}
                </strong>
              </div>
            </div>

            {/* 수정 및 삭제 버튼 */}
            <div className="notice-detail-action-row">

              {/* 수정 */}
              <button
                type="button"
                className="notice-edit-button"
                disabled={deleting}
                onClick={openEditModal}
              >
                수정
              </button>

              {/* 삭제 */}
              <button
                type="button"
                className="notice-delete-button"
                disabled={deleting}
                onClick={openDeleteConfirm}
              >
                {deleting
                  ? '삭제 중...'
                  : '삭제'}
              </button>

            </div>

          </div>

        </article>
      </div>

      {/* 삭제 확인 / 결과 */}
      {resultModal && (
        <PlaceResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          confirmText="삭제"
          cancelText="취소"
          onClose={closeResultModal}
          onConfirm={deleteNotice}
        />
      )}
    </>
  )
}

export default NoticeDetailModal