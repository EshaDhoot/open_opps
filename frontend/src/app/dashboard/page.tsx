'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBookmark, FaBell, FaTrash, FaExternalLinkAlt, FaEdit } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';

// Types
interface Bookmark {
  id: number;
  job_id: number;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    job_type: string;
    created_at: string;
  };
}

interface Reminder {
  id: number;
  job_id: number;
  remind_at: string;
  is_sent: boolean;
  job: {
    id: number;
    title: string;
    company: string;
  };
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not authenticated or not a candidate
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'candidate') {
      if (user?.role === 'organization') {
        router.push('/organization/dashboard');
      } else if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);
  
  // Fetch bookmarks
  useEffect(() => {
    if (isAuthenticated && user?.role === 'candidate') {
      const fetchBookmarks = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await userAPI.getBookmarks();
          setBookmarks(response.data);
        } catch (err) {
          setError('Failed to fetch bookmarks. Please try again later.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchBookmarks();
    }
  }, [isAuthenticated, user]);
  
  // Fetch reminders
  useEffect(() => {
    if (isAuthenticated && user?.role === 'candidate' && activeTab === 'reminders') {
      const fetchReminders = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await userAPI.getReminders();
          setReminders(response.data);
        } catch (err) {
          setError('Failed to fetch reminders. Please try again later.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchReminders();
    }
  }, [isAuthenticated, user, activeTab]);
  
  // Handle remove bookmark
  const handleRemoveBookmark = async (bookmarkId: number) => {
    try {
      await userAPI.removeBookmark(bookmarkId);
      setBookmarks(bookmarks.filter(bookmark => bookmark.job_id !== bookmarkId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };
  
  // Handle delete reminder
  const handleDeleteReminder = async (reminderId: number) => {
    try {
      await userAPI.deleteReminder(reminderId);
      setReminders(reminders.filter(reminder => reminder.id !== reminderId));
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || user?.role !== 'candidate') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Candidate Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your bookmarked jobs and reminders</p>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`${
                  activeTab === 'bookmarks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FaBookmark className="mr-2 h-5 w-5" />
                Bookmarked Jobs
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`${
                  activeTab === 'reminders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FaBell className="mr-2 h-5 w-5" />
                Reminders
              </button>
            </nav>
          </div>
          
          {/* Content */}
          {activeTab === 'bookmarks' ? (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="spinner"></div>
                  <p className="mt-4 text-gray-600">Loading bookmarks...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : bookmarks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <FaBookmark className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No bookmarked jobs</h3>
                  <p className="mt-1 text-gray-500">You haven't bookmarked any jobs yet.</p>
                  <div className="mt-6">
                    <Link
                      href="/jobs"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {bookmarks.map((bookmark) => (
                      <li key={bookmark.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/jobs/${bookmark.job.id}`}
                                className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate"
                              >
                                {bookmark.job.title}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">
                                {bookmark.job.company}
                                {bookmark.job.location && ` • ${bookmark.job.location}`}
                                {bookmark.job.job_type && ` • ${bookmark.job.job_type}`}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/jobs/${bookmark.job.id}`}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <FaExternalLinkAlt className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleRemoveBookmark(bookmark.job.id)}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Bookmarked on {formatDate(bookmark.job.created_at)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="spinner"></div>
                  <p className="mt-4 text-gray-600">Loading reminders...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <FaBell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No reminders set</h3>
                  <p className="mt-1 text-gray-500">You haven't set any reminders for job applications.</p>
                  <div className="mt-6">
                    <Link
                      href="/jobs"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {reminders.map((reminder) => (
                      <li key={reminder.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/jobs/${reminder.job.id}`}
                                className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate"
                              >
                                {reminder.job.title}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">
                                {reminder.job.company}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/jobs/${reminder.job.id}`}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <FaExternalLinkAlt className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteReminder(reminder.id)}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            <span className={reminder.is_sent ? 'text-gray-500' : 'text-green-600 font-medium'}>
                              {reminder.is_sent ? 'Reminder sent on' : 'Reminder set for'}
                            </span>{' '}
                            {formatDate(reminder.remind_at)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
