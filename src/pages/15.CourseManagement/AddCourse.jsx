import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllSchools, useGetAllCampuses, useCreateCourse } from '@/store/tanstackStore/services/queries';
import { toast } from 'sonner';

const StepHeader = () => {
  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <div className="h-[2px] bg-[#CDAA4C]" />
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700">Step 1</p>
          <p className="text-xs text-gray-500">Course Information</p>
        </div>
      </div>
    </div>
  );
};

const AddCourse = () => {
  const navigate = useNavigate();
  const { data: campusesData } = useGetAllCampuses();
  const { data: schoolsData } = useGetAllSchools();
  const createCourseMutation = useCreateCourse();
  const [form, setForm] = useState({
    campusId: '',
    code: '',
    title: '',
    description: '',
    directMasters: false,
    schoolId: '',
    departmentId: '',
    duration: '',
  });

  const selectedSchool = useMemo(() =>
    schoolsData?.schools?.find(s => s.id === form.schoolId),
    [schoolsData, form.schoolId]
  );

  const departments = selectedSchool?.departments || [];

  // Set sensible defaults when data arrives
  useEffect(() => {
    if (!form.campusId && campusesData?.campuses?.length > 0) {
      setForm((prev) => ({ ...prev, campusId: campusesData.campuses[0].id }));
    }
  }, [campusesData?.campuses]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'schoolId' ? { departmentId: '' } : {}),
    }));
  };

  const onCancel = () => navigate('/courses');

  const onSave = () => {
    // Minimal client validation
    if (!form.campusId || !form.code || !form.title) {
      toast.error('Please fill in Campus, Course Code and Course Title.');
      return;
    }

    // For direct masters courses, school and department are required
    if (form.directMasters && (!form.schoolId || !form.departmentId)) {
      toast.error('Please fill in School and Department for direct masters course.');
      return;
    }

    // Prepare course data for API
    const courseData = {
      code: form.code,
      title: form.title,
      description: form.description || null,
      campusId: form.campusId,
      directMasters: form.directMasters,
      schoolId: form.directMasters ? form.schoolId : null,
      departmentId: form.directMasters ? form.departmentId : null,
      duration: form.duration ? Number(form.duration) : null,
    };

    // Create course using mutation
    createCourseMutation.mutate(courseData, {
      onSuccess: (data) => {
        toast.success('Course created successfully!');
        navigate('/courses');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create course. Please try again.');
      },
    });
  };

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-between py-6 px-6 pb-0 w-full h-[88px] border-b border-gray-200">
        <p className="text-sm font-[Inter-Medium] text-gray-900">Research Centre Portal</p>
        <p className="text-sm font-[Inter-Medium] text-gray-600">Digital Research Information Management System</p>
      </div>

      <div className="px-6 py-3">
        <h1 className="text-2xl font-semibold text-gray-800">Add Course Manually</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mx-6 mb-8">
        <StepHeader />

        {/* Form */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
            <select
              name="campusId"
              value={form.campusId}
              onChange={onChange}
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
            >
              {(campusesData?.campuses || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Course Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
            <input
              name="code"
              value={form.code}
              onChange={onChange}
              placeholder="Enter course code"
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
            />
          </div>

          {/* Course Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Enter course title"
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
            />
          </div>

          {/* Course Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Course Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={6}
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm resize-y"
            />
          </div>

          {/* Direct Masters */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="directMasters"
                checked={form.directMasters}
                onChange={onChange}
                className="w-4 h-4 text-[#23388F] border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Direct Masters (school and department are set at the course level, no specializations)
              </span>
            </label>
          </div>

          {/* School & Department - shown only for direct masters courses */}
          {form.directMasters && (
            <>
              {/* School */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                <select
                  name="schoolId"
                  value={form.schoolId}
                  onChange={onChange}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
                >
                  <option value="">Select School</option>
                  {(schoolsData?.schools || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={onChange}
                  disabled={!form.schoolId}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Years)</label>
                <input
                  type="number"
                  name="duration"
                  value={form.duration}
                  onChange={onChange}
                  placeholder="e.g. 1, 2"
                  min="1"
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <button 
            onClick={onCancel} 
            disabled={createCourseMutation.isPending}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            onClick={onSave} 
            disabled={createCourseMutation.isPending}
            className="px-4 py-2 text-sm rounded-md bg-[#23388F] text-white hover:bg-[#2d48b8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createCourseMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;