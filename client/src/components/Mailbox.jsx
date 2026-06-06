import React, { useState, useEffect } from 'react';

export default function Mailbox({ mailbox, onMailboxUpdate, userId }) {
  const [selectedMail, setSelectedMail] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookedSlot, setBookedSlot] = useState(null);

  // Poll mailbox database from express backend every 4 seconds to get async recruiter emails!
  useEffect(() => {
    if (!userId) return;

    const fetchMail = async () => {
      try {
        const response = await fetch(`${window.API_BASE_URL}/api/mailbox`, {
          headers: { 'x-user-id': userId }
        });
        const data = await response.json();
        if (response.ok) {
          // If we received new mail, update mailbox state
          onMailboxUpdate(data);
        }
      } catch (error) {
        console.error("Failed to fetch mail:", error);
      }
    };

    fetchMail();
    const interval = setInterval(fetchMail, 4000);
    return () => clearInterval(interval);
  }, [userId]);

  // Handle opening an email
  const handleSelectMail = (mail) => {
    setSelectedMail(mail);
    setShowCalendar(false);
    
    // Mark as read locally in UI state if needed
    onMailboxUpdate(prev => 
      prev.map(m => m.id === mail.id ? { ...m, read: true } : m)
    );
  };

  const handleBookSlot = (slot) => {
    setBookedSlot(slot);
    setTimeout(() => {
      setShowCalendar(false);
      alert(`Interview successfully scheduled for ${slot}! Confirmation sent.`);
    }, 1000);
  };

  const mockTimeSlots = [
    "Mon, Jun 12 - 10:00 AM",
    "Mon, Jun 12 - 2:00 PM",
    "Tue, Jun 13 - 11:30 AM",
    "Wed, Jun 14 - 3:30 PM",
    "Thu, Jun 15 - 9:00 AM"
  ];

  return (
    <div className="tab-content">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2.2rem' }}>AI AutoApply Mailbox</h1>
        <p style={{ color: 'var(--text-muted)' }}>View system application receipts and submission logs delivered to your inbox.</p>
      </div>

      <div className="mailbox-layout">
        {/* Email Index List */}
        <div className="mail-list">
          <div className="mail-list-header">
            Inbox ({mailbox.length})
          </div>
          {mailbox.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dark)', fontSize: '0.9rem' }}>
              No notifications yet. Applied jobs will trigger confirmation receipts here.
            </div>
          ) : (
            mailbox.map((mail) => {
              const isSelected = selectedMail && selectedMail.id === mail.id;
              const isUnread = !mail.read;

              return (
                <div 
                  key={mail.id} 
                  className={`mail-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectMail(mail)}
                >
                  {isUnread && <span className="unread-dot"></span>}
                  <div className="mail-item-top">
                    <span className="mail-item-sender">AI AutoApply</span>
                    <span>
                      {new Date(mail.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mail-item-subject" style={{ fontWeight: isUnread ? 'bold' : 'normal' }}>
                    {mail.subject}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Email Detail Reader */}
        <div className="mail-reading-pane">
          {!selectedMail ? (
            <div className="mailbox-empty">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l8-4A2 2 0 0113 5.4l8 4A2 2 0 0121.89 11v8.93a2 2 0 01-1 1.732l-8 4a2 2 0 01-1.78 0l-8-4a2 2 0 01-1-1.732z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10l9 7 9-7" />
              </svg>
              <p>Select a message to view details and options.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="mail-details-header">
                <div className="mail-header-row">
                  <h2 style={{ fontSize: '1.2rem' }}>{selectedMail.subject}</h2>
                  <span className="badge badge-success">
                    Application Confirmed
                  </span>
                </div>
                <div className="mail-header-row" style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>From: <strong>{selectedMail.from}</strong></span>
                  <span>Received: {new Date(selectedMail.receivedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Email Body */}
              <div className="mail-body">
                {selectedMail.body}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
