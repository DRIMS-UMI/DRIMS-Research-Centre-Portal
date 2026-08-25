import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../utils/tanstack';
import apiRequest from '../../../utils/apiRequestUrl';
import { getAllBooksService, getAllCampusesService, getAllDepartmentsService, getAllExaminersService, getAllFacultyService, getAllProposalsService, getAllSchoolsService, getAllStatusDefinitionsService, getAllStudentsService, getAllSupervisorsService, getAllUsersService, getAssignedStudentsService, getBookService, getCampusService, getDepartmentService, getExaminerService, getFacultyService, getLoggedInUserDetails, getPanelistsService, getProposalService, getReviewersService, getSchoolService, getStatusDefinitionService, getStudentBooksService, getStudentProposalsService, getStudentService, getStudentStatusesService, getSupervisorService, getUserService, getAllPanelistsService, getBookVivasService, getDashboardStatsService, getStatusStatisticsService, getProgressTrendsService, getNotificationsService, getProposalDefensesService, getGraduationStatisticsService, getChairpersonsService, getExternalPersonsService,  getAllResearchRequestsService, updateResearchRequestService, getEvaluationAnalyticsService, getDetailedEvaluationsService, createResearchClinicDayService, getAllResearchClinicDaysService, updateResearchClinicDayService, generateRecurringSessionsService, getResearchClinicBookingsService, updateBookingStatusService, getResearchClinicStatisticsService, deleteResearchClinicDayService, getReallocationStatisticsService, createCourseService, getAllCoursesService, updateCourseService, deleteCourseService, createSpecializationService, getAllSpecializationsService, updateSpecializationService, deleteSpecializationService, uploadStudentsService, getAllActivitiesService, getOverdueDocumentsService } from './api';

