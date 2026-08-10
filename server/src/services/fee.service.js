import mongoose from 'mongoose';
import FeeStructure from '../models/FeeStructure.js';
import FeeTransaction from '../models/FeeTransaction.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import ExcelJS from 'exceljs';
import AcademicYear from '../models/AcademicYear.js';
import SchoolClass from '../models/SchoolClass.js';

export const createFeeStructure = async (schoolId, data) => {
  const total = data.categories.reduce((sum, c) => sum + c.amount, 0);
  const structure = await FeeStructure.create({ ...data, schoolId, totalAmount: total });
  return structure;
};

export const getFeeStructures = async (schoolId, options) => {
  return paginate(FeeStructure, { schoolId }, {
    ...options,
    searchFields: ['name'],
    populate: [
      { path: 'academicYear', select: 'name' },
      { path: 'schoolClass', select: 'name' },
    ],
  });
};

export const getFeeStructureById = async (id, schoolId) => {
  const structure = await FeeStructure.findOne({ _id: id, schoolId });
  if (!structure) throw new ApiError(404, 'Fee structure not found');
  return structure;
};

export const updateFeeStructure = async (id, schoolId, data) => {
  if (data.categories) {
    data.totalAmount = data.categories.reduce((sum, c) => sum + c.amount, 0);
  }
  const structure = await FeeStructure.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!structure) throw new ApiError(404, 'Fee structure not found');
  return structure;
};

export const deleteFeeStructure = async (id, schoolId) => {
  const structure = await FeeStructure.findOneAndDelete({ _id: id, schoolId });
  if (!structure) throw new ApiError(404, 'Fee structure not found');
  return true;
};

export const recordPayment = async (schoolId, data, userId) => {
  const structure = await FeeStructure.findById(data.feeStructure);
  if (!structure) throw new ApiError(404, 'Fee structure not found');

  const balance = data.amount - data.paidAmount;
  const status = balance <= 0 ? 'paid' : 'partial';

  const feeTransaction = await FeeTransaction.create({
    ...data,
    schoolId,
    balance: Math.max(0, balance),
    status,
    paidBy: userId,
    dueDate: new Date(),
    paymentDate: new Date(),
  });

  return feeTransaction;
};

export const getFeeTransactions = async (schoolId, options) => {
  return paginate(FeeTransaction, { schoolId }, options);
};

export const getStudentFeeStatus = async (schoolId, studentId) => {
  const transactions = await FeeTransaction.find({ schoolId, student: studentId })
    .populate('feeStructure', 'name totalAmount');
  const totalDue = transactions.reduce((s, t) => s + t.amount, 0);
  const totalPaid = transactions.reduce((s, t) => s + t.paidAmount, 0);
  return { transactions, totalDue, totalPaid, balance: totalDue - totalPaid };
};

export const getFeeReport = async (schoolId) => {
  const totalCollected = await FeeTransaction.aggregate([
    { $match: { schoolId: mongoose.Types.ObjectId.createFromHexString(schoolId), status: { $in: ['paid', 'partial'] } } },
    { $group: { _id: null, total: { $sum: '$paidAmount' } } },
  ]);
  const pendingCount = await FeeTransaction.countDocuments({ schoolId, status: { $in: ['pending', 'overdue'] } });
  return {
    totalCollected: totalCollected[0]?.total || 0,
    pendingCount,
  };
};

