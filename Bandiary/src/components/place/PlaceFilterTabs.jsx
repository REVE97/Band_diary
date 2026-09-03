import styles from './PlaceFilterTabs.module.css'

const placeFilters = [
  {
    value: 'all',
    label: '전체',
  },
  {
    value: 'studio',
    label: '합주실',
  },
  {
    value: 'restaurant',
    label: '주변 맛집',
  },
  {
    value: 'parking',
    label: '주차장',
  },
]

function PlaceFilterTabs({
  id,
  activeFilter,
  counts,
  onChange,
}) {
  return (
    <div id={id} className={styles.panel}>
      <div className={styles.grid} role="tablist" aria-label="장소 유형 필터">
        {placeFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.value}
            className={`${styles.button} ${
              activeFilter === filter.value ? styles.active : ''
            }`}
            onClick={() => onChange(filter.value)}
          >
            <span>{filter.label}</span>
            <span className={styles.count}>{counts[filter.value] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PlaceFilterTabs
