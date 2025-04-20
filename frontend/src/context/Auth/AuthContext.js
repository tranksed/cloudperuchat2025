import React, { createContext } from "react";

import useAuth from "../../hooks/useAuth.js";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
	const { loading, user, isAuth, handleLogin, handleLogout } = useAuth();
	const [showDialogButton, setShowDialogButton] = React.useState(false);
	return (
		<AuthContext.Provider
			value={{ loading, user, isAuth, handleLogin, handleLogout, showDialogButton, setShowDialogButton }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export { AuthContext, AuthProvider };
