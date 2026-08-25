import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ROUTES } from "./config/routes";
import { AuthProvider, useAuth } from "./store/context/AuthContext";
import MainLayout from "./components/Layout/MainLayout";

// Auth Pages
import LoginPage from "./pages/0.auth/LoginPage";
import RequestPasswordReset from "./pages/0.auth/RequestPasswordReset";

// Dashboard
import Dashboard from "./pages/1.dashboard/Dashboard";

// Student Management
import StudentsManagement from "./pages/2.student/StudentsManagement";
import StudentProfile from "./pages/2.student/StudentProfile";

// Grade Management
import GradeManagement from "./pages/3.GradeManagement/GradeManagement";

// Faculty Management
import Faculty from "./pages/4.faculty/FacultyManagement"
import AddFaculty from "./pages/4.faculty/AddFaculty";
import FacultyProfile from "./pages/4.faculty/FacultyProfile";

// Schools Management
import SchoolManagement from "./pages/5.schools/SchoolManagement";
import AddSchool from "./pages/5.schools/AddSchool";

// Status Management
import StatusManagement from "./pages/8.statuses/StatusManagement";

// Other Pages
import NotificationsManagement from "./pages/6.notifications/NotificationsManagement";

import TableBuilder from "./pages/tables";
// PWA Component
import PWAInstaller from "./components/PWAInstaller";
import PWAUpdateToast from "./components/PWAUpdateToast";
import Settings from "./pages/settings";
import EditSchool from "./pages/5.schools/EditSchool";
import RegisterSuperAdmin from "./pages/0.auth/RegisterSuperAdmin";
import AddStudent from "./pages/2.student/AddStudent";
import AddSupervisor from "./pages/4.faculty/AddSupervisor";
import SupervisorProfile from "./pages/4.faculty/SupervisorProfile";
import AssignStudents from "./pages/4.faculty/AssignStudents";
import GradeProposal from "./pages/3.GradeManagement/GradeProposal";
import StudentSubmitBook from "./pages/2.student/StudentSubmitBook";
import GradeBook from "./pages/3.GradeManagement/GradeBook";
import GradeBookAddExternalExaminer from "./pages/3.GradeManagement/GradeBookAddExternalExaminer";
import UserRolesManagement from "./pages/9.roles/UserRolesManagement";
import UserManagementView from "./pages/9.roles/UserManagementView";
import FacultyStatsManagement from "./pages/7.FacultyStatistics/FacultyStatsManagement";
import ResetPassword from "./pages/0.auth/ResetPassword";
import GraduationManagement from "./pages/10.Graduation/GraduationManagement";
import AddSupervisors from "./pages/2.student/AddSupervisors";
import ChangeSupervisor from "./pages/2.student/ChangeSupervisor";
import GradeProposalScheduleDefense from "./pages/3.GradeManagement/GradeProposalScheduleDefense";
import GradeBookScheduleViva from "./pages/3.GradeManagement/GradeBookScheduleViva";
import ManageResearchRequests from "./pages/ResearchRequests/ManageResearchRequests";
import StudentEvaluationsManagement from "./pages/11.StudentEvaluations/StudentEvaluationsManagement";
import StaffManagement from "./pages/12.staff/StaffManagement";
import ResearchClinicManagement from "./pages/13.ResearchClinic/ResearchClinicManagement";
import ReallocationMonitoring from "./pages/14.ReallocationMonitoring/ReallocationMonitoring";
import AddStudentUpload from "./pages/2.student/AddStudentUpload";
import ImportAcmisStudent from "./pages/2.student/ImportAcmisStudent";
import CourseManagement from "./pages/15.CourseManagement/CourseManagement";
import AddCourse from "./pages/15.CourseManagement/AddCourse";
import SpecializationManagement from "./pages/15.CourseManagement/SpecializationManagement";
import SupportTickets from "./pages/16.SupportTickets/SupportTickets";
import ActivityLogs from "./pages/9.roles/ActivityLogs";
import OverdueDocuments from "./pages/17.OverdueDocuments/OverdueDocuments";
// PublicRoute: Redirects authenticated users away from public pages (like login)
// If user is authenticated, redirects to dashboard
// If user is not authenticated, shows the public page content
const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? (
    <Navigate to={ROUTES.DASHBOARD} replace />
  ) : (
    children
  );
};

