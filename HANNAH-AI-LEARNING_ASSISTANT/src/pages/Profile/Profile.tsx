import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import ChangePasswordForm from './ChangePasswordForm'; // Import the new component
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../service/authService';
import userService from '../../service/userService';
import type { UserData } from '../../service/authService';
import toast from 'react-hot-toast'; // Import toast for notifications
import { buildAvatarUrl } from '../../config/apiConfig'; // Import the helper function
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
    const { user, logout, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user) {
                setIsLoading(false);
                toast.error("Không tìm thấy thông tin người dùng.");
                return;
            }

            setIsLoading(true);
            try {
                // Fetch fresh profile data from API
                const profileData = await userService.getUserProfile(user.userId.toString());

                // Format join date from user data
                const joinDate = new Date(profileData.createdAt || user.createdAt).toLocaleDateString('vi-VN', {
                    month: 'long',
                    year: 'numeric'
                });

                // Build a full, valid URL for the avatar
                const avatarUrl = buildAvatarUrl(user.avatarUrl) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=4285F4&color=fff&size=200`;

                // Build profile from API response
                const fullProfile: UserProfile = {
                    name: user.fullName,
                    email: user.email,
                    role: user.role as 'Student' | 'Faculty' | 'Admin',
                    avatar: avatarUrl,
                    joinDate: joinDate,
                    phone: profileData.phone || undefined,
                    date_of_birth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : undefined,
                    bio: profileData.bio || undefined,
                    student_id: profileData.studentId || undefined,
                    student_specialty: profileData.studentSpecialty as any,
                    notification_preferences: profileData.notificationPreferences || {
                        emailUpdates: true,
                        appEvents: true,
                        weeklyReports: false,
                    },
                };

                setUserProfile(fullProfile);
                setEditedProfile(fullProfile);
            } catch (error) {
                console.error("Failed to load user profile:", error);
                toast.error("Không thể tải thông tin hồ sơ.");
            } finally {
                setIsLoading(false);
            }
        };

        loadUserProfile();
    }, [user, navigate]);



    const handleSave = async () => {
        if (!editedProfile || !user) {
            toast.error("Dữ liệu không hợp lệ để cập nhật.");
            return;
        }

        try {
            // Compare original and edited profiles to find changes
            const updateData: any = {};
            if (editedProfile.phone !== userProfile?.phone) {
                updateData.phone = editedProfile.phone;
            }
            if (editedProfile.date_of_birth !== userProfile?.date_of_birth) {
                updateData.dateOfBirth = editedProfile.date_of_birth;
            }
            if (editedProfile.bio !== userProfile?.bio) {
                updateData.bio = editedProfile.bio;
            }
            if (editedProfile.student_specialty !== userProfile?.student_specialty) {
                updateData.studentSpecialty = editedProfile.student_specialty;
            }

            // Only call API if there are actual changes
            if (Object.keys(updateData).length > 0) {
                const response = await userService.updateUserProfile(user.userId.toString(), updateData);

                // Create the updated profile object for local state
                const updatedProfileData = { ...userProfile, ...response.data };

                setUserProfile(updatedProfileData as UserProfile);
                setEditedProfile(updatedProfileData as UserProfile);
                toast.success("Cập nhật hồ sơ thành công!");
            } else {
                toast.success("Không có thay đổi nào để lưu.");
            }

            setIsEditing(false);


        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Cập nhật hồ sơ thất bại. Vui lòng thử lại.");
        }
    };

    const handleCancel = () => {
        setEditedProfile(userProfile);
        setIsEditing(false);
    };

    const handleAvatarClick = () => {
        setShowAvatarModal(true);
    };

    const handleAvatarChange = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && user) {
            const file = event.target.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh hợp lệ');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }

            setIsUploadingAvatar(true);
            try {
                // Upload avatar to server
                const response = await userService.uploadAvatar(user.userId.toString(), file);

                // Build a full URL for the new avatar and update the state
                const newAvatarUrl = buildAvatarUrl(response.avatarUrl);
                if (userProfile && editedProfile) {
                    const updatedProfile = { ...userProfile, avatar: newAvatarUrl };
                    setUserProfile(updatedProfile);
                    setEditedProfile(updatedProfile);
                }

                toast.success('Đã cập nhật avatar thành công!');
            } catch (error) {
                console.error('Failed to upload avatar:', error);
                toast.error('Cập nhật avatar thất bại. Vui lòng thử lại.');
            } finally {
                setIsUploadingAvatar(false);
            }
        }
    };

    useEffect(() => {
        const avatarUrl = editedProfile?.avatar;

        // Cleanup function to revoke the object URL to prevent memory leaks
        return () => {
            if (avatarUrl && avatarUrl.startsWith('blob:')) {
                URL.revokeObjectURL(avatarUrl);
            }
        };
    }, [editedProfile?.avatar]);

    if (isLoading) {
        return (
            <div className="profile-page-loading">
                <Sparkles size={48} className="text-blue-500 animate-pulse" />
                <h2>Đang tải hồ sơ...</h2>
            </div>
        );
    }

    if (!userProfile || !editedProfile) {
        return (
            <div className="profile-page-error">
                <h2>Không thể tải hồ sơ</h2>
                <p>Đã xảy ra lỗi khi tải thông tin người dùng. Vui lòng thử lại.</p>
                <button onClick={() => navigate('/')}>Về trang chủ</button>
            </div>
        );
    }

    return (
        <div className={`profile-page ${embedded ? 'embedded' : ''}`}>
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

            <div className="profile-container">
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

                        <button
                            className={`profile-nav-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <Shield size={20} />
                            <span>Bảo mật & Đăng nhập</span>
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
                    {/* Conditional Rendering based on activeTab */}
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
                                                onClick={handleAvatarClick}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <button
                                                className="profile-avatar-change"
                                                onClick={handleAvatarChange}
                                                disabled={isUploadingAvatar}
                                            >
                                                <Camera size={20} />
                                            </button>
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

                    {activeTab === 'security' && (
                        <ChangePasswordForm />
                    )}
                </main>
            </div>
        </div>
    )
}
