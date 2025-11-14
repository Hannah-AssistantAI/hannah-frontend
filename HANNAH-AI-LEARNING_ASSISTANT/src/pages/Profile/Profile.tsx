import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    Award,
    BookOpen,
    Settings,
    Bell,
    Shield,
    CreditCard,
    LogOut,
    Edit,
    Camera,
    Save,
    X,
    Sparkles,
    ChevronRight,
    Clock,
    Target,
    TrendingUp,
    CheckCircle
} from 'lucide-react'
import './Profile.css'

// Dựa theo DB schema
interface UserProfile {
    name: string; // từ bảng users
    email: string; // từ bảng users
    role: 'Student' | 'Faculty' | 'Admin';
    avatar: string;
    joinDate: string;

    // Personal Information
    phone?: string;
    date_of_birth?: string;
    bio?: string;

    // Student-specific fields
    student_id?: string;
    student_specialty?: 'SE' | 'IS' | 'AI' | 'DS';

    // Faculty-specific fields
    faculty_specialty?: string;
    years_of_experience?: number;

    // Preferences
    notification_preferences: {
        emailUpdates: boolean;
        appEvents: boolean;
        weeklyReports: boolean;
    };
}

interface LearningStats {
    coursesCompleted: number
    totalHours: number
    currentStreak: number
    totalPoints: number
}

interface ProfileProps {
  embedded?: boolean;
}

