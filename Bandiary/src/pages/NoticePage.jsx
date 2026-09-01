import { useCallback, useEffect, useMemo, useState } from 'react'

import NoticeAddModal from '../components/notice/NoticeAddModal'
import NoticeDetailModal from '../components/notice/NoticeDetailModal'
import NoticeFilterTabs from '../components/notice/NoticeFilterTabs'

import addIcon from '../assets/images/add.svg'
import importantIcon from '../assets/images/notice-important.svg'
import noticeIcon from '../assets/images/notice-announcement.svg'
import memoIcon from '../assets/images/notice-memo.svg'
import searchIcon from '../assets/images/search.svg'

import supabase from '../api/supabase'
import styles from './NoticePage.module.css'

function NoticePage() {
  // 유저 데이터 호출
  const storageInfo = JSON.parse(
    sessionStorage.getItem('bandiaryLoginUser')
  )

  // 관리자 여부 확인
  const isAdmin = storageInfo?.userId === 'admin'

  // 공지사항 전체 데이터
  const [notices, setNotices] = useState([])

  // 데이터 조회 상태
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // 등록 Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // 상세 Modal
  const [selectedNotice, setSelectedNotice] = useState(null)

  // 수정 Modal
  const [editingNotice, setEditingNotice] = useState(null)

  // 공지 및 메모 유형 필터
  const [selectedType, setSelectedType] = useState('전체')

  // 제목 검색 입력값
  const [searchInput, setSearchInput] = useState('')

  // 검색 버튼으로 적용된 제목 검색어
  const [searchKeyword, setSearchKeyword] = useState('')

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
    // Supabase의 초기 공지 목록을 페이지 진입 시 한 번만 조회합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotices()
  }, [fetchNotices])

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

  // 공지 및 메모 유형별 개수
  const noticeCounts = useMemo(() => {
    return normalNotices.reduce(
      (counts, notice) => {
        counts.전체 += 1

        if (counts[notice.type] !== undefined) {
          counts[notice.type] += 1
        }

        return counts
      },
      {
        전체: 0,
        공지: 0,
        메모: 0,
      }
    )
  }, [normalNotices])

  // 전체 목록 유형 및 제목 검색 조건 적용
  const filteredNormalNotices = useMemo(() => {
    const normalizedKeyword =
      searchKeyword.trim().toLocaleLowerCase()

    return normalNotices.filter((notice) => {
      const matchesType =
        selectedType === '전체' ||
        notice.type === selectedType

      const normalizedTitle =
        (notice.title ?? '')
          .toLocaleLowerCase()

      const matchesTitle =
        !normalizedKeyword ||
        normalizedTitle.includes(normalizedKeyword)

      return matchesType && matchesTitle
    })
  }, [normalNotices, selectedType, searchKeyword])

  // 일반 공지사항 월별 그룹화
  const groupedNotices = useMemo(() => {
    return filteredNormalNotices.reduce(
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
  }, [filteredNormalNotices])

  // 공지, 메모 아이콘 판별
  const getNoticeTypeIcon = (type) => {
    if (type === '공지') {
      return noticeIcon
    }

    if (type === '메모') {
      return memoIcon
    }

    return noticeIcon
  }

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

  // 제목 검색 실행
  const handleSearch = (event) => {
    event.preventDefault()

    setSearchKeyword(
      searchInput.trim()
    )
  }

  // 공지 및 메모 유형 필터 변경
  const handleNoticeFilterChange = (filterValue) => {
    setSelectedType(filterValue)
  }

  // 상세 모달 열기
  const openDetailModal = (notice) => {
    setSelectedNotice(notice)
  }

  // 상세 모달 닫기
  const closeDetailModal = () => {
    setSelectedNotice(null)
  }

  // 수정 모달 열기
  const openEditModal = (notice) => {
    setSelectedNotice(null)
    setEditingNotice(notice)
  }

  // 수정 취소 후 상세 모달 열기
  const cancelEditModal = (notice) => {
    setEditingNotice(null)
    setSelectedNotice(notice)
  }

  // 공지 등록 / 삭제 후 notice 테이블 다시 조회
  const handleNoticeChanged = async () => {
    await fetchNotices()
  }

  // 공지 수정 후 notice 테이블 다시 조회
  const handleNoticeUpdated = async () => {
    await fetchNotices()
  }

  return (
    <div className={`${styles.page} ${styles.noticePage}`}>
      {/* 로딩중 */}
      {loading && (
        <div className={styles.noticeStateBox}>
          공지사항을 불러오는 중입니다.
        </div>
      )}

      {/* 조회 오류 */}
      {!loading && errorMessage && (
        <div className={styles.noticeStateBox + " " + styles.error}>
          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={fetchNotices}
          >
            재시도
          </button>
        </div>
      )}

      {/* 조회 완료 */}
      {!loading && !errorMessage && (
        <>

          {/* 유형 및 제목 검색 */}
          <section
            className={styles.noticeControls}
            aria-label="공지 검색"
          >
            <form onSubmit={handleSearch}>
              <label className={styles.searchField}>
                <img
                  src={searchIcon}
                  alt=""
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={searchInput}
                  placeholder="공지 제목 검색"
                  aria-label="공지사항 제목 검색"
                  onChange={(event) => {
                    setSearchInput(event.target.value)
                    setSearchKeyword(event.target.value)
                  }}
                />
              </label>
            </form>

            {/* 공지 및 메모 유형 필터 */}
            <NoticeFilterTabs
              activeFilter={selectedType}
              counts={noticeCounts}
              onChange={handleNoticeFilterChange}
            />
          </section>

          {/* 중요 공지 */}
          {importantNotices.length > 0 && (
            <section className={styles.noticeSection}>

              <div className={styles.noticeSectionHeader}>
                <h3>중요 공지</h3>
              </div>

              <div className={styles.noticeImportantList}>

                {importantNotices.map((notice) => (
                  <button
                    key={notice.id}
                    type="button"
                    className={styles.noticeImportantCard}
                    onClick={() =>
                      openDetailModal(notice)
                    }
                  >

                    {/* 중요 표시 */}
                    <div className={styles.noticeImportantIcon}>
                      <img
                        src={importantIcon}
                        aria-hidden="true"
                      />
                    </div>

                    <div className={styles.noticeCardContent}>
                      <div className={styles.noticeCardTitleRow}>
                        <strong>
                          {notice.title}
                        </strong>
                      </div>

                      <div className={styles.noticeCardMeta}>
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
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 전체 목록 */}
          <section className={styles.noticeSection}>
            <div className={styles.noticeSectionHeader}>
              <h3>전체 목록</h3>
            </div>

            {/* 데이터가 없는 경우 */}
            {filteredNormalNotices.length === 0 ? (
              <div className={styles.noticeEmptyBox}>
                <strong>
                  {selectedType !== '전체' || searchKeyword
                    ? '검색 조건에 맞는 공지나 메모가 없습니다.'
                    : '등록된 공지나 메모가 없습니다.'}
                </strong>
              </div>
            ) : (

              /* 데이터가 있는 경우 */
              <div className={styles.noticeGroupList}>

                {Object.entries(
                  groupedNotices
                ).map(
                  ([month, monthNotices]) => (

                    <div
                      key={month}
                      className={styles.noticeMonthGroup}
                    >

                      {/* 월 */}
                      <p className={styles.noticeMonthTitle}>
                        {month}
                      </p>

                      <div className={styles.noticeList}>

                        {monthNotices.map(
                          (notice) => (

                            <button
                              key={notice.id}
                              type="button"
                              className={styles.noticeListItem}
                              onClick={() =>
                                openDetailModal(notice)
                              }
                            >

                              {/* 유형 아이콘 */}
                              <div
                                className={styles.noticeListIcon}
                              >
                                <img
                                  src={getNoticeTypeIcon(notice.type)}
                                  aria-hidden="true"
                                />
                              </div>

                              {/* 내용 */}
                              <div className={styles.noticeListContent}>
                                <strong>
                                  {notice.title}
                                </strong>

                                <div className={styles.noticeListMeta}>
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
        className={styles.noticeAddButton}
        data-floating-add-button
        aria-label="공지 또는 메모 등록"
        onClick={() =>
          setIsAddModalOpen(true)
        }
      >
        <img src={addIcon} alt="" aria-hidden="true" />
      </button>

      {/* 등록 모달 */}
      {isAddModalOpen && (
        <NoticeAddModal
          userId={storageInfo?.userId ?? ''}
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
          isAdmin={isAdmin}
          onClose={closeDetailModal}
          onDeleted={handleNoticeChanged}
          onEdit={openEditModal}
        />
      )}

      {/* 수정 모달 */}
      {editingNotice && (
        <NoticeAddModal
          mode="edit"
          notice={editingNotice}
          userId={storageInfo?.userId ?? ''}
          onClose={() =>
            setEditingNotice(null)
          }
          onUpdated={handleNoticeUpdated}
          onCancelEdit={cancelEditModal}
        />
      )}

    </div>
  )
}

export default NoticePage
