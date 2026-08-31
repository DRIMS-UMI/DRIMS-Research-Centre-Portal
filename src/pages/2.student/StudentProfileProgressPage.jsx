import React, { useState, useMemo, useCallback, Fragment } from "react";

import { HiX } from 'react-icons/hi'
import {
  useGetStudentStatuses,
  useGetStudentProposals,
  useGetStudentBooks,
} from "@/store/tanstackStore/services/queries";
import { Icon } from "@iconify-icon/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudentProfileProgressStatusTable from "./StudentProfileProgressStatusTable.jsx";
import StudentProfileProgressProposalTable from "./StudentProfileProgressProposalTable.jsx";
import StudentProfileProgressStatusDrawer from "./StudentProfileProgressStatusDrawer.jsx";
import StudentProfileProgressProposalDrawer from "./StudentProfileProgressProposalDrawer.jsx";
import StudentProfileProgressBookTable from "./StudentProfileProgressBookTable.jsx";
import { useNavigate, useParams } from "react-router-dom";
import StudentProfileProgressBookDrawer from "./StudentProfileProgressBookDrawer.jsx";
import {
  updateResultsApprovalDateService,
  updateResultsSentDateService,
  updateSenateApprovalDateService,
  deregisterStudentService,
  reinstateStudentService,
  updateStudentSupervisorRoleService,
} from "@/store/tanstackStore/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const StudentProfileProgressPage = ({ studentData }) => {
  const [activeView, setActiveView] = useState("tracker");
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false);
  const [isProposalDrawerOpen, setIsProposalDrawerOpen] = useState(false);
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState(false);
  const [isSupervisorDrawerOpen, setIsSupervisorDrawerOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const { id } = useParams();
  const queryClient = useQueryClient();
  let navigate = useNavigate();

  // State for results update dialogs
  const [isResultsApprovedDialogOpen, setIsResultsApprovedDialogOpen] =
    useState(false);
  const [isResultsSentDialogOpen, setIsResultsSentDialogOpen] = useState(false);
  const [isSenateApprovalDialogOpen, setIsSenateApprovalDialogOpen] =
    useState(false);

  const [resultsApprovedDate, setResultsApprovedDate] = useState(
    studentData?.student?.resultsApprovedDate || ""
  );
  const [resultsSentDate, setResultsSentDate] = useState(
    studentData?.student?.resultsSentDate || ""
  );
  const [senateApprovalDate, setSenateApprovalDate] = useState(
    studentData?.student?.senateApprovalDate || ""
  );

  const { data: studentStatuses, isLoading: isLoadingStudentStatuses } =
    useGetStudentStatuses(id);

  const { data: proposals, isLoading: isLoadingProposals } =
    useGetStudentProposals(id);

  const { data: books, isLoading: isLoadingBooks } = useGetStudentBooks(id);

  const updateResultsApprovalDateMutation = useMutation({
    mutationFn: (data) =>
      updateResultsApprovalDateService(
        data.studentId,
        data.resultsApprovedDate
      ),
    onSuccess: () => {
      toast.success("Results approval date updated successfully");
      queryClient.resetQueries({ queryKey: ["studentStatuses"] });
      queryClient.resetQueries({ queryKey: ["studentProposals"] });
      queryClient.resetQueries({ queryKey: ["studentBooks"] });
      setIsResultsApprovedDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error?.message);
    },
  });

  const updateResultsSentDateMutation = useMutation({
    mutationFn: (data) =>
      updateResultsSentDateService(data.studentId, data.resultsSentDate),
    onSuccess: () => {
      toast.success("Results sent date updated successfully");
      queryClient.resetQueries({ queryKey: ["studentStatuses"] });
      queryClient.resetQueries({ queryKey: ["studentProposals"] });
      queryClient.resetQueries({ queryKey: ["studentBooks"] });
      setIsResultsSentDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error?.message);
    },
  });

  const updateSenateApprovalDateMutation = useMutation({
    mutationFn: (data) =>
      updateSenateApprovalDateService(data.studentId, data.senateApprovalDate),
    onSuccess: () => {
      toast.success("Senate approval date updated successfully");
      queryClient.resetQueries({ queryKey: ["studentStatuses"] });
      queryClient.resetQueries({ queryKey: ["studentProposals"] });
      queryClient.resetQueries({ queryKey: ["studentBooks"] });
      setIsSenateApprovalDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error?.message);
    },
  });

  // Deregistration / Reinstatement State
  const [isDeregisterDialogOpen, setIsDeregisterDialogOpen] = useState(false);
  const [isReinstateDialogOpen, setIsReinstateDialogOpen] = useState(false);
  const [deregisterReason, setDeregisterReason] = useState("");
  const [reinstateReason, setReinstateReason] = useState("");
  const [newExpectedDate, setNewExpectedDate] = useState("");

  const deregisterStudentMutation = useMutation({
    mutationFn: (data) => deregisterStudentService(data.studentId, data.reason),
    onSuccess: () => {
      toast.success("Student deregistered successfully");
      queryClient.invalidateQueries({ queryKey: ["studentStatuses"] });
      // Invalidate the main student query if possible, or just refresh page
      window.location.reload(); 
      setIsDeregisterDialogOpen(false);
    },
    onError: (error) => toast.error(error?.message),
  });

  const reinstateStudentMutation = useMutation({
    mutationFn: (data) => reinstateStudentService(data.studentId, data),
    onSuccess: () => {
      toast.success("Student reinstated successfully");
      queryClient.invalidateQueries({ queryKey: ["studentStatuses"] });
      window.location.reload();
      setIsReinstateDialogOpen(false);
    },
    onError: (error) => toast.error(error?.message),
  });

  const currentStatus = useMemo(
    () => studentData?.student?.statuses?.find((s) => s.isCurrent),
    [studentData?.student?.statuses]
  );

  const currentSupervisor = useMemo(
    () => studentData?.student?.supervisors,
    [studentData?.student?.supervisors]
  );

  const { totalDays, enrollmentDate, expectedDays } = useMemo(() => {
    const enrollmentDate = studentData?.student?.createdAt
      ? new Date(studentData?.student?.createdAt)
      : new Date();
    const totalDays = Math.ceil(
      (new Date() - enrollmentDate) / (1000 * 60 * 60 * 24)
    );
    const expectedDays = studentData?.student?.expectedCompletionDate
      ? Math.ceil(
          (new Date(studentData?.student?.expectedCompletionDate) -
            enrollmentDate) /
            (1000 * 60 * 60 * 24)
        )
      : null;
    return { totalDays, enrollmentDate, expectedDays };
  }, [
    studentData?.student?.createdAt,
    studentData?.student?.expectedCompletionDate,
  ]);

  const handleViewChange = useCallback((view) => {
    setActiveView(view);
  }, []);

  const handleResultsApprovedSubmit = () => {
    updateResultsApprovalDateMutation.mutate({
      studentId: id,
      resultsApprovedDate: resultsApprovedDate,
    });
  };

  const handleResultsSentSubmit = () => {
    updateResultsSentDateMutation.mutate({
      studentId: id,
      resultsSentDate: resultsSentDate,
    });
    // setIsResultsSentDialogOpen(false);
  };

  const handleSenateApprovalSubmit = () => {
    updateSenateApprovalDateMutation.mutate({
      studentId: id,
      senateApprovalDate: senateApprovalDate,
    });
    // setIsSenateApprovalDialogOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-UG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderTimelineBar = useCallback(
    (status, index) => {
      const startDate = new Date(status.startDate);
      const endDate =
        index < studentData.student.statuses.length - 1
          ? new Date(studentData.student.statuses[index + 1].startDate)
          : new Date();
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const position = Math.ceil(
        (startDate - enrollmentDate) / (1000 * 60 * 60 * 24)
      );

      return (
        <TooltipProvider key={status.id} className="z-[50] h-full">
          <Tooltip className="z-50 h-full">
            <TooltipTrigger className="z-50 h-full relative">
              <div
                key={status.id}
                className="h-full group cursor-pointer hover:brightness-90 transition-all"
                style={{
                  width: `${duration * 2}px`,
                  left: `${position * 2}px`,
                  backgroundColor: status?.definition?.color || "#313132",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  borderRadius: "2px",
                }}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-white p-2 rounded-lg shadow-lg border border-gray-200">
              <div className="space-y-1">
                <div className="font-medium text-gray-900">
                  {status?.definition?.name}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(status?.startDate).toLocaleDateString()} -{" "}
                  {index < studentData?.student?.statuses?.length - 1
                    ? new Date(
                        studentData?.student?.statuses[index + 1]?.startDate
                      ).toLocaleDateString()
                    : "Present"}
                </div>
                <div className="text-xs font-[Inter-Regular] text-gray-900">
                  Actual Duration: {duration} days
                </div>
                {status?.definition?.expectedDays && (
                  <div className="text-sm font-[Inter-Regular] text-gray-900">
                    Expected Duration: {status.definition.expectedDays} days
                    {duration > status.definition.expectedDays && (
                      <span className="text-red-500 ml-1">
                        (Overdue by {duration - status.definition.expectedDays}{" "}
                        days)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    [enrollmentDate, studentData?.student?.statuses?.length]
  );

  const renderTimelineLegend = useCallback(
    (status) => {
      // Check if this status definition has already been rendered
      const isFirstOccurrence =
        studentData.student.statuses.findIndex(
          (s) => s.definition?.name === status.definition?.name
        ) === studentData.student.statuses.indexOf(status);

      if (!isFirstOccurrence) return null;

      return (
        <div
          key={status.id}
          className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md shadow-sm"
        >
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              backgroundColor: status.definition?.color || "#313132",
            }}
          />
          <span className="text-xs font-[Inter-Medium] text-[#626263] capitalize whitespace-nowrap">
            {status.definition?.name || "Unknown"}
          </span>
        </div>
      );
    },
    [studentData?.student?.statuses]
  );

  const handleViewSupervisor = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setIsSupervisorDrawerOpen(true);
  };

  const handleChangeSupervisor = (supervisor) => {
    navigate(`/students/change-supervisor/${id}?supervisorId=${supervisor.id}`);
  };

  // Mutation to update a supervisor's role (Main vs Co-Supervisor)
  const updateSupervisorRoleMutation = useMutation({
    mutationFn: ({ supervisorId, role }) => updateStudentSupervisorRoleService(id, { supervisorId, role }),
    onSuccess: () => {
      toast.success("Supervisor role updated successfully");
      queryClient.invalidateQueries(["student", id]);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update supervisor role");
      queryClient.invalidateQueries(["student", id]);
    },
  });

  const handleRoleChange = (supervisorId, newRole) => {
    updateSupervisorRoleMutation.mutate({ supervisorId, role: newRole });
  };

  // TanStack Table for Supervisors
  const columnHelper = createColumnHelper();
  
  const supervisorColumns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <span className="text-sm font-[Inter-Regular] text-gray-900">
          {info.row.original.title} {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("id", {
      header: "Role",
      cell: (info) => {
        const supervisorId = info.getValue();
        const role = studentData?.student?.supervisorRoles?.[supervisorId];
        const currentRole = role === "MAIN" ? "MAIN" : "CO_SUPERVISOR";

        return (
          <Select
            value={currentRole}
            onValueChange={(value) => handleRoleChange(supervisorId, value)}
            disabled={updateSupervisorRoleMutation.isPending}
          >
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MAIN">Main Supervisor</SelectItem>
              <SelectItem value="CO_SUPERVISOR">Co-Supervisor</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    }),
    columnHelper.accessor("workEmail", {
      header: "Email",
      cell: (info) => (
        <span className="text-sm font-[Inter-Regular] text-gray-900">
          {info.getValue() || "N/A"}
        </span>
      ),
    }),
    columnHelper.accessor("primaryPhone", {
      header: "Phone",
      cell: (info) => (
        <span className="text-sm font-[Inter-Regular] text-gray-900">
          {info.getValue() || "N/A"}
        </span>
      ),
    }),
   
    columnHelper.accessor("id", {
      header: "Actions",
      cell: (info) => {
        const supervisor = info.row.original;
        return (
          <div className="flex flex-col gap-2 max-w-[150px] ">
            <button
              className="px-2 py-1 text-xs font-[Inter-Medium]  text-white bg-accent2-600 rounded hover:bg-accent2-700 flex items-center"
              onClick={() => handleViewSupervisor(supervisor)}
            >
              <Icon icon="tabler:eye" className="h-3 w-3 mr-1" />
              View Supervisor
            </button>
            {!supervisor.isCurrent && (
              <button
                className="px-2 py-1 text-xs font-[Inter-Medium] text-white bg-primary-600 rounded hover:bg-primary-700 flex items-center"
                onClick={() => handleChangeSupervisor(supervisor)}
              >
                <Icon icon="tabler:refresh" className="h-3 w-3 mr-1" />
                Change Supervisor
              </button>
            )}
          </div>
        );
      },
    }),
  ];

  const supervisorsData = studentData?.student?.supervisors || [];
  
  const supervisorsTable = useReactTable({
    data: supervisorsData,
    columns: supervisorColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoadingStudentStatuses) {
    return <div>Loading...</div>;
  }

  if (!studentData) {
    return <div>Student not found</div>;
  }

  return (
    <div className="space-y-6 ">
      {/* Section 1: Student Information Details */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-8">
        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Supervisor(s)
          </h3>
          <div className="flex gap-2">
            <div className="flex flex-col">
              {currentSupervisor && currentSupervisor.length > 0 
                ? currentSupervisor.map((supervisor) => (
                    <span key={supervisor.id} className="text-sm font-[Inter-Regular] text-gray-900 flex items-center gap-1">
                      {supervisor.title} {supervisor.name}
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {studentData?.student?.supervisorRoles?.[supervisor.id] === 'MAIN' ? 'Main' : 'Co-Supervisor'}
                      </span>
                    </span>
                  ))
                : <span className="text-sm font-[Inter-Regular] text-gray-900">No supervisor assigned</span>}
            </div>
            {/* <button className="text-[#626263]">
              <Icon
                icon="tabler:selector"
                width="20"
                height="20"
                className=" text-[#626263]"
              />
            </button> */}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Current Status
          </h3>
          <span
            style={{
              color: currentStatus?.definition?.color || "#6B7280",
              backgroundColor:
                `${currentStatus?.definition?.color}18` || "#F3F4F6",
              border: `1px solid ${
                currentStatus?.definition?.color || "#6B7280"
              }`,
            }}
            className="inline-flex px-2 py-0.5 rounded-[4px] text-sm font-[Inter-Regular] capitalize"
          >
            {currentStatus?.definition?.name || "Unknown"}
          </span>
          
          <div className="mt-2 flex gap-2">
            {studentData?.student?.isActive !== false ? (
              <button
                className="px-2 py-1 text-xs font-[Inter-Medium] text-white bg-red-600 rounded hover:bg-red-700 flex items-center gap-1"
                onClick={() => setIsDeregisterDialogOpen(true)}
              >
                <Icon icon="tabler:user-x" width="14" height="14" />
                Deregister
              </button>
            ) : (
              <button
                className="px-2 py-1 text-xs font-[Inter-Medium] text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-1"
                onClick={() => setIsReinstateDialogOpen(true)}
              >
                <Icon icon="tabler:user-check" width="14" height="14" />
                Reinstate Student
              </button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Total Time
          </h3>
          <span className="text-sm font-[Inter-Regular] text-gray-900">
            {totalDays} {expectedDays && `of ${expectedDays} days`}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Results Approved
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-[Inter-Regular] text-gray-900">
              {formatDate(resultsApprovedDate)}
            </span>

            <button
              className="px-2 py-1 text-xs font-[Inter-Medium] text-white bg-accent2-600 rounded hover:bg-accent2-700"
              onClick={() => setIsResultsApprovedDialogOpen(true)}
            >
              Update
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Results Sent to School
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-[Inter-Regular] text-gray-900">
              {formatDate(resultsSentDate)}
            </span>
            <button
              className="px-2 py-1 text-xs font-[Inter-Medium] text-white bg-accent2-600 rounded hover:bg-accent2-700"
              onClick={() => setIsResultsSentDialogOpen(true)}
            >
              Update
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Senate Approval
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-[Inter-Regular] text-gray-900">
              {formatDate(senateApprovalDate)}
            </span>
            <button
              className="px-2 py-1 text-xs font-[Inter-Medium] text-white bg-accent2-600 rounded hover:bg-accent2-700"
              onClick={() => setIsSenateApprovalDialogOpen(true)}
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Timeline */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-[Inter-Regular] text-gray-500 mb-4">
          Timeline (Days)
        </h3>

        <div className="flex flex-col ">
          {/* Expected Completion Date Indicator */}
          {studentData?.student?.expectedCompletionDate && (
            <div className="relative h-6 mb-1">
              <div
                className="absolute h-6 border-l-2 border-red-500 border-dashed"
                style={{
                  left: "100%",
                }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="absolute -left-[6px] top-0 w-3 h-3 bg-red-500 rounded-full" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        Expected Completion Date:{" "}
                        {new Date(
                          studentData.student.expectedCompletionDate
                        ).toLocaleDateString()}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Timeline Progress Bar */}
          <div className="space-y-2">
            <div className="relative h-8 bg-white shadow-md flex gap-1">
              {studentData.student?.statuses?.map((status, index) =>
                renderTimelineBar(status, index)
              )}
            </div>
          </div>
          {/* Timeline Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 p-3 bg-white rounded-lg shadow-sm">
            {studentData.student?.statuses?.map(renderTimelineLegend)}
          </div>
        </div>
      </div>

      {/* Supervisor Table */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="w-full flex items-center justify-between mb-4">
          <h3 className="text-sm font-[Inter-Bold] text-gray-700 ">
            Supervisors
          </h3>

          <div className="flex">
            {studentData?.student?.supervisors && studentData.student.supervisors.length < 2 && (
              <button 
                onClick={() => navigate(`/students/add-supervisors/${id}`)} 
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-[Inter-Medium] text-white bg-primary-600 rounded hover:bg-primary-700"
              >
                <Icon icon="tabler:plus" width="16" height="16" />
                Add Supervisor(s)
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {supervisorsData.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                {supervisorsTable.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="bg-gray-50">
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id}
                        className="text-left py-3 px-3 text-sm font-[Inter-Medium] text-gray-500 border-b"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supervisorsTable.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td 
                        key={cell.id}
                        className="py-2 px-3 text-sm font-[Inter-Regular] text-gray-900"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-4 px-3 text-sm text-center text-gray-500">
              No supervisors assigned
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Status Action Tracker and Proposal Table and Book Table */}
      <div className="bg-white rounded-lg py-2 space-y-4">
        {/* Options */}
        <div className="flex gap-4 px-4 pt-4">
          <button
            onClick={() => handleViewChange("tracker")}
            className={`text-sm font-[Inter-Medium] border py-1 px-2 rounded-lg !cursor-pointer select-none ${
              activeView === "tracker"
                ? "border-secondary-800 bg-secondary-100  text-primary-800"
                : "border-secondary-700 bg-white text-secondary-800"
            }`}
          >
            Status Action Tracker
          </button>

          <button
            onClick={() => handleViewChange("proposal")}
            className={`text-sm font-[Inter-Medium] border py-1 px-2 rounded-lg !cursor-pointer select-none ${
              activeView === "proposal"
                ? "border-secondary-800 bg-secondary-100  text-primary-900"
                : "border-secondary-700 bg-white text-secondary-800"
            }`}
          >
            Proposal
          </button>

          <button
            onClick={() => handleViewChange("book")}
            className={`text-sm font-[Inter-Medium] border py-1 px-2 rounded-lg !cursor-pointer select-none ${
              activeView === "book"
                ? "border-secondary-800 bg-secondary-100  text-primary-900"
                : "border-secondary-700 bg-white text-secondary-800"
            }`}
          >
            Dissertation
          </button>
        </div>

        {/* Content */}
        {/* Status Tracker Table */}
        {activeView === "tracker" && (
          <div className="px-4">
            <StudentProfileProgressStatusTable
              statuses={studentStatuses?.statuses || []}
              isLoading={isLoadingStudentStatuses}
              setIsStatusDrawerOpen={setIsStatusDrawerOpen}
              setSelectedStatus={setSelectedStatus}
            />
          </div>
        )}

        {/* Grading Progress Table */}
        {activeView === "proposal" && (
          <StudentProfileProgressProposalTable
            setIsStatusDrawerOpen={setIsProposalDrawerOpen}
            setSelectedStatus={setSelectedProposal}
            studentId={studentData?.student?.id}
            proposals={proposals?.proposals || []}
            isLoadingProposals={isLoadingProposals}
          />
        )}

        {/* Grading Progress Table */}
        {activeView === "book" && (
          <StudentProfileProgressBookTable
            setIsStatusDrawerOpen={setIsBookDrawerOpen}
            setSelectedStatus={setSelectedBook}
            studentId={studentData?.student?.id}
            books={books?.books || []}
            isLoadingBooks={isLoadingBooks}
          />
        )}
      </div>

      {/* Results Approved Dialog */}
      <Dialog
        open={isResultsApprovedDialogOpen}
        onOpenChange={setIsResultsApprovedDialogOpen}
        className="z-[9999]"
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Results Approval Date</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resultsApprovedDate" className="text-right">
                Date
              </Label>
              <Input
                id="resultsApprovedDate"
                type="date"
                value={resultsApprovedDate}
                onChange={(e) => setResultsApprovedDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResultsApprovedDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleResultsApprovedSubmit}
              disabled={updateResultsApprovalDateMutation.isPending}
            >
              {updateResultsApprovalDateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Sent Dialog */}
      <Dialog
        open={isResultsSentDialogOpen}
        onOpenChange={setIsResultsSentDialogOpen}
        className="z-[9999]"
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Results Sent to School Date</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resultsSentDate" className="text-right">
                Date
              </Label>
              <Input
                id="resultsSentDate"
                type="date"
                value={resultsSentDate}
                onChange={(e) => setResultsSentDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResultsSentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleResultsSentSubmit}
              disabled={updateResultsSentDateMutation.isPending}
            >
              {updateResultsSentDateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Senate Approval Dialog */}
      <Dialog
        open={isSenateApprovalDialogOpen}
        onOpenChange={setIsSenateApprovalDialogOpen}
        className="z-[9999]"
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Senate Approval Date</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="senateApprovalDate" className="text-right">
                Date
              </Label>
              <Input
                id="senateApprovalDate"
                type="date"
                value={senateApprovalDate}
                onChange={(e) => setSenateApprovalDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSenateApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSenateApprovalSubmit}
              disabled={updateSenateApprovalDateMutation.isPending}
            >
              {updateSenateApprovalDateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deregister Dialog */}
      <Dialog open={isDeregisterDialogOpen} onOpenChange={setIsDeregisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-[Inter-Bold]">Deregister Student</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deregisterReason">Reason for Deregistration</Label>
              <Input
                id="deregisterReason"
                placeholder="e.g. Exceeded research timeline"
                value={deregisterReason}
                onChange={(e) => setDeregisterReason(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 italic">
              Warning: This will set the student as inactive and record them as deregistered.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeregisterDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deregisterStudentMutation.mutate({ studentId: id, reason: deregisterReason })}
              disabled={deregisterStudentMutation.isPending || !deregisterReason}
            >
              {deregisterStudentMutation.isPending ? "Processing..." : "Confirm Deregistration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reinstate Dialog */}
      <Dialog open={isReinstateDialogOpen} onOpenChange={setIsReinstateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-green-600 font-[Inter-Bold]">Reinstate Student</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reinstateReason">Reason for Reinstatement</Label>
              <Input
                id="reinstateReason"
                placeholder="e.g. Board approved extension"
                value={reinstateReason}
                onChange={(e) => setReinstateReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newExpectedDate">New Expected Completion Date (Extension)</Label>
              <Input
                id="newExpectedDate"
                type="date"
                value={newExpectedDate}
                onChange={(e) => setNewExpectedDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReinstateDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => reinstateStudentMutation.mutate({ 
                studentId: id, 
                reason: reinstateReason, 
                newExpectedCompletionDate: newExpectedDate 
              })}
              disabled={reinstateStudentMutation.isPending || !reinstateReason || !newExpectedDate}
            >
              {reinstateStudentMutation.isPending ? "Processing..." : "Reinstate Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isStatusDrawerOpen && (
        <StudentProfileProgressStatusDrawer
          isOpen={isStatusDrawerOpen}
          onClose={() => setIsStatusDrawerOpen(false)}
          studentId={studentData?.student?.id}
          studentData={studentData?.student}
          selectedStatus={selectedStatus}
        />
      )}

      {isProposalDrawerOpen && (
        <StudentProfileProgressProposalDrawer
          isOpen={isProposalDrawerOpen}
          onClose={() => setIsProposalDrawerOpen(false)}
          proposalData={selectedProposal}
        />
      )}

      {isBookDrawerOpen && (
        <StudentProfileProgressBookDrawer
          isOpen={isBookDrawerOpen}
          onClose={() => setIsBookDrawerOpen(false)}
          bookData={selectedBook}
          studentData={studentData?.student}
        />
      )}

      {/* Supervisor Drawer */}
      {isSupervisorDrawerOpen && selectedSupervisor && (
        <div className="fixed inset-0  z-50 overflow-hidden">
          <div className="fixed inset-0 top-0 h-screen bg-black/30" onClick={() => setIsSupervisorDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full">
            <div className="w-screen max-w-md">
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-[Inter-Bold] text-gray-900">Supervisor Details</h2>
                    <button
                       onClick={() => setIsSupervisorDrawerOpen(false)}
                        className="bg-primary-500 text-white rounded-lg hover:bg-primary-800 flex items-center justify-center whitespace-nowrap text-sm"
                        style={{ width: "148px", height: "36px", gap: "8px" }}
                      >
                        <HiX className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-shrink-0 text-sm">Close Window</span>
                      </button>
                  
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm font-[Inter-Medium]">
                            {selectedSupervisor.title} {selectedSupervisor.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="text-sm font-[Inter-Medium]">
                            {selectedSupervisor.isCurrent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Current
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Previous
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Contact Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.workEmail || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.primaryPhone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Alternative Phone</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.alternativePhone || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                      <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Academic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.department || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Specialization</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.specialization || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedSupervisor.notes && (
                      <div>
                        <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Notes</h3>
                        <p className="text-sm font-[Inter-Regular] bg-gray-50 p-3 rounded-md">
                          {selectedSupervisor.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-center space-x-3">
                   
                   
                      <button
                        onClick={() => navigate(`/faculty/supervisor/profile/${selectedSupervisor?.id}`)}
                        className="px-4 py-2 text-sm font-[Inter-Medium] text-white bg-primary-600 rounded-md hover:bg-primary-700"
                      >
                        View More
                      </button>
                  
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfileProgressPage;
