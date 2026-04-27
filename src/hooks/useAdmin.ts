import { useState } from 'react';
import toast from 'react-hot-toast';
import { generatePdf } from '../lib/pdf';
import { supabase } from '../lib/supabase';
import { useAdminStore } from '../store/adminStore';
import { DEMO_SUBMISSIONS } from '../lib/demoData';

export function useAdmin() {
  const [loading, setLoading] = useState(false);
  const { hrUser, setSubmissions, setSelectedSubmission, updateSubmissionStatus } = useAdminStore();

  async function fetchSubmissions() {
    if (hrUser?.id === 'demo-hr-id') {
      setSubmissions(DEMO_SUBMISSIONS);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('*, employees(*)')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch {
      toast.error('Başvurular yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubmissionDetail(id: string) {
    if (hrUser?.id === 'demo-hr-id') {
      const found = DEMO_SUBMISSIONS.find((s) => s.id === id) || null;
      setSelectedSubmission(found);
      return found;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('*, employees(*), documents(*), approval_logs(*, hr_users(*))')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSelectedSubmission(data);
      return data;
    } catch {
      toast.error('Başvuru detayı yüklenemedi');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function approveSubmission(id: string, note?: string) {
    if (!hrUser) return false;
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('onboarding_submissions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('approval_logs')
        .insert({ submission_id: id, hr_user_id: hrUser.id, action: 'approved', note: note || null });

      if (logError) throw logError;

      // Fetch submission for PDF
      const { data: sub } = await supabase
        .from('onboarding_submissions')
        .select('*, employees(*), documents(*)')
        .eq('id', id)
        .single();

      if (sub) {
        const pdfBlob = await generatePdf(sub, hrUser.full_name);
        const fileName = `onboarding_${Date.now()}.pdf`;
        await supabase.storage
          .from('generated-pdfs')
          .upload(`${id}/${fileName}`, pdfBlob, { contentType: 'application/pdf' });
      }

      updateSubmissionStatus(id, 'approved');
      toast.success('Başvuru onaylandı');
      return true;
    } catch {
      toast.error('Onaylama işlemi başarısız');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function rejectSubmission(id: string, note: string) {
    if (!hrUser) return false;
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('onboarding_submissions')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('approval_logs')
        .insert({ submission_id: id, hr_user_id: hrUser.id, action: 'rejected', note });

      if (logError) throw logError;

      updateSubmissionStatus(id, 'rejected');
      toast.success('Başvuru reddedildi');
      return true;
    } catch {
      toast.error('Reddetme işlemi başarısız');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function revertToSubmitted(id: string) {
    if (!hrUser) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('onboarding_submissions')
        .update({ status: 'submitted' })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('approval_logs').insert({
        submission_id: id,
        hr_user_id: hrUser.id,
        action: 'note_added',
        note: 'Başvuru yeniden incelemeye alındı',
      });

      updateSubmissionStatus(id, 'submitted');
      toast.success('Başvuru yeniden incelemeye alındı');
      return true;
    } catch {
      toast.error('İşlem başarısız');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, fetchSubmissions, fetchSubmissionDetail, approveSubmission, rejectSubmission, revertToSubmitted };
}
