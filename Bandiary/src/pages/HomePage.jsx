import { useState, useEffect } from 'react'
import supabase from '../api/supabase'

import StatCard from '../components/home/StatCard'
import ContentCard from '../components/home/ContentCard'
import ContentFilterTabs from '../components/home/ContentFilterTabs'
import ProfileEditModal from '../components/home/ProfileEditModal'
import ContentAddModal from '../components/home/ContentAddModal'
import ContentDetailModal from '../components/home/ContentDetailModal'
import PlaceResultModal from '../components/place/PlaceResultModal'

import profile from '../assets/images/profile.jpeg'
import picture from '../assets/images/picture_white.svg'
import video from '../assets/images/video_white.svg'
import editIcon from '../assets/images/edit.svg'

const initialProfileForm = {
  name: '',
  bandName: '',
  mainSession: '',
  subSession: '',
}

const initialContentForm = {
  category: '',
  title: '',
}

function HomePage() {
  const [selectedContent, setSelectedContent] = useState(null)

  // 프로필 데이터 상태값
  const [profileInfo, setProfileInfo] = useState([])
  const [profileForm, setProfileForm] = useState(initialProfileForm)

  const [profileImageFile, setProfileImageFile] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState('')

  // 콘텐츠 데이터 상태값
  const [content, setContent] = useState([])

  // 콘텐츠 필터 상태값
  const [activeContentFilter, setActiveContentFilter] = useState('전체')

  // 콘텐츠 추가 모달 상태값
  const [isContentModalOpen, setIsContentModalOpen] = useState(false)
  const [contentType, setContentType] = useState('사진')
  const [contentForm, setContentForm] = useState(initialContentForm)
  const [contentFile, setContentFile] = useState(null)
  const [contentFileName, setContentFileName] = useState('선택된 파일 없음')
  const [contentPreview, setContentPreview] = useState('')

  // 콘텐츠 상세 모달 상태값
  const [detailContent, setDetailContent] = useState(null)

  // 콘텐츠 삭제 대상 상태값
  const [deleteContentTarget, setDeleteContentTarget] = useState(null)

  // 모달 관련 데이터 상태값
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
  })

  // 유저 데이터 호출
  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  // 비디오, 사진 개수 출력
  const videoCount = content.filter((item) => item.type === '비디오').length
  const pictureCount = content.filter((item) => item.type === '사진').length

  // 필터링된 콘텐츠 목록
  const filteredContent =
    activeContentFilter === '전체'
      ? content
      : content.filter((item) => item.type === activeContentFilter)

  const getUsers = async () => {
    if (!storageInfo?.userId) return

    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('userId', storageInfo.userId)

    if (error) {
      console.error(error)
      return
    }

    setProfileInfo(data)
  }

  // 콘텐츠 데이터 호출
  const getContent = async () => {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setContent(data)
    }
  }

  useEffect(() => {
    getUsers()
    getContent()
  }, [])

  // Storage public URL에서 bucket 내부 path만 추출
  const getStorageFilePathFromUrl = (bucketName, fileUrl) => {
    if (!fileUrl) return ''

    const marker = `/storage/v1/object/public/${bucketName}/`
    const markerIndex = fileUrl.indexOf(marker)

    if (markerIndex === -1) return ''

    return decodeURIComponent(fileUrl.slice(markerIndex + marker.length))
  }

  // Storage public URL을 기준으로 파일 삭제
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

  // 모바일 WebView 대응: file.type이 비어 있을 수 있으므로 확장자도 함께 검사
  const isImageFile = (file) => {
    const fileName = file.name?.toLowerCase() || ''
    const fileType = file.type || ''

    return (
      fileType.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif)$/.test(fileName)
    )
  }

  const isVideoFile = (file) => {
    const fileName = file.name?.toLowerCase() || ''
    const fileType = file.type || ''

    return (
      fileType.startsWith('video/') ||
      /\.(mp4|mov|webm|m4v|avi)$/.test(fileName)
    )
  }

  const getFileExtension = (file, type) => {
    const fileName = file?.name || ''
    const extFromName = fileName.includes('.')
      ? fileName.split('.').pop().toLowerCase()
      : ''

    if (extFromName) return extFromName

    if (type === '사진' || type === 'profile') {
      if (file.type === 'image/png') return 'png'
      if (file.type === 'image/webp') return 'webp'
      if (file.type === 'image/gif') return 'gif'
      if (file.type === 'image/heic') return 'heic'
      if (file.type === 'image/heif') return 'heif'

      return 'jpg'
    }

    if (type === '비디오') {
      if (file.type === 'video/quicktime') return 'mov'
      if (file.type === 'video/webm') return 'webm'
      if (file.type === 'video/x-m4v') return 'm4v'

      return 'mp4'
    }

    return 'file'
  }

  const createSafeId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID()
    }

    return `${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  // 프로필 수정 Modal 관련 메서드
  const handleOpenProfileModal = () => {
    const currentProfile = profileInfo[0]

    setProfileForm({
      name: currentProfile?.name || '',
      bandName: currentProfile?.bandName || '',
      mainSession: currentProfile?.mainSession || '',
      subSession: currentProfile?.subSession || '',
    })

    setProfileImageFile(null)
    setProfileImagePreview(currentProfile?.profileImageUrl || '')
    setErrorMessage('')
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
    setProfileForm(initialProfileForm)
    setProfileImageFile(null)
    setProfileImagePreview('')
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

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrorMessage('')
  }

  // 프로필 이미지 수정 메서드
  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!isImageFile(file)) {
      setErrorMessage('이미지 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    setProfileImageFile(file)
    setProfileImagePreview(URL.createObjectURL(file))
    setErrorMessage('')
  }

  const uploadProfileImage = async (file) => {
    if (!file) return null

    const fileExt = getFileExtension(file, 'profile')
    const safeUserId = String(storageInfo?.userId || 'guest').replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )

    const fileName = `${Date.now()}_${createSafeId()}.${fileExt}`
    const filePath = `${safeUserId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath)

    return {
      publicUrl: data.publicUrl,
      filePath,
    }
  }

  const handleUpdateProfile = async () => {
    if (!storageInfo?.userId) {
      setErrorMessage('로그인 사용자 정보를 찾을 수 없습니다.')
      return
    }

    let uploadedProfileImagePath = ''

    try {
      const previousProfileImageUrl = profileInfo[0]?.profileImageUrl || null
      let profileImageUrl = previousProfileImageUrl

      if (profileImageFile) {
        const uploadedProfileImage = await uploadProfileImage(profileImageFile)

        profileImageUrl = uploadedProfileImage.publicUrl
        uploadedProfileImagePath = uploadedProfileImage.filePath
      }

      const payload = {
        name: profileForm.name.trim() || null,
        bandName: profileForm.bandName.trim() || null,
        mainSession: profileForm.mainSession.trim() || null,
        subSession: profileForm.subSession.trim() || null,
        profileImageUrl,
      }

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('userId', storageInfo.userId)

      if (error) {
        throw error
      }

      // 새 프로필 이미지로 정상 업데이트된 후에만 기존 프로필 이미지를 Storage에서 삭제
      if (
        profileImageFile &&
        previousProfileImageUrl &&
        previousProfileImageUrl !== profileImageUrl
      ) {
        await deleteStorageFileByUrl('profile-images', previousProfileImageUrl)
      }

      await getUsers()
      handleCloseProfileModal()

      setResultModal({
        isOpen: true,
        type: 'success',
        title: '수정 완료',
        message: '프로필 정보가 성공적으로 수정되었습니다.',
      })
    } catch (error) {
      console.error('프로필 수정 실패:', {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
        error,
        fileName: profileImageFile?.name,
        fileType: profileImageFile?.type,
        fileSize: profileImageFile?.size,
      })

      // 새 이미지 업로드는 성공했지만 users 테이블 update가 실패한 경우,
      // 새로 업로드된 이미지가 Storage에 남지 않도록 삭제
      if (uploadedProfileImagePath) {
        const { error: removeUploadedError } = await supabase.storage
          .from('profile-images')
          .remove([uploadedProfileImagePath])

        if (removeUploadedError) {
          console.error('업로드된 프로필 이미지 정리 실패:', removeUploadedError)
        }
      }

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '수정 실패',
        message:
          '프로필 수정 중 오류가 발생했습니다. Storage 또는 Supabase 설정을 확인해주세요.',
      })
    }
  }

  // 콘텐츠 추가 Modal 관련 메서드
  const handleOpenContentModal = () => {
    setContentType('사진')
    setContentForm(initialContentForm)
    setContentFile(null)
    setContentFileName('선택된 파일 없음')

    if (contentPreview) {
      URL.revokeObjectURL(contentPreview)
    }

    setContentPreview('')
    setErrorMessage('')
    setIsContentModalOpen(true)
  }

  const handleCloseContentModal = () => {
    setIsContentModalOpen(false)
    setContentType('사진')
    setContentForm(initialContentForm)
    setContentFile(null)
    setContentFileName('선택된 파일 없음')

    if (contentPreview) {
      URL.revokeObjectURL(contentPreview)
    }

    setContentPreview('')
    setErrorMessage('')
  }

  const handleContentTypeChange = (event) => {
    setContentType(event.target.value)
    setContentFile(null)
    setContentFileName('선택된 파일 없음')

    if (contentPreview) {
      URL.revokeObjectURL(contentPreview)
    }

    setContentPreview('')
    setErrorMessage('')
  }

  const handleContentInputChange = (event) => {
    const { name, value } = event.target

    setContentForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrorMessage('')
  }

  const handleContentFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setContentFile(null)
      setContentFileName('선택된 파일 없음')

      if (contentPreview) {
        URL.revokeObjectURL(contentPreview)
      }

      setContentPreview('')
      return
    }

    if (contentType === '사진' && !isImageFile(file)) {
      setErrorMessage('사진 콘텐츠는 이미지 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (contentType === '비디오' && !isVideoFile(file)) {
      setErrorMessage('비디오 콘텐츠는 영상 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    const maxImageSize = 10 * 1024 * 1024
    const maxVideoSize = 50 * 1024 * 1024

    if (contentType === '사진' && file.size > maxImageSize) {
      setErrorMessage('이미지 파일은 10MB 이하만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (contentType === '비디오' && file.size > maxVideoSize) {
      setErrorMessage('영상 파일은 50MB 이하만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    setContentFile(file)
    setContentFileName(file.name || '선택한 파일')

    if (contentPreview) {
      URL.revokeObjectURL(contentPreview)
    }

    // 모바일 네이버앱 WebView에서는 대용량 영상 미리보기가 불안정할 수 있으므로
    // 사진만 미리보기를 생성하고, 영상은 파일명만 보여준다.
    if (contentType === '사진') {
      setContentPreview(URL.createObjectURL(file))
    } else {
      setContentPreview('')
    }

    setErrorMessage('')
  }

  const uploadContentFile = async (file) => {
    if (!file) return null

    const fileExt = getFileExtension(file, contentType)
    const storageFolderName = contentType === '사진' ? 'image' : 'video'

    const safeUserId = String(storageInfo?.userId || 'guest').replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )

    const fileName = `${Date.now()}_${createSafeId()}.${fileExt}`
    const filePath = `${safeUserId}/${storageFolderName}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('content-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('content-files')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const validateContentForm = () => {
    if (!contentForm.category.trim()) {
      return '카테고리를 입력해주세요.'
    }

    if (!contentForm.title.trim()) {
      return '제목을 입력해주세요.'
    }

    if (!contentFile) {
      return contentType === '사진'
        ? '이미지 파일을 첨부해주세요.'
        : '영상 파일을 첨부해주세요.'
    }

    return ''
  }

  const handleAddContent = async () => {
    const validationMessage = validateContentForm()

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      const contentFileUrl = await uploadContentFile(contentFile)

      const payload = {
        type: contentType,
        category: contentForm.category.trim(),
        title: contentForm.title.trim(),
        contentImageUrl: contentType === '사진' ? contentFileUrl : null,
        contentVideoUrl: contentType === '비디오' ? contentFileUrl : null,
      }

      const { error } = await supabase.from('content').insert([payload])

      if (error) {
        throw error
      }

      await getContent()
      handleCloseContentModal()

      setResultModal({
        isOpen: true,
        type: 'success',
        title: '등록 완료',
        message:
          contentType === '사진'
            ? '사진 콘텐츠가 성공적으로 등록되었습니다.'
            : '비디오 콘텐츠가 성공적으로 등록되었습니다.',
      })
    } catch (error) {
      console.error('콘텐츠 업로드 실패:', {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
        error,
        contentType,
        fileName: contentFile?.name,
        fileType: contentFile?.type,
        fileSize: contentFile?.size,
      })

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '등록 실패',
        message:
          '콘텐츠 등록 중 오류가 발생했습니다. 파일 용량, 형식, 네트워크 상태 또는 Supabase 설정을 확인해주세요.',
      })
    }
  }

  // 콘텐츠 필터 변경
  const handleContentFilterChange = (filterValue) => {
    setActiveContentFilter(filterValue)
    setSelectedContent(null)
  }

  // 콘텐츠 카드 클릭
  const handleContentCardClick = (item) => {
    setSelectedContent(item)
    setDetailContent(item)
  }

  const handleCloseDetailModal = () => {
    setDetailContent(null)
  }

  // 콘텐츠 삭제 확인 모달 열기
  const handleOpenContentDeleteModal = (event, item) => {
    event.stopPropagation()
    setDeleteContentTarget(item)
  }

  // 콘텐츠 삭제 확인 모달 닫기
  const handleCloseContentDeleteModal = () => {
    setDeleteContentTarget(null)
  }

  // 콘텐츠 삭제 API 호출
  const handleDeleteContent = async () => {
    if (!deleteContentTarget) return

    try {
      const fileUrl =
        deleteContentTarget.type === '사진'
          ? deleteContentTarget.contentImageUrl
          : deleteContentTarget.contentVideoUrl

      if (fileUrl) {
        await deleteStorageFileByUrl('content-files', fileUrl)
      }

      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', deleteContentTarget.id)

      if (error) {
        throw error
      }

      await getContent()

      if (selectedContent?.id === deleteContentTarget.id) {
        setSelectedContent(null)
      }

      if (detailContent?.id === deleteContentTarget.id) {
        setDetailContent(null)
      }

      setResultModal({
        isOpen: true,
        type: 'success',
        title: '삭제 완료',
        message: `${deleteContentTarget.title} 콘텐츠가 삭제되었습니다.`,
      })

      setDeleteContentTarget(null)
    } catch (error) {
      console.error(error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '삭제 실패',
        message:
          '콘텐츠 삭제 중 오류가 발생했습니다. Supabase 또는 Storage 설정을 확인해주세요.',
      })

      setDeleteContentTarget(null)
    }
  }

  return (
    <div className="page home-page">
      <section className="user-greeting">
        <div>
          <h2>안녕하세요, {profileInfo[0]?.name || 'Guest'}님</h2>
          <p>{profileInfo[0]?.bandName || '밴드를 설정해주세요'}</p>
        </div>

        <div className="profile-avatar">
          <img
            src={profileInfo[0]?.profileImageUrl || profile}
            alt={`${profileInfo[0]?.name || 'Guest'} 프로필`}
          />
        </div>
      </section>

      <section className="profile-edit-section">
        <button
          type="button"
          className="profile-edit-button"
          onClick={handleOpenProfileModal}
        >
          <img src={editIcon} alt="edit" />
          프로필 수정
        </button>
      </section>

      <section className="instrument-grid">
        <div className="instrument-card">
          <p>메인 세션</p>
          <strong>
            {profileInfo[0]?.mainSession || (
              <>
                메인 세션을 <br /> 설정해주세요
              </>
            )}
          </strong>
        </div>

        <div className="instrument-card">
          <p>서브 세션</p>
          <strong>
            {profileInfo[0]?.subSession || (
              <>
                서브 세션을 <br /> 설정해주세요
              </>
            )}
          </strong>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="비디오" value={videoCount} icon={video} />
        <StatCard title="사진" value={pictureCount} icon={picture} />
      </section>

      <ContentFilterTabs
        activeFilter={activeContentFilter}
        onChange={handleContentFilterChange}
      />

      <button
        type="button"
        className="content-add-button"
        onClick={handleOpenContentModal}
        aria-label="사진 또는 비디오 추가"
      >
        +
      </button>

      <section>
        <div className="home-card-grid">
          {filteredContent.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              isActive={selectedContent?.id === item.id}
              onClick={handleContentCardClick}
              onDeleteClick={handleOpenContentDeleteModal}
            />
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="content-empty-box">
            {activeContentFilter === '전체'
              ? '등록된 콘텐츠가 없습니다.'
              : `${activeContentFilter} 콘텐츠가 없습니다.`}
          </div>
        )}
      </section>

      {/* 프로필 수정 Modal */}
      {isProfileModalOpen && (
        <ProfileEditModal
          profileForm={profileForm}
          profileImagePreview={profileImagePreview}
          errorMessage={errorMessage}
          onClose={handleCloseProfileModal}
          onSubmit={handleUpdateProfile}
          onInputChange={handleProfileInputChange}
          onImageChange={handleProfileImageChange}
        />
      )}

      {/* 콘텐츠 추가 Modal */}
      {isContentModalOpen && (
        <ContentAddModal
          contentType={contentType}
          contentForm={contentForm}
          contentFileName={contentFileName}
          contentPreview={contentPreview}
          errorMessage={errorMessage}
          onClose={handleCloseContentModal}
          onSubmit={handleAddContent}
          onContentTypeChange={handleContentTypeChange}
          onInputChange={handleContentInputChange}
          onFileChange={handleContentFileChange}
        />
      )}

      {/* 콘텐츠 상세 Modal */}
      {detailContent && (
        <ContentDetailModal
          content={detailContent}
          onClose={handleCloseDetailModal}
        />
      )}

      {/* 콘텐츠 삭제 확인 Modal */}
      {deleteContentTarget && (
        <PlaceResultModal
          type="confirm"
          title="삭제 확인"
          message={`${deleteContentTarget.title} 콘텐츠를 삭제하시겠습니까?`}
          confirmText="삭제"
          cancelText="취소"
          onClose={handleCloseContentDeleteModal}
          onConfirm={handleDeleteContent}
        />
      )}

      {/* 결과 Modal */}
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

export default HomePage