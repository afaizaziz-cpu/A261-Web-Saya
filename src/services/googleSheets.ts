import { StudentSubmission } from '../types';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

export const SHEET_HEADERS = [
  'Tarikh Hantar',
  'Nama Pelajar',
  'No. Matrik',
  'Tajuk Web',
  'Link Laman Web',
  'Link Slide (PDF)',
];

/**
 * Searches the user's Google Drive for Spreadsheets & PDF Slide files
 */
export async function listUserDriveFiles(
  accessToken: string,
  type: 'sheets' | 'slides' | 'all' = 'all'
): Promise<DriveFile[]> {
  try {
    let q = "trashed = false";
    if (type === 'sheets') {
      q += " and mimeType = 'application/vnd.google-apps.spreadsheet'";
    } else if (type === 'slides') {
      q += " and (mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.presentation')";
    } else {
      q += " and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.presentation')";
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        q
      )}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gagal menyemak Google Drive.');
    }

    const data = await response.json();
    return data.files || [];
  } catch (err: unknown) {
    console.error('Error listing drive files:', err);
    throw err;
  }
}

/**
 * Creates a dedicated new Google Sheet
 */
export async function createAssignmentSpreadsheet(
  accessToken: string,
  title = 'Projek Website Saya - Senarai Assignment Pelajar'
): Promise<{ id: string; url: string }> {
  try {
    const body = {
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Hantaran Pelajar',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    };

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gagal mencipta Google Sheet baru.');
    }

    const created = await response.json();
    const spreadsheetId = created.spreadsheetId;

    // Append Header Row
    await appendRowsToSheet(accessToken, spreadsheetId, [SHEET_HEADERS]);

    return {
      id: spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  } catch (err: unknown) {
    console.error('Error creating spreadsheet:', err);
    throw err;
  }
}

/**
 * Appends rows to sheet
 */
export async function appendRowsToSheet(
  accessToken: string,
  spreadsheetId: string,
  values: (string | number)[][]
): Promise<void> {
  const range = encodeURIComponent('Hantaran Pelajar!A:F');
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal memasukkan data ke Google Sheet.');
  }
}

/**
 * Converts submission to a single row
 */
export function submissionToRow(sub: StudentSubmission): (string | number)[] {
  return [
    sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('ms-MY') : '',
    sub.nama,
    sub.noMatrik,
    sub.tajukWeb,
    sub.linkLamanWeb,
    sub.slideFileName ? `${sub.slideFileName} (${sub.slidePdfUrl.startsWith('data:') ? 'Fail Dimuat Naik' : sub.slidePdfUrl})` : sub.slidePdfUrl,
  ];
}

/**
 * Syncs full array of submissions to the Google Sheet
 */
export async function syncSubmissionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  submissions: StudentSubmission[]
): Promise<void> {
  const rows = [SHEET_HEADERS, ...submissions.map(submissionToRow)];
  const range = encodeURIComponent('Hantaran Pelajar!A1:F' + rows.length);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal mengemaskini Google Sheet.');
  }
}
