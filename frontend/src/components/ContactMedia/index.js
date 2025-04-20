import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";

import api from "../../services/api";

import toastError from "../../errors/toastError";
import TicketGallery from "../TicketGallery";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import ImageIcon from "@material-ui/icons/Image";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import GetAppIcon from '@material-ui/icons/GetApp';
import Paper from "@material-ui/core/Paper";
import { isArray } from "lodash";
import { Button, Typography } from "@material-ui/core";
import { IconButton, Stack } from "@mui/material";
import { MdLocalPhone, MdPhoneMissed } from "react-icons/md";
import moment from "moment";
import { format } from "date-fns";


const useStyles = makeStyles(theme => ({
  mediaWrapper: {
    position: "relative",
    display: "flex",
    height: "150px",
    flexDirection: "column",
    overflow: "auto",
    "&::-webkit-scrollbar": {
      width: "3px",
      height: "5px",
    },
    "&::-webkit-scrollbar-thumb": {
      boxShadow: `inset 0 0 6px rgba(0, 0, 0, 0.3)`,
      backgroundColor: theme.palette.primary.main,
    },
    '&::-webkit-scrollbar-corner': {
      backgroundColor: theme.palette.background.default,
    }
  },
  mediaContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gridGap: "1px",
    gap: "1px",
    padding: "2px",
  },
  imageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    cursor: "pointer",
  },
  tabsHeader: {
    flex: "none",
    backgroundColor: theme.palette.background.default,
  },
  tabs: {
    "@media (min-width: 600px)": {
      minWidth: "initial",
    },
  },

  tab: {
    minWidth: 120,
    width: 120,
    position: "relative",
  },
  document: {
    display: "grid",
    alignItems: "center",
    gridTemplateColumns: "15% 70% 15%",
  },
  documentIcon: {
    fill: theme.palette.text.secondary,
    width: "50%",
    margin: "auto",
    display: "block",
    cursor: "pointer",
  },
  videoContainer: {
    width: "100%",
    display: "flex",
    position: "relative",
    color: "#fff",
  },
  videoPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "5px",
    display: "flex",
    borderRadius: "100px",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  }
}));

const getFileNameFromUrl = (url) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

