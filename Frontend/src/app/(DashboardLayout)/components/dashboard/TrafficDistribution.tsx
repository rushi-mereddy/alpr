import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import { Grid, Stack, Typography, Avatar } from "@mui/material";

import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";

const TrafficDistribution = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const error = theme.palette.error.main;


  // chart
  const optionscolumnchart: any = {
    chart: {
      type: "donut",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: "#adb0bb",
      toolbar: {
        show: false,
      },
      height: 170,
    },
    colors: [error, primary],
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        donut: {
          size: "75%",
          background: "transparent",
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      fillSeriesColor: false,
    },
    stroke: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    responsive: [
      {
        breakpoint: 991,
        options: {
          chart: {
            width: 120,
          },
        },
      },
    ],
  };
  const seriescolumnchart: any = [2000, 4106];

  return (
    <DashboardCard title="Traffic Distribution">
      <Grid container spacing={3}>
        {/* column */}
        <Grid item xs={6} sm={7}>
          <Typography variant="h1" fontWeight="700">
            329
          </Typography>
        
          <Stack spacing={3} mt={5} direction="row">
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                sx={{
                  width: 9,
                  height: 9,
                  bgcolor: primary,
                  svg: { display: "none" },
                }}
              ></Avatar>
              <Typography
                variant="subtitle2"
                fontSize="12px"
                color="textSecondary"
              >
                Four wheeler
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                sx={{
                  width: 9,
                  height: 9,
                  bgcolor: error,
                  svg: { display: "none" },
                }}
              ></Avatar>
              <Typography
                variant="subtitle2"
                fontSize="12px"
                color="textSecondary"
              >
                Two wheeler
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        {/* column */}
        <Grid item xs={6} sm={5}>
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="donut"
            width={"100%"}
            height="150px"
          />
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default TrafficDistribution;
