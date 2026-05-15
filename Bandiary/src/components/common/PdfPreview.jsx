import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

function PdfPreview({ pdf }) {
  const [numPages, setNumPages] = useState(null)

  if (!pdf) {
    return (
      <div className="pdf-preview-empty">
        PDF 카드를 선택하면 미리보기가 표시됩니다.
      </div>
    )
  }

  return (
    <div className="pdf-preview-wrap">
      <div className="pdf-preview-header">
        <strong>{pdf.title}</strong>
        <span>{pdf.fileName}</span>
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