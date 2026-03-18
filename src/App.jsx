import Dashboard from './pages/Dashboard' // Import trang Dashboard Bo vừa tạo
import './App.css'

function App() {
    return (
        <div className="app-container">
            {/* Sau này Bo có thể thêm Navbar hoặc Sidebar ở đây */}
            <main>
                <Dashboard />
            </main>
        </div>
    )
}

export default App