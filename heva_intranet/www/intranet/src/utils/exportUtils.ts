import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Exports data to an Excel file (.xlsx)
 * @param data Array of objects to export
 * @param filename Name of the file to be saved
 * @param sheetName Name of the sheet in the Excel file
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create Blob and save
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `${filename}.xlsx`);
};

/**
 * Creates a ZIP file from multiple URLs (e.g., attachments)
 * @param files Array of objects with name and url
 * @param zipFilename Name of the ZIP file to be saved
 */
export const exportToZip = async (files: { name: string; url: string }[], zipFilename: string) => {
    const zip = new JSZip();

    const fetchPromises = files.map(async (file) => {
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            zip.file(file.name, blob);
        } catch (error) {
            console.error(`Failed to fetch file: ${file.name}`, error);
        }
    });

    await Promise.all(fetchPromises);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${zipFilename}.zip`);
};
