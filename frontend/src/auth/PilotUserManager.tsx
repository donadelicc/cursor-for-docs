'use client';

import React, { useState, useEffect } from 'react';
import {
  getAllPilotUsers,
  addPilotUser,
  updatePilotUser,
  removePilotUser,
} from '@/utils/firestore';
import { PilotUser, CreatePilotUserData } from '@/types/editor';

interface PilotUserManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PilotUserManager: React.FC<PilotUserManagerProps> = ({ isOpen, onClose }) => {
  const [pilotUsers, setPilotUsers] = useState<PilotUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserNotes, setNewUserNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPilotUsers();
    }
  }, [isOpen]);

  const loadPilotUsers = async () => {
    setLoading(true);
    try {
      const users = await getAllPilotUsers();
      setPilotUsers(users);
    } catch (error) {
      console.error('Error loading pilot users:', error);
      setError('Failed to load pilot users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newUserData: CreatePilotUserData = {
        email: newUserEmail.trim(),
        displayName: newUserDisplayName.trim() || undefined,
        addedBy: 'admin', // You can get this from current user context
        notes: newUserNotes.trim() || undefined,
      };

      await addPilotUser(newUserData);
      await loadPilotUsers(); // Reload the list

      // Clear form
      setNewUserEmail('');
      setNewUserDisplayName('');
      setNewUserNotes('');
    } catch (error) {
      console.error('Error adding pilot user:', error);
      setError('Failed to add pilot user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (user: PilotUser) => {
    setLoading(true);
    try {
      await updatePilotUser(user.id, { isActive: !user.isActive });
      await loadPilotUsers(); // Reload the list
    } catch (error) {
      console.error('Error updating pilot user:', error);
      setError('Failed to update pilot user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this pilot user?')) {
      return;
    }

    setLoading(true);
    try {
      await removePilotUser(userId);
      await loadPilotUsers(); // Reload the list
    } catch (error) {
      console.error('Error removing pilot user:', error);
      setError('Failed to remove pilot user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Pilot User Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Add New User Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Add New Pilot User</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newUserDisplayName}
                  onChange={(e) => setNewUserDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newUserNotes}
                  onChange={(e) => setNewUserNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes about this user"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>

          {/* Pilot Users List */}
          <div>
            <h3 className="text-lg font-medium mb-3">Current Pilot Users ({pilotUsers.length})</h3>
            {loading && pilotUsers.length === 0 ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading pilot users...</p>
              </div>
            ) : pilotUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pilot users found.</p>
            ) : (
              <div className="space-y-2">
                {pilotUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 border rounded-lg ${
                      user.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {user.displayName && (
                          <p className="text-sm text-gray-600">{user.displayName}</p>
                        )}
                        {user.notes && <p className="text-sm text-gray-500 mt-1">{user.notes}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          Added: {user.addedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleUser(user)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm rounded ${
                            user.isActive
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } disabled:opacity-50`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilotUserManager;
