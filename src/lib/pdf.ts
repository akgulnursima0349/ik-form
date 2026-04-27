import jsPDF from 'jspdf';
import type { OnboardingSubmission } from '../types/database';

function maskTC(tc: string): string {
  return '•••••••' + tc.slice(-4);
}

function maskIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '');
  return cleaned.slice(0, 4) + ' •••• •••• •••• •••• ' + cleaned.slice(-2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function generatePdf(
  submission: OnboardingSubmission,
  approverName: string
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const margin = 20;
  let y = margin;

  const addLine = (label: string, value: string, indent = margin) => {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(label, indent, y);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(value || '-', indent + 55, y);
    y += 7;
  };

  const addSection = (title: string) => {
    y += 4;
    doc.setFillColor(240, 244, 255);
    doc.rect(margin, y - 4, 170, 8, 'F');
    doc.setFontSize(11);
    doc.setTextColor(47, 74, 194);
    doc.text(title, margin + 2, y + 1);
    doc.setTextColor(0);
    y += 10;
  };

  const addDivider = () => {
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 5;
  };

  // Header
  doc.setFontSize(18);
  doc.setTextColor(47, 74, 194);
  doc.text('HR Onboarding Platform', margin, y);
  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('ISE GIRIS FORMU', 105, y, { align: 'center' });
  y += 6;
  addDivider();

  const p = submission.personal_info;
  const c = submission.contact_info;
  const e = submission.emergency_contact;
  const b = submission.bank_info;
  const emp = submission.employees;

  // Kişisel Bilgiler
  addSection('KISISEL BILGILER');
  addLine('Ad Soyad:', emp?.full_name || '-');
  addLine('TC Kimlik No:', p ? maskTC(p.tc_no) : '-');
  addLine('Dogum Tarihi:', p?.birth_date ? new Date(p.birth_date).toLocaleDateString('tr-TR') : '-');
  addLine('Dogum Yeri:', p?.birth_place || '-');
  addLine('Cinsiyet:', p?.gender === 'male' ? 'Erkek' : p?.gender === 'female' ? 'Kadin' : 'Belirtmek Istemiyor');
  addLine('Medeni Durum:', p?.marital_status === 'single' ? 'Bekar' : p?.marital_status === 'married' ? 'Evli' : p?.marital_status === 'divorced' ? 'Bosanmis' : 'Dul');
  addLine('Egitim Durumu:', p?.education_level || '-');
  addLine('Departman:', p?.department || '-');
  addLine('Gorev Unvani:', p?.job_title || '-');
  addLine('Ise Baslama Tarihi:', p?.start_date ? new Date(p.start_date).toLocaleDateString('tr-TR') : '-');

  // İletişim Bilgileri
  addSection('ILETISIM BILGILERI');
  addLine('E-posta:', emp?.email || '-');
  addLine('Telefon:', c?.phone || '-');
  addLine('Adres:', c?.address || '-');
  addLine('Il / Ilce:', c ? `${c.city} / ${c.district}` : '-');
  addLine('Posta Kodu:', c?.postal_code || '-');

  // Acil İletişim
  addSection('ACIL ILETISIM');
  addLine('Kisi Adi:', e?.name || '-');
  addLine('Yakinlik:', e?.relationship || '-');
  addLine('Telefon:', e?.phone || '-');

  // Banka Bilgileri
  addSection('BANKA BILGILERI');
  addLine('Banka Adi:', b?.bank_name || '-');
  addLine('IBAN:', b ? maskIBAN(b.iban) : '-');
  addLine('Hesap Sahibi:', b?.account_holder || '-');

  // Belgeler
  addSection('YUKLENEN BELGELER');
  const docs = submission.documents || [];
  if (docs.length === 0) {
    doc.setFontSize(10);
    doc.text('Belge bulunamadi', margin, y);
    y += 7;
  } else {
    docs.forEach((d) => {
      doc.setFontSize(10);
      doc.text(`+ ${d.doc_type} - ${d.file_name}`, margin + 4, y);
      y += 6;
    });
  }

  // Footer
  y += 5;
  addDivider();
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Onay Tarihi: ${formatDate(new Date().toISOString())}`, margin, y);
  y += 5;
  doc.text(`Onaylayan HR: ${approverName}`, margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Bu form dijital onay ile gonderilmistir.', margin, y);

  return doc.output('blob');
}
