import { useState } from 'react'

import PdfPreview from '../components/common/PdfPreview'

import { musicsheetMockList } from '../mocks/musicsheetMock'

function PracticePage() {
  const [selectedPdf, setSelectedPdf] = useState(null)

  const handlePdfClick = (pdf) => {
    setSelectedPdf(pdf)
  }

  return (
    <div className="page pdf-page">
      <div className="studio-list">
        {musicsheetMockList.map((pdf) => (
          <button
            key={`${pdf.type}-${pdf.id}`}
            type="button"
            className={
              selectedPdf?.id === pdf.id
                ? 'studio-card active'
                : 'studio-card'
            }
            onClick={() => handlePdfClick(pdf)}
          >
            <div className="studio-info">
              <strong>{pdf.title}</strong>
              <span>{pdf.description}</span>
              <p>{pdf.session}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="pdf-box">
        <PdfPreview pdf={selectedPdf} />
      </div>
    </div>
  )
}

export default PracticePage