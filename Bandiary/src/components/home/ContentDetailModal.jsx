import { useEffect, useState } from 'react'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

function ContentDetailModal({ content, onClose }) {
  const isPicture = content.type === '사진'
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

    const { data, error } = await supabase
      .from('comment')
      .select('*')
      .eq('content_id', content.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setCommentErrorMessage('댓글을 불러오지 못했습니다.')
      return
    }

    setComments(data || [])
  }

  useEffect(() => {
    getComments()
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
    <div className="place-modal-overlay">
      <div className="place-modal-card content-detail-card">
        <div className="place-modal-header">
          <div>
            <h2>{content.title}</h2>
            <p>
              {content.type} / {content.category}
              <br />
              {formatDate(content.created_at)}
            </p>
          </div>

          <button
            type="button"
            className="place-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="content-detail-media">
          {isPicture && content.contentImageUrl && (
            <img src={content.contentImageUrl} alt={content.title} />
          )}

          {isVideo && content.contentVideoUrl && (
            <video src={content.contentVideoUrl} controls />
          )}

          {isPicture && !content.contentImageUrl && (
            <div className="content-detail-empty">
              등록된 이미지가 없습니다.
            </div>
          )}

          {isVideo && !content.contentVideoUrl && (
            <div className="content-detail-empty">
              등록된 영상이 없습니다.
            </div>
          )}
        </div>

        <div className="comment-section">
          <div className="comment-header">
            <h3>댓글</h3>
            <span>{comments.length}개</span>
          </div>

          <div className="comment-list">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-item-top">
                    <div className="comment-meta">
                      <strong>{comment.name}</strong>
                      <span>{formatDate(comment.created_at)}</span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        className="comment-delete-button"
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
              <div className="comment-empty">
                아직 등록된 댓글이 없습니다.
              </div>
            )}
          </div>

          <div className="comment-form">
            <textarea
              value={commentText}
              placeholder="댓글을 입력해주세요."
              onChange={handleCommentInputChange}
            />

            {commentErrorMessage && (
              <p className="login-error">{commentErrorMessage}</p>
            )}

            <button
              type="button"
              className="primary-button comment-submit-button"
              onClick={handleAddComment}
              disabled={isCommentLoading}
            >
              {isCommentLoading ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentDetailModal