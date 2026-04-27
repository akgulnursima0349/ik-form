import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-gray-300">404</p>
        <h2 className="text-xl font-semibold text-gray-700">Sayfa bulunamadı</h2>
        <Button onClick={() => navigate(-1)}>Geri Dön</Button>
      </div>
    </div>
  );
}
