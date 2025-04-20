import React, { useContext, useEffect, useState } from 'react';
import './styles.css';
import { SlSpeech } from "react-icons/sl";
import { AuthContext } from '../../context/Auth/AuthContext';
import useQuickMessages from '../../hooks/useQuickMessages';
import AttachFileIcon from "@material-ui/icons/AttachFile";
import { Tooltip } from '@material-ui/core';

export const Submenus = (props) => {

  const { setInputMessage, setMediaUrl, setMediaName } = props;

  const { user } = useContext(AuthContext);

  const { list2: listQuickMessages } = useQuickMessages();

  const [listCategories, setListCategories] = useState([]);

  useEffect(() => {

    getListMessages();

  }, []);

  const getListMessages = async () => {
    try {

      const companyId = localStorage.getItem("companyId");

      const messages = await listQuickMessages({ companyId, userId: user.id });

      setListCategories(messages);

    } catch (e) {
      console.error(e);
    }
  }

  const limitCaracteres = (message) => {
    if (message.length > 30) {
      return message.substring(0, 30) + '...';
    } else {
      return message;
    }
  }

  return (
    <Menu menuStyle={{ fontSize: 12 }} menuButton={<MenuButton style={{ border: 'none', background: 'none', width: 20, height: 0, display: 'flex', alignItems: 'center', fontSize: 22 }}> <SlSpeech color='grey' size={28} /> </MenuButton>}>

      {listCategories.map((category) => (
        <SubMenu menuStyle={{ maxHeight: 180, overflowY: "scroll" }} label={category.shortcode}>
          {category.messages.map((message) => (
            <Tooltip title={message.message} placement="top" arrow>
              <MenuItem onClick={() => {
                setInputMessage(message.message);
                setMediaUrl(message.mediaPath);
                setMediaName(message.mediaName);

              }} key={message.id}> {message.mediaPath ? <AttachFileIcon style={{ fontSize: 15 }} /> : ''}
                {limitCaracteres(message.message)}
              </MenuItem>
            </Tooltip>
          ))}
        </SubMenu>
      ))}
    </Menu>

  );
}