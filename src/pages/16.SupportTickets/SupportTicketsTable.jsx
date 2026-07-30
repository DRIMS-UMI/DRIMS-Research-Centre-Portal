import React from 'react';
import { format } from 'date-fns';
import * as xlsx from 'xlsx';
import { FiDownload, FiArrowLeft } from 'react-icons/fi';

const SupportTicketsTable = ({ tickets, onBack }) => {

  const getCreatorName = (ticket) => {
    return ticket.creatorStudent?.fullName 
      || ticket.creatorUser?.name 
      || ticket.guestName 
      || "Unknown";
  };

  const getSourceLabel = (source) => {
    const labels = {
      STUDENT_PORTAL: 'Student',
      SUPERVISOR_PORTAL: 'Supervisor',
      SCHOOL_PORTAL: 'School',
      MANAGEMENT_PORTAL: 'Management',
    };
    return labels[source] || source || '—';
  };

  const getWorkedBy = (ticket) => {
    if (!ticket.messages) return ticket.assignedTo?.name || 'Unassigned';
    const creatorName = getCreatorName(ticket);
    const admins = ticket.messages
      .filter(msg => 
        msg.senderAdmin && 
        msg.senderAdmin.name && 
        msg.senderAdmin.name !== creatorName
      )
      .map(msg => msg.senderAdmin.name);
    const uniqueAdmins = [...new Set(admins)];
    if (uniqueAdmins.length > 0) return uniqueAdmins.join(', ');
    return ticket.assignedTo?.name || 'Unassigned';
  };

  const handleExport = () => {
    // Map tickets into a flat structure for export
    const exportData = tickets.map(ticket => {
      // Find the name of the creator dynamically
      const creatorName = getCreatorName(ticket);
      
      const creatorEmail = ticket.creatorStudent?.email 
        || ticket.creatorUser?.email 
        || ticket.guestEmail 
        || "N/A";



      return {
        'Ticket ID': ticket.ticketNumber,
        'Subject': ticket.subject,
        'Source': getSourceLabel(ticket.source),
        'Priority': ticket.priority,
        'Status': ticket.status,
        'Opened At': format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        'Resolved At': ticket.resolvedAt ? format(new Date(ticket.resolvedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Creator Name': creatorName,
        'Creator Email': creatorEmail,
        'Worked By': getWorkedBy(ticket),
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Support Tickets");

    xlsx.writeFile(workbook, `Support_Tickets_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to Chat View
        </button>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Tickets Overview</h2>
          <button 
            onClick={handleExport}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded shadow transition-colors"
          >
            <FiDownload className="mr-2" /> Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200 text-gray-700">
              <th className="py-3 px-4 font-medium">Ticket #</th>
              <th className="py-3 px-4 font-medium">Subject</th>
              <th className="py-3 px-4 font-medium">Source</th>
              <th className="py-3 px-4 font-medium">Creator</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Priority</th>
              <th className="py-3 px-4 font-medium">Opened At</th>
              <th className="py-3 px-4 font-medium">Concluded At</th>
              <th className="py-3 px-4 font-medium">Worked By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((ticket) => {
              const creatorName = ticket.creatorStudent?.fullName 
                || ticket.creatorUser?.name 
                || ticket.guestName 
                || "Unknown";
              
              return (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-900 font-medium">{ticket.ticketNumber}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{ticket.subject}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        ticket.source === 'STUDENT_PORTAL' ? 'bg-blue-100 text-blue-700' :
                        ticket.source === 'SUPERVISOR_PORTAL' ? 'bg-purple-100 text-purple-700' :
                        ticket.source === 'SCHOOL_PORTAL' ? 'bg-green-100 text-green-700' :
                        ticket.source === 'MANAGEMENT_PORTAL' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getSourceLabel(ticket.source)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                    <span className="block truncate">{creatorName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      ticket.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {ticket.resolvedAt ? format(new Date(ticket.resolvedAt), 'MMM d, yyyy HH:mm') : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {(() => {
                      const workedBy = getWorkedBy(ticket);
                      return workedBy === 'Unassigned' 
                        ? <span className="text-gray-400 italic">Unassigned</span>
                        : workedBy;
                    })()}
                  </td>
                </tr>
              );
            })}
            {tickets.length === 0 && (
              <tr>
                <td colSpan="9" className="py-8 text-center text-gray-500">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportTicketsTable;