export default function Profile({ embedded = false }: ProfileProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile'>('profile')
    const [isEditing, setIsEditing] = useState(false)

    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: 'Lưu Quang Trí',
        email: 'trilqse170000@fpt.edu.vn',
        role: 'Admin', // Change this to 'Faculty' or 'Student' to test different views
        avatar: 'https://ui-avatars.com/api/?name=Luu+Quang+Tri&background=4285F4&color=fff&size=200',
        joinDate: 'Tháng 1, 2024',

        // Personal Information
        phone: '0912345678',
        date_of_birth: '2003-10-25',
        bio: 'Sinh viên năm 3 chuyên ngành Kỹ thuật phần mềm tại Đại học FPT. Đam mê phát triển web và trí tuệ nhân tạo.',

        // Student-specific fields
        student_id: 'SE170000',
        student_specialty: 'SE',

        // Faculty-specific fields (null for student)
        faculty_specialty: undefined,
        years_of_experience: undefined,

        // Preferences
        notification_preferences: {
            emailUpdates: true,
            appEvents: true,
            weeklyReports: false,
        },
    })

    const [editedProfile, setEditedProfile] = useState<UserProfile>(userProfile);
    const fileInputRef = useRef<HTMLInputElement>(null);



    const handleSave = () => {
        setUserProfile(editedProfile)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditedProfile(userProfile)
        setIsEditing(false)
    }

    const handleAvatarChange = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            // Tạo URL tạm thời để xem trước ảnh
            const newAvatarUrl = URL.createObjectURL(file);
            setEditedProfile(prev => ({ ...prev, avatar: newAvatarUrl }));
            // Trong ứng dụng thực tế, bạn sẽ lưu đối tượng `file` này
            // để gửi lên server khi người dùng nhấn "Lưu".
        }
    };

    useEffect(() => {
        const avatarUrl = editedProfile.avatar;

        // Cleanup function to revoke the object URL to prevent memory leaks
        return () => {
            if (avatarUrl && avatarUrl.startsWith('blob:')) {
                URL.revokeObjectURL(avatarUrl);
            }
        };
    }, [editedProfile.avatar]);

    return (
        <div className="profile-page">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
            />
            {/* Header - Conditionally render based on embedded prop */}
            {!embedded && (
            <header className="profile-header">
                    <div className="profile-header-left">
                        <div className="profile-logo" onClick={() => navigate('/learn')}>
                            <Sparkles size={24} className="text-blue-500" />
                            <span className="profile-logo-text">Hannah Assistant</span>
                        </div>
                    </div>
                    <div className="profile-header-right">
                        <button className="profile-back-btn" onClick={() => navigate(-1)}>
                            Quay lại
                        </button>
                    </div>
            </header>
            )}

            <div className={`profile-container ${embedded ? 'embedded' : ''}`}>
                {/* Sidebar */}
                {!embedded && (
                <aside className="profile-sidebar">
                    <div className="profile-nav">
                        <button
                            className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={20} />
                            <span>Thông tin cá nhân</span>
                            <ChevronRight size={18} className="ml-auto" />
                        </button>

                    </div>

                    <div className="profile-sidebar-footer">
                        {user?.role === 'student' && (
                            <button className="profile-logout-btn">
                                <LogOut size={20} />
                                <span>Đăng xuất</span>
                            </button>
                        )}
                    </div>
                </aside>
            )}

                {/* Main Content */}
                <main className="profile-main">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="profile-content">
                            {/* Profile Card */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">Hồ sơ của tôi</h2>
                                    {!isEditing ? (
                                        <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                                            <Edit size={18} />
                                            <span>Chỉnh sửa</span>
                                        </button>
                                    ) : (
                                        <div className="profile-edit-actions">
                                            <button className="profile-save-btn" onClick={handleSave}>
                                                <Save size={18} />
                                                <span>Lưu</span>
                                            </button>
                                            <button className="profile-cancel-btn" onClick={handleCancel}>
                                                <X size={18} />
                                                <span>Hủy</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="profile-card-body">
                                    {/* Avatar Section */}
                                    <div className="profile-avatar-section">
                                        <div className="profile-avatar-wrapper">
                                            <img
                                                src={editedProfile.avatar}
                                                alt="Avatar"
                                                className="profile-avatar-img"
                                            />
                                            {isEditing && (
                                                <button className="profile-avatar-change" onClick={handleAvatarChange}>
                                                    <Camera size={20} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="profile-avatar-info">
                                            <h3 className="profile-name">{userProfile.name}</h3>
                                            <p className="profile-role">{userProfile.role}</p>
                                            <p className="profile-join-date">
                                                <Calendar size={16} />
                                                Tham gia từ {userProfile.joinDate}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Profile Details */}
                                    <div className="profile-details">
                                        <div className="profile-detail-item">
                                            <label className="profile-detail-label">
                                                <Mail size={18} />
                                                Email
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    className="profile-detail-input"
                                                    value={editedProfile.email}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                                                />
                                            ) : (
                                                <p className="profile-detail-value">{userProfile.email}</p>
                                            )}
                                        </div>

                                        <div className="profile-detail-item">
                                            <label className="profile-detail-label">
                                                <Phone size={18} />
                                                Số điện thoại
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    className="profile-detail-input"
                                                    value={editedProfile.phone}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                                />
                                            ) : (
                                                <p className="profile-detail-value">{userProfile.phone}</p>
                                            )}
                                        </div>

                                        <div className="profile-detail-item">
                                            <label className="profile-detail-label">
                                                <Calendar size={18} />
                                                Ngày sinh
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    className="profile-detail-input"
                                                    value={editedProfile.date_of_birth}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                                                />
                                            ) : (
                                                <p className="profile-detail-value">{userProfile.date_of_birth}</p>
                                            )}
                                        </div>

                                        <div className="profile-detail-item">
                                            <label className="profile-detail-label">
                                                <Briefcase size={18} />
                                                Giới thiệu bản thân
                                            </label>
                                            {isEditing ? (
                                                <textarea
                                                    className="profile-detail-textarea"
                                                    value={editedProfile.bio}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                                    rows={3}
                                                />
                                            ) : (
                                                <p className="profile-detail-value">{userProfile.bio}</p>
                                            )}
                                        </div>

                                        {/* Role-specific fields */}
                                        {userProfile.role === 'Student' && (
                                            <>
                                                <div className="profile-detail-item">
                                                    <label className="profile-detail-label">
                                                        <Award size={18} />
                                                        Mã số sinh viên
                                                    </label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            className="profile-detail-input"
                                                            value={editedProfile.student_id || ''}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, student_id: e.target.value })}
                                                        />
                                                    ) : (
                                                        <p className="profile-detail-value">{userProfile.student_id}</p>
                                                    )}
                                                </div>
                                                <div className="profile-detail-item">
                                                    <label className="profile-detail-label">
                                                        <BookOpen size={18} />
                                                        Chuyên ngành
                                                    </label>
                                                    {isEditing ? (
                                                        <select
                                                            className="profile-detail-input"
                                                            value={editedProfile.student_specialty || ''}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, student_specialty: e.target.value as any })}
                                                        >
                                                            <option value="SE">Kỹ thuật phần mềm (SE)</option>
                                                            <option value="IS">An toàn thông tin (IS)</option>
                                                            <option value="AI">Trí tuệ nhân tạo (AI)</option>
                                                            <option value="DS">Khoa học dữ liệu (DS)</option>
                                                        </select>
                                                    ) : (
                                                        <p className="profile-detail-value">{userProfile.student_specialty}</p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {userProfile.role === 'Faculty' && (
                                            <>
                                                <div className="profile-detail-item">
                                                    <label className="profile-detail-label">
                                                        <Briefcase size={18} />
                                                        Chuyên môn giảng dạy
                                                    </label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            className="profile-detail-input"
                                                            value={editedProfile.faculty_specialty || ''}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, faculty_specialty: e.target.value })}
                                                        />
                                                    ) : (
                                                        <p className="profile-detail-value">{userProfile.faculty_specialty}</p>
                                                    )}
                                                </div>
                                                <div className="profile-detail-item">
                                                    <label className="profile-detail-label">
                                                        <Clock size={18} />
                                                        Năm kinh nghiệm
                                                    </label>
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            className="profile-detail-input"
                                                            value={editedProfile.years_of_experience || 0}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, years_of_experience: parseInt(e.target.value, 10) })}
                                                        />
                                                    ) : (
                                                        <p className="profile-detail-value">{userProfile.years_of_experience} năm</p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                </main>
            </div>
        </div>
    )
}
