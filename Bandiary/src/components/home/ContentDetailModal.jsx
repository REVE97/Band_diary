import { useEffect, useState } from 'react'

import ModalPortal from '../common/ModalPortal'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

import commentSendIcon from '../../assets/images/comment-send.svg'
import styles from './ContentDetailModal.module.css'

const fetchComments = (contentId) =>
  supabase
    .from('comment')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: true })

function ContentDetailModal({ content, onClose }) {
  const isVideo = content.type === '비디오'

  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentErrorMessage, setCommentErrorMessage] = useState('')
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState(null)

  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  const isAdmin = storageInfo?.userId === 'admin'

  // 유저 데이터 불러오기
  const getComments = async () => {
    if (!content?.id) return

    const { data, error } = await fetchComments(content.id)

    if (error) {
      console.error(error)
      setCommentErrorMessage('댓글을 불러오지 못했습니다.')
      return
    }

    setComments(data || [])
  }

  useEffect(() => {
    if (!content?.id) return undefined

    let isCancelled = false

    void fetchComments(content.id).then(({ data, error }) => {
      if (isCancelled) return

      if (error) {
        console.error(error)
        setCommentErrorMessage('댓글을 불러오지 못했습니다.')
        return
      }

      setComments(data || [])
    })

    return () => {
      isCancelled = true
    }
  }, [content?.id])

  const handleCommentInputChange = (event) => {
    setCommentText(event.target.value)
    setCommentErrorMessage('')
  }

  // 댓글 추가 기능
  const handleAddComment = async () => {
    if (!storageInfo?.userId) {
      setCommentErrorMessage('로그인 사용자 정보를 찾을 수 없습니다.')
      return
    }

    if (!commentText.trim()) {
      setCommentErrorMessage('댓글 내용을 입력해주세요.')
      return
    }

    setIsCommentLoading(true)

    const { error } = await supabase.from('comment').insert([
      {
        content_id: content.id,
        name: storageInfo.userId,
        description: commentText.trim(),
      },
    ])

    if (error) {
      console.error(error)
      setCommentErrorMessage('댓글 등록에 실패했습니다.')
      setIsCommentLoading(false)
      return
    }

    setCommentText('')
    setCommentErrorMessage('')
    setIsCommentLoading(false)

    await getComments()
  }

  // 댓글 삭제 기능 (관리자용)
  const handleDeleteComment = async (commentId) => {
    if (!isAdmin) {
      setCommentErrorMessage('관리자만 댓글을 삭제할 수 있습니다.')
      return
    }

    const isConfirmed = window.confirm('댓글을 삭제하시겠습니까?')

    if (!isConfirmed) return

    setDeletingCommentId(commentId)
    setCommentErrorMessage('')

    const { error } = await supabase
      .from('comment')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error(error)
      setCommentErrorMessage('댓글 삭제에 실패했습니다.')
      setDeletingCommentId(null)
      return
    }

    setDeletingCommentId(null)

    await getComments()
  }

  return (
    <ModalPortal onEscapeKey={onClose}>
      <div
        className={`${styles.placeModalCard} ${styles.contentDetailCard}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-detail-title"
      >
        {/* 콘텐츠 상세 헤더 */}
        <div className={styles.contentDetailHeader}>
          <div className={styles.contentDetailHeading}>
            <span className={styles.contentDetailType}>
              {content.type}
            </span>

            <h2 id="content-detail-title">{content.title}</h2>
            <time>{formatDate(content.created_at)}</time>
          </div>

          <button
            type="button"
            className={styles.placeModalClose}
            onClick={onClose}
            aria-label="콘텐츠 상세 모달 닫기"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 미디어 */}
        <div className={styles.contentDetailMedia}>
          {isVideo && content.contentVideoUrl && (
            <video src={content.contentVideoUrl} controls />
          )}

          {isVideo && !content.contentVideoUrl && (
            <div className={styles.contentDetailEmpty}>
              등록된 영상이 없습니다.
            </div>
          )}

        </div>

        <div className={styles.commentSection}>
          <div className={styles.commentHeader}>
            <h3>댓글</h3>
            <span>{comments.length}개</span>
          </div>

          <div className={styles.commentList}>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentItemTop}>
                    <div className={styles.commentMeta}>
                      <strong>{comment.name}</strong>
                      <span>{formatDate(comment.created_at)}</span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        className={styles.commentDeleteButton}
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        aria-label="댓글 삭제"
                      >
                        {deletingCommentId === comment.id ? '...' : '-'}
                      </button>
                    )}
                  </div>

                  <p>{comment.description}</p>
                </div>
              ))
            ) : (
              <div className={styles.commentEmpty}>
                아직 등록된 댓글이 없습니다.
              </div>
            )}
          </div>

          <div className={styles.commentForm}>
            <div className={styles.commentInputRow}>
              <textarea
                value={commentText}
                placeholder="댓글을 입력해주세요."
                onChange={handleCommentInputChange}
              />

              <button
                type="button"
                className={styles.commentSendButton}
                onClick={handleAddComment}
                disabled={isCommentLoading}
                aria-label="댓글 등록"
              >
                {isCommentLoading ? (
                  <span className={styles.commentSendLoading}>
                    ...
                  </span>
                ) : (
                  <img
                    src={commentSendIcon}
                    alt=""
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>

            {commentErrorMessage && (
              <p className={styles.loginError}>{commentErrorMessage}</p>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

export default ContentDetailModal
