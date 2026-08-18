import { useEffect, useMemo, useRef, useState } from 'react'
import supabase from '../api/supabase'
import styles from './MusicsheetPage.module.css'

import PdfPreview from '../components/common/PdfPreview'
import MusicsheetAddModal from '../components/musicsheet/MusicsheetAddModal'
import MusicsheetFilterTabs from '../components/musicsheet/MusicsheetFilterTabs'
import PlaceResultModal from '../components/place/PlaceResultModal'
import useToast from '../components/common/useToast'
import downloadIcon from '../assets/images/download.svg'
import bassPdfIcon from '../assets/images/PdfIcon-bass.svg'
import drumPdfIcon from '../assets/images/PdfIcon-drum.svg'
import guitarPdfIcon from '../assets/images/PdfIcon-guitar.svg'
import keyboardPdfIcon from '../assets/images/PdfIcon-keyboard.svg'
import vocalPdfIcon from '../assets/images/PdfIcon-vocal.svg'
import searchIcon from '../assets/images/search.svg'

const initialMusicsheetForm = {
  session: 'Vocal',
  title: '',
  description: '',
}

const getSessionClassName = (session) => {
  if (session === 'Vocal') return styles.vocal
  if (session === 'Guitar') return styles.guitar
  if (session === 'Bass') return styles.bass
  if (session === 'Keyboard') return styles.keyboard
  if (session === 'Drum') return styles.drum

  return styles.defaultSession
}

const sessionPdfIcons = {
  Vocal: vocalPdfIcon,
  Guitar: guitarPdfIcon,
  Bass: bassPdfIcon,
  Keyboard: keyboardPdfIcon,
  Drum: drumPdfIcon,
}

const getSessionPdfIcon = (session) => {
  return sessionPdfIcons[session] || guitarPdfIcon
}

