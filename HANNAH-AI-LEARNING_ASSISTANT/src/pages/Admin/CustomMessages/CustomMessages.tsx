import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import { mockCustomMessages } from '../../../data/mockCustomMessages';
import type { CustomMessage } from '../../../types';
import { Badge } from '../../../components/Admin/Badge';
import { Card } from '../../../components/Admin/Card';
import './CustomMessages.css';

const CustomMessages: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = mockCustomMessages.filter((msg) => {
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    const matchesSearch =
      msg.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.studentQuestion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.context.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeVariant = (status: CustomMessage['status']): 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: mockCustomMessages.length,
    pending: mockCustomMessages.filter((m) => m.status === 'pending').length,
    approved: mockCustomMessages.filter((m) => m.status === 'approved').length,
    rejected: mockCustomMessages.filter((m) => m.status === 'rejected').length,
  };

  return (
    <div className="custom-messages-page">
      <div className="page-header">
        <h1>Custom Messages Review</h1>
        <p className="page-description">
          Review and approve customized messages submitted by faculty members
        </p>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-label">Total Messages</div>
          <div className="stat-value">{stats.total}</div>
        </Card>
        <Card className="stat-card pending">
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">{stats.pending}</div>
        </Card>
        <Card className="stat-card approved">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{stats.approved}</div>
        </Card>
        <Card className="stat-card rejected">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{stats.rejected}</div>
        </Card>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by faculty, question, or context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="approved">Approved ({stats.approved})</option>
            <option value="rejected">Rejected ({stats.rejected})</option>
          </select>
        </div>
      </div>

      <div className="messages-list">
        {filteredMessages.length === 0 ? (
          <Card className="empty-state">
            <p>No custom messages found matching your criteria.</p>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="message-card">
              <div className="message-header">
                <div className="message-info">
                  <h3>{message.facultyName}</h3>
                  <p className="faculty-email">{message.facultyEmail}</p>
                </div>
                <Badge type={getStatusBadgeVariant(message.status)}>
                  {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                </Badge>
              </div>

              <div className="message-content">
                <div className="question-section">
                  <label>Student Question:</label>
                  <p>{message.studentQuestion}</p>
                </div>
                <div className="context-section">
                  <label>Context:</label>
                  <p>{message.context}</p>
                </div>
                <div className="preview-section">
                  <label>Customized Message (Preview):</label>
                  <p className="message-preview">
                    {message.customizedMessage.substring(0, 150)}
                    {message.customizedMessage.length > 150 && '...'}
                  </p>
                </div>
              </div>

              <div className="message-footer">
                <span className="timestamp">
                  Submitted: {formatDate(message.submittedAt)}
                </span>
                <button
                  className="view-detail-btn"
                  onClick={() => navigate(`/admin/custom-messages/${message.id}`)}
                >
                  <Eye size={18} />
                  View Details
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomMessages;
