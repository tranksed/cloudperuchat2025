import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
	mainContainer: {
		//flex: 1,
		padding: "80px 5px 5px 5px",
		height: `100vh`,
		overflowY: "hidden",
	},

	contentWrapper: {
		...theme.scrollbarStyles,
		height: "100%",		
		display: "flex",
		flexDirection: "column",
		overflowY:"auto"
	},
}));

const MainContainer = ({ children }) => {
	const classes = useStyles();

	return (
		<Container maxWidth={false} className={classes.mainContainer}>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;