// ProtectedRoute: Protects private routes from unauthenticated access
// If user is authenticated, shows the protected content
// If user is not authenticated, redirects to login page
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      {/* <Route
        path={ROUTES.FORGOT_PASSWORD}
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      /> */}
      <Route
        path={'/request-password-reset'}
        element={
          <PublicRoute>
            <RequestPasswordReset />
          </PublicRoute>
        }
      />
       <Route
        path={'/reset-password'}
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
       {/* Register SuperAdmin */}
       <Route path={ROUTES.REGISTER_SUPERADMIN} element={ <PublicRoute><RegisterSuperAdmin /></PublicRoute>} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Default Route */}
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />

       

        {/* Dashboard */}
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

        {/* Student Management */}
        <Route path={ROUTES.STUDENT.LIST} element={<StudentsManagement />} />
        <Route path={ROUTES.STUDENT.ADD} element={<AddStudent />} />
        <Route path={ROUTES.STUDENT.IMPORT_ACMIS} element={<ImportAcmisStudent />} />
        <Route  path={"/students/upload-students"} element={<AddStudentUpload />} />
        <Route path="/students/profile/:id" element={<StudentProfile />} />
        <Route path="/students/submit-book/:id" element={<StudentSubmitBook />} />
        <Route path="/students/add-supervisors/:id" element={<AddSupervisors/>} />
        <Route path="/students/change-supervisor/:id" element={<ChangeSupervisor/>} />
        {/* Grade Management */}
        <Route path={ROUTES.GRADE.ROOT}>
        <Route index element={<GradeManagement />} />

        <Route path="proposal/:id" element={<GradeProposal />} />
        <Route  path="proposal/schedule-defense/:id" element={<GradeProposalScheduleDefense />} />
        <Route path="book/:id" element={<GradeBook />} />
        <Route path="book/add-external-examiner/:id" element={<GradeBookAddExternalExaminer />} />
        <Route path="book/schedule-viva/:id" element={<GradeBookScheduleViva />} />
        
        </Route>

        {/* Research Requests */}
        <Route path={ROUTES.STUDENT_REQUESTS.ROOT} element={<ManageResearchRequests />} />

        {/* Faculty Management */}
        <Route path={ROUTES.FACULTY.ROOT}>
          <Route index element={<Faculty />} />
          <Route path="add" element={<AddFaculty />} />
          <Route path="supervisor/add" element={<AddSupervisor />} />
          <Route path="profile/:id" element={<FacultyProfile />} />
          <Route path="supervisor/profile/:id" element={<SupervisorProfile />} />
          <Route path="assign-students/:id" element={<AssignStudents />} />
          <Route path="user-list/:id" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Route>

        

        {/* Schools Management */}
        <Route path={ROUTES.SCHOOLS.ROOT}>
          <Route index element={<SchoolManagement />} />
          <Route path="add" element={<AddSchool />} />
          <Route path="edit/:id" element={<EditSchool />} />
        </Route>

        {/* Graduation Management */}
        <Route path={'/graduation'} element={<GraduationManagement />} />

        {/* Status Management */}
        <Route path={ROUTES.STATUS.ROOT}>
          <Route index element={<StatusManagement />} />
        </Route>

        {/* Assign Supervisor */}
        {/* <Route path={ROUTES.SUPERVISOR.ROOT}>
          <Route index element={<SupervisorManagement />} />
          <Route path={ROUTES.SUPERVISOR.ADD} element={<AssignSupervisor />} />
        </Route> */}

        {/* Faculty Statistics */}
        <Route path={ROUTES.STATISTICS.ROOT}>
          <Route index element={<FacultyStatsManagement />} />
        </Route>

        {/* Student Evaluations */}
        <Route path={ROUTES.EVALUATIONS.ROOT}>
          <Route index element={<StudentEvaluationsManagement />} />
        </Route>

        {/* Staff Management */}
        <Route path={ROUTES.STAFF.ROOT}>
          <Route index element={<StaffManagement />} />
        </Route>

        {/* Research Clinic Management */}
        <Route path={ROUTES.RESEARCH_CLINIC.ROOT}>
          <Route index element={<ResearchClinicManagement />} />
        </Route>

        {/* Reallocation Monitoring */}
        <Route path={ROUTES.REALLOCATION_MONITORING.ROOT} element={<ReallocationMonitoring />} />

        <Route path={"/courses"} element={<CourseManagement  />} />
        <Route path={"/courses/add"} element={<AddCourse  />} />
        <Route path={"/courses/specializations/:courseId"} element={<SpecializationManagement />} />

        {/* Other Routes */}
        <Route path={ROUTES.OVERDUE_DOCUMENTS} element={<OverdueDocuments />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsManagement />} />
        <Route path={"/users"} element={<UserRolesManagement />} />
        <Route path={"/users/:userId"} element={<UserManagementView />} />
        <Route path={ROUTES.ACTIVITIES} element={<ActivityLogs />} />
        <Route path={ROUTES.SUPPORT_TICKETS} element={<SupportTickets />} />
        <Route path={ROUTES.TABLES} element={<TableBuilder />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        {/* PWA Installer - shows on all pages including login */}
        <PWAInstaller />
        <PWAUpdateToast />
      </Router>
    </AuthProvider>
  );
};

export default App;
