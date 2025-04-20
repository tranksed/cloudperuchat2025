import React, { useState, useEffect, useRef, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import NavigateBeforeIcon from "@material-ui/icons/NavigateBefore";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import MessageIcon from "@material-ui/icons/Message";

import api from "../../services/api";

const useStyles = makeStyles(theme => ({
  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderRadius: 8,
    cursor: "pointer",
  },
  modalBackdrop: {
    position: 'fixed',
    zIndex: 5000,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    touchAction: 'none',
    overflow: 'hidden',
  },
  modalHeader: {
    position: 'absolute',
    zIndex: 5001,
    top: 0,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
    display: "flex",
    justifyContent: "space-between",
  },
  modalImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  modalImage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    overflow: 'hidden',
    backgroundColor: 'black',
    userSelect: 'none',
    '-webkit-user-select': 'none', /* Safari/Chrome */
    '-moz-user-select': 'none', /* Firefox */
    '-ms-user-select': 'none', /* IE/Edge */
  },
  navigators: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    WebkitTransform: 'translateY(-50%)',
    msTransform: 'translateY(-50%)',
    padding: "10px",
    borderRadius: "100px",
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    color: "#fff",
    zIndex: 5001,
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },
  icons: {
    userSelect: 'none',
    '-webkit-user-select': 'none', /* Safari/Chrome */
    '-moz-user-select': 'none', /* Firefox */
    '-ms-user-select': 'none', /* IE/Edge */
    cursor: 'pointer'
  }
}));

