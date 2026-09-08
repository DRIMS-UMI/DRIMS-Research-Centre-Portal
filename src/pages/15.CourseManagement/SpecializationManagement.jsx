import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiPlus, HiPencil, HiTrash, HiArrowLeft, HiX } from "react-icons/hi";
import { useGetAllSpecializations, useCreateSpecialization, useUpdateSpecialization, useDeleteSpecialization, useGetAllCourses, useGetAllSchools, useGetAllCampuses } from '@/store/tanstackStore/services/queries';
import { toast } from 'sonner';
import { UsageReportModal } from '../5.schools/SchoolTableControlPanel';
import { getAllActivitiesService } from '@/store/tanstackStore/services/api';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { format } from 'date-fns';

const SpecializationModal = ({ isOpen, onClose, specialization, courseId, schoolsData, onSave, isLoading }) => {
  const [form, setForm] = useState({
    name: '',
    code: '',
    duration: '',
    schoolId: '',
    departmentId: '',
  });

  const selectedSchool = useMemo(() => 
    schoolsData?.schools?.find(s => s.id === form.schoolId), 
    [schoolsData, form.schoolId]
  );
  
  const departments = selectedSchool?.departments || [];

  useEffect(() => {
    if (specialization) {
      setForm({
        name: specialization.name || '',
        code: specialization.code || '',
        duration: specialization.duration || '',
        schoolId: specialization.schoolId || '',
        departmentId: specialization.departmentId || '',
      });
    } else {
      setForm({
        name: '',
        code: '',
        duration: '',
        schoolId: '',
        departmentId: '',
      });
    }
  }, [specialization, isOpen]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log('SpecializationModal handleSave called', { form, courseId });
    if (!form.name || !form.schoolId || !form.departmentId) {
      toast.error('Please fill in Name, School and Department.');
      return;
    }

    const data = {
      ...form,
      duration: form.duration ? Number(form.duration) : null,
      courseId,
    };

    if (specialization) {
      onSave({ id: specialization.id, data });
    } else {
      onSave(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{specialization ? 'Edit' : 'Add'} Specialization</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              name="departmentId"
              value={form.departmentId}
              onChange={onChange}
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
              disabled={!form.schoolId}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="e.g. Finance, Marketing"
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code (Optional)</label>
            <input
              name="code"
              value={form.code}
              onChange={onChange}
              placeholder="e.g. FIN"
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
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

          <div className="flex items-center justify-end gap-3 mt-6">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-md bg-[#23388F] text-white hover:bg-[#2d48b8] disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecializationManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [isUsageReportOpen, setIsUsageReportOpen] = useState(false);
  const [auditData, setAuditData] = useState([]);

  const { data: coursesData } = useGetAllCourses();
  const course = useMemo(() => coursesData?.courses?.find(c => c.id === courseId), [coursesData, courseId]);

  const { data: specsData, isLoading: specsLoading, refetch: refetchSpecs } = useGetAllSpecializations({ courseId });
  const { data: schoolsData } = useGetAllSchools();

  const createSpecMutation = useCreateSpecialization();
  const updateSpecMutation = useUpdateSpecialization();
  const deleteSpecMutation = useDeleteSpecialization();

  const handleAdd = () => {
    setSelectedSpec(null);
    setModalOpen(true);
  };

  const handleEdit = (spec) => {
    setSelectedSpec(spec);
    setModalOpen(true);
  };

  const handleSave = (data) => {
    console.log('SpecializationManagement handleSave with data:', data);
    const mutation = selectedSpec ? updateSpecMutation : createSpecMutation;
    mutation.mutate(data, {
      onSuccess: () => {
        toast.success(`Specialization ${selectedSpec ? 'updated' : 'created'} successfully!`);
        setModalOpen(false);
        refetchSpecs();
      },
      onError: (error) => {
        console.error('Save specialization error:', error);
        toast.error(error.message || 'Failed to save specialization.');
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this specialization?')) {
      deleteSpecMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Specialization deleted successfully!');
          refetchSpecs();
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to delete specialization.');
        }
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      const activitiesData = await getAllActivitiesService();
      if (!activitiesData || !activitiesData.activities || activitiesData.activities.length === 0) {
        toast.error('No audit logs available to generate report');
        return;
      }

      // Filter for specialization activities
      const specActivities = activitiesData.activities.filter(a => a.entityType?.toLowerCase() === 'specialization');
      
      if (specActivities.length === 0) {
        toast.error('No specialization-specific audit logs found');
        return;
      }

      const formattedData = specActivities.map(activity => {
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

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-between py-6 px-6 pb-0 w-full h-[88px] border-b border-gray-200">
        <p className="text-sm font-[Inter-Medium] text-gray-900">Research Centre Portal</p>
        <p className="text-sm font-[Inter-Medium] text-gray-600">Digital Research Information Management System</p>
      </div>

      <div className="px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/courses')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <HiArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Course Specializations</h1>
          <p className="text-sm text-gray-500">{course?.code} - {course?.title}</p>
          {course?.directMasters && (
            <p className="text-xs text-purple-700 mt-1">
              Direct Masters{course?.duration ? ` &middot; ${course.duration} ${course.duration === 1 ? 'Year' : 'Years'}` : ''} &middot; {course?.school?.name} &middot; {course?.department?.name}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mx-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-700">Available Specializations</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateReport}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 gap-2"
            >
              <HiOutlineDocumentReport className="w-5 h-5" />
              Generate Usage Report
            </button>
            {!course?.directMasters && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-2 bg-[#23388F] text-white rounded-lg text-sm font-medium hover:bg-[#2d48b8] gap-2"
              >
                <HiPlus className="w-5 h-5" />
                Add Specialization
              </button>
            )}
          </div>
        </div>

        {course?.directMasters && (
          <div className="mb-6 p-4 rounded-lg border border-purple-200 bg-purple-50 text-sm text-purple-700">
            This is a direct masters course. School and department are set at the course level, so no specializations are used.
          </div>
        )}

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left text-gray-600 text-xs border-b bg-gray-50">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Specialization Name</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {specsLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Loading specializations...</td></tr>
              ) : (specsData?.specializations || []).map((s) => (
                <tr key={s.id} className="text-sm text-gray-900 border-b last:border-b-0">
                  <td className="px-4 py-4">{s.code || 'N/A'}</td>
                  <td className="px-4 py-4 font-medium">{s.name}</td>
                  <td className="px-4 py-4 text-gray-600">
                    {s.duration ? `${s.duration} ${s.duration === 1 ? 'Year' : 'Years'}` : 'Not specified'}
                  </td>
                  <td className="px-4 py-4">{s.school?.name}</td>
                  <td className="px-4 py-4">{s.department?.name}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!specsLoading && specsData?.specializations?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No specializations found for this course.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SpecializationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        specialization={selectedSpec}
        courseId={courseId}
        schoolsData={schoolsData}
        onSave={handleSave}
        isLoading={createSpecMutation.isPending || updateSpecMutation.isPending}
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
          link.setAttribute('download', `UMI_Specialization_Audits_${format(new Date(), 'yyyy-MM-dd')}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Audit usage report downloaded successfully');
        }}
      />
    </div>
  );
};

export default SpecializationManagement;
