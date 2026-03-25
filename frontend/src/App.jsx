import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/templates/MainLayout'
import { HomePage } from './pages/HomePage'
import { PdfMergerPage } from './pages/PdfMergerPage';
import { EditPage } from './pages/EditPage'
import { SplitPage } from './pages/SplitPage'
import { SignPage } from './pages/SignPage'

function App() {

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="merge" element={<PdfMergerPage />} />
        <Route path="edit" element={<EditPage />} />
        <Route path="split" element={<SplitPage />} />
        <Route path="sign" element={<SignPage />} />
      </Route>
    </Routes>
  )
}

export default App
