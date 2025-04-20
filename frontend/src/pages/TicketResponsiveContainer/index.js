import React from "react";
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';

import Tickets from "../TicketsCustom"
import TicketAdvanced from "../TicketsAdvanced";
import { QueueSelectedProvider } from "../../context/QueuesSelected/QueuesSelectedContext";
function TicketResponsiveContainer (props) {
    return (
        <QueueSelectedProvider>
            {isWidthUp('md', props.width) ? <Tickets /> :  <TicketAdvanced />}
        </QueueSelectedProvider>
    )
}

export default withWidth()(TicketResponsiveContainer);