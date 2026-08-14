import styles from './MusicsheetFilterTabs.module.css'

const musicsheetFilterOptions = [
  {
    label: '전체',
    value: '전체',
  },
  {
    label: 'Vocal',
    value: 'Vocal',
  },
  {
    label: 'Guitar',
    value: 'Guitar',
  },
  {
    label: 'Bass',
    value: 'Bass',
  },
  {
    label: 'Keyboard',
    value: 'Keyboard',
  },
  {
    label: 'Drum',
    value: 'Drum',
  },
]

function MusicsheetFilterTabs({ activeFilter, counts, onChange }) {
  return (
    <div className={styles.row} aria-label="세션별 악보 필터">
      {musicsheetFilterOptions.map((option) => (
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

export default MusicsheetFilterTabs
