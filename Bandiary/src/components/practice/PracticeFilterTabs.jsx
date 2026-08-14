import styles from './PracticeFilterTabs.module.css'

const practiceFilterOptions = [
  {
    label: '전체보기',
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

function PracticeFilterTabs({ activeFilter, onChange }) {
  return (
    <section className={styles.section}>
      <div className={styles.row}>
        {practiceFilterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              activeFilter === option.value
                ? `${styles.button} ${styles.active}`
                : styles.button
            }
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export default PracticeFilterTabs
