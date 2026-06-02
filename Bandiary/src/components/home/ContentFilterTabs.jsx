import picture_icon from '../../assets/images/picture.svg'
import video_icon from '../../assets/images/video.svg'
import allView_icon from '../../assets/images/allView.svg'
import audio_icon from '../../assets/images/audio.svg'

const contentFilterOptions = [
  {
    label: '전체보기',
    value: '전체',
    icon: allView_icon,
  },
  {
    label: '비디오',
    value: '비디오',
    icon: video_icon,
  },
  {
    label: '사진',
    value: '사진',
    icon: picture_icon,
  },
  {
    label: '오디오',
    value: '오디오',
    icon: audio_icon,
  },
]

function ContentFilterTabs({ activeFilter, onChange }) {
  return (
    <section className="content-filter-section">
      <div className="content-filter-row">
        {contentFilterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              activeFilter === option.value
                ? 'content-filter-button active'
                : 'content-filter-button'
            }
            onClick={() => onChange(option.value)}
          >
            <img src={option.icon} alt="" className="content-filter-icon" />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default ContentFilterTabs