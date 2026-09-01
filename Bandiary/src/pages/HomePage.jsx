import { useRef, useState, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import supabase from '../api/supabase'

import ContentCard from '../components/home/ContentCard'
import ContentFilterTabs from '../components/home/ContentFilterTabs'
import ProfileEditModal from '../components/home/ProfileEditModal'
import ContentAddModal from '../components/home/ContentAddModal'
import VideoDetailModal from '../components/home/VideoDetailModal'
import AudioDetailModal from '../components/home/AudioDetailModal'
import PictureDetailModal from '../components/home/PictureDetailModal'
import PlaceResultModal from '../components/place/PlaceResultModal'
import useToast from '../components/common/useToast'

import profile from '../assets/images/default_profile.svg'
import addIcon from '../assets/images/add.svg'
import editIcon from '../assets/images/edit.svg'
import instagramIcon from '../assets/images/instagram.svg'
import discordIcon from '../assets/images/discord.svg'
import usersIcon from '../assets/images/users.svg'
import styles from './HomePage.module.css'

const initialProfileForm = {
  description: '',
  members: [],
}

const initialContentForm = {
  title: '',
}

function HomePage() {
  const { showToast } = useToast()
  const [selectedContent, setSelectedContent] = useState(null)

  // 프로필 데이터 상태값
  const [profileInfo, setProfileInfo] = useState([])
  const [profileForm, setProfileForm] = useState(initialProfileForm)
  const [isMembersTooltipOpen, setIsMembersTooltipOpen] = useState(false)
  const membersTooltipRef = useRef(null)

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
  const [contentAudioFiles, setContentAudioFiles] = useState([])
  const [contentPreview, setContentPreview] = useState('')
  const [isContentUploading, setIsContentUploading] = useState(false)
  const [convertMessage, setConvertMessage] = useState('')

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

  // ffmpeg.wasm 인스턴스
  const ffmpegRef = useRef(new FFmpeg())
  const isFfmpegLoadedRef = useRef(false)

  // 유저 데이터 호출
  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  // 관리자 여부 확인
  const isAdmin = storageInfo?.userId === 'admin'

  const members = Array.isArray(profileInfo[0]?.members)
    ? profileInfo[0].members
    : []

  // 비디오, 사진, 오디오 개수
  const videoCount = content.filter((item) => item.type === '비디오').length
  const pictureCount = content.filter((item) => item.type === '사진').length
  const audioCount = content.filter((item) => item.type === '오디오').length

  const contentCounts = {
    전체: content.length,
    비디오: videoCount,
    사진: pictureCount,
    오디오: audioCount,
  }

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
      return
    }

    const contentList = data || []
    const audioContentIds = contentList
      .filter((item) => item.type === '오디오')
      .map((item) => item.id)
    const pictureContentIds = contentList
      .filter((item) => item.type === '사진')
      .map((item) => item.id)
    const videoContentIds = contentList
      .filter((item) => item.type === '비디오')
      .map((item) => item.id)

    const audioFilesByContentId = new Map()
    const pictureFilesByContentId = new Map()
    const videoFilesByContentId = new Map()

    if (audioContentIds.length > 0) {
      const { data: audioData, error: audioError } = await supabase
        .from('content_audio')
        .select(
          'id, content_id, title, file_url, storage_path, original_file_name, mime_type, file_size, sort_order, created_at'
        )
        .in('content_id', audioContentIds)
        .order('sort_order', { ascending: true })

      if (audioError) {
        console.error('오디오 목록 조회 실패:', audioError)
      } else {
        const audioFileList = audioData || []

        audioFileList.forEach((audioFile) => {
          const currentAudioFiles =
            audioFilesByContentId.get(audioFile.content_id) || []

          currentAudioFiles.push(audioFile)
          audioFilesByContentId.set(audioFile.content_id, currentAudioFiles)
        })
      }
    }

    if (pictureContentIds.length > 0) {
      const { data: pictureData, error: pictureError } = await supabase
        .from('content_picture')
        .select(
          'id, content_id, file_url, storage_path, original_file_name, mime_type, file_size, sort_order, created_at'
        )
        .in('content_id', pictureContentIds)
        .order('sort_order', { ascending: true })

      if (pictureError) {
        console.error('사진 목록 조회 실패:', pictureError)
      } else {
        const pictureFileList = pictureData || []

        pictureFileList.forEach((pictureFile) => {
          const currentPictureFiles =
            pictureFilesByContentId.get(pictureFile.content_id) || []

          currentPictureFiles.push(pictureFile)
          pictureFilesByContentId.set(
            pictureFile.content_id,
            currentPictureFiles
          )
        })
      }
    }

    if (videoContentIds.length > 0) {
      const { data: videoData, error: videoError } = await supabase
        .from('content_video')
        .select(
          'id, content_id, file_url, storage_path, original_file_name, mime_type, file_size, duration, width, height, sort_order, created_at'
        )
        .in('content_id', videoContentIds)
        .order('sort_order', { ascending: true })

      if (videoError) {
        console.error('비디오 목록 조회 실패:', videoError)
      } else {
        const videoFileList = videoData || []

        videoFileList.forEach((videoFile) => {
          const currentVideoFiles =
            videoFilesByContentId.get(videoFile.content_id) || []

          currentVideoFiles.push(videoFile)
          videoFilesByContentId.set(videoFile.content_id, currentVideoFiles)
        })
      }
    }

    setContent(
      contentList.map((item) => {
        const savedAudioFiles = audioFilesByContentId.get(item.id) || []
        const savedPictureFiles = pictureFilesByContentId.get(item.id) || []
        const savedVideoFiles = videoFilesByContentId.get(item.id) || []

        return {
          ...item,
          audioFiles: savedAudioFiles,
          pictureFiles: savedPictureFiles,
          videoFiles: savedVideoFiles,
        }
      })
    )
  }

  useEffect(() => {
    // 초기 화면 진입 시 프로필과 콘텐츠 데이터를 함께 조회합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void Promise.all([getUsers(), getContent()])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isMembersTooltipOpen) return undefined

    const handleMembersTooltipClose = (event) => {
      if (
        event.type === 'keydown' &&
        event.key !== 'Escape'
      ) {
        return
      }

      if (
        event.type === 'pointerdown' &&
        membersTooltipRef.current?.contains(event.target)
      ) {
        return
      }

      setIsMembersTooltipOpen(false)
    }

    document.addEventListener('pointerdown', handleMembersTooltipClose)
    document.addEventListener('keydown', handleMembersTooltipClose)

    return () => {
      document.removeEventListener('pointerdown', handleMembersTooltipClose)
      document.removeEventListener('keydown', handleMembersTooltipClose)
    }
  }, [isMembersTooltipOpen])

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

    const { error } = await supabase.storage.from(bucketName).remove([filePath])

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

  const isAudioFile = (file) => {
    const fileName = file.name?.toLowerCase() || ''
    const fileType = file.type || ''

    return (
      fileType.startsWith('audio/') ||
      /\.(mp3|m4a|aac|wav|webm|ogg)$/.test(fileName)
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

    if (type === '오디오') {
      if (file.type === 'audio/mpeg') return 'mp3'
      if (file.type === 'audio/mp4') return 'm4a'
      if (file.type === 'audio/aac') return 'aac'
      if (file.type === 'audio/wav') return 'wav'
      if (file.type === 'audio/webm') return 'webm'
      if (file.type === 'audio/ogg') return 'ogg'

      return 'm4a'
    }

    return 'file'
  }

  const createSafeId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID()
    }

    return `${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  const getSafeUserId = () => {
    return String(storageInfo?.userId || 'guest').replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )
  }

  // ffmpeg.wasm 로드
  const loadFfmpeg = async () => {
    if (isFfmpegLoadedRef.current) return

    setConvertMessage('미디어 변환 엔진을 불러오는 중입니다.')

    const ffmpeg = ffmpegRef.current

    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message)
    })

    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm'

    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript'
      ),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
    })

    isFfmpegLoadedRef.current = true
  }

  // 영상 파일을 m4a 194k 오디오 파일로 변환
  const convertVideoToM4a = async (file) => {
    await loadFfmpeg()

    setConvertMessage('영상에서 오디오를 추출하는 중입니다.')

    const ffmpeg = ffmpegRef.current

    const inputExt = getFileExtension(file, '비디오')
    const inputName = `input_${Date.now()}.${inputExt}`
    const outputName = `output_${Date.now()}.m4a`

    await ffmpeg.writeFile(inputName, await fetchFile(file))

    const resultCode = await ffmpeg.exec([
      '-i',
      inputName,
      '-vn',
      '-c:a',
      'aac',
      '-b:a',
      '194k',
      outputName,
    ])

    if (resultCode !== 0) {
      throw new Error('영상 파일을 m4a 오디오로 변환하지 못했습니다.')
    }

    const data = await ffmpeg.readFile(outputName)

    try {
      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
    } catch (error) {
      console.warn('ffmpeg 임시 파일 삭제 실패:', error)
    }

    const audioBlob = new Blob([data.buffer], {
      type: 'audio/mp4',
    })

    const originalName = file.name?.replace(/\.[^/.]+$/, '') || 'converted'

    return new File([audioBlob], `${originalName}.m4a`, {
      type: 'audio/mp4',
    })
  }

  // Supabase Free Storage 제한에 맞춰 영상을 540p MP4로 압축
  const compressVideoTo540p = async (file) => {
    await loadFfmpeg()

    setConvertMessage(
      '비디오를 540p로 압축하는 중입니다. 기기 성능에 따라 시간이 걸릴 수 있어요.'
    )

    const ffmpeg = ffmpegRef.current
    const inputExt = getFileExtension(file, '비디오')
    const fileId = createSafeId()
    const inputName = 'video_input_' + fileId + '.' + inputExt
    const outputName = 'video_output_' + fileId + '.mp4'

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))

      const resultCode = await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        'scale=-2:540',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-b:v',
        '650k',
        '-maxrate',
        '715k',
        '-bufsize',
        '1300k',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        '-movflags',
        '+faststart',
        '-map_metadata',
        '-1',
        outputName,
      ])

      if (resultCode !== 0) {
        throw new Error('비디오를 540p MP4로 압축하지 못했습니다.')
      }

      const data = await ffmpeg.readFile(outputName)
      const originalName =
        file.name?.replace(/\.[^/.]+$/, '') || 'compressed-video'

      return new File([data], originalName + '-540p.mp4', {
        type: 'video/mp4',
      })
    } finally {
      for (const temporaryFileName of [inputName, outputName]) {
        try {
          await ffmpeg.deleteFile(temporaryFileName)
        } catch (error) {
          console.warn('비디오 변환 임시 파일 삭제 실패:', error)
        }
      }
    }
  }

  const getVideoMetadata = (file) =>
    new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)

      const cleanup = () => {
        video.removeAttribute('src')
        video.load()
        URL.revokeObjectURL(objectUrl)
      }

      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        const metadata = {
          duration: Number.isFinite(video.duration) ? video.duration : null,
          width: video.videoWidth || null,
          height: video.videoHeight || null,
        }

        cleanup()
        resolve(metadata)
      }
      video.onerror = () => {
        cleanup()
        reject(new Error('압축한 비디오의 정보를 확인하지 못했습니다.'))
      }
      video.src = objectUrl
    })

  // 프로필 수정 Modal 관련 메서드
  const handleOpenProfileModal = () => {
    const currentProfile = profileInfo[0]

    setProfileForm({
      description: currentProfile?.description || '',
      members: Array.isArray(currentProfile?.members)
        ? [...currentProfile.members]
        : [],
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

  const handleProfileMembersChange = (members) => {
    setProfileForm((prev) => ({
      ...prev,
      members,
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
    const safeUserId = getSafeUserId()

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

    const description = profileForm.description.trim()
    const members = Array.isArray(profileForm.members)
      ? profileForm.members
          .map((member) => member.trim())
          .filter(Boolean)
      : []

    if (description.length > 20) {
      setErrorMessage('설명은 20자 이내로 입력해주세요.')
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
        description: description || null,
        members,
        profileImageUrl,
      }

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('userId', storageInfo.userId)

      if (error) {
        throw error
      }

      if (
        profileImageFile &&
        previousProfileImageUrl &&
        previousProfileImageUrl !== profileImageUrl
      ) {
        await deleteStorageFileByUrl('profile-images', previousProfileImageUrl)
      }

      await getUsers()
      handleCloseProfileModal()

      showToast('프로필이 수정되었습니다.')
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
    setContentAudioFiles([])
    setConvertMessage('')

    if (contentPreview) {
      URL.revokeObjectURL(contentPreview)
    }

    setContentPreview('')
    setErrorMessage('')
    setIsContentModalOpen(true)
  }

  const handleCloseContentModal = () => {
    if (isContentUploading) return

    setIsContentModalOpen(false)
    setContentType('사진')
    setContentForm(initialContentForm)
    setContentFile(null)
    setContentFileName('선택된 파일 없음')
    setContentAudioFiles([])
    setConvertMessage('')

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
    setContentAudioFiles([])
    setConvertMessage('')

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
    const selectedFiles = Array.from(event.target.files || [])

    if (selectedFiles.length === 0) return

    const maxImageSize = 10 * 1024 * 1024
    const maxVideoConvertSourceSize = 200 * 1024 * 1024
    const maxAudioSize = 20 * 1024 * 1024

    if (contentType === '오디오') {
      const existingFileKeys = new Set(
        contentAudioFiles.map(
          (audioFile) =>
            `${audioFile.file.name}-${audioFile.file.size}-${audioFile.file.lastModified}`
        )
      )
      const nextAudioFiles = []

      for (const file of selectedFiles) {
        const isSelectedFileVideo = isVideoFile(file)
        const isSelectedFileAudio = isAudioFile(file)

        if (!isSelectedFileAudio && !isSelectedFileVideo) {
          setErrorMessage(
            '오디오 콘텐츠는 오디오 파일 또는 변환할 영상 파일만 업로드할 수 있습니다.'
          )
          event.target.value = ''
          return
        }

        if (isSelectedFileVideo && file.size > maxVideoConvertSourceSize) {
          setErrorMessage(
            '오디오 변환용 영상 파일은 파일별 200MB 이하만 선택할 수 있습니다.'
          )
          event.target.value = ''
          return
        }

        if (isSelectedFileAudio && file.size > maxAudioSize) {
          setErrorMessage(
            '오디오 파일은 파일별 20MB 이하만 업로드할 수 있습니다.'
          )
          event.target.value = ''
          return
        }

        const fileKey = `${file.name}-${file.size}-${file.lastModified}`

        if (existingFileKeys.has(fileKey)) continue

        existingFileKeys.add(fileKey)
        nextAudioFiles.push({
          id: createSafeId(),
          file,
          title: file.name?.replace(/\.[^/.]+$/, '') || '오디오',
          originalFileName: file.name || '오디오 파일',
        })
      }

      const updatedAudioFiles = [...contentAudioFiles, ...nextAudioFiles]

      setContentAudioFiles(updatedAudioFiles)
      setContentFile(null)
      setContentFileName(
        updatedAudioFiles.length > 0
          ? `${updatedAudioFiles.length}개 파일 선택됨`
          : '선택된 파일 없음'
      )
      setContentPreview('')
      setConvertMessage('')
      setErrorMessage(
        nextAudioFiles.length === 0
          ? '이미 선택한 파일입니다.'
          : ''
      )
      event.target.value = ''
      return
    }

    const file = selectedFiles[0]
    const isSelectedFileImage = isImageFile(file)
    const isSelectedFileVideo = isVideoFile(file)

    if (contentType === '사진' && !isSelectedFileImage) {
      setErrorMessage('사진 콘텐츠는 이미지 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (contentType === '비디오' && !isSelectedFileVideo) {
      setErrorMessage('비디오 콘텐츠는 영상 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (contentType === '사진' && file.size > maxImageSize) {
      setErrorMessage('이미지 파일은 10MB 이하만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (contentType === '비디오' && file.size > maxVideoConvertSourceSize) {
      setErrorMessage(
        '압축할 비디오 원본은 200MB 이하만 선택할 수 있습니다.'
      )
      event.target.value = ''
      return
    }

    setContentFile(file)
    setContentFileName(file.name || '선택한 파일')
    setConvertMessage('')

    if (contentPreview) {
      URL.revokeObjectURL(contentPreview)
    }

    if (contentType === '사진' || contentType === '비디오') {
      setContentPreview(URL.createObjectURL(file))
    } else {
      setContentPreview('')
    }

    setErrorMessage('')
  }

  const handleContentAudioTitleChange = (audioFileId, title) => {
    setContentAudioFiles((prev) =>
      prev.map((audioFile) =>
        audioFile.id === audioFileId
          ? {
              ...audioFile,
              title,
            }
          : audioFile
      )
    )

    setErrorMessage('')
  }

  const handleRemoveContentAudioFile = (audioFileId) => {
    const nextAudioFiles = contentAudioFiles.filter(
      (audioFile) => audioFile.id !== audioFileId
    )

    setContentAudioFiles(nextAudioFiles)
    setContentFileName(
      nextAudioFiles.length > 0
        ? `${nextAudioFiles.length}개 파일 선택됨`
        : '선택된 파일 없음'
    )

    setErrorMessage('')
  }

  const uploadContentFile = async (file, uploadType) => {
    if (!file) return null

    const fileExt = getFileExtension(file, uploadType)

    let storageFolderName = 'files'

    if (uploadType === '사진') storageFolderName = 'image'
    if (uploadType === '비디오') storageFolderName = 'video'
    if (uploadType === '오디오') storageFolderName = 'audio'

    const safeUserId = getSafeUserId()
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

    return {
      publicUrl: data.publicUrl,
      filePath,
    }
  }

  const validateContentForm = () => {
    if (!contentForm.title.trim()) {
      return '제목을 입력해주세요.'
    }

    if (contentType === '오디오') {
      if (contentAudioFiles.length === 0) {
        return '오디오 파일을 한 개 이상 첨부해주세요.'
      }

      if (contentAudioFiles.some((audioFile) => !audioFile.title.trim())) {
        return '모든 오디오 제목을 입력해주세요.'
      }

      if (
        contentAudioFiles.some(
          (audioFile) => audioFile.title.trim().length > 100
        )
      ) {
        return '오디오 제목은 100자 이하로 입력해주세요.'
      }

      return ''
    }

    if (!contentFile) {
      if (contentType === '사진') return '이미지 파일을 첨부해주세요.'
      if (contentType === '비디오') return '영상 파일을 첨부해주세요.'
    }

    return ''
  }

  const handleAddContent = async () => {
    const validationMessage = validateContentForm()

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setIsContentUploading(true)
    setErrorMessage('')
    setConvertMessage('')

    const uploadedStoragePaths = []
    let createdContentId = null

    try {
      const payload = {
        type: contentType,
        title: contentForm.title.trim(),
      }

      const uploadedAudioFiles = []
      let uploadedPictureFile = null
      let uploadedVideoFile = null

      if (contentType === '오디오') {
        for (let index = 0; index < contentAudioFiles.length; index += 1) {
          const audioFile = contentAudioFiles[index]
          const progressText = `${index + 1}/${contentAudioFiles.length}`
          const isAudioSourceVideo = isVideoFile(audioFile.file)

          let uploadFile = audioFile.file

          if (isAudioSourceVideo) {
            setConvertMessage(
              `${progressText} 영상에서 오디오를 추출하는 중입니다.`
            )
            uploadFile = await convertVideoToM4a(audioFile.file)
          }

          setConvertMessage(
            `${progressText} ${audioFile.title.trim()} 오디오를 업로드하는 중입니다.`
          )

          const uploadedFile = await uploadContentFile(uploadFile, '오디오')

          uploadedStoragePaths.push(uploadedFile.filePath)
          uploadedAudioFiles.push({
            title: audioFile.title.trim(),
            file_url: uploadedFile.publicUrl,
            storage_path: uploadedFile.filePath,
            original_file_name: audioFile.originalFileName,
            mime_type: uploadFile.type || null,
            file_size: uploadFile.size,
            sort_order: index,
          })
        }
      } else if (contentType === '비디오') {
        const compressedVideo = await compressVideoTo540p(contentFile)
        const maxCompressedVideoSize = 48 * 1024 * 1024

        if (compressedVideo.size > maxCompressedVideoSize) {
          throw new Error(
            '압축한 비디오가 48MB를 초과합니다. 영상 길이를 줄인 후 다시 시도해주세요.'
          )
        }

        const videoMetadata = await getVideoMetadata(compressedVideo)

        setConvertMessage('압축한 비디오를 업로드하는 중입니다.')

        const uploadedFile = await uploadContentFile(
          compressedVideo,
          '비디오'
        )

        uploadedStoragePaths.push(uploadedFile.filePath)
        uploadedVideoFile = {
          file_url: uploadedFile.publicUrl,
          storage_path: uploadedFile.filePath,
          original_file_name: contentFile.name || '비디오 파일',
          mime_type: compressedVideo.type,
          file_size: compressedVideo.size,
          duration: videoMetadata.duration,
          width: videoMetadata.width,
          height: videoMetadata.height,
          sort_order: 0,
        }
      } else {
        setConvertMessage('이미지 파일을 업로드하는 중입니다.')

        const uploadedFile = await uploadContentFile(contentFile, contentType)

        uploadedStoragePaths.push(uploadedFile.filePath)

        if (contentType === '사진') {
          uploadedPictureFile = {
            file_url: uploadedFile.publicUrl,
            storage_path: uploadedFile.filePath,
            original_file_name: contentFile.name || '이미지 파일',
            mime_type: contentFile.type || null,
            file_size: contentFile.size,
            sort_order: 0,
          }
        }
      }

      const { data: createdContent, error } = await supabase
        .from('content')
        .insert([payload])
        .select('id')
        .single()

      if (error) {
        throw error
      }

      createdContentId = createdContent.id

      if (contentType === '오디오') {
        const { error: audioInsertError } = await supabase
          .from('content_audio')
          .insert(
            uploadedAudioFiles.map((audioFile) => ({
              ...audioFile,
              content_id: createdContent.id,
            }))
          )

        if (audioInsertError) {
          throw audioInsertError
        }
      }

      if (contentType === '사진' && uploadedPictureFile) {
        const { error: pictureInsertError } = await supabase
          .from('content_picture')
          .insert([
            {
              ...uploadedPictureFile,
              content_id: createdContent.id,
            },
          ])

        if (pictureInsertError) {
          throw pictureInsertError
        }
      }

      if (contentType === '비디오' && uploadedVideoFile) {
        const { error: videoInsertError } = await supabase
          .from('content_video')
          .insert([
            {
              ...uploadedVideoFile,
              content_id: createdContent.id,
            },
          ])

        if (videoInsertError) {
          throw videoInsertError
        }
      }

      await getContent()
      handleCloseContentModal()

      showToast(`${contentType} 콘텐츠가 등록되었습니다.`)
    } catch (error) {
      if (createdContentId) {
        const { error: removeContentError } = await supabase
          .from('content')
          .delete()
          .eq('id', createdContentId)

        if (removeContentError) {
          console.error('실패한 콘텐츠 데이터 정리 실패:', removeContentError)
        }
      }

      if (uploadedStoragePaths.length > 0) {
        const { error: removeFilesError } = await supabase.storage
          .from('content-files')
          .remove(uploadedStoragePaths)

        if (removeFilesError) {
          console.error('실패한 콘텐츠 파일 정리 실패:', removeFilesError)
        }
      }

      console.error('콘텐츠 업로드 실패:', {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
        error,
        contentType,
        fileNames:
          contentType === '오디오'
            ? contentAudioFiles.map((audioFile) => audioFile.originalFileName)
            : [contentFile?.name],
      })

      const isContentAudioPermissionError =
        contentType === '오디오' &&
        (error.code === '42501' ||
          error.message?.includes('permission denied for table content_audio'))
      const isPictureTableError =
        contentType === '사진' &&
        (error.code === '42501' ||
          error.message?.includes('content_picture') ||
          error.message?.includes('schema cache'))
      const isVideoTableError =
        contentType === '비디오' &&
        (error.code === '42501' ||
          error.message?.includes('content_video') ||
          error.message?.includes('schema cache'))

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '등록 실패',
        message: isContentAudioPermissionError
          ? 'content_audio 테이블의 Supabase 접근 정책을 확인해주세요.'
          : isPictureTableError
            ? 'content_picture 테이블 생성 SQL을 먼저 실행해주세요.'
            : isVideoTableError
              ? 'content_video 테이블 생성 SQL을 먼저 실행해주세요.'
              : error.message ||
                '콘텐츠 등록 중 오류가 발생했습니다. 파일 용량, 형식, 네트워크 상태 또는 Supabase 설정을 확인해주세요.',
      })
    } finally {
      setIsContentUploading(false)
      setConvertMessage('')
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

    if (!isAdmin) {
      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '삭제 권한 없음',
        message: '관리자만 콘텐츠를 삭제할 수 있습니다.',
      })
      return
    }

    setDeleteContentTarget(item)
  }

  // 콘텐츠 삭제 확인 모달 닫기
  const handleCloseContentDeleteModal = () => {
    setDeleteContentTarget(null)
  }

  // 콘텐츠 삭제 API 호출
  const handleDeleteContent = async () => {
    if (!deleteContentTarget) return

    if (!isAdmin) {
      setDeleteContentTarget(null)
      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '삭제 권한 없음',
        message: '관리자만 콘텐츠를 삭제할 수 있습니다.',
      })
      return
    }

    try {
      const storageFilePaths = []

      if (deleteContentTarget.type === '사진') {
        const pictureFiles = deleteContentTarget.pictureFiles || []

        pictureFiles.forEach((pictureFile) => {
          const filePath =
            pictureFile.storage_path ||
            getStorageFilePathFromUrl('content-files', pictureFile.file_url)

          if (filePath) storageFilePaths.push(filePath)
        })
      }

      if (deleteContentTarget.type === '비디오') {
        const videoFiles = deleteContentTarget.videoFiles || []

        videoFiles.forEach((videoFile) => {
          const filePath =
            videoFile.storage_path ||
            getStorageFilePathFromUrl('content-files', videoFile.file_url)

          if (filePath) storageFilePaths.push(filePath)
        })
      }

      if (deleteContentTarget.type === '오디오') {
        const audioFiles = deleteContentTarget.audioFiles || []

        audioFiles.forEach((audioFile) => {
          const filePath =
            audioFile.storage_path ||
            getStorageFilePathFromUrl('content-files', audioFile.file_url)

          if (filePath) storageFilePaths.push(filePath)
        })
      }

      if (storageFilePaths.length > 0) {
        const { error: removeFilesError } = await supabase.storage
          .from('content-files')
          .remove([...new Set(storageFilePaths)])

        if (removeFilesError) {
          throw removeFilesError
        }
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

      showToast('콘텐츠가 삭제되었습니다.')

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
    <div className={styles.page}>
      {/* 프로필 정보 */}
      <section className={styles.userGreeting}>

        {/* 프로필 이미지 */}
        <div className={styles.profileAvatarWrap}>
          <div className={styles.profileAvatar}>
            <img
              src={profileInfo[0]?.profileImageUrl || profile}
              alt={`${profileInfo[0]?.userId || 'Guest'} 프로필`}
            />
          </div>

          {/* 프로필 수정 */}
          <button
            type="button"
            className={styles.profileEditButton}
            aria-label="프로필 수정"
            title="프로필 수정"
            onClick={handleOpenProfileModal}
          >
            <img
              src={editIcon}
              alt=""
              aria-hidden="true"
            />
          </button>
        </div>

        {/* 프로필 상세 정보 */}
        <div className={styles.profileSummary}>
          <div className={styles.profileMetadata}>
            <h2>
              {profileInfo[0]?.bandName || '밴드를 설정해주세요'}
            </h2>

            <div className={styles.memberInfo} ref={membersTooltipRef}>
              <button
                type="button"
                className={styles.membersButton}
                aria-label={`밴드 멤버 ${members.length}명 보기`}
                aria-expanded={isMembersTooltipOpen}
                aria-controls="profile-members-tooltip"
                onClick={() =>
                  setIsMembersTooltipOpen((isOpen) => !isOpen)
                }
              >
                <img src={usersIcon} alt="" aria-hidden="true" />
              </button>

              <span>{members.length}명</span>

              {isMembersTooltipOpen && (
                <div
                  id="profile-members-tooltip"
                  className={styles.membersTooltip}
                  role="tooltip"
                >
                  <strong>밴드 멤버</strong>

                  {members.length > 0 ? (
                    <ul>
                      {members.map((member, index) => (
                        <li key={`${member}-${index}`}>{member}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>등록된 멤버가 없습니다.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <p>
            {profileInfo[0]?.description || '밴드 소개를 작성해주세요'}
          </p>

          {/* SNS */}
          <section className={styles.snsList}>
            <a
              href="https://www.instagram.com/11f_band"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram으로 이동"
            >
              <img src={instagramIcon} alt="Instagram" />
            </a>

            <a
              href="https://discord.gg/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord로 이동"
            >
              <img src={discordIcon} alt="Discord" />
            </a>
          </section>
        </div>
      </section>

      <ContentFilterTabs
        activeFilter={activeContentFilter}
        counts={contentCounts}
        onChange={handleContentFilterChange}
      />

      <button
        type="button"
        className={styles.contentAddButton}
        data-floating-add-button
        onClick={handleOpenContentModal}
        aria-label="사진, 비디오 또는 오디오 추가"
      >
        <img src={addIcon} alt="" aria-hidden="true" />
      </button>

      {/* 콘텐츠 목록 */}
      <section className={styles.contentListSection}>
        <div className={styles.homeCardGrid}>
          {filteredContent.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              isActive={selectedContent?.id === item.id}
              isAdmin={isAdmin}
              onClick={handleContentCardClick}
              onDeleteClick={handleOpenContentDeleteModal}
            />
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className={styles.contentEmptyBox}>
            {activeContentFilter === '전체'
              ? '등록된 콘텐츠가 없습니다.'
              : `${activeContentFilter} 콘텐츠가 없습니다.`}
          </div>
        )}
      </section>

      {isProfileModalOpen && (
        <ProfileEditModal
          profileForm={profileForm}
          profileImagePreview={profileImagePreview}
          errorMessage={errorMessage}
          onClose={handleCloseProfileModal}
          onSubmit={handleUpdateProfile}
          onInputChange={handleProfileInputChange}
          onMembersChange={handleProfileMembersChange}
          onImageChange={handleProfileImageChange}
        />
      )}

      {isContentModalOpen && (
        <ContentAddModal
          contentType={contentType}
          contentForm={contentForm}
          contentFileName={contentFileName}
          contentAudioFiles={contentAudioFiles}
          contentPreview={contentPreview}
          errorMessage={errorMessage}
          convertMessage={convertMessage}
          isContentUploading={isContentUploading}
          onClose={handleCloseContentModal}
          onSubmit={handleAddContent}
          onContentTypeChange={handleContentTypeChange}
          onInputChange={handleContentInputChange}
          onFileChange={handleContentFileChange}
          onAudioTitleChange={handleContentAudioTitleChange}
          onAudioFileRemove={handleRemoveContentAudioFile}
        />
      )}

      {detailContent?.type === '오디오' && (
        <AudioDetailModal
          content={detailContent}
          onClose={handleCloseDetailModal}
        />
      )}

      {detailContent?.type === '사진' && (
        <PictureDetailModal
          content={detailContent}
          onClose={handleCloseDetailModal}
        />
      )}

      {detailContent?.type === '비디오' && (
        <VideoDetailModal
          content={detailContent}
          onClose={handleCloseDetailModal}
        />
      )}

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
