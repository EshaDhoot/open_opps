'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUsers, FaBriefcase, FaBuilding, FaCheck, FaTimes, FaTrash, FaEye, FaEdit } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';

// Types
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  created_at: string;
  is_approved: boolean;
  is_external: boolean;
  source: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Organization {
  id: number;
  name: string;
  user_id: number;
  user: {
    name: string;
    email: string;
  };
  created_at: string;
}

export default function AdminDashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'admin') {
      if (user?.role === 'candidate') {
        router.push('/dashboard');
      } else if (user?.role === 'organization') {
        router.push('/organization/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);
  
  // Fetch data based on active tab
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          if (activeTab === 'jobs') {
            const response = await adminAPI.getJobs();
            setJobs(response.data);
          } else if (activeTab === 'users') {
            const response = await adminAPI.getUsers();
            setUsers(response.data);
          } else if (activeTab === 'organizations') {
            const response = await adminAPI.getOrganizations();
            setOrganizations(response.data);
          }
        } catch (err) {
          setError(`Failed to fetch ${activeTab}. Please try again later.`);
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isAuthenticated, user, activeTab]);
  
  // Handle job approval
  const handleApproveJob = async (jobId: number) => {
    try {
      await adminAPI.approveJob(jobId);
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, is_approved: true } : job
      ));
    } catch (err) {
      console.error('Failed to approve job:', err);
    }
  };
  
  // Handle job rejection
  const handleRejectJob = async (jobId: number) => {
    try {
      await adminAPI.rejectJob(jobId);
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, is_approved: false } : job
      ));
    } catch (err) {
      console.error('Failed to reject job:', err);
    }
  };
  
  // Handle job deletion
  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await adminAPI.deleteJob(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };
  
  // Handle organization deletion
  const handleDeleteOrganization = async (orgId: number) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return;
    
    try {
      await adminAPI.deleteOrganization(orgId);
      setOrganizations(organizations.filter(org => org.id !== orgId));
    } catch (err) {
      console.error('Failed to delete organization:', err);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage jobs, users, and organizations</p>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FaBriefcase className="mr-2 h-5 w-5" />
                Jobs
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FaUsers className="mr-2 h-5 w-5" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('organizations')}
                className={`${
                  activeTab === 'organizations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FaBuilding className="mr-2 h-5 w-5" />
                Organizations
              </button>
            </nav>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-600">Loading data...</p>
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
            <>
              {/* Jobs Tab */}
              {activeTab === 'jobs' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">Job Listings</h2>
                  </div>
                  <div className="border-t border-gray-200">
                    {jobs.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No jobs found.</p>
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
                                Company
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Source
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
                                  <div className="text-sm text-gray-500">{job.company}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {job.is_external ? job.source : 'Internal'}
                                  </div>
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
                                    {!job.is_approved && (
                                      <button
                                        onClick={() => handleApproveJob(job.id)}
                                        className="text-green-600 hover:text-green-900"
                                      >
                                        <FaCheck className="h-5 w-5" />
                                      </button>
                                    )}
                                    {job.is_approved && (
                                      <button
                                        onClick={() => handleRejectJob(job.id)}
                                        className="text-yellow-600 hover:text-yellow-900"
                                      >
                                        <FaTimes className="h-5 w-5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteJob(job.id)}
                                      className="text-red-600 hover:text-red-900"
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
              )}
              
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">Users</h2>
                  </div>
                  <div className="border-t border-gray-200">
                    {users.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No users found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Joined Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.role === 'admin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : user.role === 'organization'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{formatDate(user.created_at)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <Link
                                      href={`/admin/users/${user.id}`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      <FaEye className="h-5 w-5" />
                                    </Link>
                                    <Link
                                      href={`/admin/users/${user.id}/edit`}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      <FaEdit className="h-5 w-5" />
                                    </Link>
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-red-600 hover:text-red-900"
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
              )}
              
              {/* Organizations Tab */}
              {activeTab === 'organizations' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">Organizations</h2>
                  </div>
                  <div className="border-t border-gray-200">
                    {organizations.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No organizations found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Organization Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Owner
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {organizations.map((org) => (
                              <tr key={org.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{org.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{org.user.name}</div>
                                  <div className="text-sm text-gray-500">{org.user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{formatDate(org.created_at)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <Link
                                      href={`/admin/organizations/${org.id}`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      <FaEye className="h-5 w-5" />
                                    </Link>
                                    <Link
                                      href={`/admin/organizations/${org.id}/edit`}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      <FaEdit className="h-5 w-5" />
                                    </Link>
                                    <button
                                      onClick={() => handleDeleteOrganization(org.id)}
                                      className="text-red-600 hover:text-red-900"
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
