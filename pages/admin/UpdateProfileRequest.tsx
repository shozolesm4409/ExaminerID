import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

interface UpdateRequest {
  id: string;
  examinerId: string;
  originalData: ExaminerData;
  updatedData: Partial<ExaminerData>;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  hscRoll: string;
  hscReg: string;
  nickName: string;
  mobileNumber: string;
}

const UpdateProfileRequest: React.FC = () => {
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'updateRequests'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as UpdateRequest));
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: UpdateRequest) => {
    if (!req.examinerId) {
        alert("Error: Invalid Examiner ID");
        return;
    }
    if (!window.confirm("Are you sure you want to approve this update? This will overwrite the examiner's profile.")) return;
    
    setProcessing(true);
    try {
      // 1. Prepare data for update
      // Remove 'id' from updatedData to prevent writing it as a field
      const { id, ...dataToUpdate } = req.updatedData;
      
      // Add last update date
      const finalUpdateData = {
          ...dataToUpdate,
          lastUpdateDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };

      // 2. Update the examiner document
      const examinerRef = doc(db, 'examiners', req.examinerId);
      await updateDoc(examinerRef, finalUpdateData);

      // 3. Delete the request
      await deleteDoc(doc(db, 'updateRequests', req.id));

      alert("Profile updated successfully!");
      setSelectedRequest(null);
      fetchRequests(); // Refresh list
    } catch (error: any) {
      console.error("Error approving request:", error);
      alert("Failed to approve: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (req: UpdateRequest) => {
    if (!window.confirm("Are you sure you want to reject (delete) this request?")) return;

    setProcessing(true);
    try {
      await deleteDoc(doc(db, 'updateRequests', req.id));
      alert("Request rejected and removed.");
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const renderDiff = (req: UpdateRequest) => {
    const keys = Object.keys(req.updatedData) as Array<keyof ExaminerData>;
    // Filter out keys that haven't changed or are metadata
    const changedKeys = keys.filter(key => {
        const val1 = req.updatedData[key];
        const val2 = req.originalData[key];
        
        if (val1 === val2) return false;
        
        // Handle Firestore Timestamp comparison or other objects
        if (val1 && val2 && typeof val1 === 'object' && typeof val2 === 'object') {
            // Check for Firestore Timestamp-like objects (seconds, nanoseconds)
            if ('seconds' in val1 && 'seconds' in val2) {
                return (val1 as any).seconds !== (val2 as any).seconds || (val1 as any).nanoseconds !== (val2 as any).nanoseconds;
            }
            return JSON.stringify(val1) !== JSON.stringify(val2);
        }
        
        return true;
    });

    if (changedKeys.length === 0) return <p className="text-gray-500 italic">No changes detected.</p>;

    return (
      <table className="w-full border-collapse border border-gray-300 mt-4 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Field</th>
            <th className="border p-2 text-left text-red-600">Original Value</th>
            <th className="border p-2 text-left text-green-600">New Value</th>
          </tr>
        </thead>
        <tbody>
          {changedKeys.map(key => {
             const val1 = req.originalData[key];
             const val2 = req.updatedData[key];
             
             const formatVal = (v: any) => {
                 if (v && typeof v === 'object' && 'seconds' in v) {
                     return `Timestamp(${new Date(v.seconds * 1000).toLocaleString()})`;
                 }
                 return String(v || '');
             };

             return (
                <tr key={key} className="border-b">
                  <td className="border p-2 font-medium">{key}</td>
                  <td className="border p-2 text-red-600 bg-red-50">{formatVal(val1)}</td>
                  <td className="border p-2 text-green-600 bg-green-50">{formatVal(val2)}</td>
                </tr>
             );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold text-brand-900 mb-6">Update Profile Requests</h2>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No pending update requests.</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* List of Requests */}
          <div className="w-full lg:w-80 flex-shrink-0 bg-white shadow rounded-lg overflow-hidden h-fit">
            <div className="bg-gray-100 px-4 py-2 border-b font-bold text-gray-700">Pending Requests</div>
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {requests.map(req => (
                <li 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition ${selectedRequest?.id === req.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="font-bold text-gray-800">{req.nickName}</div>
                  <div className="text-sm text-gray-600">Roll: {req.hscRoll}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(req.timestamp).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Details View */}
          <div className="flex-grow">
            {selectedRequest ? (
              <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Request Details</h3>
                        <p className="text-sm text-gray-500">ID: {selectedRequest.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleReject(selectedRequest)}
                            disabled={processing}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button 
                            onClick={() => handleApprove(selectedRequest)}
                            disabled={processing}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {processing ? 'Processing...' : 'Approve Update'}
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Changes Requested</h4>
                    {renderDiff(selectedRequest)}
                </div>

                <div>
                    <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Full Updated Profile Preview</h4>
                    <div className="bg-gray-50 p-4 rounded text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(selectedRequest.updatedData).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-gray-200 pb-1">
                                <span className="font-medium text-gray-600">{key}:</span>
                                <span className="text-gray-900">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-10 text-center text-gray-500 border border-dashed border-gray-300">
                Select a request from the list to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProfileRequest;
