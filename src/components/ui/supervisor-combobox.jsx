import React, { useMemo, useState } from "react";
import { Combobox } from "@headlessui/react";
import { ChevronDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

const getSupervisorName = (supervisor) =>
  [supervisor?.title, supervisor?.name].filter(Boolean).join(" ");

const getSupervisorMeta = (supervisor) =>
  [
    supervisor?.department?.name,
    supervisor?.designation,
    supervisor?.campus?.name,
  ]
    .filter(Boolean)
    .join(" · ");

const getSupervisorSearchText = (supervisor) =>
  [
    supervisor?.name,
    supervisor?.title,
    supervisor?.employeeId,
    supervisor?.workEmail,
    supervisor?.personalEmail,
    supervisor?.designation,
    supervisor?.department?.name,
    supervisor?.school?.name,
    supervisor?.campus?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getStudentCount = (supervisor) => supervisor?.students?.length || 0;

const SupervisorCombobox = ({
  supervisors = [],
  value,
  onChange,
  placeholder = "Search supervisors by name, email or department",
  emptyMessage = "No supervisor matches your search",
  className,
  disabled = false,
}) => {
  const [query, setQuery] = useState("");

  const selectedSupervisor = useMemo(
    () => supervisors.find((supervisor) => supervisor.id === value) || null,
    [supervisors, value]
  );

  const tokens = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query]
  );

  const filteredSupervisors = useMemo(() => {
    const matches = tokens.length
      ? supervisors.filter((supervisor) => {
          const searchText = getSupervisorSearchText(supervisor);
          return tokens.every((token) => searchText.includes(token));
        })
      : supervisors;

    return [...matches].sort((a, b) =>
      (a?.name || "").localeCompare(b?.name || "")
    );
  }, [supervisors, tokens]);

  const handleSelect = (supervisor) => {
    setQuery("");
    onChange(supervisor?.id || "");
  };

  return (
    <Combobox
      value={selectedSupervisor}
      onChange={handleSelect}
      by={(a, b) => a?.id === b?.id}
      disabled={disabled}
    >
      <Combobox.Label className="sr-only">Search supervisors</Combobox.Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <Combobox.Input
          className={cn(
            "h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-16 text-sm text-gray-900 shadow-sm outline-none transition focus:border-accent2-500 focus:ring-1 focus:ring-accent2-500 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder={placeholder}
          displayValue={getSupervisorName}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setQuery("")}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
        <Combobox.Button className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Combobox.Button>

        <Combobox.Options className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg focus:outline-none">
          {filteredSupervisors.length === 0 ? (
            <li className="cursor-default px-3 py-6 text-center text-sm text-gray-500">
              {emptyMessage}
            </li>
          ) : (
            filteredSupervisors.map((supervisor) => {
              const meta = getSupervisorMeta(supervisor);
              const studentCount = getStudentCount(supervisor);

              return (
                <Combobox.Option
                  key={supervisor.id}
                  value={supervisor}
                  className={({ active }) =>
                    cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded px-3 py-2",
                      active && "bg-accent2-100"
                    )
                  }
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-900">
                      {getSupervisorName(supervisor)}
                    </p>
                    {meta ? (
                      <p className="truncate text-xs text-gray-500">{meta}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {studentCount} {studentCount === 1 ? "student" : "students"}
                  </span>
                </Combobox.Option>
              );
            })
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

export { SupervisorCombobox };
