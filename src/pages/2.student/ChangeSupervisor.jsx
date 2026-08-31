import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetAllSupervisors, useGetStudent } from '@/store/tanstackStore/services/queries';
import { changeStudentSupervisorService } from '@/store/tanstackStore/services/api';

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ChangeSupervisor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(location.search);
  const supervisorIdFromUrl = searchParams.get('supervisorId');
  
  const [role, setRole] = useState("CO_SUPERVISOR");
  const [reason, setReason] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [supervisorToReplace, setSupervisorToReplace] = useState(supervisorIdFromUrl || "");

  // Get all supervisors using the query hook
  const { data: availableSupervisors = [], isLoading: isLoadingSupervisors } = useGetAllSupervisors();
  
  // Get student data using the query hook
  const { data: studentData, isLoading: isLoadingStudent } = useGetStudent(id);
  const student = studentData?.student;
  const supervisors = student?.supervisors || [];
  const supervisorRoles = student?.supervisorRoles || {};

  // Set initial values based on URL params
  useEffect(() => {
    if (student && supervisorIdFromUrl) {
      const supervisor = supervisors.find(s => s.id === supervisorIdFromUrl);
      if (supervisor) {
        setRole(supervisorRoles[supervisor.id] === "MAIN" ? "MAIN" : "CO_SUPERVISOR");
      }
    }
  }, [student, supervisorIdFromUrl, supervisors, supervisorRoles]);

  const changeSupervisorMutation = useMutation({
    mutationFn: () => {
      return changeStudentSupervisorService(id, {
        oldSupervisorId: supervisorToReplace,
        newSupervisorId: selectedSupervisor,
        reason: reason,
        role: role
      });
    },
    onSuccess: () => {
      toast.success("Supervisor changed successfully");
      queryClient.invalidateQueries(["student", id]);
      navigate(`/students/profile/${id}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to change supervisor");
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedSupervisor) {
      toast.error("Please select a new supervisor");
      return;
    }
    
    if (!supervisorToReplace) {
      toast.error("Please select a supervisor to replace");
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Please provide a reason for changing the supervisor");
      return;
    }
    
    changeSupervisorMutation.mutate();
  };

  if (isLoadingStudent || isLoadingSupervisors) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent2-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-[Inter-SemiBold] text-gray-900 mb-6">
          Change Supervisor
        </h1>
        
        {student && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-[Inter-Medium] text-gray-800 mb-2">
              Student Information
            </h2>
            <p className="text-sm font-[Inter-Regular] text-gray-700">
              <span className="font-[Inter-Medium]">Name:</span> {student.fullName}
            </p>
            <p className="text-sm font-[Inter-Regular] text-gray-700">
              <span className="font-[Inter-Medium]">ID:</span> {student.studentId}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentSupervisor">Supervisor to Replace</Label>
              <Select 
                value={supervisorToReplace} 
                onValueChange={setSupervisorToReplace}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supervisor to replace" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.title} {supervisor.name} ({supervisorRoles[supervisor.id] === "MAIN" ? "Main" : "Co-Supervisor"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="newSupervisor">New Supervisor</Label>
              <Select 
                value={selectedSupervisor} 
                onValueChange={setSelectedSupervisor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select new supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {availableSupervisors?.supervisors?.filter(s => !supervisors.some(existing => existing.id === s.id))
                    .map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.title} {supervisor.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="supervisorType">Supervisor Role</Label>
              <Select 
                value={role} 
                onValueChange={setRole}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supervisor role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">Main Supervisor</SelectItem>
                  <SelectItem value="CO_SUPERVISOR">Co-Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason for changing the supervisor"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/students/profile/${id}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={changeSupervisorMutation.isLoading}
              className="bg-accent2-600 hover:bg-accent2-700"
            >
              {changeSupervisorMutation.isPending ? "Submitting..." : "Change Supervisor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeSupervisor;
