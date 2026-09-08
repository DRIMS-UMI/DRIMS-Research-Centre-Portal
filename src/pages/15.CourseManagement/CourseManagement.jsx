import React, { useMemo, useState, useEffect } from 'react';
import { format } from "date-fns";
import { HiPlus, HiPencil, HiTrash, HiX, HiExternalLink } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useGetAllCourses, useGetAllCampuses, useGetAllSchools, useUpdateCourse, useDeleteCourse } from '@/store/tanstackStore/services/queries';
import { toast } from 'sonner';
import { UsageReportModal } from '../5.schools/SchoolTableControlPanel';
import { getAllActivitiesService } from '@/store/tanstackStore/services/api';
import { HiOutlineDocumentReport } from 'react-icons/hi';


const StatCard = ({ value, label, highlight }) => {
  return (
    <div className={`flex-1 bg-white rounded-lg border ${highlight ? 'border-gray-200' : 'border-gray-200'} p-6`}>
      <div className="text-3xl font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
};

const CampusTabs = ({ courses, selectedCampus, setSelectedCampus, campusesData }) => {
  const counts = useMemo(() => {
    const map = {};
    courses.forEach(c => {
      const campusName = c.campus?.name || 'Unknown';
      map[campusName] = (map[campusName] || 0) + 1;
    });
    return map;
  }, [courses]);

  const campuses = useMemo(() => {
    if (campusesData?.campuses) {
      return campusesData.campuses.map(c => c.name).sort();
    }
    return Object.keys(counts).sort();
  }, [campusesData?.campuses, counts]);

  return (
    <div className="px-1">
      <div className="flex items-center gap-6 border-b border-gray-200">
        {campuses.map(c => {
          const active = selectedCampus === c;
          return (
            <button
              key={c}
              onClick={() => setSelectedCampus(c)}
              className={`relative py-3 text-sm ${active ? 'text-[#23388F] font-medium' : 'text-gray-600'}`}
            >
              {c} <span className="ml-1 text-gray-400">{counts[c]}</span>
              {active && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[#23388F]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SearchBox = ({ value, onChange }) => {
  return (
    <div className="flex-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by Code, or Title"
        className="w-full h-10 px-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#23388F] text-sm"
      />
    </div>
  );
};

const PageSize = ({ pageSize, setPageSize }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Show:</span>
      <select
        value={pageSize}
        onChange={(e) => setPageSize(parseInt(e.target.value))}
        className="h-10 px-3 rounded-md border border-gray-300 text-sm"
      >
        {[10, 20, 30, 50].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
};

const Table = ({ data, isLoading, onEdit, onDelete }) => {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="text-left text-gray-600 text-xs border-b">
              <th className="px-4 py-3">Crs. Code</th>
              <th className="px-4 py-3">Course Title</th>
              <th className="px-4 py-3">Campus</th>
              <th className="px-4 py-3">Direct Masters</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Specializations</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                Loading courses...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-left text-gray-600 text-xs border-b">
            <th className="px-4 py-3">Crs. Code</th>
            <th className="px-4 py-3">Course Title</th>
            <th className="px-4 py-3">Campus</th>
            <th className="px-4 py-3">Direct Masters</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Specializations</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="text-sm text-gray-900 border-b last:border-b-0">
              <td className="px-4 py-4">{c.code}</td>
              <td className="px-4 py-4">{c.title}</td>
              <td className="px-4 py-4">{c.campus?.name || 'Unknown'}</td>
              <td className="px-4 py-4">
                {c.directMasters ? (
                  <span className="px-2 py-0.5 text-xs rounded border border-purple-200 bg-purple-50 text-purple-700">
                    Yes
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs rounded border border-gray-200 bg-gray-50 text-gray-500">
                    No
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-gray-600">
                {c.duration ? `${c.duration} ${c.duration === 1 ? 'Year' : 'Years'}` : '—'}
              </td>
              <td className="px-4 py-4">
                <span className="text-xs text-gray-500">
                  {c.specializations?.length || 0} specializations
                </span>
              </td>
              <td className="px-4 py-4">
                <span className={`px-2 py-0.5 text-xs rounded border ${c.isActive
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
                  }`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {!c.directMasters && (
                    <button
                      onClick={() => navigate(`/courses/specializations/${c.id}`)}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                    >
                      Specializations
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(c)}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                No courses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const Pagination = ({ totalItems, pageSize, currentPage, setCurrentPage }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const go = (p) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-xs text-gray-500">Showing {Math.min(pageSize, totalItems - (currentPage - 1) * pageSize)} of {totalItems} Results</p>
      <div className="flex items-center gap-2">
        <button disabled={!canPrev} onClick={() => go(currentPage - 1)} className={`px-3 py-1.5 text-sm rounded border ${canPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Previous</button>
        <span className="text-sm text-gray-600">{currentPage}</span>
        <button disabled={!canNext} onClick={() => go(currentPage + 1)} className={`px-3 py-1.5 text-sm rounded border ${canNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Next</button>
      </div>
    </div>
  );
};

const EditCourseModal = ({ isOpen, onClose, course, schoolsData, campusesData, onSave, isLoading }) => {
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

  // Initialize form when course changes
  useEffect(() => {
    if (course) {
      setForm({
        campusId: course.campus?.id || '',
        code: course.code || '',
        title: course.title || '',
        description: course.description || '',
        directMasters: !!course.directMasters,
        schoolId: course.schoolId || '',
        departmentId: course.departmentId || '',
        duration: course.duration || '',
      });
    }
  }, [course]);



  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'schoolId' ? { departmentId: '' } : {}),
    }));
  };

  const handleSave = () => {
    if (!form.campusId || !form.code || !form.title) {
      toast.error('Please fill in Campus, Course Code and Course Title.');
      return;
    }

    if (form.directMasters && (!form.schoolId || !form.departmentId)) {
      toast.error('Please fill in School and Department for direct masters course.');
      return;
    }

    const courseData = {
      id: course.id,
      code: form.code,
      title: form.title,
      description: form.description || null,
      campusId: form.campusId,
      directMasters: form.directMasters,
      schoolId: form.directMasters ? form.schoolId : null,
      departmentId: form.directMasters ? form.departmentId : null,
      duration: form.duration ? Number(form.duration) : null,
    };

    onSave(courseData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Edit Course</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-md bg-[#23388F] text-white hover:bg-[#2d48b8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteCourseModal = ({ isOpen, onClose, course, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Delete Course</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <HiTrash className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Are you sure?</h3>
              <p className="text-sm text-gray-600 mb-4">
                You are about to delete the course <strong>"{course?.title}"</strong> ({course?.code}).
                This action cannot be undone.
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <strong>Course Details:</strong><br />
                Campus: {course?.campus?.name || 'Unknown'}<br />
                Specializations: {course?.specializations?.length || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(course)}
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem("courses_pageSize")) || 10);
  const [currentPage, setCurrentPage] = useState(parseInt(localStorage.getItem("courses_currentPage")) || 1);

  // Modal state management
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isUsageReportOpen, setIsUsageReportOpen] = useState(false);
  const [auditData, setAuditData] = useState([]);

  // API queries
  const { data: schoolsData } = useGetAllSchools();
  const { data: campusesData } = useGetAllCampuses();
  const { data: coursesData, isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useGetAllCourses({
    page: currentPage,
    limit: pageSize,
    isActive: true, // Only show active courses by default
  });

  // Mutations
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  // Handler functions for edit and delete actions
  const handleEdit = (course) => {
    setSelectedCourse(course);
    setEditModalOpen(true);
  };

  const handleDelete = (course) => {
    setSelectedCourse(course);
    setDeleteModalOpen(true);
  };

  const handleEditSave = (courseData) => {
    console.log('handleEditSave called with:', courseData);
    const { id, ...data } = courseData;
    updateCourseMutation.mutate({ id, data }, {
      onSuccess: () => {
        toast.success('Course updated successfully!');
        setEditModalOpen(false);
        setSelectedCourse(null);
        refetchCourses();
      },
      onError: (error) => {
        console.error('Update course error:', error);
        toast.error(error.message || 'Failed to update course. Please try again.');
      },
    });
  };

  const handleDeleteConfirm = (course) => {
    deleteCourseMutation.mutate(course.id, {
      onSuccess: () => {
        toast.success('Course deleted successfully!');
        setDeleteModalOpen(false);
        setSelectedCourse(null);
        refetchCourses();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete course. Please try again.');
      },
    });
  };

  const closeModals = () => {
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedCourse(null);
  };

  const handleGenerateReport = async () => {
    try {
      const activitiesData = await getAllActivitiesService();
      if (!activitiesData || !activitiesData.activities || activitiesData.activities.length === 0) {
        toast.error('No audit logs available to generate report');
        return;
      }

      // Filter for course activities
      const courseActivities = activitiesData.activities.filter(a => a.entityType?.toLowerCase() === 'course');
      
      if (courseActivities.length === 0) {
        toast.error('No course-specific audit logs found');
        return;
      }

      const formattedData = courseActivities.map(activity => {
        let browserAgent = activity.browserAgent || 'Web Browser';
        try {
          if (activity.details && activity.details.startsWith('{')) {
            const parsed = JSON.parse(activity.details);
            if (parsed.browserAgent) browserAgent = parsed.browserAgent;
            if (parsed.userAgent) browserAgent = parsed.userAgent;
          }
        } catch (e) {}

        return {
          user: activity.user?.name || 'Unknown User',
          role: activity.user?.role || 'N/A',
          action: activity.action,
          date: format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          browserAgent,
          ipAddress: activity.ipAddress || 'Unknown',
          deviceId: activity.deviceId || 'Unknown',
          details: activity.details || null,
        };
      });

      setAuditData(formattedData);
      setIsUsageReportOpen(true);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
      console.error(error);
    }
  };

  // Set default campus when campuses data loads
  useEffect(() => {
    if (campusesData?.campuses?.length > 0 && !selectedCampus) {
      setSelectedCampus(campusesData.campuses[0].name);
    }
  }, [campusesData?.campuses, selectedCampus]);

  // Persist pagination state
  useEffect(() => {
    localStorage.setItem("courses_pageSize", pageSize);
    localStorage.setItem("courses_currentPage", currentPage);
  }, [pageSize, currentPage]);

  // Get courses and stats
  const courses = coursesData?.courses || [];
  const pagination = coursesData?.pagination || {};

  // Stats
  const allCoursesCount = pagination.totalCount || 0;
  const activeCoursesCount = courses.filter(c => c.isActive).length;
  const availableThisSemesterCount = courses.length; // Assuming all fetched courses are available

  // Filtered by campus + search
  const filtered = useMemo(() => {
    let filteredCourses = courses;

    // Filter by campus if selected
    if (selectedCampus) {
      filteredCourses = courses.filter(c => c.campus?.name === selectedCampus);
    }

    // Filter by search term
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filteredCourses = filteredCourses.filter(c =>
        c.code.toLowerCase().includes(term) ||
        c.title.toLowerCase().includes(term)
      );
    }

    return filteredCourses;
  }, [courses, selectedCampus, searchTerm]);

  return (
    <div className="mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-6 px-6 pb-0 w-full h-[88px] border-b border-gray-200">
        <p className="text-sm font-[Inter-Medium] text-gray-900">Research Centre Portal</p>
        <p className="text-sm font-[Inter-Medium] text-gray-600">Digital Research Information Management System</p>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3">
        <h1 className="text-2xl font-semibold text-gray-800">Courses</h1>
        <span className="text-sm text-gray-500">Last login: {format(new Date(), "MM-dd-yyyy hh:mm:ssaa")}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
        <StatCard value={allCoursesCount} label="All Courses" />
        <StatCard value={activeCoursesCount} label="Active Courses" highlight />
        <StatCard value={availableThisSemesterCount} label="Available This Semester" />
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg shadow-md mx-6 mb-8">
        {/* Tabs */}
        <CampusTabs
          courses={courses}
          selectedCampus={selectedCampus}
          setSelectedCampus={setSelectedCampus}
          campusesData={campusesData}
        />

        {/* Controls */}
        <div className="flex justify-between items-center my-4">
          <SearchBox value={searchTerm} onChange={setSearchTerm} />
          <div className="flex items-center gap-3">
            <PageSize pageSize={pageSize} setPageSize={setPageSize} />
            <button
              onClick={handleGenerateReport}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 gap-2"
            >
              <HiOutlineDocumentReport className="w-5 h-5" />
              Generate Usage Report
            </button>
            <button
              onClick={() => navigate("/courses/add")}
              className="inline-flex items-center px-4 py-2 bg-[#23388F] text-white rounded-lg text-sm font-medium hover:bg-[#2d48b8] gap-2"
            >
              <HiPlus className="w-5 h-5" />
              Add Course
            </button>
          </div>
        </div>

        {/* Table */}
        <Table
          data={filtered}
          isLoading={coursesLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        <Pagination
          totalItems={pagination.totalCount || filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Modals */}
      <EditCourseModal
        isOpen={editModalOpen}
        onClose={closeModals}
        course={selectedCourse}
        schoolsData={schoolsData}
        campusesData={campusesData}
        onSave={handleEditSave}
        isLoading={updateCourseMutation.isPending}
      />

      <DeleteCourseModal
        isOpen={deleteModalOpen}
        onClose={closeModals}
        course={selectedCourse}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteCourseMutation.isPending}
      />

      <UsageReportModal
        isOpen={isUsageReportOpen}
        onClose={() => setIsUsageReportOpen(false)}
        auditData={auditData}
        onDownloadCsv={() => {
          if (!auditData || auditData.length === 0) return;
          
          const headers = ['User', 'Role', 'Action', 'Date', 'Browser Agent', 'IP Address', 'Device ID'];
          const csvContent = [
            headers.join(','),
            ...auditData.map(row => 
              [row.user, row.role, row.action, row.date, row.browserAgent, row.ipAddress, row.deviceId]
                .map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`)
                .join(',')
            )
          ].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `UMI_Course_Management_Audits_${format(new Date(), 'yyyy-MM-dd')}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Audit usage report downloaded successfully');
        }}
      />
    </div>
  );
};

export default CourseManagement;