import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useOnboardingStore } from '../store/onboardingStore';

const DEMO_EMPLOYEE = {
  id: 'demo-employee-id',
  email: 'demo@sirket.com',
  full_name: 'Demo Çalışan',
  phone: '0555 000 0000',
  token: 'demo',
  invited_by: null,
  token_used: false,
  created_at: new Date().toISOString(),
};

const DEMO_SUBMISSION = {
  id: 'demo-submission-id',
  employee_id: 'demo-employee-id',
  status: 'draft' as const,
  personal_info: null,
  contact_info: null,
  emergency_contact: null,
  bank_info: null,
  current_step: 1,
  digital_consent: false,
  submitted_at: null,
  updated_at: new Date().toISOString(),
};

export function useOnboarding() {
  const [loading, setLoading] = useState(false);
  const { employee, submission, currentStep, setEmployee, setSubmission } = useOnboardingStore();

  async function verifyToken(token: string) {
    if (token === 'demo') {
      setEmployee(DEMO_EMPLOYEE);
      setSubmission(DEMO_SUBMISSION);
      return { valid: true };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_onboarding_token', {
        p_token: token,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        return { valid: false, reason: 'invalid' };
      }

      const result = data[0];

      // Fetch employee details
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', result.employee_id)
        .single();

      if (empError) throw empError;
      setEmployee(empData);

      // If submission exists, fetch it; otherwise create one
      if (result.submission_id) {
        const { data: subData, error: subError } = await supabase
          .from('onboarding_submissions')
          .select('*, documents(*), approval_logs(*)')
          .eq('id', result.submission_id)
          .single();

        if (subError) throw subError;
        setSubmission(subData);
      } else {
        // Create new submission
        const { data: newSub, error: createError } = await supabase
          .from('onboarding_submissions')
          .insert({ employee_id: result.employee_id })
          .select()
          .single();

        if (createError) throw createError;
        setSubmission(newSub);
      }

      return { valid: true };
    } catch {
      toast.error('Token doğrulanamadı');
      return { valid: false, reason: 'error' };
    } finally {
      setLoading(false);
    }
  }

  async function saveStep(step: number, data: object) {
    if (!submission) return false;
    if (submission.id === 'demo-submission-id') {
      return true;
    }
    setLoading(true);

    const fieldMap: Record<number, string> = {
      1: 'personal_info',
      2: 'contact_info',
      3: 'emergency_contact',
      4: 'bank_info',
    };

    const field = fieldMap[step];
    if (!field) {
      setLoading(false);
      return true;
    }

    try {
      const { error } = await supabase
        .from('onboarding_submissions')
        .update({ [field]: data, current_step: Math.max(step + 1, submission.current_step) })
        .eq('id', submission.id);

      if (error) throw error;
      // current_step'i mevcut UI adımıyla koru, setSubmission sıfırlamasın
      setSubmission({ ...submission, [field]: data, current_step: currentStep });
      return true;
    } catch (err: unknown) {
      console.error('saveStep hatası:', err);
      toast.error('Bilgiler kaydedilemedi, tekrar deneyin');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function submitForm() {
    if (!submission || !employee) return false;
    if (submission.id === 'demo-submission-id') return true;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('onboarding_submissions')
        .update({
          status: 'submitted',
          digital_consent: true,
          submitted_at: new Date().toISOString(),
          current_step: 6,
        })
        .eq('id', submission.id);

      if (error) throw error;

      // Mark token as used
      await supabase
        .from('employees')
        .update({ token_used: true })
        .eq('id', employee.id);

      return true;
    } catch {
      toast.error('Form gönderilemedi, tekrar deneyin');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, verifyToken, saveStep, submitForm, employee, submission };
}
