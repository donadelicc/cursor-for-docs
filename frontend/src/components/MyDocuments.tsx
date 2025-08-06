"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDocuments, deleteDocument } from "@/utils/firestore";
import { Document } from "@/types/editor";

export default function MyDocuments() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userDocs = await getUserDocuments(currentUser.uid);
      setDocuments(userDocs);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadDocuments();
    }
  }, [currentUser, loadDocuments]);

  const handleDocumentClick = (doc: Document) => {
    router.push(`/document?id=${doc.id}`);
  };

  const handleNewDocument = () => {
    router.push("/document");
  };

  const handleDeleteDocument = async (
    documentId: string,
    documentTitle: string,
  ) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${documentTitle}"? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      await deleteDocument(documentId);
      setDocuments(documents.filter((doc) => doc.id !== documentId));
      setShowOptionsMenu(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error deleting document. Please try again.");
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Less than 2 minutes ago
    if (diffMinutes < 2) return "Now";

    // Less than 60 minutes ago
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    // Less than 24 hours ago
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

    // Exactly 1 day ago
    if (diffDays === 1) return "Yesterday";

    // Less than 7 days ago
    if (diffDays < 7) return `${diffDays} days ago`;

    // More than 7 days ago - show exact date
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Remove unused function since we now use inline icons

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Header with New Document Button - Fixed */}
      <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Documents
            </h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <svg
                className="w-4 h-4 mr-1.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {documents.length}{" "}
              {documents.length === 1 ? "document" : "documents"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewDocument}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New
            </button>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
                title="List view"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
                title="Grid view"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "list" ? (
          /* List View */
          <div className="h-full flex flex-col">
            {/* Table Header - Sticky */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200 flex-shrink-0 sticky top-0 z-10">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 flex items-center text-sm font-bold text-gray-800">
                  <div className="w-8 h-8 flex items-center justify-center mr-4">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span>Name</span>
                </div>
                <div className="col-span-3 flex items-center text-sm font-bold text-gray-800">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Last Modified
                </div>
                <div className="col-span-2 flex items-center text-sm font-bold text-gray-800">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Owner
                </div>
                <div className="col-span-1"></div>
              </div>
            </div>

            {/* Documents List - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-blue-600"></div>
                        <div className="absolute inset-0 rounded-full h-10 w-10 border-3 border-transparent border-l-blue-600 animate-pulse"></div>
                      </div>
                      <p className="text-sm font-medium text-gray-600 mt-4">
                        Loading your documents...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        This should only take a moment
                      </p>
                    </div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="max-w-sm mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg
                          className="w-10 h-10 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        No documents yet
                      </h3>
                      <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                        Start your writing journey by creating your first
                        document. All your work will be automatically saved and
                        appear here.
                      </p>
                      <button
                        onClick={handleNewDocument}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Create your first document
                      </button>
                    </div>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc)}
                      className="group px-6 py-4 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-6 flex items-center min-w-0">
                          <div className="flex-shrink-0 mr-4">
                            <div className="w-8 h-8 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-900 transition-colors">
                              {doc.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Document
                            </p>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-gray-600 font-medium">
                            {formatDate(doc.lastModified)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center">
                            {currentUser?.photoURL ? (
                              <Image
                                src={currentUser.photoURL}
                                alt={currentUser.displayName || "User"}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full mr-2"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-2">
                                <span className="text-xs font-semibold text-white">
                                  {currentUser?.displayName?.charAt(0) ||
                                    currentUser?.email?.charAt(0) ||
                                    "U"}
                                </span>
                              </div>
                            )}
                            <span className="text-sm text-gray-600 font-medium">
                              me
                            </span>
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end relative">
                          <button
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-200 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOptionsMenu(
                                showOptionsMenu === doc.id ? null : doc.id!,
                              );
                            }}
                          >
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" />
                            </svg>
                          </button>

                          {/* Options Dropdown */}
                          {showOptionsMenu === doc.id && (
                            <div className="absolute right-0 top-full mt-1 w-10 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id!, doc.title);
                                }}
                                className="flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete document"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="h-full overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 rounded-full h-10 w-10 border-3 border-transparent border-l-blue-600 animate-pulse"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mt-4">
                    Loading your documents...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This should only take a moment
                  </p>
                </div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="max-w-sm mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No documents yet
                  </h3>
                  <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                    Start your writing journey by creating your first document.
                    All your work will be automatically saved and appear here.
                  </p>
                  <button
                    onClick={handleNewDocument}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create your first document
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-pointer transition-all duration-200 hover:border-blue-300"
                  >
                    {/* Document Name - Top */}
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                    </div>

                    <div className="relative">
                      {/* Document Preview */}
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded border border-gray-200 flex items-center justify-center mb-3 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
                        <svg
                          className="w-8 h-8 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>

                      {/* Options Button */}
                      <button
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-white rounded shadow-sm hover:bg-gray-50 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOptionsMenu(
                            showOptionsMenu === doc.id ? null : doc.id!,
                          );
                        }}
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" />
                        </svg>
                      </button>

                      {/* Options Dropdown */}
                      {showOptionsMenu === doc.id && (
                        <div className="absolute top-8 right-1 w-8 bg-white rounded shadow-lg border border-gray-200 p-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id!, doc.title);
                            }}
                            className="flex items-center justify-center w-6 h-6 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete document"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(doc.lastModified)}</span>
                      <div className="flex items-center">
                        {currentUser?.photoURL ? (
                          <Image
                            src={currentUser.photoURL}
                            alt={currentUser.displayName || "User"}
                            width={16}
                            height={16}
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-[8px] font-semibold text-white">
                              {currentUser?.displayName?.charAt(0) ||
                                currentUser?.email?.charAt(0) ||
                                "U"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close options menu */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptionsMenu(null)}
        />
      )}
    </div>
  );
}
