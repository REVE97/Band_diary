import RecruitCard from '../components/recruit/RecruitCard'

const recruitList = [
  {
    id: 1,
    title: '노을의 조각들',
    position: '드럼',
    location: '서울 마포구',
    tags: ['인디', '락', '포스트록'],
    description: '감성 인디 록 밴드, 드러머 한 분 구해요!'
  },
  {
    id: 2,
    title: '시티 브리즈',
    position: '베이스',
    location: '서울 강남구',
    tags: ['시티팝', '재즈', 'R&B'],
    description: '시티팝 기반 밴드, 베이스 구합니다!'
  },
  {
    id: 3,
    title: '더 파라독스',
    position: '일렉기타',
    location: '경기 성남시',
    tags: ['메탈', '하드록'],
    description: '정통 하드록/메탈 기타리스트 모집합니다.'
  }
]

function RecruitPage() {
  return (
    <div className="page recruit-page">
      <div className="filter-row">
        <button>밴드 ▾</button>
        <button>장르 ▾</button>
        <button>지역 ▾</button>
        <button>악기 ▾</button>
      </div>

      <div className="recruit-list">
        {recruitList.map((item) => (
          <RecruitCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default RecruitPage