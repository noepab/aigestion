export default function VideoSection() {
    return (
      <section className="video-showcase">
        <div className="container">
          <div className="holo-frame">
            <div className="scan-overlay"></div>
            <video
              className="video-player"
              autoPlay
              loop
              muted
              playsInline
              poster="/aig-brain-logo.png"
            >
              <source src="/videos/presentacion.mp4" type="video/mp4" />
              Tu navegador no soporta el video.
            </video>
          </div>
        </div>
      </section>
    );
}

