import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  RiDashboardLine,
  RiUserLine,
  RiTeamLine,
  RiBuilding4Line,
  RiNotification3Line,
  RiUserSettingsLine,
  RiSettings5Line,
  RiTableLine,
  RiFileListLine,
  RiMedicineBottleLine,
  RiExchangeLine,
  RiBook2Line,
  RiHistoryLine,
  RiMessage3Line,
  RiAlarmWarningLine
} from 'react-icons/ri';
import { useGetLoggedInUserDetails } from '../../store/tanstackStore/services/queries';
import { HiOutlineUserGroup, HiOutlineAcademicCap } from 'react-icons/hi';
const menuItems = {
  mainActivities: [
    { name: 'Dashboard', icon: RiDashboardLine, path: '/dashboard' },
    { name: 'Students Management', icon: RiUserLine, path: '/students' },
    { name: 'Grade Management', icon: RiTableLine, path: '/grades' },
    { name: 'Faculty Management', icon: RiTeamLine, path: '/faculty' },
    { name: 'Staff Management', icon: RiTeamLine, path: '/staff' },
    { name: 'Student Requests', icon: RiFileListLine, path: '/student-requests' },
    { name: 'Student Evaluations', icon: RiTableLine, path: '/evaluations' },
    { name: 'Schools Management', icon: RiBuilding4Line, path: '/schools' },
    { name: 'Course Management', icon: RiBook2Line, path: '/courses' },
    { name: 'Notifications', icon: RiNotification3Line, path: '/notifications' },
    { name: 'Overdue Documents', icon: RiAlarmWarningLine, path: '/overdue-documents' },
    { name: 'Research Clinic', icon: RiMedicineBottleLine, path: '/research-clinic' },
    { name: 'Reallocation Monitoring', icon: RiExchangeLine, path: '/reallocation-monitoring' },
    { name: 'Support Tickets', icon: RiMessage3Line, path: '/support-tickets' },
  ],
  otherOptions: [

    { name: 'Faculty Statistics', icon: RiUserSettingsLine, path: '/statistics' },
    { name: 'Graduation Statistics', icon: HiOutlineAcademicCap, path: '/graduation' },
    { name: 'User Roles Management', icon: HiOutlineUserGroup, path: '/users' },
    { name: 'System Activity Logs', icon: RiHistoryLine, path: '/activities' },
    { name: 'Status Management', icon: RiFileListLine, path: '/status' },
    { name: 'Settings', icon: RiSettings5Line, path: '/settings' },

  ]
};

const NavItem = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);

  return (
    <NavLink
      to={item.path}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-md
        ${isActive
          ? 'text-[#23388F] bg-[#ECF6FB]'
          : 'text-[#070B1D] hover:bg-[#ECF6FB]'
        }
      `}
    >
      <item.icon
        className={`w-[15px] h-[15px] ${isActive ? 'text-[#23388F]' : 'text-[#939495]'}`}
      />
      <span className="text-xs font-medium">{item.name}</span>
    </NavLink>
  );
};

/**
 * Navigation menu component
 * @returns {React.ReactElement}
 */
const NavigationMenu = () => {
  const { data: user } = useGetLoggedInUserDetails();
  const role = user?.user?.role;

  const filteredMainActivities = menuItems.mainActivities.filter(item => {
    if (item.name === 'Support Tickets') return role === 'SUPERADMIN' || role === 'MANAGER';
    // Both SuperAdmin and Auditor see these, but Research Admin might not see some
    return true; // Keep existing visibility for now
  });

  const filteredOtherOptions = menuItems.otherOptions.filter(item => {
    if (item.name === 'User Roles Management') return role === 'SUPERADMIN' || role === 'AUDITOR';
    if (item.name === 'System Activity Logs') return role === 'SUPERADMIN' || role === 'AUDITOR';
    return true;
  });

  return (
    <div className="px-4 py-6 flex flex-col gap-8">
      {/* Main Activities */}
      <nav className="space-y-1">
        <p className="text-xs font-medium text-gray-400 mb-3">Main Activities</p>
        {filteredMainActivities.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Other Options */}
      <nav className="space-y-1">
        <p className="text-xs font-medium text-gray-400 mb-3">Other options</p>
        {filteredOtherOptions.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>
    </div>
  );
};

export default NavigationMenu;
