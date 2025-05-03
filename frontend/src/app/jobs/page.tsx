'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaBuilding, FaBookmark, FaClock } from 'react-icons/fa';
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
  created_at: string;
  is_external: boolean;
  source: string;
}

export default function Jobs() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<number[]>([]);
  
  // Search filters
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState(searchParams.get('job_type') || '');
  const [company, setCompany] = useState(searchParams.get('company') || '');

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query params
        const params: Record<string, string> = {};
        if (title) params.title = title;
        if (location) params.location = location;
        if (jobType) params.job_type = jobType;
        if (company) params.company = company;
        
        const response = await jobsAPI.getJobs(params);
        setJobs(response.data);
      } catch (err) {
        setError('Failed to fetch jobs. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [title, location, jobType, company]);
  
  // Fetch bookmarked jobs if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role === 'candidate') {
      const fetchBookmarks = async () => {
        try {
          const response = await userAPI.getBookmarks();
          setBookmarkedJobs(response.data.map((bookmark: any) => bookmark.job_id));
        } catch (err) {
          console.error('Failed to fetch bookmarks:', err);
        }
      };
      
      fetchBookmarks();
    }
  }, [isAuthenticated, user]);
  
  // Handle bookmark toggle
  const handleBookmark = async (jobId: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    try {
      if (bookmarkedJobs.includes(jobId)) {
        await userAPI.removeBookmark(jobId);
        setBookmarkedJobs(bookmarkedJobs.filter(id => id !== jobId));
      } else {
        await userAPI.addBookmark(jobId);
        setBookmarkedJobs([...bookmarkedJobs, jobId]);
      }
    } catch (err) {
      console.error('Failed to update bookmark:', err);
    }
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search params
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (location) params.set('location', location);
    if (jobType) params.set('job_type', jobType);
    if (company) params.set('company', company);
    
    router.push(`/jobs?${params.toString()}`);
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
            <p className="mt-2 text-gray-600">Browse job listings from multiple sources</p>
          </div>
          
          {/* Search filters */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title or Keywords
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Job title or keywords"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="City, state, or remote"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Company name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="job-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBriefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="job-type"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">All Job Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Search Jobs
                </button>
              </div>
            </form>
          </div>
          
          {/* Job listings */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="spinner"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No jobs found matching your criteria.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          <Link href={`/jobs/${job.id}`} className="hover:text-blue-600">
                            {job.title}
                          </Link>
                        </h2>
                        <div className="mt-1 flex items-center text-gray-500">
                          <FaBuilding className="mr-1 h-4 w-4" />
                          <span>{job.company}</span>
                          {job.location && (
                            <>
                              <span className="mx-2">•</span>
                              <FaMapMarkerAlt className="mr-1 h-4 w-4" />
                              <span>{job.location}</span>
                            </>
                          )}
                          {job.job_type && (
                            <>
                              <span className="mx-2">•</span>
                              <FaBriefcase className="mr-1 h-4 w-4" />
                              <span>{job.job_type}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        {isAuthenticated && user?.role === 'candidate' && (
                          <button
                            onClick={() => handleBookmark(job.id)}
                            className={`p-2 rounded-full ${
                              bookmarkedJobs.includes(job.id)
                                ? 'text-blue-600 hover:text-blue-800'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            aria-label={bookmarkedJobs.includes(job.id) ? 'Remove bookmark' : 'Add bookmark'}
                          >
                            <FaBookmark className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-gray-600 line-clamp-3">{job.description}</p>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaClock className="mr-1 h-4 w-4" />
                        <span>Posted {formatDate(job.created_at)}</span>
                        {job.is_external && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            via {job.source}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
