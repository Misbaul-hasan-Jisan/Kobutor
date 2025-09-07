function FlyingPigeon({ color = 'white', delay = 0, top = '20vh' }) {
  const pigeonColor = {
    white: 'bg-white',
    black: 'bg-gray-800',
    brown: 'bg-amber-700',
  };

  return (
    <div
      className={`w-6 h-6 rounded-full ${pigeonColor[color]} absolute animate-fly`}
      style={{
        top,
        animationDelay: `${delay}s`,
        boxShadow: '0 0 4px rgba(0,0,0,0.3)',
      }}
    />
  );
}

export default FlyingPigeon;