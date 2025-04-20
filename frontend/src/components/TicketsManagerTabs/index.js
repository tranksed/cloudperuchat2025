import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import { Add, ClearAllRounded, DoneAll, Facebook, Group, Instagram, OfflineBolt, WhatsApp } from "@material-ui/icons";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import MessageSharpIcon from "@material-ui/icons/MessageSharp";
import ClockIcon from "@material-ui/icons/AccessTime";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import GroupIcon from '@mui/icons-material/Group';


import FilterListIcon from '@material-ui/icons/FilterList';

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid"

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";

import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { StatusFilter } from "../StatusFilter";
import { WhatsappsFilter } from "../WhatsappsFilter";
import api from "../../services/api";
import { Box, Button, Snackbar } from "@material-ui/core";
import { IconButton, SpeedDial, SpeedDialAction, Stack } from "@mui/material";
import { QueueSelectedContext } from "../../context/QueuesSelected/QueuesSelectedContext";

import AddIcon from '@mui/icons-material/Add';

const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  tabsHeader: {
    flex: "none",
    // backgroundColor: "#eee",
    backgroundColor: theme.palette.tabHeaderBackground,
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8,
  },

  tab: {
    minWidth: 120,
    width: 120,
  },

  snackbar: {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    borderRadius: 30,
  },

  yesButton: {
    backgroundColor: '#FFF',
    color: 'rgba(0, 100, 0, 1)',
    padding: '4px 4px',
    fontSize: '1em',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginRight: theme.spacing(1),
    '&:hover': {
      backgroundColor: 'darkGreen',
      color: '#FFF',
    },
    borderRadius: 30,
  },
  noButton: {
    backgroundColor: '#FFF',
    color: 'rgba(139, 0, 0, 1)',
    padding: '4px 4px',
    fontSize: '1em',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    '&:hover': {
      backgroundColor: 'darkRed',
      color: '#FFF',
    },
    borderRadius: 30,
  },

  tabPanelItem: {
    minWidth: 120,
    fontSize: 11,
    marginLeft: 0,
  },

  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // background: "#fafafa",
    background: theme.palette.optionsBackground,
    //padding: theme.spacing(1),
  },

  serachInputWrapper: {
    flex: 1,
    // background: "#fff",
    background: theme.palette.total,
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1),
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
  },

  badge: {
    // right: "-10px",
  },

  customBadge: {
    right: "-10px",
    backgroundColor: "#f44336",
    color: "#fff",
  },

  show: {
    display: "block",
  },

  hide: {
    display: "none !important",
  },

  speedDial: {
    position: 'absolute',
    bottom: theme.spacing(1),
    right: theme.spacing(1),
  },
}));

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const searchInputRef = useRef();
  const { user } = useContext(AuthContext);
  const { profile } = user;

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [groupingCount, setGroupingCount] = useState(0);

  const userQueueIds = user.queues.map((q) => q.id);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
  // const [forceSearch, setForceSearch] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [filter, setFilter] = useState(false);
  // const [open, setOpen] = useState(false);
  // const [hidden, setHidden] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { setSelectedQueuesMessage } = useContext(QueueSelectedContext);

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedQueuesMessage(selectedQueueIds);
  }, []);
  // }, [selectedQueueIds]);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
    // setForceSearch(!forceSearch)
  }, []);


  let searchTimeout;

  const handleSearch = e => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    if (searchedTerm === "") {
      setSearchParam(searchedTerm);
      setTab("open");
      return;
    }

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  // const handleBack = React.useCallback(() => {
  //   history.push("/tickets");
  // },[history]);

  const handleSnackbarOpen = React.useCallback(() => {
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = React.useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const applyPanelStyle = status => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const CloseAllTicket = async () => {
    try {
      const { data } = await api.post("/tickets/closeAll", { status: tabOpen, queueIds: selectedQueueIds });
      handleSnackbarClose();
    } catch (err) {
      console.log("Error: ", err);
    }
  };


  // const handleVisibility = () => {
  //   setHidden((prevHidden) => !prevHidden);
  // };

  // const handleOpen = () => {
  //   setOpen(true);
  // };

  // const handleClosed = () => {
  //   setOpen(false);
  // };

  const tooltipTitleStyle = {
    fontSize: '10px'
  };

  const handleCloseOrOpenTicket = ticket => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = selecteds => {
    const tags = selecteds.map(t => t.id);
    setSelectedTags(tags);
  };

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map(t => t.id);
    setSelectedUsers(users);
  };

  const handleSelectedWhatsapps = (selecteds) => {
    const whatsapp = selecteds.map((t) => t.id);
    setSelectedWhatsapp(whatsapp);
  };

  const handleSelectedStatus = (selecteds) => {
    const statusFilter = selecteds.map((t) => t.status);

    setSelectedStatus(statusFilter);
  };

  const handleFilter = () => {
    if (filter) {
      setFilter(false);
      setTab("open")
    }
    else
      setFilter(true);
    setTab("search")
  };

  return (
    <Paper
      elevation={0}
      variant="outlined"
      className={classes.ticketsWrapper}
    >
      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={i18n.t("ticketsManager.questionCloseTicket")}
        ContentProps={{
          className: classes.snackbar,
        }}
        action={
          <>
            <Button className={classes.yesButton} size="small" onClick={CloseAllTicket}>
              {i18n.t("ticketsManager.yes")}
            </Button>
            <Button className={classes.noButton} size="small" onClick={handleSnackbarClose}>
              {i18n.t("ticketsManager.not")}
            </Button>
          </>
        }
      />

      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />



      {filter === true && (
        <>

          <TagsFilter onFiltered={handleSelectedTags} />
          <WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
          <StatusFilter onFiltered={handleSelectedStatus} />
          {profile === "admin" && (
            <>
              <UsersFilter onFiltered={handleSelectedUsers} />
            </>
          )}
        </>
      )}


      <Paper elevation={0} square className={classes.tabsHeader}>

        <Stack direction="row" spacing={2} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 3, justifyContent: 'space-between' }}>

          <Typography variant="h6" style={{ fontWeight: 'bold' }}>Conversas</Typography>

          <Stack direction={'row'} sx={{ alignItems: 'center' }} spacing={1} >

            <IconButton onClick={(e) => setNewTicketModalOpen(true)} sx={{ color: "#fff", background: '#ccc' }} aria-label="upload picture" component="span">
              <AddIcon />
            </IconButton>



            <IconButton onClick={(e) => handleChangeTab(e, 'open')} sx={tab == 'open' ? { background: '#065183', color: '#fff' } : { color: "#fff", background: '#ccc' }} aria-label="upload picture" component="span">
              <LibraryBooksIcon />
            </IconButton>

            <IconButton onClick={(e) => handleChangeTab(e, 'closed')} sx={tab == 'closed' ? { background: '#065183', color: '#fff' } : { color: "#fff", background: '#ccc' }} aria-label="upload picture" component="span">
              <LibraryAddCheckIcon />
            </IconButton>

            <IconButton onClick={(e) => handleChangeTab(e, 'search')} sx={tab == 'search' ? { background: '#065183', color: '#fff' } : { color: "#fff", background: '#ccc' }} aria-label="upload picture" component="span">
              <SearchIcon />
            </IconButton>

            <Box>
              <Can
                role={user.profile}
                perform="tickets-manager:showall"
                yes={() => (
                  <FormControlLabel
                    // label={i18n.t("tickets.buttons.showAll")}
                    labelPlacement="start"
                    style={{marginLeft: "1px"}}
                    control={
                      <Switch
                        size="small"
                        checked={showAllTickets}
                        onChange={() =>
                          setShowAllTickets((prevState) => !prevState)
                        }
                        name="showAllTickets"
                        color="primary"
                      />
                    }
                  />
                )}
              />
              <SpeedDial
                ariaLabel="Menu Actions"
                className={classes.speedDial}
                // hidden={hidden}
                size="small"
                icon={<OfflineBolt />}

              >
                {user.profile === 'admin' && (
                  <SpeedDialAction
                    icon={<DoneAll style={{ color: 'green' }} />}
                    className={classes.closeAllFab}
                    tooltipTitle={<span style={tooltipTitleStyle}>{i18n.t("ticketsManager.buttons.close")}&nbsp;Todos</span>}
                    tooltipOpen
                    onClick={(event) => {
                      // handleClosed();
                      handleSnackbarOpen();
                    }}
                  />
                )}

                <SpeedDialAction
                  icon={<Add style={{ color: '#25D366' }} />}
                  tooltipTitle={<span style={tooltipTitleStyle}>{i18n.t("ticketsManager.buttons.new")}&nbsp;Ticket</span>}
                  tooltipOpen
                  onClick={() => {
                    // handleClosed();
                    setNewTicketModalOpen(true);
                  }}
                />
              </SpeedDial>
            </Box>

          </Stack>

        </Stack>

        <Stack direction={'row'} sx={{ alignItems: 'center' }} spacing={1} p={1} >
          <div className={classes.serachInputWrapper}>

            <SearchIcon className={classes.searchIcon} />
            <InputBase
              className={classes.searchInput}
              inputRef={searchInputRef}
              placeholder={i18n.t("tickets.search.placeholder")}
              type="search"
              onChange={handleSearch}
            />
            <IconButton color="primary"
              aria-label="upload picture"
              component="span"
              onClick={handleFilter}
            >
              <FilterListIcon />
            </IconButton>
          </div>

          <TicketsQueueSelect
            style={{ marginLeft: 6 }}
            selectedQueueIds={selectedQueueIds}
            userQueues={user?.queues}
            onChange={(values) => {
              setSelectedQueueIds(values);
              //history.push("/tickets");
            }}
          />
        </Stack>


        {/* <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon label tabs example"
        >

          <Tab
            value={"open"}
            icon={<MoveToInboxIcon />}
            label={i18n.t("tickets.tabs.open.title")}
            classes={{ root: classes.tab }}
          />

          <Tab
            value={"closed"}
            icon={<CheckBoxIcon />}
            label={i18n.t("tickets.tabs.closed.title")}
            classes={{ root: classes.tab }}
          />

          <Tab
            value={"search"}
            icon={<SearchIcon />}
            label={i18n.t("tickets.tabs.search.title")}
            classes={{ root: classes.tab }}
          />
        </Tabs> */}
      </Paper>



      <Paper square elevation={0} className={classes.ticketOptionsBox}>
        <>
          {/* <Can
            role={user.profile}
            perform="tickets-manager:showall"
            yes={() => (
              <FormControlLabel
                label={i18n.t("tickets.buttons.showAll")}
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={showAllTickets}
                    onChange={() =>
                      setShowAllTickets((prevState) => !prevState)
                    }
                    name="showAllTickets"
                    color="primary"
                  />
                }
              />
            )}
          /> */}
          {/* <SpeedDial
            ariaLabel="Menu Actions"
            className={classes.speedDial}
            // hidden={hidden}
            size="small"
            icon={<OfflineBolt />}

          >
            {user.profile === 'admin' && (
              <SpeedDialAction
                icon={<DoneAll style={{ color: 'green' }} />}
                className={classes.closeAllFab}
                tooltipTitle={<span style={tooltipTitleStyle}>{i18n.t("ticketsManager.buttons.close")}&nbsp;Todos</span>}
                tooltipOpen
                onClick={(event) => {
                  // handleClosed();
                  handleSnackbarOpen();
                }}
              />
            )}

            <SpeedDialAction
              icon={<Add style={{ color: '#25D366' }} />}
              tooltipTitle={<span style={tooltipTitleStyle}>{i18n.t("ticketsManager.buttons.new")}&nbsp;Ticket</span>}
              tooltipOpen
              onClick={() => {
                // handleClosed();
                setNewTicketModalOpen(true);
              }}
            />
          </SpeedDial> */}
        </>
        {/* <TicketsQueueSelect
          style={{ marginLeft: 6 }}
          selectedQueueIds={selectedQueueIds}
          userQueues={user?.queues}
          onChange={(values) => {
            setSelectedQueueIds(values);
            //history.push("/tickets");
          }}
        /> */}
      </Paper>

      <TabPanel
        value={tab}
        name="open"
        className={classes.ticketsWrapper}
      >
        <Tabs
          value={tabOpen}
          onChange={handleChangeTabOpen}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >

          {/* ATENDENDO */}
          <Tab
            label={
              <Grid container alignItems="center" justifyContent="center">
                <Grid item>
                  <Badge
                    overlap="rectangular"
                    className={classes.badge}
                    badgeContent={openCount}
                    color="primary"
                  >
                    <MessageSharpIcon
                      style={{
                        fontSize: 18,
                      }}
                    />
                  </Badge>
                </Grid>
                <Grid item>
                  <Typography
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {i18n.t("ticketsList.assignedHeader")}
                  </Typography>
                </Grid>
              </Grid>
            }
            value={"open"}
            classes={{ root: classes.tabPanelItem }}
          />

          {/* AGUARDANDO */}
          <Tab
            label={
              <Grid container alignItems="center" justifyContent="center">
                <Grid item>
                  <Badge
                    overlap="rectangular"
                    classes={{ badge: classes.customBadge }}
                    badgeContent={pendingCount}
                    color="primary"
                  >
                    <ClockIcon
                      style={{
                        fontSize: 18,
                      }}
                    />
                  </Badge>
                </Grid>
                <Grid item>
                  <Typography
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {i18n.t("ticketsList.pendingHeader")}
                  </Typography>
                </Grid>
              </Grid>
            }
            value={"pending"}
            classes={{ root: classes.tabPanelItem }}
          />

          {/* GRUPOS */}
          <Tab
            label={
              <Grid container alignItems="center" justifyContent="center">
                <Grid item>
                  <Badge
                    overlap="rectangular"
                    classes={{ badge: classes.customBadge }}
                    badgeContent={groupingCount}
                    color="primary"
                  >
                    <Group
                      style={{
                        fontSize: 18,
                      }}
                    />
                  </Badge>
                </Grid>
                <Grid item>
                  <Typography
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {i18n.t("ticketsList.groupingHeader")}
                  </Typography>
                </Grid>
              </Grid>
            }
            value={"group"}
            classes={{ root: classes.tabPanelItem }}
          />
        </Tabs>

        <Paper className={classes.ticketsWrapper}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setOpenCount(val)}
            style={applyPanelStyle("open")}
            forceSearch={false}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            showAll={user.profile === "admin" ? showAllTickets : false}
            updateCount={(val) => setPendingCount(val)}
            style={applyPanelStyle("pending")}
            forceSearch={false}

          />
          <TicketsList
            status="group"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setGroupingCount(val)}
            style={applyPanelStyle("group")}
            forceSearch={false}

          />
        </Paper>
      </TabPanel>

      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={showAllTickets}
          selectedQueueIds={selectedQueueIds}
        // handleChangeTab={handleChangeTabOpen}
        />
      </TabPanel>

      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        {profile === "admin" && (
          <>
            <TicketsList
              statusFilter={selectedStatus}
              searchParam={searchParam}
              showAll={showAllTickets}
              tags={selectedTags}
              users={selectedUsers}
              selectedQueueIds={selectedQueueIds}
              whatsappIds={selectedWhatsapp}
              forceSearch={true}
              status="search"
            />
          </>
        )}

        {profile === "user" && (
          <TicketsList
            statusFilter={selectedStatus}
            searchParam={searchParam}
            showAll={false}
            tags={selectedTags}
            selectedQueueIds={selectedQueueIds}
            whatsappIds={selectedWhatsapp}
            forceSearch={true}
            status="search"
          />
        )}
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;
