'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaBriefcase, FaBuilding, FaMoneyBillWave, FaBookmark, FaClock, FaExternalLinkAlt, FaCalendarPlus } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import { jobsAPI, userAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Job type definition
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_range: string;
  job_type: string;
  url: string;
  created_at: string;
  is_external: boolean;
  source: string;
}

export default function JobDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  
  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await jobsAPI.getJob(Number(id));
        setJob(response.data);
      } catch (err) {
        setError('Failed to fetch job details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [id]);
  
  // Check if job is bookmarked
  useEffect(() => {
    if (isAuthenticated && user?.role === 'candidate') {
      const checkBookmark = async () => {
        try {
          const response = await userAPI.getBookmarks();
          const bookmarkedJobIds = response.data.map((bookmark: any) => bookmark.job_id);
          setIsBookmarked(bookmarkedJobIds.includes(Number(id)));
        } catch (err) {
          console.error('Failed to fetch bookmarks:', err);
        }
      };
      
      checkBookmark();
    }
  }, [isAuthenticated, user, id]);
  
  // Handle bookmark toggle
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    try {
      if (isBookmarked) {
        await userAPI.removeBookmark(Number(id));
        setIsBookmarked(false);
      } else {
        await userAPI.addBookmark(Number(id));
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Failed to update bookmark:', err);
    }
  };
  
  // Handle reminder creation
  const handleCreateReminder = async () => {
    if (!reminderDate) return;
    
    try {
      await userAPI.addReminder({
        job_id: Number(id),
        remind_at: new Date(reminderDate).toISOString(),
      });
      setShowReminderModal(false);
      setReminderDate('');
      alert('Reminder set successfully!');
    } catch (err) {
      console.error('Failed to create reminder:', err);
      alert('Failed to set reminder. Please try again.');
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-600">Loading job details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : job ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <div className="mt-2 flex items-center text-gray-500">
                      <FaBuilding className="mr-1 h-5 w-5" />
                      <span className="text-lg">{job.company}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isAuthenticated && user?.role === 'candidate' && (
                      <>
                        <button
                          onClick={handleBookmark}
                          className={`p-2 rounded-md flex items-center ${
                            isBookmarked
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <FaBookmark className="h-5 w-5 mr-1" />
                          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                        </button>
                        <button
                          onClick={() => setShowReminderModal(true)}
                          className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center"
                        >
                          <FaCalendarPlus className="h-5 w-5 mr-1" />
                          <span>Set Reminder</span>
                        </button>
                      </>
                    )}
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                      >
                        <FaExternalLinkAlt className="h-5 w-5 mr-1" />
                        <span>Apply Now</span>
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {job.location && (
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p>{job.location}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.job_type && (
                    <div className="flex items-center text-gray-600">
                      <FaBriefcase className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Job Type</p>
                        <p>{job.job_type}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.salary_range && (
                    <div className="flex items-center text-gray-600">
                      <FaMoneyBillWave className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Salary Range</p>
                        <p>{job.salary_range}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
                  <div className="mt-2 prose prose-blue max-w-none text-gray-600">
                    {/* Render HTML content safely */}
                    <div dangerouslySetInnerHTML={{ __html: job.description }} />
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaClock className="mr-1 h-4 w-4" />
                      <span>Posted {formatDate(job.created_at)}</span>
                      {job.is_external && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          via {job.source}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => router.back()}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Back to Jobs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Job not found.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Set Reminder</h2>
            <p className="text-gray-600 mb-4">
              Choose when you'd like to be reminded about this job:
            </p>
            <input
              type="datetime-local"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReminder}
                disabled={!reminderDate}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
