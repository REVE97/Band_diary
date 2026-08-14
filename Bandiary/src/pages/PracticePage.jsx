import { useEffect, useState } from 'react'
import supabase from '../api/supabase'
import styles from './PracticePage.module.css'

import PdfPreview from '../components/common/PdfPreview'
import MusicsheetAddModal from '../components/practice/MusicsheetAddModal'
import PracticeFilterTabs from '../components/practice/PracticeFilterTabs'
import PlaceResultModal from '../components/place/PlaceResultModal'

const initialMusicsheetForm = {
  session: 'Vocal',
  title: '',
  description: '',
}

function PracticePage() {
  const [musicsheetList, setMusicsheetList] = useState([])
  const [selectedPdf, setSelectedPdf] = useState(null)

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

  // 선택한 세션에 따라 필터링된 악보 목록
  const filteredMusicsheetList =
    activeSessionFilter === '전체'
      ? musicsheetList
      : musicsheetList.filter(
          (musicsheet) => musicsheet.session === activeSessionFilter
        )

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
    getMusicsheetList()
  }, [])

  const handlePdfClick = (pdf) => {
    setSelectedPdf(pdf)
  }

  const handlePracticeFilterChange = (filterValue) => {
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

      setResultModal({
        isOpen: true,
        type: 'success',
        title: '등록 완료',
        message: 'PDF 악보가 성공적으로 등록되었습니다.',
      })
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

      setResultModal({
        isOpen: true,
        type: 'success',
        title: '삭제 완료',
        message: `${deleteMusicsheetTarget.title} 악보가 삭제되었습니다.`,
      })

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
    <div className={`${styles.page} ${styles.pdfPage}`}>
      <PracticeFilterTabs
        activeFilter={activeSessionFilter}
        onChange={handlePracticeFilterChange}
      />

      <button
        type="button"
        className={styles.contentAddButton}
        onClick={handleOpenMusicsheetModal}
        aria-label="PDF 악보 추가"
      >
        +
      </button>

      <div className={styles.studioList}>
        {filteredMusicsheetList.map((pdf) => (
          <div
            key={pdf.id}
            role="button"
            tabIndex={0}
            className={selectedPdf?.id === pdf.id ? styles.studioCard + " " + styles.active : styles.studioCard}
            onClick={() => handlePdfClick(pdf)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handlePdfClick(pdf)
              }
            }}
          >
            {isAdmin && (
              <button
                type="button"
                className={styles.studioDeleteButton}
                onClick={(event) => handleOpenMusicsheetDeleteModal(event, pdf)}
                aria-label={`${pdf.title} 삭제`}
              >
                -
              </button>
            )}

            <div className={styles.studioInfo}>
              <strong>{pdf.title}</strong>
              <span>{pdf.description}</span>
              <p>{pdf.session}</p>
            </div>
          </div>
        ))}

        {filteredMusicsheetList.length === 0 && (
          <div className={styles.contentEmptyBox}>
            {activeSessionFilter === '전체'
              ? '등록된 PDF 악보가 없습니다.'
              : `${activeSessionFilter} 세션의 PDF 악보가 없습니다.`}
          </div>
        )}
      </div>

      <div className={styles.pdfBox}>
        <PdfPreview pdf={selectedPdf} />
      </div>

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

export default PracticePage
