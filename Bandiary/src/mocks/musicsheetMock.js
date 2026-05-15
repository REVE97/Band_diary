import example01 from '../assets/pdf/example_01.pdf'
import example02 from '../assets/pdf/example_02.pdf'

export const musicsheetMockList = [
  {
    id: 1,
    type: 'pdf',
    title: '정보처리기사 이론 1',
    description: '정보처리기사 이론 1 입니다.',
    fileName: 'example01.pdf',
    pdfUrl: example01,
    tags: ['정보처리기사', '이론', 'Programming'],
  },
  {
    id: 2,
    type: 'pdf',
    title: '정보처리기사 이론 2',
    description: '정보처리기사 이론 2 입니다',
    fileName: 'example02.pdf',
    pdfUrl: example02,
    tags: ['정보처리기사', '이론', 'CS'],
  },
]