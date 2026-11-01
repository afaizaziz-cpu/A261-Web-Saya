/**
 * Validation logic for student assignment submission.
 */

export interface SubmissionFormInput {
  nama: string;
  noMatrik: string;
  tajukWeb: string;
  linkLamanWeb: string;
  slidePdfUrl: string;
}

export function validateSubmission(input: SubmissionFormInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.nama || input.nama.trim().length < 2) {
    errors.nama = 'Sila masukkan nama pelajar.';
  }

  if (!input.noMatrik || input.noMatrik.trim().length < 2) {
    errors.noMatrik = 'Sila masukkan nombor matrik.';
  }

  if (!input.tajukWeb || input.tajukWeb.trim().length < 2) {
    errors.tajukWeb = 'Sila masukkan tajuk web.';
  }

  if (!input.linkLamanWeb || !input.linkLamanWeb.trim()) {
    errors.linkLamanWeb = 'Sila masukkan pautan laman web.';
  }

  if (!input.slidePdfUrl || !input.slidePdfUrl.trim()) {
    errors.slidePdfUrl = 'Sila muat naik fail slaid (PDF).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
