import React, { useContext, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";
import { AuthContext } from "../../context/Auth/AuthContext";
import { socketConnection } from "../../services/socket";

import { i18n } from "../../translate/i18n";
import { Hidden } from "@material-ui/core";
import MainContainer from '../../components/MainContainer';

const useStyles = makeStyles(theme => ({
	chatContainer:{
		padding: "78px 5px 5px 5px",
		height: `100vh`,
		overflow:"hidden"
	},
	chatPapper: {
		// backgroundColor: "red",
		display: "flex",
		height: "100%",
	},

	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
	},
	messagesWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
	},
	welcomeMsg: {
		// backgroundColor: "#eee",
		background: theme.palette.tabHeaderBackground,
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		height: "100%",
		textAlign: "center",
	},
}));

const TicketsCustom = () => {
	const classes = useStyles();
	const { ticketId } = useParams();

	return (
		<MainContainer>
			{/* <MainContainer> */}
				<div className={classes.chatPapper}>
					<Grid container spacing={0}>
						<Grid item xs={12} md={4} className={classes.contactsWrapper}>
							<TicketsManager />
						</Grid>
						<Grid item xs={12} md={8} className={classes.messagesWrapper}>
							{ticketId ? (
								<>
									<Ticket
									/>
								</>
							) : (
								<Hidden only={["sm", "xs"]}>
									<Paper square variant="outlined" className={classes.welcomeMsg}>
										<span>{i18n.t("chat.noTicketMessage")}</span>
									</Paper>
								</Hidden>
							)}
						</Grid>
					</Grid>
				</div>
			{/* </MainContainer> */}
		</MainContainer>
	);
};

export default TicketsCustom;
