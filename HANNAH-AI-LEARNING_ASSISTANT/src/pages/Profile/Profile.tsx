import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import ChangePasswordForm from './ChangePasswordForm';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../service/authService';
import userService from '../../service/userService';
import studentService from '../../service/studentService';
import type { UserData } from '../../service/authService';
import toast from 'react-hot-toast';
import { buildAvatarUrl } from '../../config/apiConfig';
import { Header } from '../../components/Header';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    Award,
    BookOpen,
    Shield,
    Edit,
    Camera,
    Save,
    X,
    Sparkles,
    ChevronRight,
    Clock,
    Loader2,
    ArrowLeft
} from 'lucide-react'
import './Profile.css'

// Dựa theo DB schema
interface UserProfile {
    name: string;
    email: string;
    role: 'Student' | 'Faculty' | 'Admin';
    avatar: string;
    joinDate: string;
    phone?: string;
    date_of_birth?: string;
    bio?: string;
    student_id?: string;
    student_specialty?: 'SE' | 'IS' | 'AI' | 'DS';
    current_semester?: string;
    faculty_specialty?: string;
    years_of_experience?: number;
    notification_preferences: {
        emailUpdates: boolean;
        appEvents: boolean;
        weeklyReports: boolean;
    };
}

interface ProfileProps {
    embedded?: boolean;
}

