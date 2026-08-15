import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as bulkImportService from '../services/bulkImport.service.js';

export const downloadTemplate = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const workbook = await bulkImportService.generateTemplate(type);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${type}_template.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});

export const importData = asyncHandler(async (req, res) => {
  const { type } = req.params;

  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, 'No file uploaded. Please upload an Excel (.xlsx) or CSV (.csv) file.'));
  }

  const rows = await bulkImportService.parseFile(req.file);

  if (rows.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, 'The uploaded file contains no data rows.'));
  }

  const result = await bulkImportService.importData(type, req.schoolId, rows);

  const message = `Import completed: ${result.created} created, ${result.updated !== undefined ? `${result.updated} updated, ` : ''}${result.skipped} skipped${result.errors.length > 0 ? `, ${result.errors.length} errors` : ''}`;

  res.status(200).json(new ApiResponse(200, result, message));
});
