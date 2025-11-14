import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Paper,
} from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)//components/shared/DashboardCard";
import img1 from 'src/assets/images/profile/user-1.jpg';
import img2 from 'src/assets/images/profile/user-2.jpg';
import img3 from 'src/assets/images/profile/user-3.jpg';
import img4 from 'src/assets/images/profile/user-4.jpg';
const products = [
  {
    id: "1",
    name: "Car",
    ptype: "Private",
    alertType: "Wrong parking",
    pbg: "primary.main",
    budget: "TS07FL0010",
    plateImageLink: "/images/demo.png",
  },
  {
    id: "2",
    name: "Car",
    ptype: "Cab",
    alertType: "Signal Jump",
    pbg: "primary.main",
    budget: "TS07FL0010",
    plateImageLink: "/images/demo.png",
  },
  {
    id: "3",
    name: "Car",
    ptype: "Private",
    alertType: "Wrong parking",
    pbg: "primary.main",
    budget: "TS07FL0010",
    plateImageLink: "/images/demo.png",
  },
  {
    id: "4",
    name: "Car",
    ptype: "Private",
    alertType: "Wrong parking",
    pbg: "primary.main",
    budget: "TS07FL0010",
    plateImageLink: "/images/demo.png",
  },
  {
    id: "5",
    name: "Car",
    ptype: "Private",
    alertType: "Wrong parking",
    pbg: "primary.main",
    budget: "TS07FL0010",
    plateImageLink: "/images/demo.png",
  },
];

const VehiclesData = () => {
  return (
    <DashboardCard title="Stats">
      <Box sx={{ overflow: "auto" }}>
        <Box sx={{ width: "100%", display: "table", tableLayout: "fixed" }}>
          <Table
            sx={{
              whiteSpace: "nowrap",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Id
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Vehicle
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Plate type
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    License plate
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Alert type
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                   Plate image
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.name}>
                  <TableCell align="center">
                    <Typography
                      sx={{
                        fontSize: "15px",
                        fontWeight: "500",
                      }}
                    >
                      {product.id}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {product.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      fontWeight={400}
                    >
                      {product.ptype}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6">{product.budget}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      sx={{
                        px: "4px",
                        backgroundColor: product.pbg,
                        color: "#fff",
                      }}
                      size="small"
                      label={product.alertType}
                    ></Chip>
                  </TableCell>
                   <TableCell align="center">
                    <Typography variant="h6"> <a href={product.plateImageLink} target="_blank" style={{textDecoration: "none"}}>View</a></Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </DashboardCard>
  );
};

export default VehiclesData;
