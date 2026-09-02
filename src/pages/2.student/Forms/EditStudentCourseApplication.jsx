import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { addYears, format, parseISO, isPast } from 'date-fns';
import { HiOutlineDocumentDuplicate } from 'react-icons/hi';
import { 
  useGetAllCampuses, 
  useGetAllSchools, 
  useGetAllDepartments, 
  useGetAllCourses, 
  useGetAllSpecializations,
  useGetStudentCohorts 
} from "@/store/tanstackStore/services/queries";
import FormErrorHandler from "@/components/FormErrorHandler/FormErrorHandler";

const EditStudentCourseApplication = ({ studentData, formRef, updateStudentMutation }) => {
    const extractDateFromRegNo = (regNo) => {
        if (!regNo) return null;
        const parts = regNo.split('/');
        if (parts.length >= 4) {
            const yearShort = parts[0];
            const monthShort = parts[3]?.toUpperCase();
            const monthMap = {
                'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3,
                'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7,
                'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
            };
            const monthIndex = monthMap[monthShort];
            const year = 2000 + parseInt(yearShort);
            if (monthIndex !== undefined && !isNaN(year)) {
                return format(new Date(year, monthIndex, 1), 'yyyy-MM-dd');
            }
        }
        return null;
    };

    const [selectedCampusId, setSelectedCampusId] = useState(studentData?.student?.campusId || '');
    const [selectedSchoolId, setSelectedSchoolId] = useState(studentData?.student?.schoolId || '');
    const [selectedCourseId, setSelectedCourseId] = useState(studentData?.student?.courseId || studentData?.student?.course || '');

    const { data: campuses } = useGetAllCampuses();
    const { data: schools } = useGetAllSchools();
    const { data: departments } = useGetAllDepartments(selectedSchoolId || '');
    const { data: courses } = useGetAllCourses({ campusId: selectedCampusId });
    const { data: specializations } = useGetAllSpecializations({ courseId: selectedCourseId });
    const { data: cohortsData } = useGetStudentCohorts();
    const existingCohorts = cohortsData?.cohorts || [];

    const initialAdmissionDate = studentData?.student?.admissionDate 
        ? format(parseISO(studentData.student.admissionDate), 'yyyy-MM-dd') 
        : extractDateFromRegNo(studentData?.student?.registrationNumber) || format(new Date(), 'yyyy-MM-dd');

    const initialValues = {
        ...studentData?.student,
        campusId: studentData?.student?.campusId || '',
        schoolId: studentData?.student?.schoolId || '',
        departmentId: studentData?.student?.departmentId || '',
        course: studentData?.student?.courseId || studentData?.student?.course || '',
        academicYear: studentData?.student?.academicYear || '',
        studyMode: studentData?.student?.studyMode || '',
        intakePeriod: studentData?.student?.intakePeriod || '',
        cohort: studentData?.student?.cohort || '',
        programLevel: studentData?.student?.programLevel || '',
        specialization: studentData?.student?.specializationId || studentData?.student?.specialization || '',
        completionTime: studentData?.student?.completionTime || '',
        extensionYears: studentData?.student?.extensionYears || 0,
        admissionDate: initialAdmissionDate,
        expectedCompletionDate: studentData?.student?.expectedCompletionDate 
            ? format(parseISO(studentData.student.expectedCompletionDate), 'yyyy-MM-dd') 
            : (initialAdmissionDate && studentData?.student?.completionTime 
                ? format(addYears(new Date(initialAdmissionDate), parseInt(studentData.student.completionTime)), 'yyyy-MM-dd') 
                : '')
    };
    
    const validationSchema = Yup.object().shape({
        campusId: Yup.string().required('Campus is required'),
        schoolId: Yup.string().required('School is required'),
        course: Yup.string().required('Course is required'),
        academicYear: Yup.string().required('Academic year is required'),
        studyMode: Yup.string().required('Study mode is required'),
        intakePeriod: Yup.string().required('Intake period is required'),
        programLevel: Yup.string().required('Program level is required'),
        specialization: Yup.string().required('Specialization is required'),
        completionTime: Yup.number().required('Completion time is required')
    });

    return (
        <Formik
            innerRef={formRef}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => {
                updateStudentMutation.mutate({
                    ...values,
                    completionTime: parseInt(values.completionTime),
                    extensionYears: parseInt(values.extensionYears) || 0
                });
            }}
        >
            {({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                  if (values.completionTime && values.admissionDate) {
                    const startDate = new Date(values.admissionDate);
                    const totalYears = parseInt(values.completionTime) + (parseInt(values.extensionYears) || 0);
                    const completionDate = addYears(startDate, totalYears);
                    const formattedDate = format(completionDate, 'yyyy-MM-dd');
                    if (values.expectedCompletionDate !== formattedDate) {
                      setFieldValue('expectedCompletionDate', formattedDate);
                    }
                  }
                }, [values.admissionDate, values.completionTime, values.extensionYears, setFieldValue]);

                return (
                    <Form className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Course Application</h2>
                            <button 
                                type="submit"
                                disabled={updateStudentMutation.isPending}
                                className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 ${
                                    updateStudentMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            >
                                <HiOutlineDocumentDuplicate className="w-4 h-4 mr-2" />
                                {updateStudentMutation.isPending ? "Saving..." : "Save Details"}
                            </button>
                        </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Campus */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Campus</label>
                            <select
                                name="campusId"
                                value={values.campusId}
                                onChange={(e) => {
                                    handleChange(e);
                                    setSelectedCampusId(e.target.value);
                                    setFieldValue('course', '');
                                    setFieldValue('specialization', '');
                                }}
                                className={`w-full h-9 rounded-md border ${errors.campusId && touched.campusId ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            >
                                <option value="">Select Campus</option>
                                {campuses?.campuses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <FormErrorHandler errors={errors.campusId} touched={touched.campusId} />
                        </div>

                        {/* Course */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Course</label>
                            <select
                                name="course"
                                value={values.course}
                                onChange={(e) => {
                                    handleChange(e);
                                    setSelectedCourseId(e.target.value);
                                    setFieldValue('specialization', '');
                                }}
                                disabled={!values.campusId}
                                className={`w-full h-9 rounded-md border ${errors.course && touched.course ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            >
                                <option value="">Select Course</option>
                                {courses?.courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                            <FormErrorHandler errors={errors.course} touched={touched.course} />
                        </div>

                        {/* Specialization */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Specialization</label>
                            <select
                                name="specialization"
                                value={values.specialization}
                                onChange={(e) => {
                                    handleChange(e);
                                    const specId = e.target.value;
                                    const spec = specializations?.specializations?.find(s => s.id === specId);
                                    if (spec) {
                                        setFieldValue('schoolId', spec.schoolId || '');
                                        setSelectedSchoolId(spec.schoolId || '');
                                        setFieldValue('departmentId', spec.departmentId || '');
                                        if (spec.duration) {
                                            setFieldValue('completionTime', spec.duration);
                                            const baseDate = values.admissionDate ? new Date(values.admissionDate) : new Date();
                                            const date = addYears(baseDate, spec.duration);
                                            setFieldValue('expectedCompletionDate', format(date, 'yyyy-MM-dd'));
                                        }
                                    } else {
                                        // Cleanup if deselected
                                        setFieldValue('schoolId', '');
                                        setSelectedSchoolId('');
                                        setFieldValue('departmentId', '');
                                        setFieldValue('completionTime', '');
                                        setFieldValue('expectedCompletionDate', '');
                                    }
                                }}
                                disabled={!values.course}
                                className={`w-full h-9 rounded-md border ${errors.specialization && touched.specialization ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            >
                                <option value="">Select Specialization</option>
                                {specializations?.specializations?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <FormErrorHandler errors={errors.specialization} touched={touched.specialization} />
                        </div>

                        {/* School */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">School</label>
                            <select
                                name="schoolId"
                                value={values.schoolId}
                                onChange={(e) => {
                                    handleChange(e);
                                    setSelectedSchoolId(e.target.value);
                                    setFieldValue('departmentId', '');
                                }}
                                className={`w-full h-9 rounded-md border ${errors.schoolId && touched.schoolId ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            >
                                <option value="">Select School</option>
                                {schools?.schools?.filter(s => s.campusId === values.campusId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <FormErrorHandler errors={errors.schoolId} touched={touched.schoolId} />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <select
                                name="departmentId"
                                value={values.departmentId}
                                onChange={handleChange}
                                disabled={!values.schoolId}
                                className="w-full h-9 rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                            >
                                <option value="">Select Department</option>
                                {departments?.departments?.filter(d => d.schoolId === values.schoolId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Program Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Program Level</label>
                            <select
                                name="programLevel"
                                value={values.programLevel}
                                onChange={handleChange}
                                className={`w-full h-9 rounded-md border ${errors.programLevel && touched.programLevel ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            >
                                <option value="">Select Level</option>
                                <option value="postgraduate">Post Graduate</option>
                                <option value="masters">Master's Degree</option>
                                <option value="phd">PhD</option>
                            </select>
                        </div>

                        {/* Study Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Study Mode</label>
                            <select
                                name="studyMode"
                                value={values.studyMode}
                                onChange={handleChange}
                                className={`w-full h-9 rounded-md border ${errors.studyMode && touched.studyMode ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            >
                                <option value="">Select Mode</option>
                                <option value="fullTime">Full Time</option>
                                <option value="partTime">Part Time</option>
                                <option value="distance">Distance Learning</option>
                            </select>
                        </div>

                        {/* Intake Period */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Intake Period</label>
                            <select
                                name="intakePeriod"
                                value={values.intakePeriod}
                                onChange={handleChange}
                                className={`w-full h-9 rounded-md border ${errors.intakePeriod && touched.intakePeriod ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            >
                                <option value="">Select Month</option>
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {/* Academic Year */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                            <input
                                type="text"
                                name="academicYear"
                                value={values.academicYear}
                                onChange={handleChange}
                                placeholder="e.g. 2024/2025"
                                className={`w-full h-9 rounded-md border ${errors.academicYear && touched.academicYear ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            />
                        </div>

                        {/* Cohort */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cohort (Optional)</label>
                            <input
                                type="text"
                                name="cohort"
                                value={values.cohort}
                                onChange={handleChange}
                                list="cohort-options"
                                placeholder="Select or type a new cohort e.g. 2023"
                                className={`w-full h-9 rounded-md border ${errors.cohort && touched.cohort ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            />
                            <datalist id="cohort-options">
                                {existingCohorts.map((c) => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>

                        {/* Completion Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Completion Time (Years)</label>
                            <input
                                type="number"
                                name="completionTime"
                                value={values.completionTime}
                                onChange={(e) => {
                                    handleChange(e);
                                    const years = parseInt(e.target.value);
                                    if (years > 0 && values.admissionDate) {
                                        const date = addYears(new Date(values.admissionDate), years);
                                        setFieldValue('expectedCompletionDate', format(date, 'yyyy-MM-dd'));
                                    }
                                }}
                                className={`w-full h-9 rounded-md border ${errors.completionTime && touched.completionTime ? "border-red-500" : "border-gray-200"} px-3 py-2 text-sm bg-gray-50`}
                            />
                        </div>

                        {/* Admission Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Admission Date</label>
                            <input
                                type="date"
                                name="admissionDate"
                                value={values.admissionDate}
                                onChange={(e) => {
                                    handleChange(e);
                                    const date = e.target.value;
                                    if (date && values.completionTime) {
                                        const compDate = addYears(new Date(date), parseInt(values.completionTime));
                                        setFieldValue('expectedCompletionDate', format(compDate, 'yyyy-MM-dd'));
                                    }
                                }}
                                className="w-full h-9 rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                            />
                        </div>

                        {/* Extension Period */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Extension Period (Years)</label>
                            <input
                                type="number"
                                name="extensionYears"
                                value={values.extensionYears}
                                onChange={handleChange}
                                placeholder="Additional years"
                                className="w-full h-9 rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                            />
                        </div>

                        {/* Expected Completion Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Expected Completion Date</label>
                            <input
                                type="date"
                                name="expectedCompletionDate"
                                value={values.expectedCompletionDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full h-9 rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            {values.expectedCompletionDate && isPast(new Date(values.expectedCompletionDate)) && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    Warning: This student has exceeded the normal completion time.
                                </div>
                            )}
                        </div>
                    </div>
                </Form>
            );
        }}
        </Formik>
    );
};

export default EditStudentCourseApplication;