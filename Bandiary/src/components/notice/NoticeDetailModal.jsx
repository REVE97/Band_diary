import { useState } from 'react'

import ModalPortal from '../common/ModalPortal'
import useToast from '../common/useToast'
import PlaceResultModal from '../place/PlaceResultModal'

import supabase from '../../api/supabase'
import styles from './NoticeDetailModal.module.css'

function NoticeDetailModal({
  notice,
  isAdmin,
  onClose,
  onDeleted,
  onEdit
}) {
  const { showToast } = useToast()
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
    // 관리자만 삭제 가능
    if (!isAdmin) return

    setResultModal({
      type: 'confirm',
      title: '게시글 삭제',
      message:
        '삭제한 공지 또는 메모는 다시 복구할 수 없습니다.'
    })
  }

  // 실제 삭제
  const deleteNotice = async () => {
    // 관리자만 삭제 가능
    if (!isAdmin) return

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

      showToast(`${notice.type}가 삭제되었습니다.`)
      onClose()
      await onDeleted?.()
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
  const closeResultModal = () => {
    setResultModal(null)
  }

  return (
    <>
      <ModalPortal
        onBackdropMouseDown={() => {
          if (!deleting) onClose()
        }}
        onEscapeKey={deleting ? undefined : onClose}
      >
        <article
          className={`${styles.placeModalCard} ${styles.noticeDetailCard}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-detail-modal-title"
        >

          {/* 헤더 */}
          <header className={styles.placeModalHeader}>
            <div>
              <h2
                id="notice-detail-modal-title"
                className={styles.noticeDetailTitle}
              >
                {notice.title}
              </h2>
            </div>

            <button
              type="button"
              className={styles.placeModalClose}
              aria-label="닫기"
              onClick={onClose}
            >
              ×
            </button>
          </header>

          <div className={styles.noticeDetailBody}>

            {/* 작성 정보 */}
            <div className={styles.noticeDetailMeta}>
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
            <section className={styles.noticeDetailContentSection}>
              <span>내용</span>
              <p>
                {notice.content}
              </p>
            </section>

            {/* 이미지 */}
            {notice.imageUrl && (
              <section className={styles.noticeDetailImageSection}>
                <span>첨부 이미지</span>

                <div className={styles.noticeDetailImage}>
                  <img
                    src={notice.imageUrl}
                    alt={`${notice.title} 첨부 이미지`}
                  />
                </div>
              </section>
            )}

            {/* 세부 속성 */}
            <div className={styles.noticeDetailProperties}>
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
            <div className={styles.noticeDetailActionRow}>

              {/* 수정 */}
              <button
                type="button"
                className={styles.noticeEditButton}
                disabled={deleting}
                onClick={openEditModal}
              >
                수정
              </button>

              {/* 삭제 */}
              {isAdmin && (
                <button
                  type="button"
                  className={styles.noticeDeleteButton}
                  disabled={deleting}
                  onClick={openDeleteConfirm}
                >
                  {deleting
                    ? '삭제 중...'
                    : '삭제'}
                </button>
              )}

            </div>

          </div>

        </article>
      </ModalPortal>

      {/* 삭제 확인 / 결과 */}
      {isAdmin && resultModal && (
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
