'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBriefcase, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { organizationAPI } from '@/lib/api';

// Types
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  created_at: string;
  is_approved: boolean;
}

interface Organization {
  id: number;
  name: string;
  description: string;
  website: string;
  logo_url: string;
}

export default function OrganizationDashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not authenticated or not an organization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'organization') {
      if (user?.role === 'candidate') {
        router.push('/dashboard');
      } else if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);
  
  // Fetch organization profile and jobs
  useEffect(() => {
    if (isAuthenticated && user?.role === 'organization') {
      const fetchOrganizationData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch organization profile
          const profileResponse = await organizationAPI.getProfile();
          setOrganization(profileResponse.data);
          
          // Fetch organization jobs
          const jobsResponse = await organizationAPI.getJobs();
          setJobs(jobsResponse.data);
        } catch (err) {
          setError('Failed to fetch organization data. Please try again later.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrganizationData();
    }
  }, [isAuthenticated, user]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated || user?.role !== 'organization') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your organization profile and job listings</p>
            </div>
            <Link
              href="/organization/jobs/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Post New Job
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-600">Loading organization data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {/* Organization Profile */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg leading-6 font-medium text-gray-900">Organization Profile</h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about your organization</p>
                  </div>
                  <Link
                    href="/organization/profile/edit"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaEdit className="mr-1 h-4 w-4" />
                    Edit Profile
                  </Link>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Organization name</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {organization?.name || 'Not set'}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {organization?.description || 'Not set'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Website</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {organization?.website ? (
                          <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            {organization.website}
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Job Listings */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Your Job Listings</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your posted jobs</p>
                </div>
                <div className="border-t border-gray-200">
                  {jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <FaBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No job listings</h3>
                      <p className="mt-1 text-gray-500">Get started by creating a new job listing.</p>
                      <div className="mt-6">
                        <Link
                          href="/organization/jobs/new"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FaPlus className="mr-2 h-4 w-4" />
                          Post New Job
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Job Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Location
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Posted Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {jobs.map((job) => (
                            <tr key={job.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{job.location || 'Not specified'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{job.job_type || 'Not specified'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{formatDate(job.created_at)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  job.is_approved
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {job.is_approved ? 'Approved' : 'Pending Approval'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Link
                                    href={`/jobs/${job.id}`}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <FaEye className="h-5 w-5" />
                                  </Link>
                                  <Link
                                    href={`/organization/jobs/${job.id}/edit`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <FaEdit className="h-5 w-5" />
                                  </Link>
                                  <button
                                    className="text-red-600 hover:text-red-900"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this job?')) {
                                        // Delete job logic would go here
                                        alert('Job deletion would happen here');
                                      }
                                    }}
                                  >
                                    <FaTrash className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
