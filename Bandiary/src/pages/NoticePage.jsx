import { useCallback, useEffect, useMemo, useState } from 'react'

import NoticeAddModal from '../components/notice/NoticeAddModal'
import NoticeDetailModal from '../components/notice/NoticeDetailModal'

import supabase from '../api/supabase'

function NoticePage() {
  // 유저 데이터 호출
  const storageInfo = JSON.parse(
    sessionStorage.getItem('bandiaryLoginUser')
  )

  // 공지사항 전체 데이터
  const [notices, setNotices] = useState([])

  // 데이터 조회 상태
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // 등록 Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // 상세 Modal
  const [selectedNotice, setSelectedNotice] = useState(null)

  // notice 테이블 전체 조회 -> created_at 최신순으로 조회
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .order('created_at', {
          ascending: false
        })

      if (error) {
        throw error
      }

      setNotices(data ?? [])
    } catch (error) {
      console.error('공지사항 조회 실패:', error)

      setErrorMessage(
        '공지사항을 불러오는 중 문제가 발생했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // notice 테이블 api 호출
  useEffect(() => {
    fetchNotices()
  }, [])

  // 중요 공지 important === true 인 데이터만 출력
  const importantNotices = useMemo(() => {
    return notices.filter(
      (notice) => notice.important === true
    )
  }, [notices])

  // 일반 공지 important === false 인 데이터 출력
  const normalNotices = useMemo(() => {
    return notices.filter(
      (notice) => !notice.important
    )
  }, [notices])

  // 일반 공지사항 월별 그룹화
  const groupedNotices = useMemo(() => {
    return normalNotices.reduce(
      (groups, notice) => {
        const date = new Date(notice.created_at)

        const key = Number.isNaN(date.getTime())
          ? '기타'
          : `${date.getFullYear()}년 ${date.getMonth() + 1}월`

        if (!groups[key]) {
          groups[key] = []
        }

        groups[key].push(notice)

        return groups
      },
      {}
    )
  }, [normalNotices])

  // 날짜 표시
  const formatDate = (createdAt) => {
    if (!createdAt) {
      return '-'
    }

    const date = new Date(createdAt)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat(
      'ko-KR',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).format(date)
  }

  // 상세 모달 열기
  const openDetailModal = (notice) => {
    setSelectedNotice(notice)
  }

  // 상세 모달 닫기
  const closeDetailModal = () => {
    setSelectedNotice(null)
  }

  // 공지 등록 / 삭제 후 notice 테이블 다시 조회
  const handleNoticeChanged = async () => {
    await fetchNotices()
  }

  return (
    <div className="page notice-page">
      {/* 로딩 */}
      {loading && (
        <div className="notice-state-box">
          공지사항을 불러오는 중입니다.
        </div>
      )}

      {/* 조회 오류 */}
      {!loading && errorMessage && (
        <div className="notice-state-box error">
          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={fetchNotices}
          >
            다시 불러오기
          </button>
        </div>
      )}

      {/* 조회 완료 */}
      {!loading && !errorMessage && (
        <>

          {/* 중요 공지 */}
          {importantNotices.length > 0 && (
            <section className="notice-section">

              <div className="notice-section-header">
                <h3>
                  중요 공지
                </h3>

                <span>
                  {importantNotices.length}
                </span>
              </div>

              <div className="notice-important-list">

                {importantNotices.map((notice) => (
                  <button
                    key={notice.id}
                    type="button"
                    className="notice-important-card"
                    onClick={() =>
                      openDetailModal(notice)
                    }
                  >

                    {/* 중요 표시 */}
                    <div className="notice-important-icon">
                      ★
                    </div>

                    <div className="notice-card-content">

                      <div className="notice-card-title-row">

                        <strong>
                          {notice.title}
                        </strong>

                        <span className="notice-important-label">
                          중요
                        </span>

                      </div>

                      <div className="notice-card-meta">

                        {/* 공지 / 메모 Badge */}
                        <span
                          className={`notice-type-badge ${
                            notice.type === '공지'
                              ? 'notice'
                              : 'memo'
                          }`}
                        >
                          {notice.type}
                        </span>

                        {/* 작성자 */}
                        <span>
                          {notice.name}
                        </span>

                        {/* 작성일 */}
                        <span>
                          {formatDate(
                            notice.created_at
                          )}
                        </span>

                      </div>
                    </div>

                    <span className="notice-card-arrow">
                      ›
                    </span>

                  </button>
                ))}

              </div>
            </section>
          )}

          {/* 전체 목록 */}
          <section className="notice-section">

            <div className="notice-section-header">

              <h3>
                전체 목록
              </h3>

              <span>
                {normalNotices.length}
              </span>

            </div>

            {/* 데이터가 없는 경우 */}
            {normalNotices.length === 0 ? (
              <div className="notice-empty-box">

                <strong>
                  등록된 공지나 메모가 없습니다.
                </strong>

                <p>
                  오른쪽 아래 + 버튼을 눌러
                  첫 내용을 등록해보세요.
                </p>

              </div>
            ) : (

              /* 데이터가 있는 경우 */
              <div className="notice-group-list">

                {Object.entries(
                  groupedNotices
                ).map(
                  ([month, monthNotices]) => (

                    <div
                      key={month}
                      className="notice-month-group"
                    >

                      {/* 월 */}
                      <p className="notice-month-title">
                        {month}
                      </p>

                      <div className="notice-list">

                        {monthNotices.map(
                          (notice) => (

                            <button
                              key={notice.id}
                              type="button"
                              className="notice-list-item"
                              onClick={() =>
                                openDetailModal(notice)
                              }
                            >

                              {/* 유형 아이콘 */}
                              <div
                                className={`notice-list-icon ${
                                  notice.type === '공지'
                                    ? 'notice'
                                    : 'memo'
                                }`}
                              >
                                {notice.type === '공지'
                                  ? '📢'
                                  : '📝'}
                              </div>

                              {/* 내용 */}
                              <div className="notice-list-content">

                                <strong>
                                  {notice.title}
                                </strong>

                                <div className="notice-list-meta">

                                  {/* 유형 */}
                                  <span
                                    className={`notice-type-badge ${
                                      notice.type === '공지'
                                        ? 'notice'
                                        : 'memo'
                                    }`}
                                  >
                                    {notice.type}
                                  </span>

                                  {/* 작성자 */}
                                  <span>
                                    {notice.name}
                                  </span>

                                </div>

                              </div>

                              {/* 등록일 */}
                              <time>
                                {formatDate(
                                  notice.created_at
                                )}
                              </time>

                            </button>
                          )
                        )}

                      </div>
                    </div>
                  )
                )}

              </div>
            )}

          </section>
        </>
      )}

      {/* 등록 버튼 */}
      <button
        type="button"
        className="notice-add-button"
        aria-label="공지 또는 메모 등록"
        onClick={() =>
          setIsAddModalOpen(true)
        }
      >
        +
      </button>

      {/* 등록 모달 */}
      {isAddModalOpen && (
        <NoticeAddModal
          userName={storageInfo?.name ?? ''}
          onClose={() =>
            setIsAddModalOpen(false)
          }
          onAdded={handleNoticeChanged}
        />
      )}

      {/* 상세 모달 */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={closeDetailModal}
          onDeleted={handleNoticeChanged}
        />
      )}

    </div>
  )
}

export default NoticePage