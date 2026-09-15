import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-7xl font-extrabold text-gradient">404</p>
      <p className="mt-4 text-lg text-muted-foreground">الصفحة غير موجودة · Page not found</p>
      <Button asChild className="mt-8">
        <Link to="/">↩</Link>
      </Button>
    </div>
  );
}
