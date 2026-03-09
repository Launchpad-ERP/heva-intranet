import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Absence from './pages/Absence';
import News from './pages/News';
import Events from './pages/Events';
import TimeTracking from './pages/TimeTracking';
import Suggestions from './pages/Suggestions';
import Trainings from './pages/Trainings';
import TravelExpenses from './pages/TravelExpenses';
import TravelExpenseForm from './pages/TravelExpenseForm';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTimeTracking from './pages/admin/AdminTimeTracking';
import AdminAbsence from './pages/admin/AdminAbsence';
import AdminTravel from './pages/admin/AdminTravel';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNews from './pages/admin/AdminNews';
import AdminSuggestions from './pages/admin/AdminSuggestions';
import AdminTrainings from './pages/admin/AdminTrainings';

function App() {
    return (
        <AuthProvider>
            <HashRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Public/Employee Routes */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } />
                    <Route path="/absence" element={
                        <ProtectedRoute>
                            <Absence />
                        </ProtectedRoute>
                    } />
                    <Route path="/news" element={
                        <ProtectedRoute>
                            <News />
                        </ProtectedRoute>
                    } />
                    <Route path="/events" element={
                        <ProtectedRoute>
                            <Events />
                        </ProtectedRoute>
                    } />
                    <Route path="/time-tracking" element={
                        <ProtectedRoute>
                            <TimeTracking />
                        </ProtectedRoute>
                    } />
                    <Route path="/suggestions" element={
                        <ProtectedRoute>
                            <Suggestions />
                        </ProtectedRoute>
                    } />
                    <Route path="/training" element={
                        <ProtectedRoute>
                            <Trainings />
                        </ProtectedRoute>
                    } />
                    <Route path="/travel" element={
                        <ProtectedRoute>
                            <TravelExpenses />
                        </ProtectedRoute>
                    } />
                    <Route path="/travel/new" element={
                        <ProtectedRoute>
                            <TravelExpenseForm />
                        </ProtectedRoute>
                    } />
                    <Route path="/travel/:id" element={
                        <ProtectedRoute>
                            <TravelExpenseForm />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminDashboard /></AdminLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/time" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminTimeTracking /></AdminLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/absence" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminAbsence /></AdminLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/travel" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminTravel /></AdminLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminUsers /></AdminLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/news" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminNews /></AdminLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/suggestions" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminSuggestions /></AdminLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/trainings" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout><AdminTrainings /></AdminLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </HashRouter>
        </AuthProvider>
    );
}

export default App;
