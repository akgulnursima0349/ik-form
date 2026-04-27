import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { DocType } from '../types/database';

export function useDocuments() {
  const [uploading, setUploading] = useState(false);

  async function uploadDocument(file: File, submissionId: string, docType: DocType) {
    if (submissionId === 'demo-submission-id') {
      toast.success('Demo: Belge yüklendi');
      return {
        id: `demo-doc-${Date.now()}`,
        submission_id: submissionId,
        doc_type: docType,
        storage_path: 'demo/path',
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
      };
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${docType}_${Date.now()}.${ext}`;
      const storagePath = `${submissionId}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('employee-documents')
        .upload(storagePath, file, { contentType: file.type });

      if (storageError) throw storageError;

      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          submission_id: submissionId,
          doc_type: docType,
          storage_path: storagePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      toast.success('Belge yüklendi');
      return data;
    } catch {
      toast.error('Belge yüklenemedi');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(docId: string, storagePath: string) {
    if (storagePath === 'demo/path') {
      toast.success('Demo: Belge silindi');
      return true;
    }
    try {
      await supabase.storage.from('employee-documents').remove([storagePath]);
      await supabase.from('documents').delete().eq('id', docId);
      toast.success('Belge silindi');
      return true;
    } catch {
      toast.error('Belge silinemedi');
      return false;
    }
  }

  async function getDocumentUrl(storagePath: string) {
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .createSignedUrl(storagePath, 3600);

    if (error) return null;
    return data.signedUrl;
  }

  async function getPdfUrl(storagePath: string) {
    const { data, error } = await supabase.storage
      .from('generated-pdfs')
      .createSignedUrl(storagePath, 3600);

    if (error) return null;
    return data.signedUrl;
  }

  return { uploading, uploadDocument, deleteDocument, getDocumentUrl, getPdfUrl };
}
