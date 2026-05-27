import { useState, useEffect } from 'react'
import supabase from '../api/supabase'

import StatCard from '../components/home/StatCard'
import ContentCard from '../components/home/ContentCard'
import ProfileEditModal from '../components/home/ProfileEditModal'
import PlaceResultModal from '../components/place/PlaceResultModal'

import profile from '../assets/images/profile.jpeg'
import picture from '../assets/images/picture_white.svg'
import video from '../assets/images/video_white.svg'
import editIcon from '../assets/images/edit.svg'

import { contentMockList } from '../mocks/contentMock'

const initialProfileForm = {
  name: '',
  bandName: '',
  mainSession: '',
  subSession: '',
}

function HomePage() {
  const [selectedContent, setSelectedContent] = useState(contentMockList[0])

  const [profileInfo, setProfileInfo] = useState([])
  const [profileForm, setProfileForm] = useState(initialProfileForm)

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
  })

  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  const videoCount = contentMockList.filter(
    (content) => content.title === '비디오'
  ).length

  const pictureCount = contentMockList.filter(
    (content) => content.title === '사진'
  ).length

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

  useEffect(() => {
    getUsers()
  }, [])

  const handleOpenProfileModal = () => {
    const currentProfile = profileInfo[0]

    setProfileForm({
      name: currentProfile?.name || '',
      bandName: currentProfile?.bandName || '',
      mainSession: currentProfile?.mainSession || '',
      subSession: currentProfile?.subSession || '',
    })

    setErrorMessage('')
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
    setProfileForm(initialProfileForm)
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

  const handleUpdateProfile = async () => {
    if (!storageInfo?.userId) {
      setErrorMessage('로그인 사용자 정보를 찾을 수 없습니다.')
      return
    }

    const payload = {
      name: profileForm.name.trim() || null,
      bandName: profileForm.bandName.trim() || null,
      mainSession: profileForm.mainSession.trim() || null,
      subSession: profileForm.subSession.trim() || null,
    }

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('userId', storageInfo.userId)

    if (error) {
      console.error(error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '수정 실패',
        message:
          '프로필 수정 중 오류가 발생했습니다. 입력값 또는 Supabase 설정을 확인해주세요.',
      })

      return
    }

    await getUsers()
    handleCloseProfileModal()

    setResultModal({
      isOpen: true,
      type: 'success',
      title: '수정 완료',
      message: '프로필 정보가 성공적으로 수정되었습니다.',
    })
  }

  return (
    <div className="page home-page">
      <section className="user-greeting">
        <div>
          <h2>안녕하세요, {profileInfo[0]?.name || 'Guest'}님</h2>
          <p>{profileInfo[0]?.bandName || '밴드명을 설정해주세요'}</p>
        </div>

        <div className="profile-avatar">
          <img src={profile} alt={`${profileInfo[0]?.name} 프로필`} />
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
            {profileInfo[0]?.mainSession || 
            (<>메인 세션을 <br /> 설정해주세요</>)}
          </strong>
        </div>

        <div className="instrument-card">
          <p>서브 세션</p>
          <strong>
            {profileInfo[0]?.subSession || 
            (<>서브 세션을 <br /> 설정해주세요</>)}
          </strong>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="비디오" value={videoCount} icon={video} />
        <StatCard title="사진" value={pictureCount} icon={picture} />
      </section>

      <section>
        <div className="home-card-grid">
          {contentMockList.map((content) => (
            <ContentCard
              key={content.id}
              item={content}
              isActive={selectedContent?.id === content.id}
              onClick={setSelectedContent}
            />
          ))}
        </div>
      </section>

      {/* 프로필 수정 Modal */}
      {isProfileModalOpen && (
        <ProfileEditModal
          profileForm={profileForm}
          errorMessage={errorMessage}
          onClose={handleCloseProfileModal}
          onSubmit={handleUpdateProfile}
          onInputChange={handleProfileInputChange}
        />
      )}

      {/* 프로필 수정 완료 Modal */}
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