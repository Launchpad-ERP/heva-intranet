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

function App() {
    return (
        <AuthProvider>
            <HashRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
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
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </HashRouter>
        </AuthProvider>
    );
}

export default App;
