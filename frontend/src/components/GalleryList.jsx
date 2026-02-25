export default function GalleryList({ works, galleryStatus }) {
  if (!works.length) return <p className="loading">Loading galleries...</p>;

  return (
    <div className="gallery-list">
      {works.map((work) => {
        const status = galleryStatus[work.URL_slug] || 'pending';
        const imageCount = work.gallery_images?.length || 0;

        return (
          <div key={work.id} className={`gallery-card status-${status}`}>
            <div className="gallery-info">
              <span className="gallery-title">{work.title}</span>
              <span className="gallery-slug">{work.URL_slug}</span>
            </div>
            <div className="gallery-meta">
              <span className="image-count">{imageCount} images</span>
              <span className={`status-badge ${status}`}>{status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