const ContactMedia = ({ ticket }) => {
  const classes = useStyles();
  const [media, setMedia] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [tabOpen, setTabOpen] = useState("media");
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    if (!ticket) return;
    (async () => {
      try {
        const { data: data } = await api.get(`/messages/getmedia/${ticket.id}`);
        setMedia(data?.media);
        setDocuments(data?.documents);
        setLinks(data?.links);
        setCalls(data?.calls);
        // console.log(data?.links);
      } catch (error) {
        toastError(error);
      }
    })();
  }, [ticket]);

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const handleGoToMessage = (message, type) => {
    const { uuid } = ticket;
    const pageNumber = message?.pageNumber;
    const lastMessage = type == 'document' ? message?.body?.split('/').pop() : message?.body;
    // alert(pageNumber)
    sessionStorage.setItem('goToMessage', JSON.stringify({
      pageNumber: pageNumber,
      ticketId: uuid,
      lastMessage: lastMessage
    }));
    window.location.reload()
  };

  // const handleDownloadFile = (url, filename) => {
  //     fetch(url)
  //         .then(response => {
  //             if (!response.ok) {
  //                 throw new Error('Erro ao baixar o arquivo');
  //             }
  //             return response.blob();
  //         })
  //         .then(blob => {
  //             const name = filename || getFileNameFromUrl(url);
  //             const downloadUrl = window.URL.createObjectURL(new Blob([blob]));
  //             const link = document.createElement('a');
  //             link.href = downloadUrl;
  //             link.setAttribute('download', name);
  //             document.body.appendChild(link);
  //             link.click();
  //             link.parentNode.removeChild(link);
  //         })
  //         .catch(error => console.error('Erro ao baixar o arquivo:', error));
  // };

  const handleDownloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao baixar o arquivo');
      }
      const blob = await response.blob();
      const name = filename || getFileNameFromUrl(url);
      const downloadUrl = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar o arquivo:', error);
    }
  }

  const handleToDocument = (document) => {

    const link = document.url;

    // abre o documento em uma nova guia
    window.open(link, '_blank');

  };

  return (
    <>
      <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={tabOpen}
          onChange={handleChangeTabOpen}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            className={classes.tabs}
            label={"Mídia"}
            value={"media"}
          />
          <Tab
            className={classes.tabs}
            label={"Documentos"}
            value={"documents"}
          />
          <Tab
            className={classes.tabs}
            label={"Links"}
            value={"links"}
          />
          <Tab
            className={classes.tabs}
            label={"Ligações"}
            value={"calls"}
          />
        </Tabs>
      </Paper>
      <Paper elevation={0} square>

        <div className={classes.mediaWrapper} style={applyPanelStyle("media")}>
          <div className={classes.mediaContainer}>
            {Array.isArray(media) &&
              media.length > 0 &&
              media.map((currentMedia) =>
                currentMedia.mediaType === "video" ? (
                  <a href={currentMedia.mediaUrl} className={classes.videoContainer} target="_blank">
                    <video style={{ objectFit: "cover", width: "100%", height: "auto", aspectRatio: "1 / 1" }} src={currentMedia.mediaUrl}></video>
                    <span className={classes.videoPlay}><PlayArrowIcon color="secondary" /></span>
                  </a>
                ) : (
                  <TicketGallery
                    imageUrl={currentMedia.mediaUrl}
                    ticket={ticket}
                    width="100%"
                    height="auto"
                  />
                )
              )}
          </div>
        </div>

        <div className={classes.mediaWrapper} style={applyPanelStyle("documents")}>
          <div>
            {Array.isArray(documents) &&
              documents.length > 0 &&
              documents.map((document) => {

                return (
                  <div className={classes.document} >
                    <IconButton onClick={() => handleGoToMessage(document, 'link')}>
                      {/* <svg className={classes.documentIcon} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 50 50">
                                                <path d="M 7 2 L 7 48 L 43 48 L 43 14.59375 L 42.71875 14.28125 L 30.71875 2.28125 L 30.40625 2 Z M 9 4 L 29 4 L 29 16 L 41 16 L 41 46 L 9 46 Z M 31 5.4375 L 39.5625 14 L 31 14 Z"></path>
                                            </svg> */}
                      <InsertDriveFileIcon />
                    </IconButton>
                    <div onClick={() => handleToDocument(document)} style={{ overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}>
                      {document.url?.split("/").pop()}
                    </div>
                    <IconButton onClick={() => handleDownloadFile(document.url, document.filename)}>
                      {/* <svg className={classes.documentIcon} height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg> */}
                      <GetAppIcon />
                    </IconButton>
                  </div>
                )
              })}
          </div>
        </div>

        <div className={classes.mediaWrapper} style={applyPanelStyle("links")}>
          <div>
            {Array.isArray(links) &&
              links.length > 0 &&
              links.map((link) => (
                <div className={classes.document}>
                  <div>
                    <svg onClick={() => { handleGoToMessage(link, 'link') }} className={classes.documentIcon} xmlns="http://www.w3.org/2000/svg" height="50" viewBox="0 0 512 512"><path d="M160 368c26.5 0 48 21.5 48 48v16l72.5-54.4c8.3-6.2 18.4-9.6 28.8-9.6H448c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16V352c0 8.8 7.2 16 16 16h96zm48 124l-.2 .2-5.1 3.8-17.1 12.8c-4.8 3.6-11.3 4.2-16.8 1.5s-8.8-8.2-8.8-14.3V474.7v-6.4V468v-4V416H112 64c-35.3 0-64-28.7-64-64V64C0 28.7 28.7 0 64 0H448c35.3 0 64 28.7 64 64V352c0 35.3-28.7 64-64 64H309.3L208 492z" /></svg>
                  </div>
                  <a href={link.url} style={{ overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }} target="_blank">
                    {link.url}
                  </a>
                </div>
              )
              )}
          </div>
        </div>

        <div className={classes.mediaWrapper} style={applyPanelStyle("calls")}>
          <div>
            {Array.isArray(calls) &&
              calls.length > 0 &&
              calls.map((call) => {

                const isAccepted = call?.body?.includes('recebida');

                return (
                  <Stack spacing={1} key={call.id} direction={'row'} p={2} sx={{ border: '1px solid #ccc' }}>

                    {isAccepted ? <MdLocalPhone color="green" size={20} /> : <MdPhoneMissed color="red" size={20} />}
                    <Typography variant="caption"> {isAccepted ? 'Chamada recebida em ' : 'Chamada perdida em '}{format(new Date(call?.createdAt), 'dd/MM/yyyy hh:mm:ss')}</Typography>

                  </Stack>
                )
              }
              )}
          </div>
        </div>

      </Paper>
    </>
  );
}

export default ContactMedia;