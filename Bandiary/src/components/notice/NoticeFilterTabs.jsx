import styles from './NoticeFilterTabs.module.css'

const noticeFilterOptions = [
  {
    label: '전체',
    value: '전체',
  },
  {
    label: '공지',
    value: '공지',
  },
  {
    label: '메모',
    value: '메모',
  },
]

function NoticeFilterTabs({ activeFilter, counts, onChange }) {
  return (
    <div className={styles.row} aria-label="유형별 공지 필터">
      {noticeFilterOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={
            activeFilter === option.value
              ? `${styles.button} ${styles.active}`
              : styles.button
          }
          onClick={() => onChange(option.value)}
          aria-pressed={activeFilter === option.value}
        >
          <span>{option.label}</span>
          <span className={styles.count}>{counts?.[option.value] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}

export default NoticeFilterTabs