export const useGetLoggedInUserDetails = () => {
  return useQuery({
    queryKey: ['loggedInUser'],
    queryFn: getLoggedInUserDetails,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetAllCampuses = () => {
  return useQuery({
    queryKey: ['campuses'],
    queryFn: getAllCampusesService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetCampus = (id: string) => {
  return useQuery({
    queryKey: ['campus', id],
    queryFn: () => getCampusService(id),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};

/* ********** DEPARTMENTS ********** */
export const useGetAllDepartments = (schoolId: string) => {
  return useQuery({
    queryKey: ['departments', schoolId],
    queryFn: () => getAllDepartmentsService(schoolId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!schoolId
  });
};

export const useGetDepartment = (schoolId: string, departmentId: string) => {
  return useQuery({
    queryKey: ['department', schoolId, departmentId], 
    queryFn: () => getDepartmentService(schoolId, departmentId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!schoolId && !!departmentId
  });
};

/* ********** SCHOOLS ********** */
export const useGetAllSchools = () => {
  return useQuery({
    queryKey: ['schools'],
    queryFn: getAllSchoolsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetSchool = (id: string) => {
  return useQuery({
    queryKey: ['school', id],
    queryFn: () => getSchoolService(id),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};

/* ********** FACULTY ********** */
export const useGetAllFaculty = () => {
  return useQuery({
    queryKey: ['faculty'],
    queryFn: getAllFacultyService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetFaculty = (id: string) => {
  return useQuery({
    queryKey: ['faculty', id],
    queryFn: () => getFacultyService(id),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};

/* ********** SUPERVISOR ********** */
export const useGetAllSupervisors = () => {
  return useQuery({
    queryKey: ['supervisors'],
    queryFn: getAllSupervisorsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetSupervisor = (id: string) => {
  return useQuery({
    queryKey: ['supervisor', id],
    queryFn: () => getSupervisorService(id),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};

export const useGetAssignedStudents = (supervisorId: string) => {
  return useQuery({
    queryKey: ['assignedStudents', supervisorId],
    queryFn: () => getAssignedStudentsService(supervisorId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!supervisorId
  });
};





/* ********** STUDENT ********** */
export const useGetAllStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: getAllStudentsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetStudent = (id: string) => {
  return useQuery({
    queryKey: ['student', id], 
    queryFn: () => getStudentService(id),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};

export const useGetStudentStatuses = (studentId: string) => {
  return useQuery({
    queryKey: ['studentStatuses', studentId],
    queryFn: () => getStudentStatusesService(studentId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!studentId
  });
};

export const useUploadStudents = () => {
  return useMutation({
    mutationFn: uploadStudentsService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};



/* ********** STATUS ********** */
export const useGetAllStatusDefinitions = () => {
  return useQuery({
    queryKey: ['statusDefinitions'],
    queryFn: getAllStatusDefinitionsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetStatusDefinition = (id: string) => {
  return useQuery({
    queryKey: ['statusDefinition', id],
    queryFn: () => getStatusDefinitionService(id), 
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};



/* ********** PROPOSAL ********** */
export const useGetAllProposals = () => {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: getAllProposalsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetProposal = (id: string) => {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: () => getProposalService(id),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};

export const useGetStudentProposals = (studentId: string) => {
  return useQuery({
    queryKey: ['studentProposals', studentId],
    queryFn: () => getStudentProposalsService(studentId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!studentId
  });
};



/* ********** REVIEWER MANAGEMENT ********** */

export function useGetReviewers() {
  return useQuery({
    queryKey: ['reviewers'],
      queryFn: getReviewersService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    networkMode: 'online',
  });
}

/* ********** END OF REVIEWER MANAGEMENT ********** */

/* ********** PANELIST MANAGEMENT ********** */

export function useGetPanelists() {
  return useQuery({
    queryKey: ['panelists'],
    queryFn: getPanelistsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    networkMode: 'online',
  });
}

/* ********** END OF PANELIST MANAGEMENT ********** */  

/* ********** CHAIRPERSON MANAGEMENT ********** */

export function useGetChairpersons() {
  return useQuery({
    queryKey: ['chairpersons'],
    queryFn: getChairpersonsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    networkMode: 'online',
  });
}

/* ********** END OF CHAIRPERSON MANAGEMENT ********** */

/* ********** EXTERNAL PERSONS MANAGEMENT ********** */
export const useGetExternalPersons = () => {
  return useQuery({
    queryKey: ['externalPersons'],
    queryFn: getExternalPersonsService,
    staleTime: 300000, // 5 minutes
    refetchInterval: false,
    retry: 1,
  });
};

/* ********** STUDENT BOOK MANAGEMENT ********** */

export const useGetStudentBooks = (studentId: string) => {
  return useQuery({
    queryKey: ['studentBooks', studentId],
    queryFn: () => getStudentBooksService(studentId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!studentId
  });
};

/* ********** END OF STUDENT BOOK MANAGEMENT ********** */

/* ********** GRADE BOOK MANAGEMENT ********** */

export const useGetAllBooks = () => {
  return useQuery({
    queryKey: ['books'],
    queryFn: getAllBooksService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetBook = (bookId: string) => {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBookService(bookId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!bookId
  });
};

/* ********** END OF GRADE BOOK MANAGEMENT ********** */

/* ********** EXAMINER MANAGEMENT ********** */

export const useGetAllExaminers = () => {
  return useQuery({
    queryKey: ['examiners'],
      queryFn: getAllExaminersService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetExaminer = (id: string) => {
  return useQuery({
    queryKey: ['examiner', id],
    queryFn: () => getExaminerService(id),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!id
  });
};

  /* ********** END OF EXAMINER MANAGEMENT ********** */  

/* ********** USER MANAGEMENT ********** */

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: getAllUsersService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};  

export const useGetUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserService(userId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!userId
  });
};  
/* ********** END OF USER MANAGEMENT ********** */

/* ********** VIVA MANAGEMENT ********** */

export const useGetAllPanelists = () => {
  return useQuery({
    queryKey: ['panelists'],
    queryFn: getAllPanelistsService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

export const useGetBookVivas = (bookId: string) => {
  return useQuery({
    queryKey: ['bookVivas', bookId],
    queryFn: () => getBookVivasService(bookId),
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
    enabled: !!bookId
  });
};
/* ********** END OF VIVA MANAGEMENT ********** */

/* ********** DASHBOARD MANAGEMENT ********** */

export const useGetDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStatsService,
    staleTime: 300000, // 5 minutes
    refetchInterval: false,
    retry: 1,
  });
};

export const useGetStatusStatistics = (category?: string) => {
  return useQuery({
    queryKey: ['statusStatistics', category],
    queryFn: () => getStatusStatisticsService(category),
    staleTime: 300000, // 5 minutes
    refetchInterval: false,
    retry: 1,
  });
};

export const useGetProgressTrends = (timeRange: string) => {
  return useQuery({
    queryKey: ['progressTrends', timeRange],
    queryFn: () => getProgressTrendsService(timeRange),
    staleTime: 300000, // 5 minutes
    refetchInterval: false,
    retry: 1,
  });
};
/* ********** END OF DASHBOARD MANAGEMENT ********** */

/* ********** NOTIFICATION MANAGEMENT ********** */

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotificationsService,
    staleTime: 300000, // 5 minutes
    refetchInterval: false,
    retry: 1,
  });
};
/* ********** END OF NOTIFICATION MANAGEMENT ********** */

/* ********** PROPOSAL DEFENSE MANAGEMENT ********** */

export const useGetProposalDefenses = () => {
  return useQuery({
    queryKey: ['proposalDefenses'],
    queryFn: getProposalDefensesService,
    staleTime: Infinity, // 1 minute
    refetchInterval: false,
  });
};

// export const useGetProposalDefenseReports = (proposalId: string) => {
//   return useQuery({
//     queryKey: ['proposalDefenseReports', proposalId],
//     queryFn: () => getProposalDefenseReportsService(proposalId),
//     staleTime: 300000, // 5 minutes
//     refetchInterval: false,
//     retry: 1,
//   });
// }; 


/* ********** END OF PROPOSAL DEFENSE MANAGEMENT ********** */

/* ********** GRADUATION MANAGEMENT ********** */

export const useGetGraduationStatistics = () => {
  return useQuery({
    queryKey: ['graduationStatistics'],
    queryFn: getGraduationStatisticsService,
    staleTime: Infinity,
    refetchInterval: false,
  });
};


/* ********** RESEARCH REQUEST MANAGEMENT ********** */

export const useGetAllResearchRequests = () => {
  return useQuery({
    queryKey: ['managementResearchRequests'],
    queryFn: getAllResearchRequestsService,
    staleTime: 0,
    refetchInterval: false,
  });
};

export const useUpdateResearchRequest = (options = {}) => {
  console.log("options", options)
  return useMutation({
    mutationFn: updateResearchRequestService,
    ...options,
  });
};
/* ********** END OF RESEARCH REQUEST MANAGEMENT ********** */

/* ********** EVALUATION ANALYTICS ********** */

export const useGetEvaluationAnalytics = () => {
  return useQuery({
    queryKey: ['evaluationAnalytics'],
    queryFn: getEvaluationAnalyticsService,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: false,
  });
};

export const useGetDetailedEvaluations = (params = {}) => {
  return useQuery({
    queryKey: ['detailedEvaluations', params],
    queryFn: () => getDetailedEvaluationsService(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: false,
  });
};

/* ********** END OF EVALUATION ANALYTICS ********** */

/* ********** STAFF MEMBERS ********** */
export const useGetStaffMembers = (searchTerm = '', statusFilter = '', isExternal?: boolean, schoolId?: string, departmentId?: string, campusId?: string) => {
  return useQuery({
    queryKey: ['staffMembers', searchTerm, statusFilter, isExternal, schoolId, departmentId, campusId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('isActive', statusFilter);
      if (isExternal !== undefined) params.append('isExternal', isExternal.toString());
      if (schoolId) params.append('schoolId', schoolId);
      if (departmentId) params.append('departmentId', departmentId);
      if (campusId) params.append('campusId', campusId);

      const response = await apiRequest.get(`/management/staff?${params.toString()}`);
      return response.data.staffMembers;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGetStaffMember = (id: string) => {
  return useQuery({
    queryKey: ['staffMember', id],
    queryFn: async () => {
      const response = await apiRequest.get(`/management/staff/${id}`);
      return response.data.staffMember;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetStaffMembersByRole = (role: string) => {
  return useQuery({
    queryKey: ['staffMembersByRole', role],
    queryFn: async () => {
      const response = await apiRequest.get(`/management/staff/role/${role}`);
      return response.data.staffMembers;
    },
    enabled: !!role,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateStaffMember = () => {
  return useMutation({
    mutationFn: async (staffData: any) => {
      const response = await apiRequest.post('/management/staff', staffData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
    },
  });
};

export const useUpdateStaffMember = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest.put(`/management/staff/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
      queryClient.invalidateQueries({ queryKey: ['staffMember', variables.id] });
    },
  });
};

export const useDeleteStaffMember = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest.delete(`/management/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
    },
  });
};

export const useGetStaffMembersForSupervisor = () => {
  return useQuery({
    queryKey: ['staffMembersForSupervisor'],
    queryFn: async () => {
      const response = await apiRequest.get('/management/staff/for-supervisor');
      return response.data.staffMembers;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGetStaffMembersWithoutSupervisor = () => {
  return useQuery({
    queryKey: ['staffMembersWithoutSupervisor'],
    queryFn: async () => {
      const response = await apiRequest.get('/management/staff/without-supervisor');
      return response.data.staffMembers;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/* ********** RESEARCH CLINIC ********** */

export const useGetAllResearchClinicDays = () => {
  return useQuery({
    queryKey: ['researchClinicDays'],
    queryFn: getAllResearchClinicDaysService,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
};

export const useGetResearchClinicBookings = () => {
  return useQuery({
    queryKey: ['researchClinicBookings'],
    queryFn: getResearchClinicBookingsService,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
};

export const useGetResearchClinicStatistics = () => {
  return useQuery({
    queryKey: ['researchClinicStatistics'],
    queryFn: getResearchClinicStatisticsService,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
};

export const useCreateResearchClinicDay = () => {
  return useMutation({
    mutationFn: createResearchClinicDayService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchClinicDays'] });
    },
  });
};

export const useUpdateResearchClinicDay = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return updateResearchClinicDayService(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchClinicDays'] });
    },
  });
};

export const useGenerateRecurringSessions = () => {
  return useMutation({
    mutationFn: generateRecurringSessionsService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchClinicDays'] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  return useMutation({
    mutationFn: async ({ bookingId, data }: { bookingId: string; data: any }) => {
      return updateBookingStatusService(bookingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchClinicBookings'] });
    },
  });
};

export const useDeleteResearchClinicDay = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteResearchClinicDayService(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchClinicDays'] });
    },
  });
};

export const useGetReallocationStatistics = (params?: { startDate?: string, endDate?: string, supervisorId?: string }) => {
    return useQuery({
        queryKey: ['reallocationStatistics', params],
        queryFn: () => getReallocationStatisticsService(params),
        enabled: true
    });
};

/* ********** COURSE MANAGEMENT ********** */

export const useGetAllCourses = (params?: { campusId?: string, schoolId?: string, isActive?: boolean, page?: number, limit?: number }) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => getAllCoursesService(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
};

export const useCreateCourse = () => {
  return useMutation({
    mutationFn: createCourseService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return updateCourseService(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      return deleteCourseService(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/* ********** SPECIALIZATION MANAGEMENT ********** */

export const useGetAllSpecializations = (params?: { courseId?: string, schoolId?: string, departmentId?: string, isActive?: boolean }) => {
  return useQuery({
    queryKey: ['specializations', params],
    queryFn: () => getAllSpecializationsService(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
};

export const useCreateSpecialization = () => {
  return useMutation({
    mutationFn: createSpecializationService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
  });
};

export const useUpdateSpecialization = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return updateSpecializationService(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
  });
};

export const useDeleteSpecialization = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      return deleteSpecializationService(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
  });
};

/* ********** ACTIVITY LOGS ********** */
export const useGetAllActivities = () => {
    return useQuery({
        queryKey: ['activities'],
        queryFn: getAllActivitiesService,
        staleTime: 30000, // 30 seconds
    });
};

/* ********** OVERDUE DOCUMENTS ********** */
export const useGetOverdueDocuments = () => {
  return useQuery({
    queryKey: ['overdue-documents'],
    queryFn: getOverdueDocumentsService,
    staleTime: 60000,
  });
};
