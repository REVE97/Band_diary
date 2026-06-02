import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'
import pdfIcon from '../../assets/images/pdf_purple.svg'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

function PdfPreview({ pdf }) {
  const [numPages, setNumPages] = useState(null)

  if (!pdf) {
    return (
      <div className="pdf-preview-empty">
        <img src={pdfIcon} alt="" className="empty-preview-icon" />
        <p>PDF 카드를 선택하면 미리보기가 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div className="pdf-preview-wrap">
      <div className="pdf-preview-header">
        <strong>{pdf.title}</strong>
        <span>{pdf.fileName}</span>

        <a
          href={pdf.pdfUrl}
          download={pdf.fileName}
          className="pdf-download-button"
        >
          다운로드
        </a>
      </div>

      <div className="pdf-canvas-box">
        <Document
          file={pdf.pdfUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={index + 1}
              pageNumber={index + 1}
              width={340}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  )
}

export default PdfPreview