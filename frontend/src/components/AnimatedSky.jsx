import FlyingPigeon from '../components/FlyingPigeon';

function AnimatedSky() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(6)].map((_, i) => (
        <FlyingPigeon
          key={i}
          color={['white', 'black', 'brown'][i % 3]}
          delay={i * 2}
          top={`${10 + i * 10}vh`}
        />
      ))}
    </div>
  );
}

export default AnimatedSky;