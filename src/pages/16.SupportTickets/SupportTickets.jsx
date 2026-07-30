import React, { useState, useEffect, useRef } from "react";
import PageHeader from "../../components/common/PageHeader";
import apiRequest, { BASE_API_URL } from "../../utils/apiRequestUrl";
import { toast } from "sonner";
import { useAuth } from "../../store/context/AuthContext";
import { io } from "socket.io-client";
import { FiSend, FiPaperclip, FiUser, FiClock, FiCheckCircle, FiInbox, FiMail, FiPhone, FiList } from "react-icons/fi";
import { RiMessage3Line } from "react-icons/ri";
import { format } from "date-fns";
import SupportTicketsTable from "./SupportTicketsTable";

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [viewMode, setViewMode] = useState("chat"); // "chat" or "table"

  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Format date helper
  const currentDate = new Date().toLocaleDateString('en-UG', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  // Extract contact info
  const getContactInfo = (ticket) => {
    if (!ticket) return {};
    const name = ticket.creatorStudent?.fullName || ticket.creatorUser?.name || ticket.guestName || "Unknown User";
    const email = ticket.creatorStudent?.email || ticket.creatorUser?.email || ticket.guestEmail || "No Email";
    const phone = ticket.creatorStudent?.student?.phoneNumber || ticket.creatorUser?.phone || ticket.guestPhone || "No Phone";
    return { name, email, phone };
  };

  const getSourceInfo = (ticket) => {
    if (!ticket?.source) return null;
    const labels = {
      STUDENT_PORTAL: { label: 'Student', color: 'bg-blue-100 text-blue-700' },
      SUPERVISOR_PORTAL: { label: 'Supervisor', color: 'bg-purple-100 text-purple-700' },
      SCHOOL_PORTAL: { label: 'School', color: 'bg-green-100 text-green-700' },
      MANAGEMENT_PORTAL: { label: 'Management', color: 'bg-orange-100 text-orange-700' },
    };
    return labels[ticket.source] || { label: ticket.source, color: 'bg-gray-100 text-gray-700' };
  };

  // Connect to Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("umi_auth_token");
    const socketUrl = BASE_API_URL.replace('/api/v1', '');

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to support socket");
    });

    newSocket.on("new_ticket_created", (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      toast.info(`New ticket created: ${ticket.subject}`);
    });

    newSocket.on("new_support_message", (data) => {
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch Tickets
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest.get("/tickets");
      setTickets(res.data.tickets || []);
    } catch (err) {
      toast.error("Failed to load tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  // Select Ticket
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await apiRequest.get(`/tickets/${ticket.id}`);
      setMessages(res.data.ticket.messages || []);
      scrollToBottom();

      // Join socket room
      if (socket) {
        socket.emit("join_ticket", { ticketId: ticket.id });
      }

      // Mark as read or in progress if it was open
      if (ticket.status === 'OPEN') {
        await apiRequest.put(`/tickets/${ticket.id}/status`, { status: 'IN_PROGRESS' });
        fetchTickets(); // Refresh list to update status
      }
    } catch (err) {
      toast.error("Failed to load ticket details.");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append("message", newMessage);
      if (file) formData.append("attachment", file);

      const res = await apiRequest.post(`/tickets/${selectedTicket.id}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setNewMessage("");
      setFile(null);

    } catch (err) {
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveTicket = async () => {
    try {
      await apiRequest.put(`/tickets/${selectedTicket.id}/status`, { status: 'RESOLVED' });
      toast.success("Ticket marked as resolved");
      setSelectedTicket({ ...selectedTicket, status: 'RESOLVED' });
      fetchTickets();
    } catch (err) {
      toast.error("Failed to resolve ticket");
    }
  };

  return (
    <div className="h-[100vh] overflow-hidden bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between py-6 px-6 pb-0 w-full h-[64px]">
        <div>
          <p className="text-sm font-[Inter-Medium] text-gray-900">Research Centre Portal</p>
          <p className="text-sm font-[Inter-Medium] text-gray-600">Support Dashboard</p>
        </div>
      </div>
      <div className="my-6 border-t border-semantic-border-border"></div>

      <div className="px-6 mb-4 flex justify-between items-start">
        <PageHeader title="Support Tickets" />
        {viewMode === 'chat' && (
          <button
            onClick={() => setViewMode('table')}
            className="flex items-center text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded shadow-sm transition-colors mt-2"
          >
            <FiList className="mr-2" /> Table Overview
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 pb-6 flex overflow-hidden">
        {viewMode === 'table' ? (
          <div className="w-full flex-1 overflow-auto">
            <SupportTicketsTable tickets={tickets} onBack={() => setViewMode('chat')} />
          </div>
        ) : (
          <div className="flex w-full gap-6">
            {/* Sidebar - Ticket List */}
            <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700">All Tickets</h2>
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{tickets.length} total</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary-600 rounded-full border-t-transparent"></div></div>
                ) : tickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <FiInbox className="w-8 h-8 mb-2 opacity-20" />
                    <p>No tickets found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {tickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-primary-50 border-l-4 border-primary-600' : 'border-l-4 border-transparent'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-900 text-sm truncate pr-2">{ticket.subject}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {(() => {
                              const src = getSourceInfo(ticket);
                              return src ? <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${src.color}`}>{src.label}</span> : null;
                            })()}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                                ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                              }`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="flex items-center truncate"><FiUser className="mr-1" /> {getContactInfo(ticket).name}</span>
                          <span className="flex items-center flex-shrink-0"><FiClock className="mr-1" /> {format(new Date(ticket.createdAt), 'MMM d, HH:mm')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Chat View */}
            <div className="w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              {selectedTicket ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1">
                        <h2 className="font-semibold text-gray-900 text-lg">{selectedTicket.subject}</h2>
                        <span className="text-xs font-medium text-gray-400">Ticket #{selectedTicket.ticketNumber}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center"><FiUser className="mr-1.5" /> {getContactInfo(selectedTicket).name}</span>
                        <span className="flex items-center"><FiMail className="mr-1.5" /> {getContactInfo(selectedTicket).email}</span>
                        <span className="flex items-center"><FiPhone className="mr-1.5" /> {getContactInfo(selectedTicket).phone}</span>
                        {(() => {
                          const src = getSourceInfo(selectedTicket);
                          return src ? <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${src.color}`}>{src.label}</span> : null;
                        })()}
                      </div>
                    </div>
                    {selectedTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={handleResolveTicket}
                        className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors"
                      >
                        <FiCheckCircle className="mr-2" /> Mark Resolved
                      </button>
                    )}
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    <div className="space-y-4">
                      {messages.map((msg, idx) => {
                        const isAdmin = !!msg.senderAdminId;
                        return (
                          <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isAdmin ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                              <div className={`text-[10px] mb-1 font-medium ${isAdmin ? 'text-primary-100' : 'text-gray-500'}`}>
                                {isAdmin ? 'Support Team' : (selectedTicket.guestName || 'User')} • {format(new Date(msg.createdAt), 'HH:mm')}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              {msg.attachmentUrl && (
                                <a href={BASE_API_URL.replace('/api/v1', '') + msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 flex items-center text-xs underline ${isAdmin ? 'text-white' : 'text-primary-600'}`}>
                                  <FiPaperclip className="mr-1" /> View Attachment
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input */}
                  {selectedTicket.status !== 'RESOLVED' ? (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                        {file && (
                          <div className="flex items-center text-xs text-primary-600 bg-primary-50 p-2 rounded-md">
                            <FiPaperclip className="mr-2" /> {file.name}
                            <button type="button" onClick={() => setFile(null)} className="ml-auto text-gray-500 hover:text-red-500">×</button>
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <div className="flex-1 relative">
                            <textarea
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your reply..."
                              className="w-full border border-gray-300 rounded-md p-3 pr-10 min-h-[80px] max-h-[150px] focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm resize-y"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage(e);
                                }
                              }}
                            />
                            <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-primary-600 transition-colors">
                              <FiPaperclip className="w-5 h-5" />
                              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
                            </label>
                          </div>
                          <button
                            type="submit"
                            disabled={isSending || (!newMessage.trim() && !file)}
                            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-md p-3 h-[80px] w-[80px] flex flex-col items-center justify-center transition-colors"
                          >
                            {isSending ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                            ) : (
                              <>
                                <FiSend className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Send</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                      This ticket has been resolved and is closed to new messages.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <RiMessage3Line className="w-16 h-16 mb-4 opacity-20" />
                  <p>Select a ticket to view conversation</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTickets;
