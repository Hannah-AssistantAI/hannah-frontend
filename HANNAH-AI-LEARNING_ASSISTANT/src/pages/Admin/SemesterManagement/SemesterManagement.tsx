import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import type { Semester } from '../../../types';
import { mockSemesters } from '../../../data/mockSemesters';
import AdminPageWrapper from '../components/AdminPageWrapper';
import './SemesterManagement.css';

const SemesterManagement: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    setSemesters(mockSemesters);
  }, []);

  const handleCreate = () => {
    setEditingSemester(null);
    setFormData({
      name: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
      setSemesters(semesters.filter(s => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSemester) {
      // Update existing semester
      setSemesters(semesters.map(s =>
        s.id === editingSemester.id
          ? {
            ...s,
            ...formData
          }
          : s
      ));
    } else {
      // Create new semester
      const newSemester: Semester = {
        id: Math.max(...semesters.map(s => s.id)) + 1,
        ...formData
      };
      setSemesters([...semesters, newSemester]);
    }

    setIsModalOpen(false);
  };

  return (
    <AdminPageWrapper title="Semester Management">
      <div className="semester-header">
        <p className="semester-description">
          Manage semesters to create course roadmaps
        </p>
        <button className="btn-add-semester" onClick={handleCreate}>
          <Plus size={16} />
          Add Semester
        </button>
      </div>

      <div className="semester-list">
        {semesters.map((semester) => (
          <div key={semester.id} className="semester-item">
            <div className="semester-info">
              <h3 className="semester-name">{semester.name}</h3>
              <span className="semester-id">ID: {semester.id}</span>
            </div>
            <div className="semester-actions">
              <button
                className="action-btn edit-btn"
                onClick={() => handleEdit(semester)}
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => handleDelete(semester.id)}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {semesters.length === 0 && (
          <div className="empty-state">
            <p>No semesters yet. Add your first semester!</p>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingSemester ? 'Edit Semester' : 'Add New Semester'}</h2>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Semester Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="e.g. Semester 1"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSemester ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default SemesterManagement;
