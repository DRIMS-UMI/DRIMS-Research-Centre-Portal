import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { addYears, format, isPast } from 'date-fns';
import { useGetAllCampuses, useGetAllSchools, useGetAllDepartments, useGetAllCourses, useGetAllSpecializations, useGetStudentCohorts } from "@/store/tanstackStore/services/queries";
import FormErrorHandler from "@/components/FormErrorHandler/FormErrorHandler";
import { useState, useEffect } from 'react';

const StudentCourseApplication = ({ formRef, handleNext, createStudentMutation }) => {
  // Encryption/decryption functions
  const encryptData = (data) => {
    return btoa(JSON.stringify(data)); // Simple base64 encoding for demo
  };

  const decryptData = (encryptedData) => {
    try {
      return JSON.parse(atob(encryptedData)); // Decode base64
    } catch {
      return {};
    }
  };

  // Get and decrypt stored data
  const encryptedData = localStorage.getItem('studentCourseApplication');
  const storedData = encryptedData ? decryptData(encryptedData) : {};
  const personalInfoEncrypted = localStorage.getItem('studentPersonalInfo');
  const personalInfo = personalInfoEncrypted ? decryptData(personalInfoEncrypted) : {};

  const [selectedCampusId, setSelectedCampusId] = useState(storedData?.campusId || '')
  const [selectedSchoolId, setSelectedSchoolId] = useState(storedData?.schoolId || '')
  const [selectedCourseId, setSelectedCourseId] = useState(storedData?.course || '')

  const { data: campuses } = useGetAllCampuses();
  const { data: schools } = useGetAllSchools();
  const { data: departments } = useGetAllDepartments(selectedSchoolId || '');

  const { data: courses } = useGetAllCourses({
    campusId: selectedCampusId
  });
  const { data: specializations } = useGetAllSpecializations({
    courseId: selectedCourseId
  });
  const { data: cohortsData } = useGetStudentCohorts();
  const existingCohorts = cohortsData?.cohorts || [];
  console.log(courses)
  const initialValues = {
    course: storedData.course || '',
    academicYear: storedData.academicYear || '',
    studyMode: storedData.studyMode || '',
    intakePeriod: storedData.intakePeriod || '',
    cohort: storedData.cohort || '',
    programLevel: storedData.programLevel || '',
    specialization: storedData.specialization || '',
    completionTime: storedData.completionTime || '',
    extensionYears: storedData.extensionYears || 0,
    admissionDate: storedData.admissionDate || '',
    expectedCompletionDate: storedData.expectedCompletionDate || '',
    schoolId: storedData.schoolId || "",
    campusId: storedData.campusId || "",
    departmentId: storedData.departmentId || null,
  };

  const validationSchema = Yup.object().shape({
    course: Yup.string().required('Course is required'),
    academicYear: Yup.string().required('Academic year is required'),
    studyMode: Yup.string().required('Study mode is required'),
    intakePeriod: Yup.string().required('Intake period is required'),
    programLevel: Yup.string().required('Program level is required'),
    specialization: Yup.string().required('Specialization is required'),
    completionTime: Yup.string().required('Completion time is required'),
    admissionDate: Yup.date().required('Admission date is required'),
    schoolId: Yup.string().required("School is required"),
    campusId: Yup.string().required("Campus is required"),
    departmentId: Yup.string().nullable(),
  });

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    return password;
  };

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        // Encrypt data before storing
        const encryptedValues = encryptData(values);
        localStorage.setItem('studentCourseApplication', encryptedValues);
        handleNext();
      }}
    >
      {({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => {
        // Auto-parse registration number logic
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          const regNo = personalInfo?.registrationNumber || '';
          if (regNo) {
            const parts = regNo.split('/');
            if (parts.length >= 4) {
              const yearShort = parts[0];
              const monthShort = parts[3]?.toUpperCase();

              const monthMap = {
                'JAN': 'January', 'FEB': 'February', 'MAR': 'March', 'APR': 'April',
                'MAY': 'May', 'JUN': 'June', 'JUL': 'July', 'AUG': 'August',
                'SEP': 'September', 'OCT': 'October', 'NOV': 'November', 'DEC': 'December'
              };

              const monthName = monthMap[monthShort];
              const year = 2000 + parseInt(yearShort);
              const monthIndex = Object.keys(monthMap).indexOf(monthShort);

              if (monthName && values.intakePeriod !== monthName) {
                setFieldValue('intakePeriod', monthName);
              }

              // Auto-fill Academic Year
              const acadYear = `${year}/${year + 1}`;
              if (values.academicYear !== acadYear) {
                setFieldValue('academicYear', acadYear);
              }

              // Set Admission Date from registration number
              if (monthIndex !== -1) {
                const startDate = new Date(year, monthIndex, 1);
                const formattedAdmissionDate = format(startDate, 'yyyy-MM-dd');
                
                // Only set if admissionDate is empty (initial state)
                if (!values.admissionDate) {
                  setFieldValue('admissionDate', formattedAdmissionDate);
                }
              }
            }
          }
        }, [personalInfo?.registrationNumber, setFieldValue]);

        // Recalculate expected completion date when admission date, duration, or extension changes
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
            <div className="grid grid-cols-2 gap-6">
              {/** campus */}
              <div>
                <label
                  htmlFor="campusId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Campus
                </label>
                <select
                  id="campusId"
                  name="campusId"
                  onChange={(e) => {
                    handleChange(e);
                    const campusId = e.target.value;
                    setSelectedCampusId(campusId);

                    // Reset all downstream fields
                    setFieldValue('course', '');
                    setSelectedCourseId('');
                    setFieldValue('specialization', '');
                    setFieldValue('schoolId', '');
                    setSelectedSchoolId('');
                    setFieldValue('departmentId', '');
                    setFieldValue('completionTime', '');
                    setFieldValue('expectedCompletionDate', '');
                  }}
                  onBlur={handleBlur}
                  value={values.campusId}
                  className={`w-full h-9 rounded-md border ${errors?.campusId ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="">Select Campus</option>
                  {campuses?.campuses?.map(campus => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
                <FormErrorHandler
                  errors={errors?.campusId}
                  message={errors?.campusId}
                />
              </div>

              {/** program level */}
              <div>
                <label htmlFor="programLevel" className="block text-sm font-medium text-gray-700">
                  Program Level
                </label>
                <select
                  id="programLevel"
                  name="programLevel"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.programLevel}
                  className={`w-full h-9 rounded-md border ${errors?.programLevel ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="">Select Program Level</option>
                  {/* <option value="certificate">Certificate</option> */}
                  {/* <option value="diploma">Diploma</option> */}
                  {/* <option value="bachelors">Bachelor's Degree</option> */}
                  {/* <option value="postgraduate">Post Graduate</option> */}
                  <option value="masters">Master's Degree</option>
                  {/* <option value="phd">PhD</option> */}
                </select>
                {errors.programLevel && touched.programLevel && (
                  <div className="text-red-500 text-sm mt-1">{errors.programLevel}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/** course */}
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                  Course
                </label>
                <select
                  id="course"
                  name="course"
                  onChange={(e) => {
                    handleChange(e);
                    const courseId = e.target.value;
                    setSelectedCourseId(courseId);

                    // Reset specialization and its associated fields
                    setFieldValue('specialization', '');
                    setFieldValue('schoolId', '');
                    setSelectedSchoolId('');
                    setFieldValue('departmentId', '');
                    setFieldValue('completionTime', '');
                    setFieldValue('expectedCompletionDate', '');
                  }}
                  onBlur={handleBlur}
                  value={values.course}
                  className={`w-full h-9 rounded-md border ${errors?.course ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}
                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                  disabled={!values.campusId}
                >
                  <option value="">Select Course</option>
                  {courses?.courses?.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
                {errors.course && touched.course && (
                  <div className="text-red-500 text-sm mt-1">{errors.course}</div>
                )}
              </div>


              {/** specialization */}
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                  Specialization (if applicable)
                </label>
                <select
                  id="specialization"
                  name="specialization"
                  onChange={(e) => {
                    handleChange(e);
                    const specId = e.target.value;

                    if (!specId) {
                      // Reset all associated fields if specialization is cleared
                      setFieldValue('schoolId', '');
                      setSelectedSchoolId('');
                      setFieldValue('departmentId', '');
                      setFieldValue('completionTime', '');
                      setFieldValue('expectedCompletionDate', '');
                      return;
                    }

                    const selectedSpec = specializations?.specializations?.find(s => s.id === specId);

                    if (selectedSpec) {
                      // Auto-fill School and Department
                      if (selectedSpec.schoolId) {
                        setFieldValue('schoolId', selectedSpec.schoolId);
                        setSelectedSchoolId(selectedSpec.schoolId);
                      } else {
                        setFieldValue('schoolId', '');
                        setSelectedSchoolId('');
                      }

                      if (selectedSpec.departmentId) {
                        setFieldValue('departmentId', selectedSpec.departmentId);
                      } else {
                        setFieldValue('departmentId', '');
                      }

                      // Auto-fill Duration/Completion Time
                      if (selectedSpec.duration) {
                        const years = selectedSpec.duration;
                        setFieldValue('completionTime', years.toString());
                        const completionDate = addYears(new Date(), years);
                        setFieldValue('expectedCompletionDate', format(completionDate, 'yyyy-MM-dd'));
                      } else {
                        setFieldValue('completionTime', '');
                        setFieldValue('expectedCompletionDate', '');
                      }
                    }
                  }}
                  onBlur={handleBlur}
                  value={values.specialization}
                  className={`w-full h-9 rounded-md border ${errors?.specialization ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}
                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                  disabled={!values.course}
                >
                  <option value="">Select Specialization</option>
                  {specializations?.specializations?.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.code ? `${spec.code} - ` : ''}{spec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/** school */}
              <div>
                <label
                  htmlFor="schoolId"
                  className="block text-sm font-medium text-gray-700"
                >
                  School
                </label>
                <select
                  id="schoolId"
                  name="schoolId"
                  onChange={(e) => {
                    handleChange(e);
                    setSelectedSchoolId(e.target.value)

                    setFieldValue('departmentId', '') // Reset department when campus changes
                  }}
                  onBlur={handleBlur}
                  value={values.schoolId}
                  className={`w-full h-9 rounded-md border ${errors?.schoolId ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                  disabled={!values.campusId}
                >
                  <option value="">Select School</option>
                  {schools?.schools
                    ?.filter(school => school.campusId === values.campusId)
                    .map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.code} - {school.name}
                      </option>
                    ))}
                </select>
                <FormErrorHandler
                  errors={errors?.schoolId}
                  message={errors?.schoolId}
                />
              </div>

              {/** department */}
              <div>
                <label
                  htmlFor="departmentId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department (if applicable)
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.departmentId || ""}
                  className={`w-full h-9 rounded-md border ${errors?.departmentId ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                  disabled={!values.schoolId}
                >
                  <option value="">Select Department</option>
                  {departments?.departments
                    ?.filter(department => department.schoolId === values.schoolId)
                    .map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.code} - {department.name}
                      </option>
                    ))}
                </select>
                <FormErrorHandler
                  errors={errors?.departmentId}
                  message={errors?.departmentId}
                />
              </div>



              {/** study mode */}
              <div>
                <label htmlFor="studyMode" className="block text-sm font-medium text-gray-700">
                  Study Mode
                </label>
                <select
                  id="studyMode"
                  name="studyMode"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.studyMode}
                  className={`w-full h-9 rounded-md border ${errors?.studyMode ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="">Select Study Mode</option>
                  <option value="fullTime">Full Time</option>
                  <option value="partTime">Part Time</option>
                  <option value="distance">Distance Learning</option>
                </select>
                {errors.studyMode && touched.studyMode && (
                  <div className="text-red-500 text-sm mt-1">{errors.studyMode}</div>
                )}
              </div>

              {/** academic year */}
              <div>
                <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700">
                  Academic Year
                </label>
                <input
                  type="text"
                  id="academicYear"
                  name="academicYear"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.academicYear}
                  className={`w-full h-9 rounded-md border ${errors?.academicYear ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  placeholder="e.g. 2023/2024"
                />
                {errors.academicYear && touched.academicYear && (
                  <div className="text-red-500 text-sm mt-1">{errors.academicYear}</div>
                )}
              </div>

              {/** intake period */}
              <div>
                <label htmlFor="intakePeriod" className="block text-sm font-medium text-gray-700">
                  Intake Period
                </label>
                <select
                  id="intakePeriod"
                  name="intakePeriod"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.intakePeriod}
                  className={`w-full h-9 rounded-md border ${errors?.intakePeriod ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="">Select Intake Period</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
                {errors.intakePeriod && touched.intakePeriod && (
                  <div className="text-red-500 text-sm mt-1">{errors.intakePeriod}</div>
                )}
              </div>

              {/** cohort */}
              <div>
                <label htmlFor="cohort" className="block text-sm font-medium text-gray-700">
                  Cohort (Optional)
                </label>
                <input
                  type="text"
                  id="cohort"
                  name="cohort"
                  list="cohort-options"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.cohort}
                  className={`w-full h-9 rounded-md border ${errors?.cohort ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}
                  placeholder="Select or type a new cohort e.g. 2023"
                />
                <datalist id="cohort-options">
                  {existingCohorts.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {errors.cohort && touched.cohort && (
                  <div className="text-red-500 text-sm mt-1">{errors.cohort}</div>
                )}
              </div>

              {/** completion time */}
              <div>
                <label htmlFor="completionTime" className="block text-sm font-medium text-gray-700">
                  Completion Time (Years)
                </label>
                <input
                  type="number"
                  id="completionTime"
                  name="completionTime"
                  onChange={(e) => {
                    handleChange(e);
                    const years = parseInt(e.target.value);
                    if (!isNaN(years) && values.admissionDate) {
                      const completionDate = addYears(new Date(values.admissionDate), years);
                      setFieldValue('expectedCompletionDate', format(completionDate, 'yyyy-MM-dd'));
                    }
                  }}
                  onBlur={handleBlur}
                  value={values.completionTime}
                  className={`w-full h-9 rounded-md border ${errors?.completionTime ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="Enter years"
                />
                {errors.completionTime && touched.completionTime && (
                  <div className="text-red-500 text-sm mt-1">{errors.completionTime}</div>
                )}
              </div>

              {/** admission date */}
              <div>
                <label htmlFor="admissionDate" className="block text-sm font-medium text-gray-700">
                  Admission Date
                </label>
                <input
                  type="date"
                  id="admissionDate"
                  name="admissionDate"
                  onChange={(e) => {
                    handleChange(e);
                    const date = e.target.value;
                    if (date && values.completionTime) {
                      const completionDate = addYears(new Date(date), parseInt(values.completionTime));
                      setFieldValue('expectedCompletionDate', format(completionDate, 'yyyy-MM-dd'));
                    }
                  }}
                  onBlur={handleBlur}
                  value={values.admissionDate}
                  className={`w-full h-9 rounded-md border ${errors?.admissionDate ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.admissionDate && touched.admissionDate && (
                  <div className="text-red-500 text-sm mt-1">{errors.admissionDate}</div>
                )}
              </div>

              {/** extension years */}
              <div>
                <label htmlFor="extensionYears" className="block text-sm font-medium text-gray-700">
                  Extension Period (Years)
                </label>
                <input
                  type="number"
                  id="extensionYears"
                  name="extensionYears"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.extensionYears}
                  className="w-full h-9 rounded-md border border-gray-200 shadow-sm px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Additional years"
                />
              </div>

              {/** expected completion date */}
              <div>
                <label htmlFor="expectedCompletionDate" className="block text-sm font-medium text-gray-700">
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  id="expectedCompletionDate"
                  name="expectedCompletionDate"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.expectedCompletionDate}
                  className="w-full h-9 rounded-md border border-gray-200 shadow-sm px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

export default StudentCourseApplication;