import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'
import pdfIcon from '../../assets/images/pdf_purple.svg'
import styles from './PdfPreview.module.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

function PdfPreview({ pdf }) {
  const [numPages, setNumPages] = useState(null)

  if (!pdf) {
    return (
      <div className={styles.empty}>
        <img src={pdfIcon} alt="" className={styles.emptyIcon} />
        <p>PDF 카드를 선택하면 미리보기가 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <strong>{pdf.title}</strong>
        <span>{pdf.fileName}</span>
      </div>

      <div className={styles.canvasBox}>
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
