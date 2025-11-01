import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

interface UserProfile {
    name: string
    email: string
    phone: string
    location: string
    bio: string
    role: string
    joinDate: string
    avatar: string
}

interface LearningStats {
    coursesCompleted: number
    totalHours: number
    currentStreak: number
    totalPoints: number
}

export default function Profile() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'learning'>('profile')
    const [isEditing, setIsEditing] = useState(false)

    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '+84 123 456 789',
        location: 'Hồ Chí Minh, Việt Nam',
        bio: 'Sinh viên ngành Công nghệ thông tin, đam mê lập trình và học tập công nghệ mới.',
        role: 'Học viên',
        joinDate: 'Tháng 1, 2024',
        avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=4285F4&color=fff&size=200'
    })

    const [editedProfile, setEditedProfile] = useState<UserProfile>(userProfile)

    const learningStats: LearningStats = {
        coursesCompleted: 12,
        totalHours: 156,
        currentStreak: 7,
        totalPoints: 2450
    }

    const recentActivities = [
        { id: 1, title: 'Hoàn thành khóa học OOP', date: '2 ngày trước', icon: CheckCircle, color: '#34A853' },
        { id: 2, title: 'Đạt 100 điểm trong Quiz', date: '3 ngày trước', icon: Award, color: '#FBBC04' },
        { id: 3, title: 'Tạo 5 bản đồ tư duy', date: '5 ngày trước', icon: Target, color: '#4285F4' },
        { id: 4, title: 'Học liên tục 7 ngày', date: '1 tuần trước', icon: TrendingUp, color: '#EA4335' }
    ]

    const handleSave = () => {
        setUserProfile(editedProfile)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditedProfile(userProfile)
        setIsEditing(false)
    }

    const handleAvatarChange = () => {
        // Simulate avatar upload
        alert('Tính năng tải ảnh đại diện sẽ được triển khai sau')
    }

    return (
        <div className="profile-page">
            {/* Header */}
            <header className="profile-header">
                <div className="profile-header-content">
                    <div className="profile-logo" onClick={() => navigate('/learn')}>
                        <Sparkles size={24} className="text-blue-500" />
                        <span className="profile-logo-text">Hannah Assistant</span>
                    </div>
                    <button className="profile-back-btn" onClick={() => navigate(-1)}>
                        Quay lại
                    </button>
                </div>
            </header>

            <div className="profile-container">
                {/* Sidebar */}
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
                            className={`profile-nav-item ${activeTab === 'learning' ? 'active' : ''}`}
                            onClick={() => setActiveTab('learning')}
                        >
                            <BookOpen size={20} />
                            <span>Quá trình học tập</span>
                            <ChevronRight size={18} className="ml-auto" />
                        </button>
                        <button
                            className={`profile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={20} />
                            <span>Cài đặt</span>
                            <ChevronRight size={18} className="ml-auto" />
                        </button>
                    </div>

                    <div className="profile-sidebar-footer">
                        <button className="profile-logout-btn">
                            <LogOut size={20} />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </aside>

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
                                                src={userProfile.avatar}
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
                                                <MapPin size={18} />
                                                Địa chỉ
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="profile-detail-input"
                                                    value={editedProfile.location}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                                                />
                                            ) : (
                                                <p className="profile-detail-value">{userProfile.location}</p>
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Learning Tab */}
                    {activeTab === 'learning' && (
                        <div className="profile-content">
                            {/* Learning Stats */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">Thống kê học tập</h2>
                                </div>
                                <div className="profile-card-body">
                                    <div className="learning-stats-grid">
                                        <div className="stat-card stat-card-blue">
                                            <div className="stat-icon">
                                                <BookOpen size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <p className="stat-value">{learningStats.coursesCompleted}</p>
                                                <p className="stat-label">Khóa học hoàn thành</p>
                                            </div>
                                        </div>

                                        <div className="stat-card stat-card-green">
                                            <div className="stat-icon">
                                                <Clock size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <p className="stat-value">{learningStats.totalHours}</p>
                                                <p className="stat-label">Giờ học tập</p>
                                            </div>
                                        </div>

                                        <div className="stat-card stat-card-orange">
                                            <div className="stat-icon">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <p className="stat-value">{learningStats.currentStreak}</p>
                                                <p className="stat-label">Ngày liên tiếp</p>
                                            </div>
                                        </div>

                                        <div className="stat-card stat-card-purple">
                                            <div className="stat-icon">
                                                <Award size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <p className="stat-value">{learningStats.totalPoints}</p>
                                                <p className="stat-label">Tổng điểm</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">Hoạt động gần đây</h2>
                                </div>
                                <div className="profile-card-body">
                                    <div className="activities-list">
                                        {recentActivities.map((activity) => {
                                            const IconComponent = activity.icon
                                            return (
                                                <div key={activity.id} className="activity-item">
                                                    <div className="activity-icon" style={{ backgroundColor: `${activity.color}20`, color: activity.color }}>
                                                        <IconComponent size={20} />
                                                    </div>
                                                    <div className="activity-content">
                                                        <p className="activity-title">{activity.title}</p>
                                                        <p className="activity-date">{activity.date}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="profile-content">
                            {/* Notifications */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">
                                        <Bell size={20} />
                                        Thông báo
                                    </h2>
                                </div>
                                <div className="profile-card-body">
                                    <div className="settings-list">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <p className="setting-title">Thông báo email</p>
                                                <p className="setting-description">Nhận thông báo qua email về hoạt động của bạn</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <p className="setting-title">Thông báo push</p>
                                                <p className="setting-description">Nhận thông báo trên trình duyệt</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <p className="setting-title">Nhắc nhở học tập</p>
                                                <p className="setting-description">Nhận nhắc nhở hàng ngày về việc học</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">
                                        <Shield size={20} />
                                        Bảo mật
                                    </h2>
                                </div>
                                <div className="profile-card-body">
                                    <div className="settings-list">
                                        <button className="setting-button">
                                            <div className="setting-info">
                                                <p className="setting-title">Đổi mật khẩu</p>
                                                <p className="setting-description">Cập nhật mật khẩu của bạn</p>
                                            </div>
                                            <ChevronRight size={20} />
                                        </button>

                                        <button className="setting-button">
                                            <div className="setting-info">
                                                <p className="setting-title">Xác thực hai yếu tố</p>
                                                <p className="setting-description">Tăng cường bảo mật tài khoản</p>
                                            </div>
                                            <ChevronRight size={20} />
                                        </button>

                                        <button className="setting-button">
                                            <div className="setting-info">
                                                <p className="setting-title">Thiết bị đã đăng nhập</p>
                                                <p className="setting-description">Quản lý các thiết bị của bạn</p>
                                            </div>
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">
                                        <CreditCard size={20} />
                                        Thanh toán
                                    </h2>
                                </div>
                                <div className="profile-card-body">
                                    <div className="settings-list">
                                        <button className="setting-button">
                                            <div className="setting-info">
                                                <p className="setting-title">Phương thức thanh toán</p>
                                                <p className="setting-description">Quản lý thẻ và phương thức thanh toán</p>
                                            </div>
                                            <ChevronRight size={20} />
                                        </button>

                                        <button className="setting-button">
                                            <div className="setting-info">
                                                <p className="setting-title">Lịch sử giao dịch</p>
                                                <p className="setting-description">Xem các giao dịch trước đây</p>
                                            </div>
                                            <ChevronRight size={20} />
                                        </button>
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