const TicketGallery = ({ imageUrl, ticket, width, height }) => {
  const classes = useStyles();
  const [fetching, setFetching] = useState(true);
  const [fetchingMaximized, setFetchingMaximized] = useState(true);
  const [blobUrl, setBlobUrl] = useState("");
  const [maximizedBlobUrl, setMaximizedBlobUrl] = useState("");
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef();
  const headerRef = useRef();
  const prevRef = useRef();
  const nextRef = useRef();
  const imageContainer = useRef();
  const [rotate, setRotate] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!imageUrl) return;
    const fetchImage = async () => {
      const { data, headers } = await api.get(imageUrl, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([data], { type: headers["content-type"] })
      );
      setBlobUrl(url);
      setFetching(false);
    };
    fetchImage();
  }, [imageUrl]);

  useEffect(() => {
    const fetchImage = async () => {
      const { data, headers } = await api.get(currentImageUrl, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([data], { type: headers["content-type"] })
      );
      setMaximizedBlobUrl(url);
      setFetchingMaximized(false);
    };
    fetchImage();
  }, [currentImageUrl]);

  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) => {
      if (prevIndex < images.length - 1) {
        setFetchingMaximized(true);
        setCurrentImageUrl(images[prevIndex + 1]?.mediaUrl);
        return prevIndex + 1;
      }

      return prevIndex;
    });
    setZoom(1);
  };

  const showPreviousImage = () => {
    setCurrentImageIndex((prevIndex) => {
      if (prevIndex > 0) {
        setFetchingMaximized(true);
        setCurrentImageUrl(images[prevIndex - 1]?.mediaUrl);
        return prevIndex - 1;
      }

      return prevIndex;
    });
    setZoom(1);
  };

  const openModal = async () => {
    setIsOpen(true);
    if (images.length == 0) {
      const getImages = async () => {
        const { data: imagesList } = await api.get(`/messages/listimages/${ticket.id}`);
        setImages(imagesList.images);
        const index = imagesList.images.findIndex((imageObj) => imageObj.mediaUrl === imageUrl);;
        if (index !== -1) {
          setCurrentImageIndex(index);
        }
      }
      await getImages();
    }

    document.querySelector("header").style.zIndex = 1200;
  }

  const closeModal = () => {
    if (images.length > 0) {
      const index = images.findIndex((imageObj) => imageObj.mediaUrl === imageUrl)
      if (index !== -1) {
        setCurrentImageIndex(index);
        setCurrentImageUrl(imageUrl);
      }
    }
    setIsOpen(false);
    setZoom(1);
    setRotate(0);
    document.querySelector("header").style.zIndex = null;
  }

  const handleOutsideClick = (event) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(event.target) &&
      headerRef.current &&
      !headerRef.current.contains(event.target) &&
      prevRef.current && !prevRef.current.contains(event.target) &&
      nextRef.current && !nextRef.current.contains(event.target) && !isDragging
    ) {
      closeModal();
    }
  };

  const handleGoToMessage = () => {
    const { uuid } = ticket;
    const pageNumber = images[currentImageIndex]?.pageNumber;
    const lastMessage = images[currentImageIndex]?.body;
    sessionStorage.setItem('goToMessage', JSON.stringify({
      pageNumber: pageNumber,
      ticketId: uuid,
      lastMessage: lastMessage
    }));
    window.location.reload()
  };

  const rotateImage = () => {
    setRotate(rotate + 90);
  }

  let isDragging = false;

  const handleContainerImageMove = (event) => {
    if (!isDragging) return;

    const x = event.clientX - modalRef.current.offsetLeft;
    const y = event.clientY - modalRef.current.offsetTop;

    modalRef.current.style.transform = `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${zoom})`;
  }

  const handleImageMove = (event) => {
    isDragging = true;
  }

  const [lastDistance, setLastDistance] = useState(null);



  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
    } else if (e.touches.length === 2) {
      const x1 = e.touches[0].pageX;
      const y1 = e.touches[0].pageY;
      const x2 = e.touches[1].pageX;
      const y2 = e.touches[1].pageY;

      const initialDistance = Math.hypot(x2 - x1, y2 - y1);
      setLastDistance(initialDistance);
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      const x = e.touches[0].clientX - modalRef.current.offsetLeft;
      const y = e.touches[0].clientY - modalRef.current.offsetTop;
      modalRef.current.style.transform = `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${zoom})`;
    }
    else if (e.touches.length === 2) {
      const x1 = e.touches[0].pageX;
      const y1 = e.touches[0].pageY;
      const x2 = e.touches[1].pageX;
      const y2 = e.touches[1].pageY;

      const newDistance = Math.hypot(x2 - x1, y2 - y1);

      if (lastDistance) {
        const delta = newDistance - lastDistance;
        setZoom((prevScale) => {
          const newScale = prevScale + delta / 100; // Adjust the factor as needed
          return Math.max(1, Math.min(3, newScale)); // Limit zoom to a specific range
        });
      }

      setLastDistance(newDistance);
    }
  };

  const handleTouchEnd = () => {
    isDragging = false;
    setLastDistance(null);
  };

  return (
    <>
      <img
        className={classes.messageMedia}
        src={fetching ? imageUrl : blobUrl}
        onClick={openModal}
        style={width && height ? { width: width, height: height, borderRadius: 0, aspectRatio: "1 / 1" } : null}
      />
      {isOpen && (
        <div className={classes.modalBackdrop} onClick={handleOutsideClick} ref={imageContainer}
          onMouseMove={(e) => { if (zoom > 1) handleContainerImageMove(e) }}
          onMouseUp={(e) => {
            isDragging = false;
          }}
          id={"ticketGalleryOpened"}
        >
          <div ref={headerRef} className={classes.modalHeader}>
            <span style={{ padding: "10px", color: "#fff", fontSize: "120%" }}>{"image"}</span>
            <span style={{ padding: "10px", color: "#fff", }}>
              <MessageIcon className={classes.icons} style={{ cursor: "pointer" }} onClick={handleGoToMessage} />
              <a href={fetchingMaximized ? currentImageUrl : maximizedBlobUrl} style={{ marginLeft: "10px", color: "#fff", }} target="_blank" download>
                <svg fill="#ffffff" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>
              </a>
              <svg className={classes.icons} onClick={() => setZoom(zoom + 0.2)} style={{ cursor: "pointer", marginLeft: "10px" }} height="24" viewBox="0 0 24 24" width="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20L14.9497 14.9498M14.9497 14.9498C16.2165 13.683 17 11.933 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C11.933 17 13.683 16.2165 14.9497 14.9498ZM7 10H13M10 7V13" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg className={classes.icons} onClick={() => setZoom(zoom > 1 ? zoom - .2 : 1)} style={{ cursor: "pointer", marginLeft: "10px" }} height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20L14.9497 14.9498M14.9497 14.9498C16.2165 13.683 17 11.933 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C11.933 17 13.683 16.2165 14.9497 14.9498ZM7 10H13" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg className={classes.icons} onClick={rotateImage} style={{ cursor: "pointer", marginLeft: "10px" }} fill="#ffffff" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0zm0 0h24v24H0V0z"></path><path d="M7.47 21.49C4.2 19.93 1.86 16.76 1.5 13H0c.51 6.16 5.66 11 11.95 11 .23 0 .44-.02.66-.03L8.8 20.15l-1.33 1.34zM12.05 0c-.23 0-.44.02-.66.04l3.81 3.81 1.33-1.33C19.8 4.07 22.14 7.24 22.5 11H24c-.51-6.16-5.66-11-11.95-11zM16 14h2V8c0-1.11-.9-2-2-2h-6v2h6v6zm-8 2V4H6v2H4v2h2v8c0 1.1.89 2 2 2h8v2h2v-2h2v-2H8z"></path></svg>
              <CloseIcon className={classes.icons} onClick={closeModal} style={{ cursor: "pointer", marginLeft: "10px" }} />
            </span>
          </div>
          <div className={classes.modalImageContainer}>
            <img id="maximizedImage" draggable="false" ref={modalRef} onDrag={(e) => e.preventDefault()} className={classes.modalImage} src={fetchingMaximized ? currentImageUrl : maximizedBlobUrl}
              style={{
                transform: `translate3d(-50%, -50%, 0) rotate(${rotate}deg) scale(${zoom})`,
                WebkitTransform: `translate3d(-50%, -50%, 0) rotate(${rotate}deg) scale(${zoom})`, // For Safari
                msTransform: `translate3d(-50%, -50%, 0) rotate(${rotate}deg) scale(${zoom})`, // For IE
                'user-drag': 'none',
                cursor: zoom ? 'move' : 'pointer',
                maxWidth: '98%',
                maxHeight: '98%',
              }}
              onMouseDown={(e) => handleImageMove(e)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            <span className={classes.navigators} id="galleryPrev" onClick={showPreviousImage} ref={prevRef} style={images.length > 0 && currentImageIndex > 0 ? { left: "10px" } : { display: "none" }}><NavigateBeforeIcon color="secondary" /></span>
            <span className={classes.navigators} id="galleryNext" onClick={showNextImage} ref={nextRef} style={images.length > 0 && currentImageIndex < (images.length - 1) ? { right: "10px" } : { display: "none" }}><NavigateNextIcon color="secondary" /></span>
          </div>
        </div>
      )}
    </>
  );
}

export default TicketGallery;