export const importFeeStructures = async (schoolId, filePath) => {
  const workbook = new ExcelJS.Workbook();
  const ext = filePath.split('.').pop().toLowerCase();
  
  if (ext === 'csv') {
    await workbook.csv.readFile(filePath);
  } else {
    await workbook.xlsx.readFile(filePath);
  }

  const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);
  if (!worksheet) throw new ApiError(400, 'Invalid or empty spreadsheet file');

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header row
    
    const rowData = [];
    for (let i = 1; i <= 8; i++) {
      const val = row.getCell(i).value;
      rowData.push(val && typeof val === 'object' && val.text ? val.text : (val ?? ''));
    }
    rows.push(rowData);
  });

  const created = [];
  const errors = [];
  const yearsCache = {};
  const classesCache = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    
    // Columns: Name, Academic Year, Class, Late Fee / Day, Category Name, Category Type, Category Amount, Category Frequency
    const name = row[0]?.toString().trim();
    const yearName = row[1]?.toString().trim();
    const className = row[2]?.toString().trim();
    const lateFeePerDay = Number(row[3]) || 0;
    const catName = row[4]?.toString().trim();
    const catType = row[5]?.toString().trim().toLowerCase();
    const catAmount = Number(row[6]) || 0;
    const catFrequency = row[7]?.toString().trim().toLowerCase() || 'monthly';

    if (!name || !yearName || !className || !catName || !catType || catAmount <= 0) {
      errors.push(`Row ${rowNum}: Missing or invalid name, year, class, category type, or amount`);
      continue;
    }

    try {
      // Match academic year
      let academicYearId = yearsCache[yearName];
      if (!academicYearId) {
        const yr = await AcademicYear.findOne({ schoolId, name: yearName });
        if (!yr) {
          errors.push(`Row ${rowNum}: Academic Year "${yearName}" not found`);
          continue;
        }
        academicYearId = yr._id;
        yearsCache[yearName] = yr._id;
      }

      // Match school class
      let schoolClassId = classesCache[className];
      if (!schoolClassId) {
        const cl = await SchoolClass.findOne({ schoolId, name: className });
        if (!cl) {
          errors.push(`Row ${rowNum}: Class "${className}" not found`);
          continue;
        }
        schoolClassId = cl._id;
        classesCache[className] = cl._id;
      }

      const validTypes = ['admission', 'tuition', 'transport', 'library', 'sports', 'lab', 'development', 'other'];
      if (!validTypes.includes(catType)) {
        errors.push(`Row ${rowNum}: Invalid category type "${catType}"`);
        continue;
      }

      const validFreqs = ['one_time', 'monthly', 'quarterly', 'half_yearly', 'annual'];
      if (!validFreqs.includes(catFrequency)) {
        errors.push(`Row ${rowNum}: Invalid frequency "${catFrequency}"`);
        continue;
      }

      // Group categories into single fee structures by name, year, and class
      let structure = created.find(
        (s) => s.name === name && 
               s.academicYear.toString() === academicYearId.toString() &&
               s.schoolClass.includes(schoolClassId.toString())
      );

      const newCategory = {
        name: catName,
        type: catType,
        amount: catAmount,
        frequency: catFrequency,
      };

      if (structure) {
        structure.categories.push(newCategory);
        structure.totalAmount += catAmount;
      } else {
        structure = {
          schoolId,
          name,
          academicYear: academicYearId,
          schoolClass: [schoolClassId],
          lateFeePerDay,
          categories: [newCategory],
          totalAmount: catAmount,
          isActive: true,
        };
        created.push(structure);
      }
    } catch (err) {
      errors.push(`Row ${rowNum}: ${err.message}`);
    }
  }

  const saved = [];
  for (const structData of created) {
    try {
      let existingStruct = await FeeStructure.findOne({
        schoolId,
        name: structData.name,
        academicYear: structData.academicYear,
        schoolClass: { $in: structData.schoolClass }
      });

      if (existingStruct) {
        existingStruct.categories = structData.categories;
        existingStruct.totalAmount = structData.totalAmount;
        existingStruct.lateFeePerDay = structData.lateFeePerDay;
        await existingStruct.save();
        saved.push(existingStruct);
      } else {
        const newStruct = await FeeStructure.create(structData);
        saved.push(newStruct);
      }
    } catch (err) {
      errors.push(`Structure "${structData.name}": Failed to save: ${err.message}`);
    }
  }

  return { savedCount: saved.length, errors };
};
