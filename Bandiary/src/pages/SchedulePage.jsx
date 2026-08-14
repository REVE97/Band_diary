import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'

import supabase from '../api/supabase'

import ScheduleAddModal from '../components/schedule/ScheduleAddModal'
import ScheduleDetailModal from '../components/schedule/ScheduleDetailModal'
import PlaceResultModal from '../components/place/PlaceResultModal'
import styles from './SchedulePage.module.css'

const initialScheduleForm = {
  type: '합주',
  title: '',
  scheduleDate: '',
  startTime: '20:00',
  endTime: '22:00',
  location: '',
  description: '',
  color: '#6b4eff',
}

const getScheduleTypeColor = (type) => {
  if (type === '합주') return '#4dabf7'
  if (type === '공연') return '#9b5de5'
  if (type === '개인연습') return '#38b000'
  if (type === '회의') return '#ff9f1c'

  return '#6b4eff'
}

const getTimeValue = (value) => {
  if (!value) return ''
  return String(value).slice(0, 5)
}

function SchedulePage() {
  const [scheduleList, setScheduleList] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm)
  const [errorMessage, setErrorMessage] = useState('')

  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState(null)

  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
  })

  const getScheduleList = async () => {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .order('schedule_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error(error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '조회 실패',
        message: '일정 목록을 불러오지 못했습니다.',
      })

      return
    }

    setScheduleList(data || [])
  }

  useEffect(() => {
    getScheduleList()
  }, [])

  const calendarEvents = scheduleList.map((schedule) => {
    const startTime = getTimeValue(schedule.start_time)
    const endTime = getTimeValue(schedule.end_time)
    const eventColor = schedule.color || getScheduleTypeColor(schedule.type)

    return {
      id: String(schedule.id),
      title: schedule.title,
      start: `${schedule.schedule_date}T${startTime}`,
      end: `${schedule.schedule_date}T${endTime}`,
      backgroundColor: eventColor,
      borderColor: eventColor,
      textColor: '#151515',
      extendedProps: {
        schedule,
      },
    }
  })

  const handleOpenScheduleModal = (dateStr = '') => {
    setScheduleForm({
      ...initialScheduleForm,
      scheduleDate: dateStr,
    })
    setErrorMessage('')
    setIsScheduleModalOpen(true)
  }

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false)
    setScheduleForm(initialScheduleForm)
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

  const handleScheduleInputChange = (event) => {
    const { name, value } = event.target

    setScheduleForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrorMessage('')
  }

  const validateScheduleForm = () => {
    if (!scheduleForm.title.trim()) {
      return '일정 제목을 입력해주세요.'
    }

    if (!scheduleForm.type.trim()) {
      return '일정 타입을 선택해주세요.'
    }

    if (!scheduleForm.scheduleDate) {
      return '일정 날짜를 선택해주세요.'
    }

    if (!scheduleForm.startTime) {
      return '시작 시간을 선택해주세요.'
    }

    if (!scheduleForm.endTime) {
      return '종료 시간을 선택해주세요.'
    }

    if (scheduleForm.startTime >= scheduleForm.endTime) {
      return '종료 시간은 시작 시간보다 늦어야 합니다.'
    }

    return ''
  }

  const handleAddSchedule = async () => {
    const validationMessage = validateScheduleForm()

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      const payload = {
        title: scheduleForm.title.trim(),
        type: scheduleForm.type,
        schedule_date: scheduleForm.scheduleDate,
        start_time: scheduleForm.startTime,
        end_time: scheduleForm.endTime,
        location: scheduleForm.location.trim() || null,
        description: scheduleForm.description.trim() || null,
        color: scheduleForm.color || getScheduleTypeColor(scheduleForm.type),
      }

      const { error } = await supabase.from('schedule').insert([payload])

      if (error) {
        throw error
      }

      await getScheduleList()
      handleCloseScheduleModal()

      setResultModal({
        isOpen: true,
        type: 'success',
        title: '등록 완료',
        message: '일정이 성공적으로 등록되었습니다.',
      })
    } catch (error) {
      console.error('일정 등록 실패:', error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '등록 실패',
        message: '일정 등록 중 오류가 발생했습니다. Supabase 설정을 확인해주세요.',
      })
    }
  }

  const handleDateClick = (info) => {
    handleOpenScheduleModal(info.dateStr)
  }

  const handleEventClick = (info) => {
    setSelectedSchedule(info.event.extendedProps.schedule)
  }

  const handleCloseDetailModal = () => {
    setSelectedSchedule(null)
  }

  const handleOpenDeleteModal = (schedule) => {
    setDeleteScheduleTarget(schedule)
  }

  const handleCloseDeleteModal = () => {
    setDeleteScheduleTarget(null)
  }

  const handleDeleteSchedule = async () => {
    if (!deleteScheduleTarget) return

    try {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', deleteScheduleTarget.id)

      if (error) {
        throw error
      }

      await getScheduleList()

      if (selectedSchedule?.id === deleteScheduleTarget.id) {
        setSelectedSchedule(null)
      }

      setResultModal({
        isOpen: true,
        type: 'success',
        title: '삭제 완료',
        message: `${deleteScheduleTarget.title} 일정이 삭제되었습니다.`,
      })

      setDeleteScheduleTarget(null)
    } catch (error) {
      console.error('일정 삭제 실패:', error)

      setResultModal({
        isOpen: true,
        type: 'fail',
        title: '삭제 실패',
        message: '일정 삭제 중 오류가 발생했습니다. Supabase 설정을 확인해주세요.',
      })

      setDeleteScheduleTarget(null)
    }
  }

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.contentAddButton}
        onClick={() => handleOpenScheduleModal()}
        aria-label="일정 추가"
      >
        +
      </button>

      <section className={styles.scheduleCalendarCard}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={koLocale}
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next',
          }}
          buttonText={{
            today: '오늘',
          }}
          dayMaxEvents={2}
          height="auto"
        />
      </section>

      {isScheduleModalOpen && (
        <ScheduleAddModal
          scheduleForm={scheduleForm}
          errorMessage={errorMessage}
          onClose={handleCloseScheduleModal}
          onSubmit={handleAddSchedule}
          onInputChange={handleScheduleInputChange}
        />
      )}

      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={handleCloseDetailModal}
          onDelete={handleOpenDeleteModal}
        />
      )}

      {deleteScheduleTarget && (
        <PlaceResultModal
          type="confirm"
          title="삭제 확인"
          message={`${deleteScheduleTarget.title} 일정을 삭제하시겠습니까?`}
          confirmText="삭제"
          cancelText="취소"
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteSchedule}
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

export default SchedulePage
