import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import '../../styles/SupportTickets.css';
import PagificationContainer from '../../components/General/PagificationContainer.jsx';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved'];

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortByPriorityDesc, setSortByPriorityDesc] = useState(true);

  const [replyFor, setReplyFor] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/View/TicketView.php?action=list');
      const list = res.data?.body?.tickets ?? res.data?.tickets ?? [];
      setTickets(list);
    } catch (err) {
      console.error(err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }

  const handlePriorityChange = async (ticketId, newPriority) => {
    if (!PRIORITY_OPTIONS.some((p) => p.value === newPriority)) return;
    setActionLoading(true);
    try {
      await api.post('/View/TicketView.php?action=priority', { ticket_id: ticketId, priority: newPriority });
      setTickets((t) => t.map((x) => (x.id === ticketId ? { ...x, priority: newPriority } : x)));
      toast.success('Priority updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update priority');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    if (!STATUS_OPTIONS.includes(newStatus)) return;
    setActionLoading(true);
    try {
      await api.post('/View/TicketView.php?action=status', { ticket_id: ticketId, status: newStatus });
      setTickets((t) => t.map((x) => (x.id === ticketId ? { ...x, status: newStatus } : x)));
      toast.success('Status updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplySend = async () => {
    if (!replyFor) return;
    const ticketId = replyFor.id;
    const msg = replyMessage.trim();
    if (msg === '') return toast.error('Reply message cannot be empty');
    setActionLoading(true);
    try {
      const res = await api.post('/View/TicketView.php?action=reply', { ticket_id: ticketId, reply_message: msg });
      const body = res.data?.body ?? res.data;
      if (body?.status === 'success') {
        setTickets((t) => t.map((x) => (x.id === ticketId ? { ...x, reply_message: msg } : x)));
        setReplyFor(null);
        setReplyMessage('');
        setShowModal(false);
        if (body.email_sent === false) {
          toast.info('Reply saved but email could not be sent. Check SMTP settings.');
          if (body.email_error) {
            toast.error('Email error: ' + body.email_error);
          }
        } else {
          toast.success('Reply sent and email delivered (or queued).');
        }
      } else {
        const msgErr = body?.message || 'Failed to send reply';
        toast.error(msgErr);
      }
    } catch (err) {
      console.error(err);
      const msgErr = err?.response?.data?.body?.message || err?.response?.data?.message || err.message || 'Failed to send reply';
      toast.error(msgErr);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!confirm('Delete ticket #' + ticketId + '?')) return;
    setActionLoading(true);
    try {
      await api.post('/View/TicketView.php?action=delete', { ticket_id: ticketId });
      setTickets((t) => t.filter((x) => x.id !== ticketId));
      toast.success('Ticket deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let out = tickets.slice();
    if (filterType) out = out.filter((t) => String(t.type).toLowerCase() === filterType.toLowerCase());
    if (filterStatus) out = out.filter((t) => String(t.status).toLowerCase() === filterStatus.toLowerCase());
    if (s) {
      out = out.filter((t) =>
        (t.user_name || '').toLowerCase().includes(s) ||
        (t.user_email || '').toLowerCase().includes(s) ||
        (t.message || '').toLowerCase().includes(s),
      );
    }

    const priorityOrder = { low: 1, medium: 2, high: 3 };
    out.sort((a, b) => {
      const pa = priorityOrder[(a.priority || '').toLowerCase()] || 0;
      const pb = priorityOrder[(b.priority || '').toLowerCase()] || 0;
      return sortByPriorityDesc ? pb - pa : pa - pb;
    });

    return out;
  }, [tickets, search, filterType, filterStatus, sortByPriorityDesc]);

  return (
    <div className="support-tickets">
      <h2>Support Tickets</h2>
      
      <div className="toolbar">
        <input 
          className="search" 
          placeholder="Search name, email or message" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          disabled={actionLoading}
        />
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          disabled={actionLoading}
        >
          <option value="">All Types</option>
          {[...new Set(tickets.map((t) => t.type).filter(Boolean))].map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          disabled={actionLoading}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          className={`btn-toggle ${sortByPriorityDesc ? 'active' : ''}`}
          onClick={() => setSortByPriorityDesc((v) => !v)}
          title="Toggle priority sort"
          disabled={actionLoading}
        >
          {sortByPriorityDesc ? 'Priority: H → L' : 'Priority: L → H'}
        </button>
        <button 
          className="btn btn-primary" 
          onClick={loadTickets}
          disabled={actionLoading}
        >
          {actionLoading ? 'Processing...' : 'Refresh'}
        </button>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <PagificationContainer data={filtered} initialRowsPerPage={20} enableRowsPerPageControl={false} itemName="tickets">
          {(pageData) => (
            <table className="tickets-table" cellPadding="6">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Reply</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.user_name}</td>
                    <td>{t.user_email}</td>
                    <td style={{ maxWidth: 300, whiteSpace: 'normal' }}>{t.message}</td>
                    <td>{t.type}</td>
                    <td>
                      <div className="priority-cell">
                        <span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>{(t.priority || 'medium').toString()}</span>
                        <select 
                          value={(t.priority || 'medium').toLowerCase()} 
                          onChange={(e) => handlePriorityChange(t.id, e.target.value)}
                          disabled={actionLoading}
                        >
                          {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`status-badge ${String(t.status || 'open').toLowerCase().replace(/\s+/g,'-')}`}>{t.status}</span>
                        <select 
                          value={t.status || 'Open'} 
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          disabled={actionLoading}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>{t.created_at}</td>
                    <td>
                      {t.reply_message ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{t.reply_message}</div>
                      ) : (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => { setReplyFor(t); setReplyMessage(''); setShowModal(true); }}
                          disabled={actionLoading}
                        >
                          Reply
                        </button>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDelete(t.id)}
                        disabled={actionLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PagificationContainer>
      )}

      {replyFor && (
        <></>
      )}

      {showModal && replyFor && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true">
            <h4>Reply to #{replyFor.id} — {replyFor.user_name} ({replyFor.user_email})</h4>
            <div className="notice">This reply will send an email to the user's email address. If the ticket belongs to a registered user, an in-app notification will also be created informing them the ticket was replied to or resolved.</div>
            <textarea 
              value={replyMessage} 
              onChange={(e) => setReplyMessage(e.target.value)} 
              placeholder="Type your reply here..."
              disabled={actionLoading}
            />
            <div className="actions">
              <button 
                className="btn btn-primary" 
                onClick={handleReplySend}
                disabled={actionLoading}
              >
                {actionLoading ? 'Sending...' : 'Send Reply'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowModal(false); setReplyMessage(''); setReplyFor(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
