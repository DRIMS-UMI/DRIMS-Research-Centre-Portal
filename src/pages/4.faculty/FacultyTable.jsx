import { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { useIsReadOnly } from "../../hooks/useIsReadOnly";

import { useMutation } from "@tanstack/react-query";
import { deleteSchoolService } from "../../store/tanstackStore/services/api";
import { queryClient } from "../../utils/tanstack";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@iconify-icon/react";

// Info icon helper component
const InfoIconHelper = ({ tooltip }) => {
  return (
    <div className="relative group">
      <div className="cursor-help w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-medium">i</span>
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div
              className="border-4 border-transparent border-t-gray-900"
              style={{ width: 0, height: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete confirmation modal
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  schoolName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Delete School
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Are you sure you want to delete {schoolName}? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ value, onChange, placeholder = "Search" }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <FiSearch className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
};

const TabPanel = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div className="border-b border-gray-200">
      <div className="flex space-x-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 border-b-2 ${activeTab === tab.id
              ? "border-[#27357E] text-[#27357E]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } font-medium text-sm focus:outline-none`}
          >
            <span>{tab.label}</span>
            {tab.count && (
              <span className="ml-2 text-gray-400">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const FacultyTable = ({
  globalFilter,
  setGlobalFilter,
  columnVisibility,
  setColumnVisibility,
  data,
}) => {
  const [pageSize, setPageSize] = useState(() => {
    const savedPageSize = localStorage.getItem("schoolTablePageSize");
    return savedPageSize ? parseInt(savedPageSize) : 10;
  });
  const [pageIndex, setPageIndex] = useState(() => {
    const savedPageIndex = localStorage.getItem("schoolTablePageIndex");
    return savedPageIndex ? parseInt(savedPageIndex) : 0;
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const isReadOnly = useIsReadOnly();

  const deleteSchoolMutation = useMutation({
    mutationFn: deleteSchoolService,
    onSuccess: () => {
      queryClient.invalidateQueries(["schools"]);
    },
  });

  useEffect(() => {
    setPageIndex(0);
  }, [data]);

  const handleDeleteClick = (school) => {
    setSchoolToDelete(school);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (schoolToDelete) {
      try {
        await deleteSchoolMutation.mutateAsync(schoolToDelete.id);
        setDeleteModalOpen(false);
        setSchoolToDelete(null);
      } catch (error) {
        console.error("Error deleting school:", error);
      }
    }
  };

  // Set initial column visibility
  const defaultColumnVisibility = {
    fullname: true,
    email: true,
    schoolCode: true,
    facultyType: true,
    campus: true,
    actions: true,
  };

  // Use the provided columnVisibility or default to all visible
  const effectiveColumnVisibility = columnVisibility || defaultColumnVisibility;

  const columns = [
    {
      accessorKey: 'name',
      header: () => <span className="text-sm">Fullname</span>,
      cell: info => <div className="text-sm">{info.getValue()}</div>
    },
    {
      accessorKey: 'workEmail',
      header: () => <span className="text-sm">Email Address</span>,
      cell: info => <div className="text-sm">{info.getValue()}</div>
    },
    {
      accessorKey: 'schoolCode',
      header: () => <span className="text-sm">School Code</span>,
      cell: info => <div className="text-sm flex flex-row text-center items-center gap-1 justify-start"> <span>{info.row.original.school?.code}</span>   <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Icon
              icon="tdesign:info-circle-filled"
              className="w-4 h-4 mt-1 text-gray-400"
            />
          </TooltipTrigger>
          <TooltipContent>{info.row.original.school?.name}</TooltipContent>
        </Tooltip>
      </TooltipProvider></div>
    },
    {
      accessorKey: 'facultyType',
      header: () => <span className="text-sm">Role</span>,
      cell: info => (
        <div className="inline-flex h-hug24px rounded-md border py-4px px-9px bg-accent2-300 items-center justify-center whitespace-nowrap text-sm capitalize">
          {info.getValue()}
        </div>
      )
    },

    {
      accessorKey: 'campus',
      header: () => <span className="text-sm">Campus</span>,
      cell: info => (
        <div className="inline-flex rounded-md py-4px px-9px  items-center justify-center whitespace-nowrap text-sm capitalize">
          {info.row.original?.campus?.name}
        </div>
      )
    },
    {
      id: 'actions',
      header: () => <span className="text-sm"> </span>,
      cell: info => (
        <>
          {
            info.row.original.facultyType === 'supervisor' ? (<Link
              to={`/faculty/supervisor/profile/${info.row.original.id}`}
              className="rounded border border-semantic-bg-border shadow-sm py-4px px-8px hover:bg-gray-50 text-sm"
            >
              Open
            </Link>) : (
              <Link
                to={`/faculty/profile/${info.row.original.id}`}
                className="rounded border border-semantic-bg-border shadow-sm py-4px px-8px hover:bg-gray-50 text-sm"
              >
                Open
              </Link>
            )
          }
        </>

      )
    }
  ];

  const table = useReactTable({
    data: data || [], // Data is already filtered by campus in SchoolManagement component
    columns,
    state: {
      globalFilter,
      columnVisibility: effectiveColumnVisibility,
      pagination: {
        pageSize,
        pageIndex,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({
          pageIndex,
          pageSize,
        });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
        localStorage.setItem(
          "schoolTablePageIndex",
          newState.pageIndex.toString()
        );
        localStorage.setItem(
          "schoolTablePageSize",
          newState.pageSize.toString()
        );
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSchoolToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        schoolName={schoolToDelete?.name}
      />

      {/* Table Controls */}
      <div className="p-4 flex justify-between items-center border-b">
        <div className="w-[240px]">
          <SearchBar
            value={globalFilter ?? ""}
            onChange={(value) => setGlobalFilter(String(value))}
            placeholder="Search by Name"
          />
        </div>
        <div className="flex items-center gap-4">
          {/* <SchoolTablePageSize
          pageSize={pageSize}
          setPageSize={setPageSize}
          setPageIndex={setPageIndex}
        /> */}
          {!isReadOnly && (
            <div className="flex items-center gap-4">
              <Link
                to="/faculty/add"
                className="inline-flex items-center px-4 py-2 bg-[#27357E] text-white rounded-lg text-sm font-medium hover:bg-[#1F2861]"
              >
                Add Faculty
                <span className="ml-2">+</span>
              </Link>

              <Link
                to="/faculty/supervisor/add"
                className="inline-flex items-center px-4 py-2 bg-[#27357E] text-white rounded-lg text-sm font-medium hover:bg-[#1F2861]"
              >
                Add Supervisor
                <span className="ml-2">+</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Table Structure */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-bold  text-[#111827] capitalize tracking-wider bg-gray-50"
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-2 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
        <div className="flex items-center text-sm text-gray-500">
          Showing{' '}
          <span className="font-medium mx-1">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>
          to{' '}
          <span className="font-medium mx-1">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getPrePaginationRowModel().rows.length
            )}
          </span>
          of{' '}
          <span className="font-medium mx-1">{table.getPrePaginationRowModel().rows.length}</span>{' '}
          results
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1 text-sm disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map(pageNumber => (
            <button
              key={pageNumber}
              className={`w-8 h-8 rounded text-sm ${pageNumber === table.getState().pagination.pageIndex + 1
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-500'
                }`}
              onClick={() => table.setPageIndex(pageNumber - 1)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="border rounded p-1 text-sm disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
};

export default FacultyTable;
