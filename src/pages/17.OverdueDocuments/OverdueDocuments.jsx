import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGetOverdueDocuments } from '../../store/tanstackStore/services/queries';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { FiDownload, FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { RiFileExcel2Line, RiFilePdf2Line } from 'react-icons/ri';

const OverdueDocuments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const { data, isLoading, error } = useGetOverdueDocuments();

  const overdueDocuments = data?.overdueDocuments || [];

  const filteredDocuments = useMemo(() => {
    let docs = overdueDocuments;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      docs = docs.filter(doc => {
        const studentName = (doc.student?.fullName || '').toLowerCase();
        const supervisorName = (doc.supervisor?.name || '').toLowerCase();
        const regNo = (doc.student?.registrationNumber || '').toLowerCase();
        const type = (doc.type || '').toLowerCase();
        const title = (doc.title || '').toLowerCase();
        return studentName.includes(term) || supervisorName.includes(term) || regNo.includes(term) || type.includes(term) || title.includes(term);
      });
    }
    return [...docs].sort((a, b) => sortOrder === 'asc' ? a.daysOverdue - b.daysOverdue : b.daysOverdue - a.daysOverdue);
  }, [overdueDocuments, searchTerm, sortOrder]);

  const getOverdueBadge = (days) => {
    if (days >= 60) return <Badge className="bg-red-100 text-red-700 border-red-200">{days}d</Badge>;
    if (days >= 30) return <Badge className="bg-orange-100 text-orange-700 border-orange-200">{days}d</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{days}d</Badge>;
  };

  const handleExportCSV = () => {
    const exportData = filteredDocuments.map(doc => ({
      'Student Name': doc.student?.fullName || '—',
      'Registration No.': doc.student?.registrationNumber || '—',
      'Supervisor': doc.supervisor?.name || '—',
      'Document Type': doc.type || '—',
      'Document Title': doc.title || '—',
      'Upload Date': format(new Date(doc.createdAt), 'yyyy-MM-dd'),
      'Days Overdue': doc.daysOverdue,
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Overdue Documents');
    xlsx.writeFile(workbook, `Overdue_Documents_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Overdue Documents Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);
    doc.text(`Total overdue: ${filteredDocuments.length}`, 14, 34);

    const tableData = filteredDocuments.map(doc => [
      doc.student?.fullName || '—',
      doc.student?.registrationNumber || '—',
      doc.supervisor?.name || '—',
      doc.type || '—',
      doc.title || '—',
      format(new Date(doc.createdAt), 'yyyy-MM-dd'),
      `${doc.daysOverdue} days`,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Student', 'Reg. No.', 'Supervisor', 'Type', 'Title', 'Upload Date', 'Days Overdue']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [35, 56, 143] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`Overdue_Documents_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Overdue Documents"
          lastLogin={`Documents not reviewed within 14 days`}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {isLoading ? 'Loading...' : `${filteredDocuments.length} overdue document${filteredDocuments.length !== 1 ? 's' : ''}`}
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by student, supervisor, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-72"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <FiArrowUp className="mr-2 h-4 w-4" /> : <FiArrowDown className="mr-2 h-4 w-4" />}
                {sortOrder === 'asc' ? 'Least Overdue' : 'Most Overdue'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredDocuments.length === 0}>
                <RiFileExcel2Line className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={filteredDocuments.length === 0}>
                <RiFilePdf2Line className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23388F]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              Failed to load overdue documents. Please try again.
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No overdue documents match your search.' : 'No documents overdue past 14 days. All reviews are on track.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.student?.fullName}
                      </TableCell>
                      <TableCell>{doc.student?.registrationNumber || '—'}</TableCell>
                      <TableCell>{doc.supervisor?.name || '—'}</TableCell>
                      <TableCell>{doc.title || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.type}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(doc.createdAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">
                        {getOverdueBadge(doc.daysOverdue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverdueDocuments;
