import React, { useEffect } from 'react';
import { Bell, CloudLightning, MessageSquare, Calendar } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

export const NotificationsView: React.FC = () => {
  const { notifications, sendNotificationFeedback, markNotificationsAsRead } = useAppState();

  // Mark all notifications as read when the user views this page
  useEffect(() => {
    markNotificationsAsRead();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudLightning className="w-5 h-5 text-red-600" />;
      case 'catch_feedback':
        return <MessageSquare className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'bg-red-50/50 border-red-100';
      case 'catch_feedback':
        return 'bg-teal-50/40 border-teal-100';
      default:
        return 'bg-white border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pb-24 overflow-y-auto">
      <div className="w-full max-w-md mt-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-8 h-8 text-teal-600" />
          <div>
            <h2 className="text-3xl font-black text-slate-900">Notifications</h2>
            <p className="text-slate-500 text-xs mt-0.5">Inbox for storm notices, catch surveys, and cooperative logs.</p>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notif) => {
            const dateStr = new Date(notif.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
            const timeStr = new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-3xl border shadow-xs space-y-3 transition-all ${getBgColor(notif.type)}`}
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr} at {timeStr}</span>
                      </div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 animate-pulse" />
                  )}
                </div>

                {/* Text Content */}
                <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap bg-white/70 p-3 rounded-2xl border border-slate-100/50">
                  {notif.text}
                </p>

                {/* Feedback options block */}
                {notif.isInteractive && !notif.selectedValue && (
                  <div className="space-y-2 pt-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Submit Catch Feedback</label>
                    <div className="grid grid-cols-3 gap-2">
                      {notif.options?.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => sendNotificationFeedback(notif.id, opt.value, opt.label)}
                          className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-[10px] font-bold transition-all shadow-xs text-center cursor-pointer"
                        >
                          [{opt.value}] {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
