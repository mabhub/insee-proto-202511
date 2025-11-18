import { Box } from '@mui/material';

/**
 * TabPanel component for tab content
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Tab content
 * @param {number} props.value - Current active tab index
 * @param {number} props.index - This tab's index
 * @param {Object} props.other - Other props to spread
 * @returns {React.ReactElement} Tab panel element
 */
const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`dataset-selector-tabpanel-${index}`}
    aria-labelledby={`dataset-selector-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export default TabPanel;
