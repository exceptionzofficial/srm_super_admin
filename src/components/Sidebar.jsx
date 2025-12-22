/**
 * Sidebar Component for Super Admin Panel
 */

import { NavLink } from 'react-router-dom';
import {
    FiHome,
    FiUsers,
    FiMapPin,
    FiCalendar,
    FiSettings,
    FiLogOut
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
    const menuItems = [
        { path: '/', icon: <FiHome />, label: 'Dashboard' },
        { path: '/employees', icon: <FiUsers />, label: 'Employees' },
        { path: '/geofence', icon: <FiMapPin />, label: 'Geo-fence Settings' },
        { path: '/attendance', icon: <FiCalendar />, label: 'Attendance' },
    ];

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">🍬</span>
                    <div className="logo-text">
                        <span className="logo-title">SRM Sweets</span>
                        <span className="logo-subtitle">Super Admin</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button className="logout-btn">
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
