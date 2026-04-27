import { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useDocuments } from '../../hooks/useDocuments';
import type { DocType, Document } from '../../types/database';
import { DOC_TYPE_LABELS } from '../../utils/constants';

const REQUIRED_DOCS: DocType[] = ['kimlik', 'ikametgah'];
const OPTIONAL_DOCS: DocType[] = ['saglik_raporu', 'diploma', 'referans_mektubu'];

const ACCEPTED_FORMATS: Record<DocType, string> = {
  kimlik: '.pdf,.jpg,.jpeg,.png',
  ikametgah: '.pdf,.jpg,.jpeg,.png',
  saglik_raporu: '.pdf',
  diploma: '.pdf,.jpg,.jpeg',
  referans_mektubu: '.pdf',
  diger: '.pdf,.jpg,.jpeg,.png',
};

const FORMAT_LABELS: Record<DocType, string> = {
  kimlik: 'PDF, JPG, PNG',
  ikametgah: 'PDF, JPG, PNG',
  saglik_raporu: 'Yalnızca PDF',
  diploma: 'PDF, JPG',
  referans_mektubu: 'Yalnızca PDF',
  diger: 'PDF, JPG, PNG',
};

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface DocRowProps {
  docType: DocType;
  required: boolean;
  uploadedDoc: Document | undefined;
  submissionId: string;
  onUploaded: (doc: Document) => void;
  onDeleted: (docId: string) => void;
}

function DocRow({ docType, required, uploadedDoc, submissionId, onUploaded, onDeleted }: DocRowProps) {
  const { uploadDocument, deleteDocument, uploading } = useDocuments();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('Dosya boyutu 10 MB\'ı geçemez');
      return;
    }
    setLocalUploading(true);
    const result = await uploadDocument(file, submissionId, docType);
    setLocalUploading(false);
    if (result) onUploaded(result);
  };

  const handleDelete = async () => {
    if (!uploadedDoc) return;
    const ok = await deleteDocument(uploadedDoc.id, uploadedDoc.storage_path);
    if (ok) onDeleted(uploadedDoc.id);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        {uploadedDoc ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {DOC_TYPE_LABELS[docType]}
            {required && <span className="ml-1 text-red-500">*</span>}
          </p>
          {uploadedDoc ? (
            <p className="text-xs text-gray-500">{uploadedDoc.file_name} {formatSize(uploadedDoc.file_size)}</p>
          ) : (
            <p className="text-xs text-gray-400">Henüz yüklenmedi · <span className="text-gray-400">{FORMAT_LABELS[docType]}</span></p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {uploadedDoc ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleDelete}>
            Sil
          </Button>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FORMATS[docType]}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={localUploading || uploading}
              onClick={() => inputRef.current?.click()}
            >
              Yükle
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function Step5Documents() {
  const { submission, nextStep, prevStep, setDocuments } = useOnboardingStore();
  const [docs, setDocs] = useState<Document[]>(submission?.documents || []);

  if (!submission) return null;

  const handleUploaded = (doc: Document) => {
    const newDocs = [...docs, doc];
    setDocs(newDocs);
    setDocuments(newDocs);
  };

  const handleDeleted = (docId: string) => {
    const newDocs = docs.filter((d) => d.id !== docId);
    setDocs(newDocs);
    setDocuments(newDocs);
  };

  const getDoc = (type: DocType) => docs.find((d) => d.doc_type === type);

  const requiredComplete = REQUIRED_DOCS.every((t) => getDoc(t));

  const handleNext = () => {
    if (!requiredComplete) {
      alert('Zorunlu belgeleri yükleyiniz (Kimlik ve İkametgah)');
      return;
    }
    nextStep();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Zorunlu (*) belgeler yüklenmeden form gönderilemez. Maksimum dosya boyutu: 10 MB.</p>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Zorunlu Belgeler</h4>
        {REQUIRED_DOCS.map((type) => (
          <DocRow key={type} docType={type} required submissionId={submission.id} uploadedDoc={getDoc(type)} onUploaded={handleUploaded} onDeleted={handleDeleted} />
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Opsiyonel Belgeler</h4>
        {OPTIONAL_DOCS.map((type) => (
          <DocRow key={type} docType={type} required={false} submissionId={submission.id} uploadedDoc={getDoc(type)} onUploaded={handleUploaded} onDeleted={handleDeleted} />
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={prevStep}>← Geri</Button>
        <Button type="button" onClick={handleNext} disabled={!requiredComplete}>İleri →</Button>
      </div>
    </div>
  );
}
