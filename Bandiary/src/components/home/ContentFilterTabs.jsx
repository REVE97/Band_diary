import picture_icon from '../../assets/images/picture.svg'
import video_icon from '../../assets/images/video.svg'
import allView_icon from '../../assets/images/allView.svg'
import audio_icon from '../../assets/images/audio.svg'
import styles from './ContentFilterTabs.module.css'

const contentFilterOptions = [
  {
    label: '전체',
    value: '전체',
    icon: allView_icon,
    iconOnly: true,
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

function ContentFilterTabs({ activeFilter, counts, onChange }) {
  const getCount = (value) => {
    return counts?.[value] ?? 0
  }

  return (
    <section className={styles.section}>
      {/* 콘텐츠 필터 */}
      <div className={styles.row}>
        {contentFilterOptions.map((option) => {
          const isActive = activeFilter === option.value
          const count = getCount(option.value)

          return (
            <button
              key={option.value}
              type="button"
              className={[
                styles.button,
                isActive ? styles.active : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(option.value)}
              aria-label={option.label}
              title={option.label}
            >
              <img src={option.icon} alt="" className={styles.icon} />

              <span className={styles.text}>
                <span>{option.label}</span>
                {/* {option.label} */}
                <strong className={styles.count}>{count}</strong>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ContentFilterTabs
