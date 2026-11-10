export default function Loading() {
    return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-white" style={{ background: 'radial-gradient(circle at 50% 30%, #2e083d 0%, #150221 65%, #090010 100%)' }}>
            <i className="fas fa-wand-magic-sparkles fa-spin fa-3x mb-3" style={{ color: '#ff2a85' }}></i>
            <h4 className="font-weight-bold" style={{ color: '#ffd700' }}>Conectando à Mesa de Alfea...</h4>
            <p className="text-white-50">Sintonizando o poder das fadas em tempo real ✨</p>
        </div>
    );
}
