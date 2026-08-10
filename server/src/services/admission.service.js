import Admission from '../models/Admission.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Section from '../models/Section.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createAdmission = async (schoolId, data) => {
  const count = await Admission.countDocuments({ schoolId });
  const applicationNo = `APP-${schoolId.toString().slice(-4)}-${(count + 1).toString().padStart(4, '0')}`;
  const admission = await Admission.create({ ...data, schoolId, applicationNo });
  return admission;
};

export const getAdmissions = async (schoolId, options) => {
  return paginate(Admission, { schoolId }, { ...options, searchFields: ['applicantName', 'applicationNo'] });
};

export const getAdmissionById = async (id, schoolId) => {
  const admission = await Admission.findOne({ _id: id, schoolId }).populate('applyingForClass', 'name');
  if (!admission) throw new ApiError(404, 'Admission not found');
  return admission;
};

export const updateAdmissionStatus = async (id, schoolId, status, remarks) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission not found');

  admission.workflowStatus = status;
  if (remarks) admission.remarks = remarks;
  await admission.save();

  if (status === 'enrolled') {
    let sectionId = null;
    if (admission.applyingForClass) {
      const sections = await Section.find({ schoolClass: admission.applyingForClass });
      if (sections.length > 0) {
        const studentCounts = await Promise.all(
          sections.map(async (sec) => {
            const count = await Student.countDocuments({ schoolId, currentSection: sec._id });
            return { id: sec._id, count };
          })
        );
        studentCounts.sort((a, b) => a.count - b.count);
        sectionId = studentCounts[0].id;
      }
    }

    const student = await Student.create({
      schoolId,
      firstName: admission.applicantName.split(' ')[0],
      lastName: admission.applicantName.split(' ').slice(1).join(' ') || '',
      dateOfBirth: admission.dateOfBirth,
      gender: admission.gender,
      admissionNo: `STU-${admission.applicationNo}`,
      admission: admission._id,
      currentClass: admission.applyingForClass || undefined,
      currentSection: sectionId || undefined,
      contact: { phone: admission.parentPhone, email: admission.parentEmail, address: admission.address },
    });

    let parent = await Parent.findOne({ schoolId, 'contact.phone': admission.parentPhone });
    if (!parent) {
      parent = await Parent.create({
        schoolId,
        firstName: admission.parentName || 'Parent',
        lastName: '',
        contact: { phone: admission.parentPhone, email: admission.parentEmail, address: admission.address },
        students: [student._id],
      });
    } else {
      parent.students.push(student._id);
      await parent.save();
    }

    student.parents.push(parent._id);
    await student.save();
  }

  return admission;
};

export const updateDocuments = async (id, schoolId, documents) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission not found');
  admission.documents.push(...documents);
  await admission.save();
  return admission;
};