export default function Profile({ embedded = false }: ProfileProps) {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showHistorySidebar, setShowHistorySidebar] = useState(false);
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
                const profileData = await userService.getUserProfile(user.userId.toString());
                const joinDate = new Date(profileData.createdAt || user.createdAt).toLocaleDateString('vi-VN', {
                    month: 'long',
                    year: 'numeric'
                });

                const avatarUrl = buildAvatarUrl(user.avatarUrl) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1f2937&color=fff&size=200`;

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
                    current_semester: profileData.currentSemester || undefined,
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
        if (!editedProfile || !user || !userProfile) {
            toast.error("Dữ liệu không hợp lệ để cập nhật.");
            return;
        }

        try {
            const updateData: any = {};
            if (editedProfile.phone !== userProfile?.phone) updateData.phone = editedProfile.phone;
            if (editedProfile.date_of_birth !== userProfile?.date_of_birth) updateData.dateOfBirth = editedProfile.date_of_birth;
            if (editedProfile.bio !== userProfile?.bio) updateData.bio = editedProfile.bio;
            if (editedProfile.student_specialty !== userProfile?.student_specialty) updateData.studentSpecialty = editedProfile.student_specialty;
            if (editedProfile.faculty_specialty !== userProfile?.faculty_specialty) updateData.facultySpecialty = editedProfile.faculty_specialty;
            if (editedProfile.years_of_experience !== userProfile?.years_of_experience) updateData.yearsOfExperience = editedProfile.years_of_experience;

            if (Object.keys(updateData).length > 0) {
                const updatedBackendProfile = await userService.updateUserProfile(user.userId.toString(), updateData);
                const updatedProfileData: UserProfile = {
                    ...userProfile,
                    phone: updatedBackendProfile.phone || undefined,
                    date_of_birth: updatedBackendProfile.dateOfBirth ? updatedBackendProfile.dateOfBirth.split('T')[0] : undefined,
                    bio: updatedBackendProfile.bio || undefined,
                    student_specialty: updatedBackendProfile.studentSpecialty as any,
                    faculty_specialty: (updatedBackendProfile as any).facultySpecialty || undefined,
                    years_of_experience: (updatedBackendProfile as any).yearsOfExperience || undefined
                };
                setUserProfile(updatedProfileData);
                setEditedProfile(updatedProfileData);
                toast.success("Cập nhật hồ sơ thành công!");
            }

            if (editedProfile.current_semester !== userProfile?.current_semester && editedProfile.current_semester) {
                try {
                    const semesterResult = await studentService.setCurrentSemester(user.userId, editedProfile.current_semester);
                    if (semesterResult.success) {
                        setUserProfile(prev => prev ? { ...prev, current_semester: semesterResult.currentSemester } : prev);
                        setEditedProfile(prev => prev ? { ...prev, current_semester: semesterResult.currentSemester } : prev);
                        // Update AuthContext so other components (like Chat) can access the new semester
                        if (updateUser && user) {
                            updateUser({ ...user, currentSemester: semesterResult.currentSemester });
                        }
                        toast.success("Cập nhật kỳ học thành công!");
                    }
                } catch (semesterError) {
                    console.error("Failed to update semester:", semesterError);
                    toast.error("Cập nhật kỳ học thất bại.");
                }
            }

            if (Object.keys(updateData).length === 0 && editedProfile.current_semester === userProfile?.current_semester) {
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

    const handleAvatarChange = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && user) {
            const file = event.target.files[0];

            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh hợp lệ');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }

            setIsUploadingAvatar(true);
            try {
                const response = await userService.uploadAvatar(user.userId.toString(), file);
                const baseUrl = buildAvatarUrl(response.avatarUrl);
                const newAvatarUrl = `${baseUrl}?v=${Date.now()}`;

                if (userProfile && editedProfile) {
                    const updatedProfile = { ...userProfile, avatar: newAvatarUrl };
                    setUserProfile(updatedProfile);
                    setEditedProfile(updatedProfile);
                }

                if (updateUser && user) {
                    updateUser({ ...user, avatarUrl: response.avatarUrl });
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
        return () => {
            if (avatarUrl && avatarUrl.startsWith('blob:')) {
                URL.revokeObjectURL(avatarUrl);
            }
        };
    }, [editedProfile?.avatar]);

    if (isLoading) {
        return (
            <div className="pf-loading">
                <Loader2 size={48} className="pf-loading-spinner" />
                <h2>Đang tải hồ sơ...</h2>
            </div>
        );
    }

    if (!userProfile || !editedProfile) {
        return (
            <div className="pf-error">
                <h2>Không thể tải hồ sơ</h2>
                <p>Đã xảy ra lỗi khi tải thông tin người dùng.</p>
                <button onClick={() => navigate('/')}>Về trang chủ</button>
            </div>
        );
    }

    return (
        <div className={`pf-page ${embedded ? 'pf-embedded' : ''}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
            />

            {/* Use shared Header component */}
            {!embedded && (
                <Header
                    onToggleHistory={() => setShowHistorySidebar(!showHistorySidebar)}
                    showNotifications={true}
                />
            )}

            <div className="pf-container">
                {/* Sidebar Navigation */}
                {!embedded && (
                    <aside className="pf-sidebar">
                        {/* Back Button */}
                        <button
                            className="pf-back-btn"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={18} />
                            <span>Quay lại</span>
                        </button>

                        <nav className="pf-nav">
                            <button
                                className={`pf-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                <User size={20} />
                                <span>Thông tin cá nhân</span>
                                <ChevronRight size={18} className="pf-nav-arrow" />
                            </button>

                            <button
                                className={`pf-nav-item ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <Shield size={20} />
                                <span>Bảo mật & Đăng nhập</span>
                                <ChevronRight size={18} className="pf-nav-arrow" />
                            </button>
                        </nav>
                    </aside>
                )}

                {/* Main Content */}
                <main className="pf-main">
                    {activeTab === 'profile' && (
                        <div className="pf-content">
                            {/* Profile Card */}
                            <div className="pf-card">
                                <div className="pf-card-header">
                                    <h2 className="pf-card-title">Hồ sơ của tôi</h2>
                                    {!isEditing ? (
                                        <button className="pf-btn pf-btn-primary" onClick={() => setIsEditing(true)}>
                                            <Edit size={18} />
                                            <span>Chỉnh sửa</span>
                                        </button>
                                    ) : (
                                        <div className="pf-edit-actions">
                                            <button className="pf-btn pf-btn-success" onClick={handleSave}>
                                                <Save size={18} />
                                                <span>Lưu</span>
                                            </button>
                                            <button className="pf-btn pf-btn-ghost" onClick={handleCancel}>
                                                <X size={18} />
                                                <span>Hủy</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="pf-card-body">
                                    {/* Avatar Section */}
                                    <div className="pf-avatar-section">
                                        <div className="pf-avatar-wrapper">
                                            <img
                                                key={editedProfile.avatar}
                                                src={editedProfile.avatar}
                                                alt={userProfile.name}
                                                className="pf-avatar-img"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=1e293b&color=fff&size=200&font-size=0.4&bold=true`;
                                                }}
                                            />
                                            <button
                                                className="pf-avatar-btn"
                                                onClick={handleAvatarChange}
                                                disabled={isUploadingAvatar}
                                            >
                                                {isUploadingAvatar ? (
                                                    <Loader2 size={18} className="pf-loading-spinner" />
                                                ) : (
                                                    <Camera size={18} />
                                                )}
                                            </button>
                                        </div>
                                        <div className="pf-avatar-info">
                                            <h3 className="pf-name">{userProfile.name}</h3>
                                            <span className="pf-role-badge">{userProfile.role}</span>
                                            <p className="pf-join-date">
                                                <Calendar size={14} />
                                                Tham gia từ {userProfile.joinDate}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Profile Details */}
                                    <div className="pf-details">
                                        <div className="pf-field">
                                            <label className="pf-label">
                                                <Mail size={16} />
                                                Email
                                            </label>
                                            <p className="pf-value">{userProfile.email}</p>
                                        </div>

                                        <div className="pf-field">
                                            <label className="pf-label">
                                                <Phone size={16} />
                                                Số điện thoại
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    className="pf-input"
                                                    value={editedProfile.phone || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                                    placeholder="Nhập số điện thoại"
                                                />
                                            ) : (
                                                <p className="pf-value">{userProfile.phone || 'Chưa cập nhật'}</p>
                                            )}
                                        </div>

                                        <div className="pf-field">
                                            <label className="pf-label">
                                                <Calendar size={16} />
                                                Ngày sinh
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    className="pf-input"
                                                    value={editedProfile.date_of_birth || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                                                />
                                            ) : (
                                                <p className="pf-value">{userProfile.date_of_birth || 'Chưa cập nhật'}</p>
                                            )}
                                        </div>

                                        <div className="pf-field pf-field-full">
                                            <label className="pf-label">
                                                <Briefcase size={16} />
                                                Giới thiệu bản thân
                                            </label>
                                            {isEditing ? (
                                                <textarea
                                                    className="pf-textarea"
                                                    value={editedProfile.bio || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                                    rows={3}
                                                    placeholder="Viết vài dòng về bạn..."
                                                />
                                            ) : (
                                                <p className="pf-value">{userProfile.bio || 'Chưa cập nhật'}</p>
                                            )}
                                        </div>

                                        {/* Student-specific fields */}
                                        {userProfile.role.toLowerCase() === 'student' && (
                                            <>
                                                <div className="pf-field">
                                                    <label className="pf-label">
                                                        <Award size={16} />
                                                        Mã số sinh viên
                                                    </label>
                                                    <p className="pf-value">{userProfile.student_id || 'Chưa cập nhật'}</p>
                                                </div>

                                                <div className="pf-field">
                                                    <label className="pf-label">
                                                        <BookOpen size={16} />
                                                        Chuyên ngành
                                                    </label>
                                                    {isEditing ? (
                                                        <select
                                                            className="pf-select"
                                                            value={editedProfile.student_specialty || ''}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, student_specialty: e.target.value as any })}
                                                        >
                                                            <option value="">Chọn chuyên ngành</option>
                                                            <option value="SE">Kỹ thuật phần mềm (SE)</option>
                                                            <option value="IS">An toàn thông tin (IS)</option>
                                                            <option value="AI">Trí tuệ nhân tạo (AI)</option>
                                                            <option value="DS">Khoa học dữ liệu (DS)</option>
                                                        </select>
                                                    ) : (
                                                        <p className="pf-value">{userProfile.student_specialty || 'Chưa cập nhật'}</p>
                                                    )}
                                                </div>

                                                <div className="pf-field">
                                                    <label className="pf-label">
                                                        <Calendar size={16} />
                                                        Kỳ học hiện tại
                                                    </label>
                                                    {isEditing ? (
                                                        <select
                                                            className="pf-select"
                                                            value={editedProfile.current_semester || ''}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, current_semester: e.target.value })}
                                                        >
                                                            <option value="">Chọn kỳ học</option>
                                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => (
                                                                <option key={k} value={k.toString()}>Kỳ {k}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <p className="pf-value">
                                                            {userProfile.current_semester ? `Kỳ ${userProfile.current_semester}` : 'Chưa thiết lập'}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}


                                        {userProfile.role.toLowerCase() === 'faculty' && (
                                            <>
                                                <div className="pf-field">
                                                    <label className="pf-label">
                                                        <Briefcase size={16} />
                                                        Chuyên môn giảng dạy
                                                    </label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            className="pf-input"
                                                            value={editedProfile.faculty_specialty || ''}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, faculty_specialty: e.target.value })}
                                                            placeholder="Nhập chuyên môn"
                                                        />
                                                    ) : (
                                                        <p className="pf-value">{userProfile.faculty_specialty || 'Chưa cập nhật'}</p>
                                                    )}
                                                </div>

                                                <div className="pf-field">
                                                    <label className="pf-label">
                                                        <Clock size={16} />
                                                        Năm kinh nghiệm
                                                    </label>
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            className="pf-input"
                                                            value={editedProfile.years_of_experience || 0}
                                                            onChange={(e) => setEditedProfile({ ...editedProfile, years_of_experience: parseInt(e.target.value, 10) })}
                                                        />
                                                    ) : (
                                                        <p className="pf-value">{userProfile.years_of_experience || 0} năm</p>
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
