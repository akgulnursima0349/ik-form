import type { Document } from '../../types/database';
import { useDocuments } from '../../hooks/useDocuments';
import { Button } from '../ui/Button';
import { DOC_TYPE_LABELS } from '../../utils/constants';

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentList({ documents }: { documents: Document[] }) {
  const { getDocumentUrl } = useDocuments();

  const handleView = async (doc: Document) => {
    const url = await getDocumentUrl(doc.storage_path);
    if (url) window.open(url, '_blank');
  };

  const handleDownload = async (doc: Document) => {
    const url = await getDocumentUrl(doc.storage_path);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.click();
  };

  if (documents.length === 0) {
    return <p className="text-sm text-gray-400">Belge yüklenmemiş</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              {doc.mime_type?.includes('pdf') ? (
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{DOC_TYPE_LABELS[doc.doc_type]}</p>
              <p className="text-xs text-gray-500">{doc.file_name} {formatSize(doc.file_size)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleView(doc)}>Görüntüle</Button>
            <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>İndir</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
