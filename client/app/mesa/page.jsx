'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MesaFallback() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/salas');
    }, [router]);

    return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center bg-dark text-white">
            <div className="spinner-border text-warning" role="status">
                <span className="sr-only">Redirecionando para o lobby de salas...</span>
            </div>
        </div>
    );
}