function MusicsheetPage() {
  const { showToast } = useToast()
  const previewSectionRef = useRef(null)
  const [musicsheetList, setMusicsheetList] = useState([])
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  // 세션 필터 상태값
  const [activeSessionFilter, setActiveSessionFilter] = useState('전체')

  const [isMusicsheetModalOpen, setIsMusicsheetModalOpen] = useState(false)
  const [musicsheetForm, setMusicsheetForm] = useState(initialMusicsheetForm)
  const [musicsheetFile, setMusicsheetFile] = useState(null)
  const [musicsheetFileName, setMusicsheetFileName] =
    useState('선택된 파일 없음')
  const [errorMessage, setErrorMessage] = useState('')

  // 삭제 대상 악보 상태값
  const [deleteMusicsheetTarget, setDeleteMusicsheetTarget] = useState(null)

  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
  })

  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  // 관리자 여부 확인
  const isAdmin = storageInfo?.userId === 'admin'

  const sessionCounts = useMemo(() => {
    return musicsheetList.reduce(
      (counts, musicsheet) => {
        counts.전체 += 1

        if (counts[musicsheet.session] !== undefined) {
          counts[musicsheet.session] += 1
        }

        return counts
      },
      {
        전체: 0,
        Vocal: 0,
        Guitar: 0,
        Bass: 0,
        Keyboard: 0,
        Drum: 0,
      }
    )
  }, [musicsheetList])

  // 세션과 검색어를 함께 적용한 악보 목록
  const filteredMusicsheetList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLocaleLowerCase()

    return musicsheetList.filter((musicsheet) => {
      const matchesSession =
        activeSessionFilter === '전체' ||
        musicsheet.session === activeSessionFilter

      const searchableText = [
        musicsheet.title,
        musicsheet.description,
        musicsheet.fileName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()

      const matchesKeyword =
        !normalizedKeyword || searchableText.includes(normalizedKeyword)

      return matchesSession && matchesKeyword
    })
  }, [activeSessionFilter, musicsheetList, searchKeyword])

  const getMusicsheetList = async () => {
    const { data, error } = await supabase
      .from('musicsheet')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '조회 실패',
        message: '악보 목록을 불러오지 못했습니다.',
      })

      return
    }

    setMusicsheetList(data || [])
  }

  useEffect(() => {
    // Supabase의 초기 악보 목록을 페이지 진입 시 한 번만 조회합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getMusicsheetList()
  }, [])

  const handlePdfClick = (pdf) => {
    if (selectedPdf?.id === pdf.id) {
      previewSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      return
    }

    setSelectedPdf(pdf)
  }

  useEffect(() => {
    if (!selectedPdf) return undefined

    const frameId = window.requestAnimationFrame(() => {
      previewSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [selectedPdf])

  const handleMusicsheetFilterChange = (filterValue) => {
    setActiveSessionFilter(filterValue)
    setSelectedPdf(null)
  }

  const handleOpenMusicsheetModal = () => {
    setMusicsheetForm(initialMusicsheetForm)
    setMusicsheetFile(null)
    setMusicsheetFileName('선택된 파일 없음')
    setErrorMessage('')
    setIsMusicsheetModalOpen(true)
  }

  const handleCloseMusicsheetModal = () => {
    setIsMusicsheetModalOpen(false)
    setMusicsheetForm(initialMusicsheetForm)
    setMusicsheetFile(null)
    setMusicsheetFileName('선택된 파일 없음')
    setErrorMessage('')
  }

  const handleCloseResultModal = () => {
    setResultModal({
      isOpen: false,
      type: '',
      title: '',
      message: '',
    })
  }

  const handleMusicsheetSessionChange = (event) => {
    const { value } = event.target

    setMusicsheetForm((prev) => ({
      ...prev,
      session: value,
    }))

    setErrorMessage('')
  }

  const handleMusicsheetInputChange = (event) => {
    const { name, value } = event.target

    setMusicsheetForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrorMessage('')
  }

  const isPdfFile = (file) => {
    const fileName = file.name?.toLowerCase() || ''
    const fileType = file.type || ''

    return fileType === 'application/pdf' || fileName.endsWith('.pdf')
  }

  const createSafeId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID()
    }

    return `${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  const handleMusicsheetFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setMusicsheetFile(null)
      setMusicsheetFileName('선택된 파일 없음')
      return
    }

    if (!isPdfFile(file)) {
      setErrorMessage('PDF 파일만 업로드할 수 있습니다.')
      setMusicsheetFile(null)
      setMusicsheetFileName('선택된 파일 없음')
      event.target.value = ''
      return
    }

    setMusicsheetFile(file)
    setMusicsheetFileName(file.name || '선택한 PDF 파일')
    setErrorMessage('')
  }

  const uploadMusicsheetFile = async (file) => {
    if (!file) return null

    const safeUserId = String(storageInfo?.userId || 'guest').replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )

    const fileName = `${Date.now()}_${createSafeId()}.pdf`
    const filePath = `${safeUserId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('musicsheet-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('musicsheet-files')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Storage public URL에서 bucket 내부 path만 추출
  const getStorageFilePathFromUrl = (bucketName, fileUrl) => {
    if (!fileUrl) return ''

    const marker = `/storage/v1/object/public/${bucketName}/`
    const markerIndex = fileUrl.indexOf(marker)

    if (markerIndex === -1) return ''

    return decodeURIComponent(fileUrl.slice(markerIndex + marker.length))
  }

  // Storage public URL을 기준으로 PDF 파일 삭제
  const deleteStorageFileByUrl = async (bucketName, fileUrl) => {
    const filePath = getStorageFilePathFromUrl(bucketName, fileUrl)

    if (!filePath) return

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      throw error
    }
  }

  const validateMusicsheetForm = () => {
    if (!musicsheetForm.session.trim()) {
      return '세션을 선택해주세요.'
    }

    if (!musicsheetForm.title.trim()) {
      return '제목을 입력해주세요.'
    }

    if (!musicsheetForm.description.trim()) {
      return '설명을 입력해주세요.'
    }

    if (!musicsheetFile) {
      return 'PDF 파일을 첨부해주세요.'
    }

    return ''
  }

  const handleAddMusicsheet = async () => {
    const validationMessage = validateMusicsheetForm()

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      const pdfUrl = await uploadMusicsheetFile(musicsheetFile)

      const payload = {
        session: musicsheetForm.session,
        title: musicsheetForm.title.trim(),
        description: musicsheetForm.description.trim(),
        fileName: musicsheetFile.name,
        pdfUrl,
      }

      const { error } = await supabase.from('musicsheet').insert([payload])

      if (error) {
        throw error
      }

      await getMusicsheetList()
      handleCloseMusicsheetModal()

      showToast('악보가 등록되었습니다.')
    } catch (error) {
      console.error('악보 등록 실패:', {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
        error,
        fileName: musicsheetFile?.name,
        fileType: musicsheetFile?.type,
        fileSize: musicsheetFile?.size,
      })

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '등록 실패',
        message:
          '악보 등록 중 오류가 발생했습니다. PDF 파일, 네트워크 상태 또는 Supabase 설정을 확인해주세요.',
      })
    }
  }

  // 악보 삭제 확인 모달 열기
  const handleOpenMusicsheetDeleteModal = (event, pdf) => {
    event.stopPropagation()

    if (!isAdmin) {
      return
    }

    setDeleteMusicsheetTarget(pdf)
  }

  // 악보 삭제 확인 모달 닫기
  const handleCloseMusicsheetDeleteModal = () => {
    setDeleteMusicsheetTarget(null)
  }

  // 악보 삭제 API 호출
  const handleDeleteMusicsheet = async () => {
    if (!deleteMusicsheetTarget) return

    if (!isAdmin) {
      setDeleteMusicsheetTarget(null)
      return
    }

    try {
      if (deleteMusicsheetTarget.pdfUrl) {
        await deleteStorageFileByUrl(
          'musicsheet-files',
          deleteMusicsheetTarget.pdfUrl
        )
      }

      const { error } = await supabase
        .from('musicsheet')
        .delete()
        .eq('id', deleteMusicsheetTarget.id)

      if (error) {
        throw error
      }

      await getMusicsheetList()

      if (selectedPdf?.id === deleteMusicsheetTarget.id) {
        setSelectedPdf(null)
      }

      showToast('악보가 삭제되었습니다.')

      setDeleteMusicsheetTarget(null)
    } catch (error) {
      console.error('악보 삭제 실패:', error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '삭제 실패',
        message:
          '악보 삭제 중 오류가 발생했습니다. Supabase 또는 Storage 설정을 확인해주세요.',
      })

      setDeleteMusicsheetTarget(null)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.libraryControls} aria-label="악보 검색과 필터">
        <label className={styles.searchField}>
          <img src={searchIcon} alt="" aria-hidden="true" />
          <input
            type="search"
            value={searchKeyword}
            placeholder="곡명 또는 설명 검색"
            aria-label="곡명 또는 설명 검색"
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>

        <MusicsheetFilterTabs
          activeFilter={activeSessionFilter}
          counts={sessionCounts}
          onChange={handleMusicsheetFilterChange}
        />
      </section>

      <button
        type="button"
        className={styles.contentAddButton}
        data-floating-add-button
        onClick={handleOpenMusicsheetModal}
        aria-label="PDF 악보 추가"
      >
        +
      </button>

      <section className={styles.librarySection}>
        <div className={styles.musicsheetList}>
          {filteredMusicsheetList.map((pdf) => (
            <article
              key={pdf.id}
              className={`${styles.musicsheetCard} ${getSessionClassName(
                pdf.session
              )} ${selectedPdf?.id === pdf.id ? styles.active : ''}`}
            >
              <button
                type="button"
                className={styles.cardSelectButton}
                onClick={() => handlePdfClick(pdf)}
                aria-label={`${pdf.title} 악보 미리보기`}
              >
                <span className={styles.pdfThumbnail} aria-hidden="true">
                  <img
                    src={getSessionPdfIcon(pdf.session)}
                    alt=""
                    className={styles.pdfIcon}
                  />
                  <span className={styles.pdfLabel}>PDF</span>
                </span>

                <span className={styles.musicsheetInfo}>
                  <span className={styles.sessionBadge}>{pdf.session}</span>
                  <strong>{pdf.title}</strong>
                  <span className={styles.description}>{pdf.description}</span>
                  <span className={styles.fileMeta}>
                    {pdf.fileName || 'PDF 파일'}
                  </span>
                </span>
              </button>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.previewButton}
                  onClick={() => handlePdfClick(pdf)}
                >
                  미리보기
                </button>

                {pdf.pdfUrl && (
                  <a
                    href={pdf.pdfUrl}
                    download={pdf.fileName}
                    className={styles.downloadButton}
                    aria-label={`${pdf.title} 다운로드`}
                  >
                    <img src={downloadIcon} alt="" aria-hidden="true" />
                    <span>다운로드</span>
                  </a>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={(event) =>
                      handleOpenMusicsheetDeleteModal(event, pdf)
                    }
                    aria-label={`${pdf.title} 삭제`}
                  >
                    삭제
                  </button>
                )}
              </div>
            </article>
          ))}

          {filteredMusicsheetList.length === 0 && (
            <div className={styles.emptyState}>
              {searchKeyword.trim()
                ? '검색 조건에 맞는 PDF 악보가 없습니다.'
                : activeSessionFilter === '전체'
                  ? '등록된 PDF 악보가 없습니다.'
                  : `${activeSessionFilter} 세션의 PDF 악보가 없습니다.`}
            </div>
          )}
        </div>
      </section>

      {selectedPdf && (
        <section
          ref={previewSectionRef}
          className={styles.previewSection}
          aria-label="선택한 악보 미리보기"
        >
          <PdfPreview pdf={selectedPdf} />
        </section>
      )}

      {isMusicsheetModalOpen && (
        <MusicsheetAddModal
          musicsheetForm={musicsheetForm}
          musicsheetFileName={musicsheetFileName}
          errorMessage={errorMessage}
          onClose={handleCloseMusicsheetModal}
          onSubmit={handleAddMusicsheet}
          onSessionChange={handleMusicsheetSessionChange}
          onInputChange={handleMusicsheetInputChange}
          onFileChange={handleMusicsheetFileChange}
        />
      )}

      {deleteMusicsheetTarget && (
        <PlaceResultModal
          type="confirm"
          title="삭제 확인"
          message={`${deleteMusicsheetTarget.title} 악보를 삭제하시겠습니까?`}
          confirmText="삭제"
          cancelText="취소"
          onClose={handleCloseMusicsheetDeleteModal}
          onConfirm={handleDeleteMusicsheet}
        />
      )}

      {resultModal.isOpen && (
        <PlaceResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={handleCloseResultModal}
        />
      )}
    </div>
  )
}

export default MusicsheetPage
